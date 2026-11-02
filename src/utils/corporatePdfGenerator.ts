import { jsPDF } from 'jspdf';
import type { CemconCompanyInfo } from '../components/hr/HRPrintableForms';

export type FormType =
  | 'recruitment'
  | 'pre_interview'
  | 'interview_eval'
  | 'joining'
  | 'leave'
  | 'clearance';

interface ExportPdfParams {
  formType: FormType;
  company: CemconCompanyInfo;
  tenantName: string;
  data: {
    recruitment?: any;
    preInterview?: any;
    eval?: any;
    joining?: any;
    leave?: any;
    clearance?: any;
  };
}

export function exportCorporatePdf({
  formType,
  company,
  tenantName,
  data,
}: ExportPdfParams): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Helper drawing functions
  const drawHeader = (docRef: string, formTitle: string) => {
    // Watermark
    doc.saveGraphicsState();
    doc.setTextColor(240, 243, 246);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(55);
    doc.text('CEMCON', pageWidth / 2, 140, {
      align: 'center',
      angle: 30,
    });
    doc.restoreGraphicsState();

    // Company Header
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
      `TRN: ${company.trn} • Commercial Reg. No: ${company.regNo} • ISO 9001 / ISO 45001 Certified`,
      margin,
      margin + 16.5
    );

    // Right Badge: Ref No & Dept
    const badgeW = 48;
    const badgeX = pageWidth - margin - badgeW;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(badgeX, margin, badgeW, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('HR & ADMIN DEPT', badgeX + badgeW / 2, margin + 4.8, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`REF: ${docRef}`, pageWidth - margin, margin + 11.5, { align: 'right' });
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`ENTITY: ${company.code}`, pageWidth - margin, margin + 15.5, { align: 'right' });

    // Separator line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(margin, margin + 19, pageWidth - margin, margin + 19);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 20, pageWidth - margin, margin + 20);

    // Form Title Banner
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, margin + 22, contentWidth, 9, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(formTitle.toUpperCase(), pageWidth / 2, margin + 28, { align: 'center' });
  };

  const drawFooter = () => {
    const footerY = pageHeight - margin + 2;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      `${tenantName} • Human Resources Management System`,
      margin,
      footerY
    );
    doc.text(
      `Confidential Corporate Document • Retain in Personnel Dossier • ISO Verified`,
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
  };

  const drawFieldRow = (
    y: number,
    leftLabel: string,
    leftVal: string,
    rightLabel: string,
    rightVal: string,
    h = 8
  ) => {
    const halfW = contentWidth / 2;
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, h, 'FD');
    doc.line(margin + halfW, y, margin + halfW, y + h);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(leftLabel, margin + 3, y + 5.2);
    doc.text(rightLabel, margin + halfW + 3, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const leftLabelW = doc.getTextWidth(leftLabel);
    const rightLabelW = doc.getTextWidth(rightLabel);
    doc.text(leftVal || 'N/A', margin + 5 + leftLabelW, y + 5.2);
    doc.text(rightVal || 'N/A', margin + halfW + 5 + rightLabelW, y + 5.2);
  };

  const drawSectionHeader = (y: number, title: string) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(title.toUpperCase(), margin + 3, y + 4.3);
  };

  const drawTextBox = (y: number, label: string, text: string, boxH = 16) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, boxH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(text || 'N/A', contentWidth - 6);
    doc.text(lines, margin + 3, y + 9);
  };

  const drawSignatures3Col = (
    y: number,
    sig1: { title: string; subtitle: string; name?: string },
    sig2: { title: string; subtitle: string; name?: string },
    sig3: { title: string; subtitle: string; name?: string }
  ) => {
    const colW = (contentWidth - 8) / 3;
    const items = [sig1, sig2, sig3];

    items.forEach((item, idx) => {
      const x = margin + idx * (colW + 4);
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, y, colW, 26, 'FD');

      // Signature line
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(x + 5, y + 15, x + colW - 5, y + 15);

      if (item.name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(item.name, x + colW / 2, y + 13.5, { align: 'center' });
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.title, x + colW / 2, y + 19, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.subtitle, x + colW / 2, y + 23, { align: 'center' });
    });
  };

  // Build Specific Form Content
  let fileName = '';

  if (formType === 'leave') {
    const lv = data.leave || {};
    drawHeader(lv.refNo || 'CEM-LV-2026', 'Employee Leave & Absence Application Form');

    let curY = margin + 34;
    drawSectionHeader(curY, '1. Employee Particulars');
    curY += 7;
    drawFieldRow(curY, 'Employee No:', lv.empNo, 'Application Date:', lv.applicationDate);
    curY += 8;
    drawFieldRow(curY, 'Employee Name:', lv.empName, 'Designation:', lv.designation);
    curY += 8;
    drawFieldRow(curY, 'Department:', lv.department, 'Operating Company:', company.code);

    curY += 12;
    drawSectionHeader(curY, '2. Leave Details & Duration');
    curY += 7;
    drawFieldRow(curY, 'Leave Category:', lv.leaveType, 'Total Duration:', lv.totalDays);
    curY += 8;
    drawFieldRow(curY, 'Commencement Date:', lv.startDate, 'Return to Duty:', lv.endDate);
    curY += 8;
    drawFieldRow(curY, 'Reliever / Handover:', lv.relieverName, 'Emergency Contact:', lv.emergencyPhone);

    curY += 12;
    drawSectionHeader(curY, '3. Purpose & Destination Contact');
    curY += 7;
    drawTextBox(curY, 'Reason / Justification for Leave:', lv.reason, 14);
    curY += 16;
    drawTextBox(curY, 'Destination Address During Leave:', lv.contactAddress, 14);

    curY += 18;
    drawSectionHeader(curY, '4. Corporate Authorizations & Approvals');
    curY += 8;
    drawSignatures3Col(
      curY,
      { title: 'Applicant Signature', subtitle: 'Employee Confirmation & Handover', name: lv.empName },
      { title: 'Department Head', subtitle: 'Operations / Project Endorsement', name: 'Muhammad Faisal' },
      { title: 'HR Manager Approval', subtitle: 'MOHRE & Leave Balance Verified', name: 'Muhammad Adeel' }
    );

    drawFooter();
    fileName = `CEMCON_Leave_Application_${lv.empNo || 'EMP'}_${company.code}.pdf`;
  } else if (formType === 'pre_interview') {
    const pi = data.preInterview || {};
    drawHeader(pi.refNo || 'CEM-PI-2026', 'Candidate Pre-Interview Information Sheet');

    let curY = margin + 34;
    drawSectionHeader(curY, '1. Candidate Identification');
    curY += 7;
    drawFieldRow(curY, 'Candidate Name:', pi.candidateName, 'Date of Submission:', pi.date);
    curY += 8;
    drawFieldRow(curY, 'Target Position:', pi.positionApplied, 'Nationality:', pi.nationality);
    curY += 8;
    drawFieldRow(curY, 'Mobile Phone:', pi.phone, 'Official Email:', pi.email);
    curY += 8;
    drawFieldRow(curY, 'Date of Birth:', pi.dob, 'Highest Qualification:', pi.highestQualification);

    curY += 12;
    drawSectionHeader(curY, '2. Employment & Residency Status');
    curY += 7;
    drawFieldRow(curY, 'Current UAE Visa Status:', pi.visaStatus, 'Visa Expiry Date:', pi.visaExpiry);
    curY += 8;
    drawFieldRow(curY, 'Current Employer:', pi.currentEmployer, 'Notice Period:', pi.noticePeriod);
    curY += 8;
    drawFieldRow(curY, 'Current Monthly Salary:', pi.currentSalary, 'Expected Monthly Salary:', pi.expectedSalary);

    curY += 12;
    drawSectionHeader(curY, '3. Declaration & Legal Clearance');
    curY += 7;
    drawTextBox(
      curY,
      'Applicant Declaration:',
      'I hereby certify that all information submitted on this document is authentic and accurate. I confirm that I am eligible to work in the UAE under MOHRE guidelines and possess valid credentials.',
      16
    );

    curY += 20;
    drawSectionHeader(curY, '4. Verification & HR Screening Sign-Off');
    curY += 8;
    drawSignatures3Col(
      curY,
      { title: 'Candidate Signature', subtitle: 'Consent & Information Accuracy', name: pi.candidateName },
      { title: 'HR Interview Coordinator', subtitle: 'Credential & Visa Verified', name: 'Muhammad Adeel' },
      { title: 'Department Head Review', subtitle: 'Technical Screening Clearance', name: 'Muhammad Faisal' }
    );

    drawFooter();
    fileName = `CEMCON_Pre_Interview_${pi.candidateName?.replace(/\s+/g, '_') || 'Candidate'}_${company.code}.pdf`;
  } else if (formType === 'recruitment') {
    const rec = data.recruitment || {};
    drawHeader(rec.refNo || 'CEM-MR-2026', 'Manpower / Recruitment Requisition Form');

    let curY = margin + 34;
    drawSectionHeader(curY, '1. Position & Department Requisition');
    curY += 7;
    drawFieldRow(curY, 'Requesting Department:', rec.requestingDept, 'Requisition Date:', rec.date);
    curY += 8;
    drawFieldRow(curY, 'Target Job Title:', rec.designation, 'Positions Required:', `${rec.vacancies} Personnel`);
    curY += 8;
    drawFieldRow(curY, 'Employment Nature:', rec.jobType, 'Target Mobilization:', rec.targetDate);

    curY += 12;
    drawSectionHeader(curY, '2. Justification & Project Allocation');
    curY += 7;
    drawTextBox(curY, 'Justification / Contract Scope:', rec.justification, 16);
    curY += 18;
    drawTextBox(curY, 'Key Responsibilities & Qualifications:', rec.jobDescription, 16);
    curY += 18;
    drawFieldRow(curY, 'Budgeted Salary Range:', rec.budgetSalary, 'Min. Experience Required:', rec.minExperience);

    curY += 14;
    drawSectionHeader(curY, '3. Corporate Authorizations & Signatures');
    curY += 8;
    drawSignatures3Col(
      curY,
      { title: 'Requesting Dept Head', subtitle: 'Department Requisition Initiator', name: rec.requestedBy || 'Department Head' },
      { title: 'Finance Controller', subtitle: 'Budget & Cost Center Verified', name: 'Finance Controller' },
      { title: 'Managing Director Approval', subtitle: 'Final Commercial Authorization', name: 'Managing Director' }
    );

    drawFooter();
    fileName = `CEMCON_Recruitment_Requisition_${rec.refNo || 'REC'}_${company.code}.pdf`;
  } else if (formType === 'interview_eval') {
    const ev = data.eval || {};
    drawHeader(ev.refNo || 'CEM-IE-2026', 'Candidate Interview & Technical Evaluation Sheet');

    let curY = margin + 34;
    drawSectionHeader(curY, '1. Evaluation Particulars');
    curY += 7;
    drawFieldRow(curY, 'Candidate Full Name:', ev.candidateName, 'Evaluation Date:', ev.date);
    curY += 8;
    drawFieldRow(curY, 'Position Evaluated:', ev.position, 'Lead Evaluator:', ev.interviewer);

    curY += 12;
    drawSectionHeader(curY, '2. Technical Competency Scoring (Out of 10)');
    curY += 7;
    drawFieldRow(curY, 'Trade Skills & Technical Acumen:', ev.technicalRating, 'Relevant Industrial Experience:', ev.experienceRating);
    curY += 8;
    drawFieldRow(curY, 'Communication & Language:', ev.communicationRating, 'HSE & Safety Standards:', ev.safetyRating);
    curY += 8;
    drawFieldRow(curY, 'Cumulative Evaluation Score:', ev.overallScore, 'Recommendation:', ev.recommendation);

    curY += 12;
    drawSectionHeader(curY, '3. Assessment & Practical Test Results');
    curY += 7;
    drawTextBox(curY, 'Practical Trade Test Results:', ev.testResults, 14);
    curY += 16;
    drawTextBox(curY, 'Evaluator Comments & Recommendations:', ev.interviewerComments, 14);

    curY += 18;
    drawSectionHeader(curY, '4. Technical Committee Sign-Off');
    curY += 8;
    drawSignatures3Col(
      curY,
      { title: 'Technical Evaluator', subtitle: 'Practical & Trade Assessment', name: ev.interviewer || 'Technical Evaluator' },
      { title: 'HR Manager Review', subtitle: 'Labor Law & Compensation Check', name: 'HR Manager' },
      { title: 'Managing Director Approval', subtitle: 'Formal Offer Letter Authorization', name: 'Managing Director' }
    );

    drawFooter();
    fileName = `CEMCON_Interview_Evaluation_${ev.candidateName?.replace(/\s+/g, '_') || 'Candidate'}_${company.code}.pdf`;
  } else if (formType === 'joining') {
    const jn = data.joining || {};
    drawHeader(jn.refNo || 'CEM-JF-2026', 'Employee Joining & Onboarding Declaration Form');

    let curY = margin + 34;
    drawSectionHeader(curY, '1. Employee & Appointment Particulars');
    curY += 7;
    drawFieldRow(curY, 'Employee No:', jn.empNo, 'Official Joining Date:', jn.joiningDate);
    curY += 8;
    drawFieldRow(curY, 'Full Legal Name:', jn.fullName, 'Designation:', jn.designation);
    curY += 8;
    drawFieldRow(curY, 'Assigned Department:', jn.department, 'Reporting Supervisor:', jn.reportingTo);

    curY += 12;
    drawSectionHeader(curY, '2. Statutory & Banking Credentials');
    curY += 7;
    drawFieldRow(curY, 'Passport Number:', jn.passportNo, 'Emirates ID No:', jn.emiratesId);
    curY += 8;
    drawFieldRow(curY, 'Bank Name:', jn.bankName, 'IBAN Number:', jn.iban);
    curY += 8;
    drawFieldRow(curY, 'Emergency Contact:', jn.emergencyContact, 'Safety Induction Date:', jn.safetyInductionDate);

    curY += 12;
    drawSectionHeader(curY, '3. HSE Induction & Asset Receipt');
    curY += 7;
    drawTextBox(curY, 'Personal Protective Equipment (PPE) Issued:', jn.ppeIssued, 14);

    curY += 18;
    drawSectionHeader(curY, '4. Onboarding Authorizations');
    curY += 8;
    drawSignatures3Col(
      curY,
      { title: 'Employee Signature', subtitle: 'Acceptance of Company Code & Assets', name: jn.fullName || 'Employee' },
      { title: 'HSE Safety Officer', subtitle: 'Safety Induction Completed', name: 'HSE Inspector' },
      { title: 'HR Manager Sign-Off', subtitle: 'Corporate Dossier Activated', name: 'HR Manager' }
    );

    drawFooter();
    fileName = `CEMCON_Joining_Form_${jn.empNo || 'EMP'}_${company.code}.pdf`;
  } else if (formType === 'clearance') {
    const cl = data.clearance || {};
    drawHeader(cl.refNo || 'CEM-CF-2026', 'Employee Clearance & Handover Sign-Off Form');

    let curY = margin + 34;
    drawSectionHeader(curY, '1. Departing Personnel Identification');
    curY += 7;
    drawFieldRow(curY, 'Employee No:', cl.empNo, 'Resignation Notice Date:', cl.resignationDate);
    curY += 8;
    drawFieldRow(curY, 'Full Legal Name:', cl.empName, 'Last Working Date:', cl.lastWorkingDate);
    curY += 8;
    drawFieldRow(curY, 'Designation:', cl.designation, 'Department:', cl.department);

    curY += 12;
    drawSectionHeader(curY, '2. Directorate Handover & Department Clearances');
    curY += 7;
    drawFieldRow(curY, 'IT Systems & ERP Access:', cl.itStatus, 'Warehouse & Tools:', cl.storeStatus);
    curY += 8;
    drawFieldRow(curY, 'Finance & Accounts Settlement:', cl.accountsStatus, 'Camp & Facility Admin:', cl.adminStatus);
    curY += 8;
    drawFieldRow(curY, 'HR & MOHRE Cancellation:', cl.hrStatus, 'End-of-Service Gratuity:', cl.gratuityAmount);

    curY += 12;
    drawSectionHeader(curY, '3. Final Settlement Disbursement');
    curY += 7;
    drawTextBox(
      curY,
      'Final Discharge Note:',
      `Net Final Settlement Payable: ${cl.finalSettlement}. The employee certifies receipt in full and final settlement of all statutory and contractual claims against ${company.name}.`,
      14
    );

    curY += 18;
    drawSectionHeader(curY, '4. Sign-Off & Official Discharge');
    curY += 8;
    drawSignatures3Col(
      curY,
      { title: 'Departing Employee', subtitle: 'Full & Final Discharge Received', name: cl.empName || 'Employee' },
      { title: 'Finance Controller', subtitle: 'Payroll & Bank Wire Disbursed', name: 'Finance Controller' },
      { title: 'HR Manager Handover', subtitle: 'Visa Cancelled & File Closed', name: 'HR Manager' }
    );

    drawFooter();
    fileName = `CEMCON_Clearance_${cl.empNo || 'EMP'}_${company.code}.pdf`;
  }

  // Trigger browser download
  doc.save(fileName);
  return fileName;
}

export interface JobOrderMaterial {
  srNo?: number | string;
  description: string;
  qty: number | string;
  rate: number | string;
  totalCost?: number | string;
}

export interface JobOrderManpower {
  srNo?: number | string;
  trade: string;
  nos: number | string;
  noOfDays: number | string;
  totalDays?: number | string;
  ratePerDay: number | string;
  totalCost?: number | string;
}

export interface JobOrderEquipment {
  srNo?: number | string;
  machineryType: string;
  capacity: string;
  quantity: number | string;
  daysOrHrs: number | string;
  ratePerDay: number | string;
  totalCost?: number | string;
}

export interface JobOrderPdfParams {
  jobNumber: string;
  date: string;
  clientName: string;
  location: string;
  deadline: string;
  priority: 'Normal' | 'Urgent' | 'Critical' | string;
  jobDescription: string;
  materials: JobOrderMaterial[];
  manpower: JobOrderManpower[];
  equipment: JobOrderEquipment[];
  overheadsEstimate: number | string;
  totalEstimatedCost: number | string;
  preparedBy?: string;
  approvedBy?: string;
  receivedBy?: string;
  company: CemconCompanyInfo;
  tenantName: string;
}

export function exportJobOrderPdf(params: JobOrderPdfParams): string {
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

  const checkPageBreak = (neededHeight: number) => {
    if (curY + neededHeight > pageHeight - margin - 12) {
      drawFooter();
      doc.addPage();
      curY = margin;
      drawSubsequentHeader();
    }
  };

  const drawFooter = () => {
    const footerY = pageHeight - margin + 2;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(
      `${params.tenantName} • Engineering Directorate • ISO 9001:2015 & OHSAS 18001 Certified`,
      margin,
      footerY
    );
    doc.text(
      `Job Order #${params.jobNumber} • Controlled Industrial Record • Page ${doc.getNumberOfPages()}`,
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
  };

  const drawSubsequentHeader = () => {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${params.company.name.toUpperCase()} — JOB ORDER #${params.jobNumber} (CONT.)`, margin, curY + 4);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, curY + 6, pageWidth - margin, curY + 6);
    curY += 10;
  };

  // 1. Watermark
  doc.saveGraphicsState();
  doc.setTextColor(242, 245, 249);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.text('CEMCON', pageWidth / 2, 145, { align: 'center', angle: 30 });
  doc.restoreGraphicsState();

  // 2. Main Official Header
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(params.company.name.toUpperCase(), margin, curY + 4);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`A MEMBER OF ${params.tenantName.toUpperCase()} • ${params.company.division.toUpperCase()}`, margin, curY + 8.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${params.company.address} • Tel: ${params.company.phone}`, margin, curY + 12.5);
  doc.text(`TRN: ${params.company.trn} • Commercial Reg. No: ${params.company.regNo} • ISO 9001 / ISO 45001 Certified`, margin, curY + 16.5);

  // Top Right Badge: Job Order & Priority
  const badgeW = 50;
  const badgeX = pageWidth - margin - badgeW;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(badgeX, curY, badgeW, 7, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL JOB ORDER', badgeX + badgeW / 2, curY + 4.8, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`JOB NO: ${params.jobNumber}`, pageWidth - margin, curY + 12, { align: 'right' });

  // Priority badge text
  const priorityColor = params.priority.toUpperCase() === 'CRITICAL' ? [225, 29, 72] : params.priority.toUpperCase() === 'URGENT' ? [217, 119, 6] : [16, 185, 129];
  doc.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`PRIORITY: ${params.priority.toUpperCase()}`, pageWidth - margin, curY + 16.5, { align: 'right' });

  // Double horizontal separator
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(margin, curY + 19, pageWidth - margin, curY + 19);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, curY + 20, pageWidth - margin, curY + 20);

  // Document Title Banner
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY + 22, contentWidth, 8, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('WORKS & FABRICATION JOB ORDER', pageWidth / 2, curY + 27.5, { align: 'center' });

  curY += 33;

  // 3. Top Metadata Box (Job Order No, Date, Client, Location, Deadline, Priority)
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, contentWidth, 18, 1, 1, 'FD');

  const halfW = contentWidth / 2;
  const thirdW = contentWidth / 3;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Job Order No:', margin + 3, curY + 5);
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(8.5);
  doc.text(params.jobNumber || 'PENDING', margin + 26, curY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Date:', margin + thirdW + 3, curY + 5);
  doc.setTextColor(15, 23, 42);
  doc.text(params.date || 'N/A', margin + thirdW + 15, curY + 5);

  doc.setTextColor(71, 85, 105);
  doc.text('Priority:', margin + thirdW * 2 + 3, curY + 5);
  doc.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2]);
  doc.text(params.priority.toUpperCase(), margin + thirdW * 2 + 18, curY + 5);

  // Divider inside metadata
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, curY + 9, pageWidth - margin, curY + 9);

  // Row 2
  doc.setTextColor(71, 85, 105);
  doc.text("Client's Name:", margin + 3, curY + 14);
  doc.setTextColor(15, 23, 42);
  doc.text(params.clientName || 'N/A', margin + 26, curY + 14);

  doc.setTextColor(71, 85, 105);
  doc.text('Location:', margin + thirdW + 3, curY + 14);
  doc.setTextColor(15, 23, 42);
  doc.text(params.location || 'Sharjah / Dubai Yard', margin + thirdW + 18, curY + 14);

  doc.setTextColor(71, 85, 105);
  doc.text('Deadline:', margin + thirdW * 2 + 3, curY + 14);
  doc.setTextColor(15, 23, 42);
  doc.text(params.deadline || 'N/A', margin + thirdW * 2 + 18, curY + 14);

  curY += 21;

  // 4. Section 1: Job Description
  checkPageBreak(25);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('1. JOB DESCRIPTION', margin + 3, curY + 4);
  curY += 6;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  const descLines = doc.splitTextToSize(params.jobDescription || 'Standard mechanical fabrication and erection works according to approved shop drawings and specifications.', contentWidth - 6);
  const descBoxH = Math.max(12, descLines.length * 4 + 4);
  doc.rect(margin, curY, contentWidth, descBoxH, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(descLines, margin + 3, curY + 4);
  curY += descBoxH + 4;

  // 5. Section 2: Materials Required
  checkPageBreak(30);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('2. MATERIALS REQUIRED', margin + 3, curY + 4);
  curY += 6;

  // Materials Table Header
  // SR. # (12) | DESCRIPTION (76) | QTY. Nos (24) | Rate Per Piece (AED) (34) | Total Estimated Cost (AED) (40)
  const colM1 = 12;
  const colM2 = 76;
  const colM3 = 24;
  const colM4 = 34;
  const colM5 = 40;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text('SR. #', margin + 2, curY + 4.2);
  doc.text('DESCRIPTION', margin + colM1 + 2, curY + 4.2);
  doc.text('QTY. Nos', margin + colM1 + colM2 + 2, curY + 4.2);
  doc.text('Rate Per Piece (AED)', margin + colM1 + colM2 + colM3 + 2, curY + 4.2);
  doc.text('Total Estimated Cost (AED)', margin + colM1 + colM2 + colM3 + colM4 + 2, curY + 4.2);
  curY += 6;

  let matSubtotal = 0;
  const materialsList = params.materials && params.materials.length > 0 ? params.materials : [
    { srNo: 1, description: 'Carbon Steel Plate ASTM A516 Gr 70 (12mm thk)', qty: 10, rate: 1250, totalCost: 12500 },
    { srNo: 2, description: 'Seamless Pipe ASTM A106 Gr B 4" Sch 40', qty: 24, rate: 380, totalCost: 9120 },
  ];

  materialsList.forEach((m, idx) => {
    checkPageBreak(7);
    const lineCost = Number(m.totalCost) || (Number(m.qty || 0) * Number(m.rate || 0));
    matSubtotal += lineCost;

    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, curY, contentWidth, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(String(m.srNo || idx + 1), margin + 3, curY + 4.2);
    doc.text(String(m.description || 'General Material'), margin + colM1 + 2, curY + 4.2);
    doc.text(String(m.qty || '1'), margin + colM1 + colM2 + 2, curY + 4.2);
    doc.text(Number(m.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colM1 + colM2 + colM3 + 2, curY + 4.2);
    doc.setFont('helvetica', 'bold');
    doc.text(lineCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colM1 + colM2 + colM3 + colM4 + 2, curY + 4.2);
    curY += 6;
  });

  // Materials Subtotal Row
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Materials Subtotal (AED):', margin + colM1 + colM2 + 2, curY + 4.2);
  doc.setTextColor(15, 23, 42);
  doc.text(matSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colM1 + colM2 + colM3 + colM4 + 2, curY + 4.2);
  curY += 9;

  // 6. Section 3: Manpower Required
  // SR. # (10) | TRADE (46) | Nos. (16) | No of Days (20) | Total Days Required (26) | Per Day Rate (AED) (28) | Total Est. Cost (AED) (40)
  checkPageBreak(30);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('3. MANPOWER REQUIRED', margin + 3, curY + 4);
  curY += 6;

  const colP1 = 10;
  const colP2 = 46;
  const colP3 = 16;
  const colP4 = 20;
  const colP5 = 26;
  const colP6 = 28;
  const colP7 = 40;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('SR. #', margin + 2, curY + 4.2);
  doc.text('TRADE', margin + colP1 + 2, curY + 4.2);
  doc.text('Nos.', margin + colP1 + colP2 + 2, curY + 4.2);
  doc.text('No of Days', margin + colP1 + colP2 + colP3 + 2, curY + 4.2);
  doc.text('Total Days Req.', margin + colP1 + colP2 + colP3 + colP4 + 2, curY + 4.2);
  doc.text('Per Day Rate (AED)', margin + colP1 + colP2 + colP3 + colP4 + colP5 + 2, curY + 4.2);
  doc.text('Total Est. Cost (AED)', margin + colP1 + colP2 + colP3 + colP4 + colP5 + colP6 + 2, curY + 4.2);
  curY += 6;

  let manSubtotal = 0;
  const manpowerList = params.manpower && params.manpower.length > 0 ? params.manpower : [
    { srNo: 1, trade: 'Certified 6G TIG/MIG Welder', nos: 3, noOfDays: 14, totalDays: 42, ratePerDay: 280, totalCost: 11760 },
    { srNo: 2, trade: 'Structural Steel Fabricator', nos: 2, noOfDays: 14, totalDays: 28, ratePerDay: 240, totalCost: 6720 },
  ];

  manpowerList.forEach((p, idx) => {
    checkPageBreak(7);
    const nos = Number(p.nos || 1);
    const days = Number(p.noOfDays || 1);
    const totalDays = Number(p.totalDays) || (nos * days);
    const rate = Number(p.ratePerDay || 0);
    const lineCost = Number(p.totalCost) || (totalDays * rate);
    manSubtotal += lineCost;

    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, curY, contentWidth, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(String(p.srNo || idx + 1), margin + 3, curY + 4.2);
    doc.text(String(p.trade || 'Worker'), margin + colP1 + 2, curY + 4.2);
    doc.text(String(nos), margin + colP1 + colP2 + 2, curY + 4.2);
    doc.text(String(days), margin + colP1 + colP2 + colP3 + 2, curY + 4.2);
    doc.text(String(totalDays), margin + colP1 + colP2 + colP3 + colP4 + 2, curY + 4.2);
    doc.text(rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colP1 + colP2 + colP3 + colP4 + colP5 + 2, curY + 4.2);
    doc.setFont('helvetica', 'bold');
    doc.text(lineCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colP1 + colP2 + colP3 + colP4 + colP5 + colP6 + 2, curY + 4.2);
    curY += 6;
  });

  // Manpower Subtotal
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Manpower Subtotal (AED):', margin + colP1 + colP2 + colP3 + 2, curY + 4.2);
  doc.setTextColor(15, 23, 42);
  doc.text(manSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colP1 + colP2 + colP3 + colP4 + colP5 + colP6 + 2, curY + 4.2);
  curY += 9;

  // 7. Section 4: Equipment and Machinery Required
  // SR. # (10) | MACHINERY TYPE (46) | CAPACITY (24) | QUANTITY (18) | Days / Hrs (20) | Rate Per Day (28) | Total Est. Cost (40)
  checkPageBreak(30);
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('4. EQUIPMENT AND MACHINERY REQUIRED', margin + 3, curY + 4);
  curY += 6;

  const colE1 = 10;
  const colE2 = 46;
  const colE3 = 24;
  const colE4 = 18;
  const colE5 = 20;
  const colE6 = 28;
  const colE7 = 40;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('SR. #', margin + 2, curY + 4.2);
  doc.text('MACHINERY TYPE', margin + colE1 + 2, curY + 4.2);
  doc.text('CAPACITY', margin + colE1 + colE2 + 2, curY + 4.2);
  doc.text('QUANTITY', margin + colE1 + colE2 + colE3 + 2, curY + 4.2);
  doc.text('Days / Hrs', margin + colE1 + colE2 + colE3 + colE4 + 2, curY + 4.2);
  doc.text('Rate Per Day', margin + colE1 + colE2 + colE3 + colE4 + colE5 + 2, curY + 4.2);
  doc.text('Total Est. Cost (AED)', margin + colE1 + colE2 + colE3 + colE4 + colE5 + colE6 + 2, curY + 4.2);
  curY += 6;

  let eqSubtotal = 0;
  const equipmentList = params.equipment && params.equipment.length > 0 ? params.equipment : [
    { srNo: 1, machineryType: 'Mobile Telescopic Crane', capacity: '50 Ton', quantity: 1, daysOrHrs: '5 Days', ratePerDay: 1800, totalCost: 9000 },
    { srNo: 2, machineryType: 'Diesel Welding Generator 500A', capacity: '500 Amp', quantity: 2, daysOrHrs: '14 Days', ratePerDay: 220, totalCost: 6160 },
  ];

  equipmentList.forEach((e, idx) => {
    checkPageBreak(7);
    const qty = Number(e.quantity || 1);
    const days = typeof e.daysOrHrs === 'number' ? e.daysOrHrs : parseFloat(String(e.daysOrHrs).replace(/[^0-9.]/g, '')) || 1;
    const rate = Number(e.ratePerDay || 0);
    const lineCost = Number(e.totalCost) || (qty * days * rate);
    eqSubtotal += lineCost;

    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, curY, contentWidth, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(String(e.srNo || idx + 1), margin + 3, curY + 4.2);
    doc.text(String(e.machineryType || 'Equipment'), margin + colE1 + 2, curY + 4.2);
    doc.text(String(e.capacity || 'Standard'), margin + colE1 + colE2 + 2, curY + 4.2);
    doc.text(String(qty), margin + colE1 + colE2 + colE3 + 2, curY + 4.2);
    doc.text(String(e.daysOrHrs || '1'), margin + colE1 + colE2 + colE3 + colE4 + 2, curY + 4.2);
    doc.text(rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colE1 + colE2 + colE3 + colE4 + colE5 + 2, curY + 4.2);
    doc.setFont('helvetica', 'bold');
    doc.text(lineCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colE1 + colE2 + colE3 + colE4 + colE5 + colE6 + 2, curY + 4.2);
    curY += 6;
  });

  // Equipment Subtotal
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, curY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Equipment Subtotal (AED):', margin + colE1 + colE2 + colE3 + 2, curY + 4.2);
  doc.setTextColor(15, 23, 42);
  doc.text(eqSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), margin + colE1 + colE2 + colE3 + colE4 + colE5 + colE6 + 2, curY + 4.2);
  curY += 9;

  // 8. Section 5: Overheads Estimate & Total Project Cost
  checkPageBreak(25);
  const overheadsVal = Number(params.overheadsEstimate) || 4500;
  const projectTotalVal = Number(params.totalEstimatedCost) || (matSubtotal + manSubtotal + eqSubtotal + overheadsVal);

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, contentWidth, 18, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('5. OVERHEADS ESTIMATE (Consumables, Transport, Supervision, HSE & Testing):', margin + 4, curY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(`AED ${overheadsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 4, curY + 6, { align: 'right' });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 4, curY + 9, pageWidth - margin - 4, curY + 9);

  // Grand Total Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin + 2, curY + 10.5, contentWidth - 4, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL ESTIMATED COST OF THE PROJECT:', margin + 6, curY + 14.8);
  doc.setFontSize(9.5);
  doc.text(`AED ${projectTotalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 6, curY + 14.8, { align: 'right' });

  curY += 23;

  // 9. Signatures Block: Prepared by | Approved by | Received by
  checkPageBreak(30);
  const colW = (contentWidth - 8) / 3;
  const sigBlocks = [
    { title: 'Prepared by', role: 'Project Engineer / Estimator', name: params.preparedBy || 'Project Engineer' },
    { title: 'Approved by', role: 'Managing Director / Plant Manager', name: params.approvedBy || 'Managing Director' },
    { title: 'Received by', role: 'Workshop Superintendent / Site Lead', name: params.receivedBy || 'Production In-charge' },
  ];

  sigBlocks.forEach((sig, idx) => {
    const x = margin + idx * (colW + 4);
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, curY, colW, 26, 1, 1, 'FD');

    // Signature line
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(x + 5, curY + 15, x + colW - 5, curY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(sig.name, x + colW / 2, curY + 13.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sig.title, x + colW / 2, curY + 19, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(sig.role, x + colW / 2, curY + 23, { align: 'center' });
  });

  drawFooter();

  const safeClient = (params.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `CEMCON_Job_Order_${params.jobNumber}_${safeClient}.pdf`;
  doc.save(fileName);
  return fileName;
}

