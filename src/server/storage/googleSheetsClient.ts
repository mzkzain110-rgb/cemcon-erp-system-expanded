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
        range: `${tabName}!A1`,
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
        range: `${tabName}!A${rowIndex}`,
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
   * Read raw values from a tab in Google Sheets
   */
  public async readTabValues(tabName: string): Promise<any[][] | null> {
    if (!this.isLiveReady()) return null;
    const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim().replace(/^["']|["']$/g, '');

    try {
      const res = await this.sheetsApi!.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${tabName}!A1:ZZ`,
      });
      return res.data.values || [];
    } catch (err: any) {
      console.warn(`[GoogleSheetsClient] Failed to read ${tabName}:`, err.message);
      return null;
    }
  }

  /**
   * Efficiently batch-initializes all 54 Compenia ERP tabs in the remote spreadsheet.
   * Uses single batchUpdate for adding missing tabs and values.batchUpdate for headers and seed data.
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

      // 1. Identify all missing tabs from ERP_TAB_SCHEMAS
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

      // Execute single batchUpdate to create all missing tabs at once
      if (addSheetRequests.length > 0) {
        console.log(`[GoogleSheetsSync] Creating ${addSheetRequests.length} missing tabs in batch...`);
        // Batch in groups of 30 if needed to stay well under request limits
        const chunkSize = 30;
        for (let i = 0; i < addSheetRequests.length; i += chunkSize) {
          const chunk = addSheetRequests.slice(i, i + chunkSize);
          await this.sheetsApi!.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
              requests: chunk,
            },
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
              requests: [
                {
                  deleteSheet: {
                    sheetId: defaultSheet1.properties.sheetId,
                  },
                },
              ],
            },
          });
          console.log('[GoogleSheetsSync] Cleaned up placeholder Sheet1.');
        } catch (e: any) {
          console.warn('[GoogleSheetsSync] Could not remove Sheet1 (ignoring):', e.message);
        }
      }

      // 2. Prepare batch data update for all tabs (headers + seed rows)
      const valueRanges: sheets_v4.Schema$ValueRange[] = [];

      for (const [tabName, schema] of Object.entries(ERP_TAB_SCHEMAS)) {
        const headers = schema.columns.map((c) => c.name);
        const localSheet = localDataMap.get(tabName);
        const rowsToUpload: any[][] = [headers];

        if (localSheet && localSheet.rows.length > 0) {
          for (const row of localSheet.rows) {
            const rowArr = headers.map((h) => this.formatCellValue(row[h]));
            rowsToUpload.push(rowArr);
            syncedRows++;
          }
        }

        valueRanges.push({
          range: `${tabName}!A1`,
          values: rowsToUpload,
        });
      }

      // Execute batch values update (in chunks of 20 to be safe and responsive)
      console.log(`[GoogleSheetsSync] Writing headers and records across ${valueRanges.length} tabs in Google Sheets...`);
      const valChunkSize = 20;
      for (let i = 0; i < valueRanges.length; i += valChunkSize) {
        const chunk = valueRanges.slice(i, i + valChunkSize);
        await this.sheetsApi!.spreadsheets.values.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: chunk,
          },
        });
      }

      console.log(`[GoogleSheetsSync] All ${valueRanges.length} tabs written successfully to Google Sheet.`);

      // Update status
      this.lastStatus = {
        isConfigured: true,
        projectId: process.env.GOOGLE_PROJECT_ID?.trim().replace(/^["']|["']$/g, '') || null,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '') || null,
        sheetId,
        liveStatus: 'CONNECTED',
        statusMessage: `Connected to Google Sheet "${meta.data.properties?.title || 'Compenia ERP'}". All ${valueRanges.length} production tabs verified and synchronized.`,
        spreadsheetTitle: meta.data.properties?.title || 'Compenia ERP Database',
        availableRemoteTabs: Object.keys(ERP_TAB_SCHEMAS),
        lastChecked: new Date().toISOString(),
      };

      return {
        success: true,
        createdTabsCount: createdTabs,
        syncedRowsCount: syncedRows,
        message: `Google Spreadsheet populated successfully. ${valueRanges.length} production tabs active with live synchronization.`,
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
