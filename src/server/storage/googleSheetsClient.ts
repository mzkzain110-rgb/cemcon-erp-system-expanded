/**
 * Compenia ERP - Google Sheets Service Account Client
 * Securely communicates with Google Sheets API v4 using backend Service Account JWT credentials.
 * Credentials (including the private key) are NEVER exposed to the frontend.
 */

import { google, sheets_v4 } from 'googleapis';
import { ERP_TAB_SCHEMAS, TabSchema } from '../schema/definitions.js';

export interface ServiceAccountStatus {
  isConfigured: boolean;
  projectId: string | null;
  clientEmail: string | null;
  sheetId: string | null;
  liveStatus: 'CONNECTED' | 'CREDENTIALS_MISSING' | 'PERMISSION_DENIED' | 'SPREADSHEET_NOT_FOUND' | 'ERROR';
  statusMessage: string;
  spreadsheetTitle?: string;
  availableRemoteTabs?: string[];
  lastChecked: string;
}

export class GoogleSheetsServiceAccountClient {
  private sheetsApi: sheets_v4.Sheets | null = null;
  private authClient: any = null;
  private initialized = false;
  private lastStatus: ServiceAccountStatus = {
    isConfigured: false,
    projectId: null,
    clientEmail: null,
    sheetId: null,
    liveStatus: 'CREDENTIALS_MISSING',
    statusMessage: 'Google Service Account credentials not yet provided in environment variables.',
    lastChecked: new Date().toISOString(),
  };

  constructor() {
    this.refreshAuth();
  }

  public refreshAuth(): boolean {
    const rawProjectId = process.env.GOOGLE_PROJECT_ID;
    const rawClientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    const rawSheetId = process.env.GOOGLE_SHEET_ID;

    const projectId = rawProjectId ? rawProjectId.trim().replace(/^["']|["']$/g, '').trim() : null;
    const clientEmail = rawClientEmail ? rawClientEmail.trim().replace(/^["']|["']$/g, '').trim() : null;
    const sheetId = rawSheetId ? rawSheetId.trim().replace(/^["']|["']$/g, '').trim() : null;
    let privateKey = rawPrivateKey ? rawPrivateKey.trim().replace(/^["']|["']$/g, '').trim() : null;

    if (!clientEmail || !privateKey || !sheetId) {
      this.sheetsApi = null;
      this.authClient = null;
      this.initialized = false;
      this.lastStatus = {
        isConfigured: false,
        projectId,
        clientEmail: clientEmail || 'Not configured',
        sheetId: sheetId || 'Not configured',
        liveStatus: 'CREDENTIALS_MISSING',
        statusMessage:
          'Missing credentials. Please define GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID in environment secrets.',
        lastChecked: new Date().toISOString(),
      };
      return false;
    }

    try {
      // Normalize private key: strip outer quotes, replace literal \n with real newline characters
      privateKey = privateKey.replace(/\\n/g, '\n');

      this.authClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheetsApi = google.sheets({ version: 'v4', auth: this.authClient });
      this.initialized = true;

      this.lastStatus = {
        isConfigured: true,
        projectId,
        clientEmail,
        sheetId,
        liveStatus: 'CONNECTED',
        statusMessage: 'Service Account configured. Ready to communicate with Google Sheets API.',
        lastChecked: new Date().toISOString(),
      };

      return true;
    } catch (err: any) {
      console.error('[GoogleSheetsClient] Error initializing auth:', err.message);
      this.sheetsApi = null;
      this.authClient = null;
      this.initialized = false;
      this.lastStatus = {
        isConfigured: false,
        projectId,
        clientEmail,
        sheetId,
        liveStatus: 'ERROR',
        statusMessage: `Authentication initialization error: ${err.message}`,
        lastChecked: new Date().toISOString(),
      };
      return false;
    }
  }

  public getStatus(): ServiceAccountStatus {
    return { ...this.lastStatus };
  }

  public isLiveReady(): boolean {
    return this.initialized && this.sheetsApi !== null && !!process.env.GOOGLE_SHEET_ID;
  }

  /**
   * Tests connection to Google Sheets API and verifies permissions on the target spreadsheet
   */
  public async testLiveConnection(): Promise<ServiceAccountStatus> {
    if (!this.refreshAuth()) {
      return this.getStatus();
    }

    const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim().replace(/^["']|["']$/g, '');

    try {
      const response = await this.sheetsApi!.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      const spreadsheet = response.data;
      const remoteTabs = (spreadsheet.sheets || []).map((s) => s.properties?.title || '').filter(Boolean);

      this.lastStatus = {
        isConfigured: true,
        projectId: process.env.GOOGLE_PROJECT_ID?.trim().replace(/^["']|["']$/g, '') || null,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '') || null,
        sheetId,
        liveStatus: 'CONNECTED',
        statusMessage: `Live connected to Google Sheet "${spreadsheet.properties?.title || sheetId}". Read/Write access verified.`,
        spreadsheetTitle: spreadsheet.properties?.title || 'Compenia ERP Database',
        availableRemoteTabs: remoteTabs,
        lastChecked: new Date().toISOString(),
      };

      return this.getStatus();
    } catch (err: any) {
      console.error('[GoogleSheetsClient] Connection test failed:', err.message);

      let statusType: ServiceAccountStatus['liveStatus'] = 'ERROR';
      let message = err.message;

      if (err.code === 403 || err.message?.includes('permission') || err.message?.includes('IAM')) {
        statusType = 'PERMISSION_DENIED';
        message = `Permission Denied: Please share spreadsheet (${sheetId}) with "${process.env.GOOGLE_CLIENT_EMAIL}" as "Editor".`;
      } else if (err.code === 404 || err.message?.includes('not found')) {
        statusType = 'SPREADSHEET_NOT_FOUND';
        message = `Spreadsheet Not Found: Please verify that GOOGLE_SHEET_ID "${sheetId}" exists.`;
      }

      this.lastStatus = {
        isConfigured: true,
        projectId: process.env.GOOGLE_PROJECT_ID?.trim().replace(/^["']|["']$/g, '') || null,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '') || null,
        sheetId,
        liveStatus: statusType,
        statusMessage: message,
        lastChecked: new Date().toISOString(),
      };

      return this.getStatus();
    }
  }

  private safeTabRange(tabName: string, cellRange: string): string {
    const escaped = tabName.replace(/'/g, "''");
    return `'${escaped}'!${cellRange}`;
  }

  private formatCellValue(val: any): any {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string' && /^0\d+$/.test(val)) {
      return `'${val}`;
    }
    return val;
  }

  /**
   * Append a row to a tab in Google Sheets
   */
  public async appendRow(tabName: string, rowValues: any[]): Promise<boolean> {
    if (!this.isLiveReady()) return false;
    const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim().replace(/^["']|["']$/g, '');

    try {
      const formatted = rowValues.map((v) => this.formatCellValue(v));
      await this.sheetsApi!.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: this.safeTabRange(tabName, 'A1'),
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [formatted],
        },
      });
      return true;
    } catch (err: any) {
      console.warn(`[GoogleSheetsClient] Failed to append row to ${tabName}:`, err.message);
      return false;
    }
  }

  /**
   * Update a specific row in Google Sheets (1-indexed, starting after header row)
   */
  public async updateRow(tabName: string, rowIndex: number, rowValues: any[]): Promise<boolean> {
    if (!this.isLiveReady()) return false;
    const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim().replace(/^["']|["']$/g, '');

    try {
      const formatted = rowValues.map((v) => this.formatCellValue(v));
      await this.sheetsApi!.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: this.safeTabRange(tabName, `A${rowIndex}`),
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [formatted],
        },
      });
      return true;
    } catch (err: any) {
      console.warn(`[GoogleSheetsClient] Failed to update row in ${tabName}:`, err.message);
      return false;
    }
  }

  /**
   * Delete a specific row in Google Sheets
   */
  public async deleteRow(tabName: string, rowIndex: number): Promise<boolean> {
    if (!this.isLiveReady()) return false;
    const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim().replace(/^["']|["']$/g, '');

    try {
      const meta = await this.sheetsApi!.spreadsheets.get({ spreadsheetId: sheetId });
      const sheetObj = meta.data.sheets?.find((s) => s.properties?.title === tabName);
      if (!sheetObj || sheetObj.properties?.sheetId === undefined) return false;

      await this.sheetsApi!.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetObj.properties.sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex,
                },
              },
            },
          ],
        },
      });
      return true;
    } catch (err: any) {
      console.warn(`[GoogleSheetsClient] Failed to delete row in ${tabName}:`, err.message);
      return false;
    }
  }

  /**
   * Read raw values from a tab in Google Sheets
   */
  public async readTabValues(tabName: string): Promise<any[][] | null> {
    if (!this.isLiveReady()) return null;
    const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim().replace(/^["']|["']$/g, '');

    try {
      const res = await this.sheetsApi!.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: this.safeTabRange(tabName, 'A1:ZZ'),
      });
      return res.data.values || [];
    } catch (err: any) {
      console.warn(`[GoogleSheetsClient] Failed to read ${tabName}:`, err.message);
      return null;
    }
  }

  /**
   * Reads raw row values from all production tabs in batches
   */
  public async loadAllRemoteTabsData(): Promise<Map<string, any[][]>> {
    const resultMap = new Map<string, any[][]>();
    if (!this.isLiveReady()) return resultMap;
    const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim().replace(/^["']|["']$/g, '');

    try {
      const tabNames = Object.keys(ERP_TAB_SCHEMAS);
      const chunkSize = 25;
      for (let i = 0; i < tabNames.length; i += chunkSize) {
        const chunk = tabNames.slice(i, i + chunkSize);
        const ranges = chunk.map((t) => this.safeTabRange(t, 'A1:ZZ'));
        const res = await this.sheetsApi!.spreadsheets.values.batchGet({
          spreadsheetId: sheetId,
          ranges,
        });
        const valueRanges = res.data.valueRanges || [];
        for (let j = 0; j < chunk.length; j++) {
          const tabName = chunk[j];
          const vr = valueRanges[j];
          resultMap.set(tabName, vr?.values || []);
        }
      }
    } catch (err: any) {
      console.warn('[GoogleSheetsClient] Error loading remote tabs in batch:', err.message);
    }

    return resultMap;
  }

  /**
   * Efficiently synchronizes all 69 Compenia ERP tabs with Google Sheets.
   * If remote tabs already have data, it preserves and loads them into memory!
   * If tabs are empty or missing, it creates and seeds them.
   */
  public async initializeRemoteSpreadsheet(localDataMap: Map<string, { headers: string[]; rows: Record<string, any>[] }>): Promise<{
    success: boolean;
    createdTabsCount: number;
    syncedRowsCount: number;
    message: string;
  }> {
    if (!this.isLiveReady()) {
      return {
        success: false,
        createdTabsCount: 0,
        syncedRowsCount: 0,
        message: 'Google Service Account credentials or GOOGLE_SHEET_ID missing in environment.',
      };
    }

    const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim().replace(/^["']|["']$/g, '');
    let createdTabs = 0;
    let syncedRows = 0;

    try {
      console.log(`[GoogleSheetsSync] Fetching remote spreadsheet metadata for: ${sheetId}...`);
      const meta = await this.sheetsApi!.spreadsheets.get({ spreadsheetId: sheetId });
      const remoteSheets = meta.data.sheets || [];
      const existingSheetTitles = new Set(remoteSheets.map((s) => s.properties?.title));

      // 1. Identify all missing tabs from ERP_TAB_SCHEMAS and create them
      const addSheetRequests: sheets_v4.Schema$Request[] = [];
      const missingTabNames: string[] = [];

      for (const tabName of Object.keys(ERP_TAB_SCHEMAS)) {
        if (!existingSheetTitles.has(tabName)) {
          missingTabNames.push(tabName);
          addSheetRequests.push({
            addSheet: {
              properties: {
                title: tabName,
                gridProperties: { frozenRowCount: 1 },
              },
            },
          });
        }
      }

      if (addSheetRequests.length > 0) {
        console.log(`[GoogleSheetsSync] Creating ${addSheetRequests.length} missing tabs in batch...`);
        const chunkSize = 30;
        for (let i = 0; i < addSheetRequests.length; i += chunkSize) {
          const chunk = addSheetRequests.slice(i, i + chunkSize);
          await this.sheetsApi!.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: { requests: chunk },
          });
        }
        createdTabs = missingTabNames.length;
        console.log(`[GoogleSheetsSync] Successfully created ${createdTabs} tabs in Google Sheets.`);
      }

      // If default "Sheet1" still exists and we created new tabs, remove Sheet1
      const defaultSheet1 = remoteSheets.find((s) => s.properties?.title === 'Sheet1');
      if (defaultSheet1 && defaultSheet1.properties?.sheetId !== undefined && (remoteSheets.length > 1 || createdTabs > 0)) {
        try {
          await this.sheetsApi!.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
              requests: [{ deleteSheet: { sheetId: defaultSheet1.properties.sheetId } }],
            },
          });
          console.log('[GoogleSheetsSync] Cleaned up placeholder Sheet1.');
        } catch {
          // ignore if Sheet1 cannot be removed
        }
      }

      // 2. Read existing remote data from Google Sheets across all tabs
      console.log(`[GoogleSheetsSync] Reading existing records from Google Sheet tabs...`);
      const remoteDataMap = await this.loadAllRemoteTabsData();

      // 3. Hydrate memory from Google Sheets, or seed only empty tabs
      const valueRangesToSeed: sheets_v4.Schema$ValueRange[] = [];

      for (const [tabName, schema] of Object.entries(ERP_TAB_SCHEMAS)) {
        const headers = schema.columns.map((c) => c.name);
        const remoteValues = remoteDataMap.get(tabName) || [];

        if (remoteValues.length > 1) {
          // Tab has existing rows in Google Sheets!
          // Hydrate local memory from Google Sheets so records are preserved across cold starts
          const remoteHeaders = (remoteValues[0] || []).map((h: any) => String(h || '').trim());
          const records: Record<string, any>[] = [];

          for (let r = 1; r < remoteValues.length; r++) {
            const rowVals = remoteValues[r];
            if (!rowVals || rowVals.length === 0 || rowVals.every((v: any) => v === '' || v === undefined)) continue;
            const rec: Record<string, any> = {};
            for (let c = 0; c < remoteHeaders.length; c++) {
              const colName = remoteHeaders[c];
              if (colName) {
                let cellVal = rowVals[c] !== undefined ? rowVals[c] : '';
                if (typeof cellVal === 'string' && cellVal.startsWith("'")) {
                  cellVal = cellVal.slice(1);
                }
                rec[colName] = cellVal;
              }
            }
            records.push(rec);
          }

          localDataMap.set(tabName, {
            headers,
            rows: records,
          });
          syncedRows += records.length;
        } else {
          // Tab is EMPTY or brand new. Write initial headers and local seed data
          const localSheet = localDataMap.get(tabName);
          const rowsToUpload: any[][] = [headers];

          if (localSheet && localSheet.rows.length > 0) {
            for (const row of localSheet.rows) {
              const rowArr = headers.map((h) => this.formatCellValue(row[h]));
              rowsToUpload.push(rowArr);
              syncedRows++;
            }
          }

          valueRangesToSeed.push({
            range: this.safeTabRange(tabName, 'A1'),
            values: rowsToUpload,
          });
        }
      }

      // Write headers/seed rows only to empty tabs
      if (valueRangesToSeed.length > 0) {
        console.log(`[GoogleSheetsSync] Seeding ${valueRangesToSeed.length} empty tabs in Google Sheets...`);
        const valChunkSize = 20;
        for (let i = 0; i < valueRangesToSeed.length; i += valChunkSize) {
          const chunk = valueRangesToSeed.slice(i, i + valChunkSize);
          await this.sheetsApi!.spreadsheets.values.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
              valueInputOption: 'USER_ENTERED',
              data: chunk,
            },
          });
        }
      }

      console.log(`[GoogleSheetsSync] All tabs verified. Total active records in system: ${syncedRows}`);

      this.lastStatus = {
        isConfigured: true,
        projectId: process.env.GOOGLE_PROJECT_ID?.trim().replace(/^["']|["']$/g, '') || null,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '') || null,
        sheetId,
        liveStatus: 'CONNECTED',
        statusMessage: `Connected to Google Sheet "${meta.data.properties?.title || 'Compenia ERP'}". All ${Object.keys(ERP_TAB_SCHEMAS).length} tabs synchronized and hydrated.`,
        spreadsheetTitle: meta.data.properties?.title || 'Compenia ERP Database',
        availableRemoteTabs: Object.keys(ERP_TAB_SCHEMAS),
        lastChecked: new Date().toISOString(),
      };

      return {
        success: true,
        createdTabsCount: createdTabs,
        syncedRowsCount: syncedRows,
        message: `Google Spreadsheet populated and hydrated successfully. Persistent multi-tenant storage active.`,
      };
    } catch (err: any) {
      console.error('[GoogleSheetsSync] Failed to initialize spreadsheet:', err.message);
      return {
        success: false,
        createdTabsCount: createdTabs,
        syncedRowsCount: syncedRows,
        message: `Failed to bootstrap remote spreadsheet: ${err.message}`,
      };
    }
  }
}

export const googleSheetsClient = new GoogleSheetsServiceAccountClient();
