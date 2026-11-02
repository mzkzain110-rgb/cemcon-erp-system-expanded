import { jsPDF } from 'jspdf';
import type { CemconCompanyInfo } from '../components/hr/HRPrintableForms';

export interface LabourBreakdownItem {
  id?: string;
  trade: string;
  headcount: number;
  regularHours: number;
  overtimeHours?: number;
  hourlyRate: number;
  otRate?: number;
  totalCost: number;
}

export interface MaterialBreakdownItem {
  id?: string;
  itemCode?: string;
  description: string;
  specification?: string;
  quantity: number;
  uom: string;
  unitRate: number;
  wastePercent?: number;
  totalCost: number;
}

export interface SubcontractBreakdownItem {
  id?: string;
  serviceName: string;
  subcontractor: string;
  scopeOfWork?: string;
  units: number;
  uom: string;
  unitPrice: number;
  totalCost: number;
}

export interface MiscBreakdownItem {
  id?: string;
  expenseCategory: string;
  description: string;
  amount: number;
  remarks?: string;
}

export interface JobEstimationPdfParams {
  company: CemconCompanyInfo;
  tenantName: string;
  estimation: {
    estimation_no: string;
    job_number: string;
    project_name: string;
    client_name: string;
    location?: string;
    status: string;
    revision: string;
    estimation_date: string;
    valid_until?: string;
    currency: string;
    contract_target_price?: number;
    total_job_cost: number;
    markup_margin_percent?: number;
    selling_price?: number;
    estimated_gross_profit?: number;
    total_manhours: number;
    total_labour_cost: number;
    labour_breakdown_json: string | LabourBreakdownItem[];
    total_material_cost: number;
    materials_breakdown_json: string | MaterialBreakdownItem[];
    total_subcontract_cost: number;
    subcontract_breakdown_json: string | SubcontractBreakdownItem[];
    total_misc_cost: number;
    misc_breakdown_json: string | MiscBreakdownItem[];
    prepared_by: string;
    reviewed_by?: string;
    approved_by?: string;
    notes?: string;
  };
}

export function exportJobEstimationPdf({
  company,
  tenantName,
  estimation,
}: JobEstimationPdfParams): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let curY = margin;

  // Helper to parse JSON arrays safely
  const parseJsonArray = <T>(val: any): T[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }
    return [];
  };

  const labourItems: LabourBreakdownItem[] = parseJsonArray<LabourBreakdownItem>(estimation.labour_breakdown_json);
  const materialItems: MaterialBreakdownItem[] = parseJsonArray<MaterialBreakdownItem>(estimation.materials_breakdown_json);
  const subcontractItems: SubcontractBreakdownItem[] = parseJsonArray<SubcontractBreakdownItem>(estimation.subcontract_breakdown_json);
  const miscItems: MiscBreakdownItem[] = parseJsonArray<MiscBreakdownItem>(estimation.misc_breakdown_json);

  const drawHeader = (pageNumber: number, totalPagesPlaceholder = false) => {
    // Watermark
    doc.saveGraphicsState();
    doc.setTextColor(242, 245, 249);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.text('CEMCON ESTIMATE', pageWidth / 2, 140, {
      align: 'center',
      angle: 32,
    });
    doc.restoreGraphicsState();

    // Company Header Top Bar
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(company.name.toUpperCase(), margin, margin + 4);

    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(
      `A MEMBER OF ${tenantName.toUpperCase()} • ${company.division.toUpperCase()}`,
      margin,
      margin + 8.5
    );

    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${company.address} • Tel: ${company.phone}`, margin, margin + 12.5);
    doc.text(
      `TRN: ${company.trn} • Commercial Reg: ${company.regNo} • ISO 9001 / ISO 45001 Certified`,
      margin,
      margin + 16.5
    );

    // Right Badge
    const badgeW = 54;
    const badgeX = pageWidth - margin - badgeW;
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(badgeX, margin, badgeW, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('JOB COST ESTIMATION', badgeX + badgeW / 2, margin + 4.8, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`DOC REF: ${estimation.estimation_no}`, pageWidth - margin, margin + 12, { align: 'right' });
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      `REV: ${estimation.revision || 'R0'}  •  JOB NO: #${estimation.job_number}`,
      pageWidth - margin,
      margin + 16,
      { align: 'right' }
    );

    // Top Divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, margin + 19, pageWidth - margin, margin + 19);

    if (!totalPagesPlaceholder) {
      // Footer page numbering
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${pageNumber} • CONFIDENTIAL COMMERCIAL ESTIMATE • CEMCON ERP ENGINE`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
      doc.text(
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        pageWidth - margin,
        pageHeight - 6,
        { align: 'right' }
      );
    }
  };

  const checkPageBreak = (neededHeight: number) => {
    if (curY + neededHeight > pageHeight - 16) {
      doc.addPage();
      curY = margin + 22;
      drawHeader(doc.getNumberOfPages());
    }
  };

  // Draw Page 1 Header
  drawHeader(1);
  curY = margin + 22;

  // 1. Title Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, curY, contentWidth, 7, 1, 1, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ENGINEERING ESTIMATION & COST BREAKDOWN REPORT', margin + 3, curY + 4.8);

  const statusColor: [number, number, number] =
    estimation.status === 'APPROVED' ? [22, 101, 52] : estimation.status === 'SUBMITTED' ? [29, 78, 216] : [146, 64, 14];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFontSize(7.5);
  doc.text(`STATUS: ${estimation.status}`, pageWidth - margin - 3, curY + 4.8, { align: 'right' });

  curY += 9;

  // 2. Project Metadata Grid Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, curY, contentWidth, 20, 1, 1, 'FD');

  const colW = contentWidth / 3;

  doc.setFontSize(7);
  // Column 1
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Title:', margin + 3, curY + 4.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(estimation.project_name, colW - 6), margin + 3, curY + 8.5);

  // Column 2
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Client / Buyer:', margin + colW + 3, curY + 4.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(estimation.client_name, colW - 6), margin + colW + 3, curY + 8.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Site / Location:', margin + colW + 3, curY + 14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(estimation.location || 'Sharjah / Dubai Site', colW - 6), margin + colW + 3, curY + 17.5);

  // Column 3
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Estimate Date:', margin + colW * 2 + 3, curY + 4.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(estimation.estimation_date || 'N/A', margin + colW * 2 + 25, curY + 4.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Validity Until:', margin + colW * 2 + 3, curY + 9.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(estimation.valid_until || '90 Days', margin + colW * 2 + 25, curY + 9.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Currency Base:', margin + colW * 2 + 3, curY + 14.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(estimation.currency || 'AED', margin + colW * 2 + 25, curY + 14.5);

  curY += 23;

  // 3. Section 1: JOB COST & COMMERCIAL SUMMARY
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('1. JOB COST & COMMERCIAL SUMMARY', margin + 3, curY + 4);
  curY += 7;

  // 4 Top Metric Cards (Total Job Cost, Target Selling Price, Gross Profit, Markup %)
  const cardW = (contentWidth - 6) / 4;
  const cards = [
    { label: 'TOTAL JOB COST', val: `${estimation.currency} ${Number(estimation.total_job_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Sum of all 4 cost elements', color: [239, 246, 255], border: [191, 219, 254], text: [30, 64, 175] },
    { label: 'SELLING PRICE (TARGET)', val: `${estimation.currency} ${Number(estimation.selling_price || estimation.contract_target_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Commercial bid price', color: [240, 253, 244], border: [187, 247, 208], text: [22, 101, 52] },
    { label: 'ESTIMATED GROSS PROFIT', val: `${estimation.currency} ${Number(estimation.estimated_gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Price minus Total Cost', color: [248, 250, 252], border: [226, 232, 240], text: [15, 23, 42] },
    { label: 'PROJECTED MARGIN %', val: `${Number(estimation.markup_margin_percent || 0).toFixed(1)}%`, sub: 'Gross profit on cost', color: [254, 243, 199], border: [253, 230, 138], text: [146, 64, 14] },
  ];

  cards.forEach((c, i) => {
    const cardX = margin + i * (cardW + 2);
    doc.setFillColor(c.color[0], c.color[1], c.color[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.roundedRect(cardX, curY, cardW, 14, 1, 1, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(c.label, cardX + cardW / 2, curY + 3.5, { align: 'center' });

    doc.setTextColor(c.text[0], c.text[1], c.text[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(c.val, cardX + cardW / 2, curY + 8.5, { align: 'center' });

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text(c.sub, cardX + cardW / 2, curY + 12, { align: 'center' });
  });

  curY += 16;

  // Cost Element Breakdown Summary Bar Table
  const totalCostVal = Math.max(Number(estimation.total_job_cost), 1);
  const elements = [
    { title: 'Labour & Manpower Cost', amount: Number(estimation.total_labour_cost), pct: (Number(estimation.total_labour_cost) / totalCostVal) * 100, note: `${estimation.total_manhours} Budgeted Manhours` },
    { title: 'Material Cost (Raw Materials)', amount: Number(estimation.total_material_cost), pct: (Number(estimation.total_material_cost) / totalCostVal) * 100, note: `${materialItems.length} BOM Items` },
    { title: 'Subcontractor Expenses', amount: Number(estimation.total_subcontract_cost), pct: (Number(estimation.total_subcontract_cost) / totalCostVal) * 100, note: `${subcontractItems.length} Subcontract Scopes` },
    { title: 'Miscellaneous Expenses', amount: Number(estimation.total_misc_cost), pct: (Number(estimation.total_misc_cost) / totalCostVal) * 100, note: `${miscItems.length} Misc Allocations` },
  ];

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('COST ELEMENT', margin + 3, curY + 3.5);
  doc.text('BUDGET ALLOCATION (AED)', margin + 80, curY + 3.5);
  doc.text('SHARE %', margin + 130, curY + 3.5);
  doc.text('REMARKS', margin + 155, curY + 3.5);
  curY += 5;

  elements.forEach((el, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, curY, contentWidth, 5, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(el.title, margin + 3, curY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.text(el.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + 115, curY + 3.5, { align: 'right' });
    doc.text(`${el.pct.toFixed(1)}%`, margin + 142, curY + 3.5, { align: 'right' });
    doc.setTextColor(100, 116, 139);
    doc.text(el.note, margin + 155, curY + 3.5);
    curY += 5;
  });

  curY += 4;

  // 4. Section 2: LABOUR MANHOURS & MANPOWER COST
  checkPageBreak(35);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('2. LABOUR MANHOURS & MANPOWER COST', margin + 3, curY + 4);
  doc.setFontSize(7);
  doc.text(`Total Manhours: ${estimation.total_manhours} Hrs  •  Total: ${estimation.currency} ${Number(estimation.total_labour_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 4, { align: 'right' });
  curY += 6.5;

  // Labour Table Header: Sr(10) | Trade / Role (60) | Headcount (18) | Reg Hrs (22) | OT Hrs (20) | Hourly Rate (24) | Total Cost (32)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SR', margin + 2, curY + 3.5);
  doc.text('TRADE / CRAFT ROLE', margin + 12, curY + 3.5);
  doc.text('NOS', margin + 75, curY + 3.5);
  doc.text('REG HRS', margin + 92, curY + 3.5);
  doc.text('OT HRS', margin + 114, curY + 3.5);
  doc.text('RATE (AED/HR)', margin + 134, curY + 3.5);
  doc.text('TOTAL COST (AED)', pageWidth - margin - 3, curY + 3.5, { align: 'right' });
  curY += 5;

  labourItems.forEach((item, index) => {
    checkPageBreak(7);
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(margin, curY, contentWidth, 5.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(String(index + 1), margin + 3, curY + 3.8);
    doc.text(item.trade || 'Tradesman', margin + 12, curY + 3.8);
    doc.text(String(item.headcount || 1), margin + 80, curY + 3.8, { align: 'center' });
    doc.text(String(item.regularHours || 0), margin + 102, curY + 3.8, { align: 'center' });
    doc.text(String(item.overtimeHours || 0), margin + 122, curY + 3.8, { align: 'center' });
    doc.text(Number(item.hourlyRate || 0).toFixed(2), margin + 148, curY + 3.8, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(Number(item.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - margin - 3, curY + 3.8, { align: 'right' });
    curY += 5.5;
  });

  // Labour Subtotal Row
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, curY, contentWidth, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SUBTOTAL: LABOUR & MANPOWER COST', margin + 12, curY + 3.8);
  doc.text(`${estimation.total_manhours} Total Hrs`, margin + 102, curY + 3.8, { align: 'center' });
  doc.text(`${estimation.currency} ${Number(estimation.total_labour_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 3.8, { align: 'right' });
  curY += 8;

  // 5. Section 3: MATERIAL COST
  checkPageBreak(35);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('3. MATERIAL COST (RAW MATERIALS & PROFILES)', margin + 3, curY + 4);
  doc.setFontSize(7);
  doc.text(`Total: ${estimation.currency} ${Number(estimation.total_material_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 4, { align: 'right' });
  curY += 6.5;

  // Material Table Header: Sr(10) | Description (55) | Spec / Grade (40) | Qty (18) | UOM (14) | Rate (22) | Total (27)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SR', margin + 2, curY + 3.5);
  doc.text('ITEM DESCRIPTION', margin + 12, curY + 3.5);
  doc.text('SPECIFICATION / GRADE', margin + 70, curY + 3.5);
  doc.text('QTY', margin + 115, curY + 3.5);
  doc.text('UOM', margin + 130, curY + 3.5);
  doc.text('RATE (AED)', margin + 152, curY + 3.5, { align: 'right' });
  doc.text('TOTAL COST (AED)', pageWidth - margin - 3, curY + 3.5, { align: 'right' });
  curY += 5;

  materialItems.forEach((item, index) => {
    checkPageBreak(7);
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(margin, curY, contentWidth, 5.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(String(index + 1), margin + 3, curY + 3.8);
    doc.text(doc.splitTextToSize(item.description, 55)[0] || '', margin + 12, curY + 3.8);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(item.specification || 'Standard Grade', 42)[0] || '', margin + 70, curY + 3.8);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.quantity), margin + 120, curY + 3.8, { align: 'right' });
    doc.text(item.uom || 'PCS', margin + 130, curY + 3.8);
    doc.text(Number(item.unitRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + 152, curY + 3.8, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(Number(item.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - margin - 3, curY + 3.8, { align: 'right' });
    curY += 5.5;
  });

  // Material Subtotal Row
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, curY, contentWidth, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SUBTOTAL: MATERIAL COST', margin + 12, curY + 3.8);
  doc.text(`${estimation.currency} ${Number(estimation.total_material_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 3.8, { align: 'right' });
  curY += 8;

  // 6. Section 4: SUB CONTRACTOR EXPENSES
  checkPageBreak(35);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('4. SUB CONTRACTOR EXPENSES (SPECIALIZED PROCESSES)', margin + 3, curY + 4);
  doc.setFontSize(7);
  doc.text(`Total: ${estimation.currency} ${Number(estimation.total_subcontract_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 4, { align: 'right' });
  curY += 6.5;

  // Subcontract Table Header: Sr(10) | Scope / Service (60) | Subcontractor (45) | Qty (15) | UOM (12) | Rate (20) | Total (24)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SR', margin + 2, curY + 3.5);
  doc.text('SUBCONTRACT SCOPE / SERVICE', margin + 12, curY + 3.5);
  doc.text('APPROVED SUBCONTRACTOR', margin + 75, curY + 3.5);
  doc.text('QTY', margin + 128, curY + 3.5);
  doc.text('UOM', margin + 140, curY + 3.5);
  doc.text('TOTAL COST (AED)', pageWidth - margin - 3, curY + 3.5, { align: 'right' });
  curY += 5;

  subcontractItems.forEach((item, index) => {
    checkPageBreak(7);
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(margin, curY, contentWidth, 5.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(String(index + 1), margin + 3, curY + 3.8);
    doc.text(doc.splitTextToSize(item.serviceName, 60)[0] || '', margin + 12, curY + 3.8);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(item.subcontractor || 'Specialized Vendor', 48)[0] || '', margin + 75, curY + 3.8);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.units), margin + 133, curY + 3.8, { align: 'right' });
    doc.text(item.uom || 'LOT', margin + 140, curY + 3.8);
    doc.setFont('helvetica', 'bold');
    doc.text(Number(item.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - margin - 3, curY + 3.8, { align: 'right' });
    curY += 5.5;
  });

  // Subcontract Subtotal Row
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, curY, contentWidth, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SUBTOTAL: SUB CONTRACTOR EXPENSES', margin + 12, curY + 3.8);
  doc.text(`${estimation.currency} ${Number(estimation.total_subcontract_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 3.8, { align: 'right' });
  curY += 8;

  // 7. Section 5: MISC EXPENSES
  checkPageBreak(35);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('5. MISCELLANEOUS EXPENSES (LOGISTICS, GASES, PERMITS, TESTING)', margin + 3, curY + 4);
  doc.setFontSize(7);
  doc.text(`Total: ${estimation.currency} ${Number(estimation.total_misc_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 4, { align: 'right' });
  curY += 6.5;

  // Misc Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SR', margin + 2, curY + 3.5);
  doc.text('EXPENSE CATEGORY', margin + 12, curY + 3.5);
  doc.text('DESCRIPTION & DELIVERABLES', margin + 65, curY + 3.5);
  doc.text('AMOUNT (AED)', pageWidth - margin - 3, curY + 3.5, { align: 'right' });
  curY += 5;

  miscItems.forEach((item, index) => {
    checkPageBreak(7);
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(margin, curY, contentWidth, 5.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(String(index + 1), margin + 3, curY + 3.8);
    doc.text(doc.splitTextToSize(item.expenseCategory, 50)[0] || '', margin + 12, curY + 3.8);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(item.description, 85)[0] || '', margin + 65, curY + 3.8);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - margin - 3, curY + 3.8, { align: 'right' });
    curY += 5.5;
  });

  // Misc Subtotal Row
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, curY, contentWidth, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SUBTOTAL: MISCELLANEOUS EXPENSES', margin + 12, curY + 3.8);
  doc.text(`${estimation.currency} ${Number(estimation.total_misc_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, curY + 3.8, { align: 'right' });
  curY += 8;

  // 8. GRAND TOTAL SUMMARY BANNER
  checkPageBreak(25);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, curY, contentWidth, 11, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GRAND TOTAL ESTIMATED JOB COST:', margin + 4, curY + 7);
  doc.setFontSize(10.5);
  doc.text(
    `${estimation.currency} ${Number(estimation.total_job_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - margin - 4,
    curY + 7,
    { align: 'right' }
  );
  curY += 14;

  // 9. Notes & Assumptions
  checkPageBreak(20);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, 12, 1, 1, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('ESTIMATION NOTES & COMMERCIAL ASSUMPTIONS:', margin + 3, curY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(6.5);
  const notesText = estimation.notes || '1. All material prices based on current mill quotations and subject to steel price index fluctuations.\n2. Subcontract services subject to approval of third-party inspection agency (TPI) and client vendor list.\n3. Fabrication to be executed strictly in accordance with approved quality plan (ITP) and ASME codes.';
  const splitNotes = doc.splitTextToSize(notesText, contentWidth - 6);
  doc.text(splitNotes, margin + 3, curY + 7.5);
  curY += 15;

  // 10. Triple Signatures Endorsement
  checkPageBreak(30);
  const sigColW = (contentWidth - 6) / 3;
  const sigs = [
    { title: 'PREPARED BY', name: estimation.prepared_by || 'Lead Estimator', role: 'Cost Estimation Engineer' },
    { title: 'CHECKED & VERIFIED BY', name: estimation.reviewed_by || 'Finance Controller', role: 'Technical / Finance Lead' },
    { title: 'APPROVED BY', name: estimation.approved_by || 'Managing Director', role: 'Commercial Director / MD' },
  ];

  sigs.forEach((s, idx) => {
    const sigX = margin + idx * (sigColW + 3);
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(sigX, curY, sigW(sigColW), 20, 1, 1, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(s.title, sigX + 3, curY + 4.5);

    doc.setDrawColor(226, 232, 240);
    doc.line(sigX + 3, curY + 12, sigX + sigColW - 3, curY + 12);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(s.name, sigX + 3, curY + 15.5);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(s.role, sigX + 3, curY + 18.5);
  });

  function sigW(w: number) {
    return w;
  }

  // Update total pages in footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages} • CONFIDENTIAL COMMERCIAL ESTIMATE • CEMCON ERP ENGINE`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const filename = `${estimation.estimation_no}_Job_${estimation.job_number}_Estimation.pdf`;
  doc.save(filename);
  return filename;
}
