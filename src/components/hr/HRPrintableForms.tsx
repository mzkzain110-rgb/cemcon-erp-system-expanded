import React, { useState, useRef } from 'react';
import { exportCorporatePdf } from '../../utils/corporatePdfGenerator';
import {
  Printer,
  FileDown,
  FileText,
  UserCheck,
  ClipboardList,
  Calendar,
  CheckCircle,
  Building2,
  X,
  Plus,
  Check,
  Loader2,
} from 'lucide-react';

export interface CemconCompanyInfo {
  id: string;
  code: string;
  name: string;
  legalType: string;
  trn: string;
  regNo: string;
  address: string;
  phone: string;
  email: string;
  division: string;
}

export const CEMCON_COMPANIES: CemconCompanyInfo[] = [
  {
    id: 'comp-mech-001',
    code: 'CEMCON-MECH',
    name: 'Cemcon Mechanical Engineering LLC',
    legalType: 'LLC',
    trn: '100293847500003',
    regNo: '588210',
    address: 'Industrial Area 11, Sharjah / Dubai, United Arab Emirates',
    phone: '+971 6 534 8920',
    email: 'info@cemcon-mech.ae',
    division: 'Heavy Steel Fabrication, Pressure Vessels & Mechanical Division',
  },
  {
    id: 'comp-me-002',
    code: 'CEMCON-ME',
    name: 'CEMCON Middle East LLC',
    legalType: 'LLC',
    trn: '100348291000003',
    regNo: '612044',
    address: 'Business Bay, Executive Towers, Dubai, United Arab Emirates',
    phone: '+971 4 429 8100',
    email: 'contracts@cemcon-me.ae',
    division: 'Turnkey MEP Contracting, Commercial Fit-Out & Engineering Solutions',
  },
  {
    id: 'comp-fze-003',
    code: 'CEMCON-FZE',
    name: 'CEMCON FZE',
    legalType: 'FZE',
    trn: '100874291000003',
    regNo: 'FZE-9418',
    address: 'Hamriyah Free Zone, Phase II, Sharjah, United Arab Emirates',
    phone: '+971 6 526 1190',
    email: 'export@cemcon-fze.ae',
    division: 'Free Zone Industrial Export, Modular Skids & Offshore Division',
  },
];

export const CEMCON_DEPARTMENTS = [
  'Accounts & Finance',
  'HR & Administration',
  'Sales & Marketing',
  'Design & Estimation',
  'Procurement',
  'Store & Logistics',
  'Production/Workshop',
  'QA/QC ( Quality Assurance & Quality Control)',
  'HSE( Health , Safety & Environment)',
];

export type FormType =
  | 'recruitment'
  | 'pre_interview'
  | 'interview_eval'
  | 'joining'
  | 'leave'
  | 'clearance';

interface HRPrintableFormsProps {
  companyName?: string;
  companyCode?: string;
  tenantName?: string;
  onClose?: () => void;
  initialForm?: FormType;
  employees?: any[];
  departments?: any[];
  companies?: any[];
}

export const HRPrintableForms: React.FC<HRPrintableFormsProps> = ({
  companyName = 'Cemcon Mechanical Engineering LLC',
  companyCode = 'CEMCON-MECH',
  tenantName = 'CEMCON Group Holding',
  onClose,
  initialForm = 'leave',
  employees = [],
  departments = [],
}) => {
  // 1. Company Selection State (Dropdown from three companies of CEMCON)
  const initialCompany =
    CEMCON_COMPANIES.find(
      (c) => c.code === companyCode || c.name.toLowerCase().includes(companyName.toLowerCase())
    ) || CEMCON_COMPANIES[0];

  const [selectedCompany, setSelectedCompany] = useState<CemconCompanyInfo>(initialCompany);
  const [selectedForm, setSelectedForm] = useState<FormType>(initialForm);

  // Modal State for "Create New Form"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormType, setCreateFormType] = useState<FormType>('leave');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // FORM DATA STORAGE: Supports multiple saved records for each form
  // -------------------------------------------------------------
  const [recruitmentList, setRecruitmentList] = useState([
    {
      id: 'rec-01',
      companyCode: 'CEMCON-MECH',
      refNo: 'CEM-MR-2026-042',
      date: '2026-04-18',
      requestingDept: 'Production/Workshop',
      designation: 'Senior Certified TIG/MIG Welder (6G)',
      vacancies: '4',
      jobType: 'Full-Time / Permanent',
      urgency: 'High (Immediate Project Mobilization)',
      targetDate: '2026-05-15',
      justification:
        'Fabrication surge for ASME Sec VIII Div 1 pressure vessels on ADNOC contract.',
      jobDescription:
        '6G pipe and plate welding, ASME Sec IX qualification, GTAW/SMAW multi-process, radiography quality compliance.',
      budgetSalary: 'AED 4,000 - 4,800 + Food & Bachelor Camp Accommodation',
      minExperience: '5+ Years in Heavy Steel Fabrication / Offshore Oil & Gas Yards',
    },
  ]);
  const [selectedRecruitmentIndex, setSelectedRecruitmentIndex] = useState(0);

  const [preInterviewList, setPreInterviewList] = useState([
    {
      id: 'pi-01',
      companyCode: 'CEMCON-MECH',
      refNo: 'CEM-PI-2026-018',
      date: '2026-04-12',
      candidateName: 'Bilal Mansoor',
      positionApplied: 'Senior Welder 6G (TIG/MIG)',
      phone: '+971-50-881-2299',
      email: 'bilal.weld@gmail.com',
      nationality: 'Pakistani',
      dob: '1992-06-14',
      visaStatus: 'Employment Visa (Transferable with NOC)',
      visaExpiry: '2026-08-30',
      currentEmployer: 'Gulf Piping Technologies LLC',
      currentSalary: 'AED 4,200',
      expectedSalary: 'AED 4,800',
      noticePeriod: '15 Days',
      highestQualification: 'Diploma in Mechanical Engineering & AWS Certification',
    },
  ]);
  const [selectedPreInterviewIndex, setSelectedPreInterviewIndex] = useState(0);

  const [evalList, setEvalList] = useState([
    {
      id: 'eval-01',
      companyCode: 'CEMCON-MECH',
      refNo: 'CEM-IE-2026-009',
      date: '2026-04-14',
      candidateName: 'Bilal Mansoor',
      position: 'Senior Welder 6G (TIG/MIG)',
      interviewer: 'Dr. Robert Vance, CEng (QA/QC Manager)',
      technicalRating: '9 / 10',
      experienceRating: '9 / 10',
      communicationRating: '8 / 10',
      safetyRating: '10 / 10',
      overallScore: '92 / 100',
      testResults:
        'Welding coupon passed 100% Visual and Ultrasonic Flaw Detection test (Zero defect root penetration).',
      recommendation: 'HIRE (Selected for Offer Letter)',
      proposedSalary: 'AED 4,600 Basic + Fixed Site Allowance',
      interviewerComments:
        'Strong technical acumen, thorough grasp of WPS/PQR specifications and ASME IX codes.',
    },
  ]);
  const [selectedEvalIndex, setSelectedEvalIndex] = useState(0);

  const [joiningList, setJoiningList] = useState([
    {
      id: 'join-01',
      companyCode: 'CEMCON-MECH',
      refNo: 'CEM-JF-2026-031',
      joiningDate: '2026-05-01',
      empNo: 'EMP-1011',
      fullName: 'Bilal Mansoor',
      designation: 'Senior Welder 6G',
      department: 'Production/Workshop',
      reportingTo: 'Muhammad Faisal (Project Engineer / Superintendent)',
      passportNo: 'PK9902188',
      emiratesId: '784-1992-1928374-1',
      bankName: 'Emirates NBD',
      iban: 'AE290260001099283746192',
      emergencyContact: 'Tariq Shehzad (Brother) - +971-55-901-2234',
      safetyInductionDate: '2026-05-01',
      ppeIssued: 'Welding Helmet, Leather Apron, Steel-toe Boots (Cat 4), Safety Harness',
    },
  ]);
  const [selectedJoiningIndex, setSelectedJoiningIndex] = useState(0);

  const [leaveList, setLeaveList] = useState([
    {
      id: 'leave-01',
      companyCode: 'CEMCON-MECH',
      refNo: 'CEM-LV-2026-087',
      applicationDate: '2026-04-16',
      empNo: 'EMP-1004',
      empName: 'Qaiser Shehzad',
      designation: 'Managing Director & System Administrator',
      department: 'Design & Estimation',
      leaveType: 'Annual Vacation',
      startDate: '2026-06-15',
      endDate: '2026-07-14',
      totalDays: '30 Calendar Days',
      contactAddress: 'Dubai Marina, Tower B, Apt 1402',
      emergencyPhone: '+971-50-992-0199',
      relieverName: 'Mohsin Afridi (Finance & Accounts Controller)',
      reason: 'Annual statutory leave as per UAE Federal Decree-Law No. 33 of 2021.',
    },
  ]);
  const [selectedLeaveIndex, setSelectedLeaveIndex] = useState(0);

  const [clearanceList, setClearanceList] = useState([
    {
      id: 'clear-01',
      companyCode: 'CEMCON-MECH',
      refNo: 'CEM-CF-2026-014',
      resignationDate: '2026-02-15',
      lastWorkingDate: '2026-03-31',
      empNo: 'EMP-0994',
      empName: 'Farooq Qasim',
      designation: 'Assistant Warehouse Storekeeper',
      department: 'Store & Logistics',
      itStatus: 'CLEARED (ERP account revoked, email archived)',
      storeStatus: 'CLEARED (Safety boots, toolkit and scanner returned)',
      accountsStatus: 'CLEARED (Nil salary advance, petty cash settled AED 0.00)',
      adminStatus: 'CLEARED (Camp room key returned, company SIM cancelled)',
      hrStatus: 'CLEARED (MOHRE Labor cancellation & passport returned)',
      gratuityAmount: 'AED 18,450.00',
      finalSettlement: 'AED 24,150.00 (Gratuity + Leave Salary + March Payroll)',
    },
  ]);
  const [selectedClearanceIndex, setSelectedClearanceIndex] = useState(0);

  // Active form data pointers
  const activeRecruitment = recruitmentList[selectedRecruitmentIndex] || recruitmentList[0];
  const activePreInterview = preInterviewList[selectedPreInterviewIndex] || preInterviewList[0];
  const activeEval = evalList[selectedEvalIndex] || evalList[0];
  const activeJoining = joiningList[selectedJoiningIndex] || joiningList[0];
  const activeLeave = leaveList[selectedLeaveIndex] || leaveList[0];
  const activeClearance = clearanceList[selectedClearanceIndex] || clearanceList[0];

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Helper Toast Alert
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };



  // -------------------------------------------------------------
  // MODAL FORM STATE (For creating a new form)
  // -------------------------------------------------------------
  const [newFormCompanyCode, setNewFormCompanyCode] = useState(selectedCompany.code);

  // Leave Form Fields
  const [newLeaveEmpNo, setNewLeaveEmpNo] = useState('');
  const [newLeaveEmpName, setNewLeaveEmpName] = useState('');
  const [newLeaveDesignation, setNewLeaveDesignation] = useState('');
  const [newLeaveDept, setNewLeaveDept] = useState(CEMCON_DEPARTMENTS[0]);
  const [newLeaveType, setNewLeaveType] = useState('Annual Vacation');
  const [newLeaveStart, setNewLeaveStart] = useState('');
  const [newLeaveEnd, setNewLeaveEnd] = useState('');
  const [newLeaveDays, setNewLeaveDays] = useState('30 Calendar Days');
  const [newLeaveReliever, setNewLeaveReliever] = useState('');
  const [newLeaveAddress, setNewLeaveAddress] = useState('');
  const [newLeavePhone, setNewLeavePhone] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('Annual Statutory Leave under UAE Labor Law');

  // Pre-Interview Form Fields
  const [newPiCandidate, setNewPiCandidate] = useState('');
  const [newPiPosition, setNewPiPosition] = useState('');
  const [newPiPhone, setNewPiPhone] = useState('');
  const [newPiEmail, setNewPiEmail] = useState('');
  const [newPiNationality, setNewPiNationality] = useState('');
  const [newPiDob, setNewPiDob] = useState('1994-01-01');
  const [newPiVisaStatus, setNewPiVisaStatus] = useState('Employment Visa (Transferable with NOC)');
  const [newPiVisaExpiry, setNewPiVisaExpiry] = useState('');
  const [newPiEmployer, setNewPiEmployer] = useState('');
  const [newPiCurrentSalary, setNewPiCurrentSalary] = useState('AED 4,500');
  const [newPiExpectedSalary, setNewPiExpectedSalary] = useState('AED 5,500');
  const [newPiNoticePeriod, setNewPiNoticePeriod] = useState('1 Month / 30 Days');
  const [newPiQualification, setNewPiQualification] = useState('Bachelor of Engineering / Diploma');

  // Recruitment Requisition Form Fields
  const [newRecDept, setNewRecDept] = useState('Production/Workshop');
  const [newRecDesignation, setNewRecDesignation] = useState('');
  const [newRecVacancies, setNewRecVacancies] = useState('2');
  const [newRecJobType, setNewRecJobType] = useState('Full-Time / Permanent');
  const [newRecUrgency, setNewRecUrgency] = useState('High (Immediate Project Mobilization)');
  const [newRecTargetDate, setNewRecTargetDate] = useState('');
  const [newRecJustification, setNewRecJustification] = useState('');
  const [newRecJobDesc, setNewRecJobDesc] = useState('');
  const [newRecSalary, setNewRecSalary] = useState('AED 5,000 - 6,500 + Benefits');
  const [newRecExperience, setNewRecExperience] = useState('4+ Years in UAE / GCC Heavy Industry');

  // Interview Evaluation Fields
  const [newEvalCandidate, setNewEvalCandidate] = useState('');
  const [newEvalPosition, setNewEvalPosition] = useState('');
  const [newEvalInterviewer, setNewEvalInterviewer] = useState('HR & Technical Panel Lead');
  const [newEvalTechRating, setNewEvalTechRating] = useState('9 / 10');
  const [newEvalExpRating, setNewEvalExpRating] = useState('8 / 10');
  const [newEvalCommRating, setNewEvalCommRating] = useState('8 / 10');
  const [newEvalSafetyRating, setNewEvalSafetyRating] = useState('10 / 10');
  const [newEvalOverallScore, setNewEvalOverallScore] = useState('88 / 100');
  const [newEvalTestResults, setNewEvalTestResults] = useState('Practical trade test passed with distinction.');
  const [newEvalRecommendation, setNewEvalRecommendation] = useState('HIRE (Selected for Offer Letter)');
  const [newEvalProposedSalary, setNewEvalProposedSalary] = useState('AED 5,200 Basic + Site Allowance');
  const [newEvalComments, setNewEvalComments] = useState('Candidate is well qualified, shows strong safety compliance and team leadership.');

  // Joining Form Fields
  const [newJoinEmpNo, setNewJoinEmpNo] = useState('');
  const [newJoinFullName, setNewJoinFullName] = useState('');
  const [newJoinDesignation, setNewJoinDesignation] = useState('');
  const [newJoinDept, setNewJoinDept] = useState('Production/Workshop');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newJoinReportingTo, setNewJoinReportingTo] = useState('');
  const [newJoinPassport, setNewJoinPassport] = useState('');
  const [newJoinEmiratesId, setNewJoinEmiratesId] = useState('');
  const [newJoinBank, setNewJoinBank] = useState('First Abu Dhabi Bank (FAB)');
  const [newJoinIban, setNewJoinIban] = useState('AE000000000000000000000');
  const [newJoinEmergency, setNewJoinEmergency] = useState('');
  const [newJoinPpe, setNewJoinPpe] = useState('Helmet, Safety Shoes, High-Vis Vest, Goggles');

  // Clearance Form Fields
  const [newClrEmpName, setNewClrEmpName] = useState('');
  const [newClrEmpNo, setNewClrEmpNo] = useState('');
  const [newClrDept, setNewClrDept] = useState('Production/Workshop');
  const [newClrDesignation, setNewClrDesignation] = useState('');
  const [newClrResignDate, setNewClrResignDate] = useState(new Date().toISOString().split('T')[0]);
  const [newClrLastDate, setNewClrLastDate] = useState(new Date().toISOString().split('T')[0]);
  const [newClrGratuity, setNewClrGratuity] = useState('AED 12,000.00');
  const [newClrFinalSettlement, setNewClrFinalSettlement] = useState('AED 18,500.00');

  // Pre-fill from selected employee
  const handleAutofillFromEmployee = (empId: string, formCategory: 'leave' | 'joining' | 'clearance') => {
    const emp = employees.find((e) => e.employee_id === empId || e.employee_no === empId);
    if (!emp) return;

    if (formCategory === 'leave') {
      setNewLeaveEmpNo(emp.employee_no || emp.employee_id);
      setNewLeaveEmpName(emp.full_name);
      setNewLeaveDesignation(emp.designation || '');
      const dept = departments.find((d) => d.department_id === emp.department_id);
      if (dept) setNewLeaveDept(dept.name);
    } else if (formCategory === 'joining') {
      setNewJoinEmpNo(emp.employee_no || emp.employee_id);
      setNewJoinFullName(emp.full_name);
      setNewJoinDesignation(emp.designation || '');
      const dept = departments.find((d) => d.department_id === emp.department_id);
      if (dept) setNewJoinDept(dept.name);
    } else if (formCategory === 'clearance') {
      setNewClrEmpNo(emp.employee_no || emp.employee_id);
      setNewClrEmpName(emp.full_name);
      setNewClrDesignation(emp.designation || '');
      const dept = departments.find((d) => d.department_id === emp.department_id);
      if (dept) setNewClrDept(dept.name);
    }
  };

  // Open Create Modal for a designated form type
  const openCreateModalFor = (form: FormType) => {
    setCreateFormType(form);
    setNewFormCompanyCode(selectedCompany.code);
    setIsCreateModalOpen(true);
  };

  // Submit Handler: Creates and activates the new form
  const handleCreateNewForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Match company object
    const targetComp =
      CEMCON_COMPANIES.find((c) => c.code === newFormCompanyCode) || selectedCompany;
    setSelectedCompany(targetComp);

    const year = new Date().getFullYear();
    const randSeq = Math.floor(100 + Math.random() * 900);

    if (createFormType === 'leave') {
      const newRef = `${targetComp.code}-LV-${year}-${randSeq}`;
      const newRecord = {
        id: `leave-${Date.now()}`,
        companyCode: targetComp.code,
        refNo: newRef,
        applicationDate: new Date().toISOString().split('T')[0],
        empNo: newLeaveEmpNo || 'EMP-NEW',
        empName: newLeaveEmpName || 'Employee Name',
        designation: newLeaveDesignation || 'Engineer / Officer',
        department: newLeaveDept,
        leaveType: newLeaveType,
        startDate: newLeaveStart || '2026-07-01',
        endDate: newLeaveEnd || '2026-07-31',
        totalDays: newLeaveDays || '30 Calendar Days',
        contactAddress: newLeaveAddress || 'Dubai, UAE',
        emergencyPhone: newLeavePhone || '+971-50-000-0000',
        relieverName: newLeaveReliever || 'Designated Colleague',
        reason: newLeaveReason || 'Annual statutory leave entitlement.',
      };
      setLeaveList((prev) => [newRecord, ...prev]);
      setSelectedLeaveIndex(0);
      setSelectedForm('leave');
      showToast(`New Leave Application Form [${newRef}] successfully created for ${targetComp.name}!`);
    } else if (createFormType === 'pre_interview') {
      const newRef = `${targetComp.code}-PI-${year}-${randSeq}`;
      const newRecord = {
        id: `pi-${Date.now()}`,
        companyCode: targetComp.code,
        refNo: newRef,
        date: new Date().toISOString().split('T')[0],
        candidateName: newPiCandidate || 'Candidate Name',
        positionApplied: newPiPosition || 'Target Position',
        phone: newPiPhone || '+971-50-000-0000',
        email: newPiEmail || 'candidate@domain.com',
        nationality: newPiNationality || 'Expatriate',
        dob: newPiDob || '1990-01-01',
        visaStatus: newPiVisaStatus,
        visaExpiry: newPiVisaExpiry || '2026-12-31',
        currentEmployer: newPiEmployer || 'Previous Organization LLC',
        currentSalary: newPiCurrentSalary,
        expectedSalary: newPiExpectedSalary,
        noticePeriod: newPiNoticePeriod,
        highestQualification: newPiQualification,
      };
      setPreInterviewList((prev) => [newRecord, ...prev]);
      setSelectedPreInterviewIndex(0);
      setSelectedForm('pre_interview');
      showToast(`New Pre-Interview Form [${newRef}] created for candidate ${newRecord.candidateName}!`);
    } else if (createFormType === 'recruitment') {
      const newRef = `${targetComp.code}-MR-${year}-${randSeq}`;
      const newRecord = {
        id: `rec-${Date.now()}`,
        companyCode: targetComp.code,
        refNo: newRef,
        date: new Date().toISOString().split('T')[0],
        requestingDept: newRecDept,
        designation: newRecDesignation || 'Operations Specialist',
        vacancies: newRecVacancies || '1',
        jobType: newRecJobType,
        urgency: newRecUrgency,
        targetDate: newRecTargetDate || '2026-06-01',
        justification: newRecJustification || 'Expansion of plant operational capacity.',
        jobDescription: newRecJobDesc || 'Standard job description according to CEMCON engineering metrics.',
        budgetSalary: newRecSalary,
        minExperience: newRecExperience,
      };
      setRecruitmentList((prev) => [newRecord, ...prev]);
      setSelectedRecruitmentIndex(0);
      setSelectedForm('recruitment');
      showToast(`New Recruitment Request Form [${newRef}] created for ${newRecDept}!`);
    } else if (createFormType === 'interview_eval') {
      const newRef = `${targetComp.code}-IE-${year}-${randSeq}`;
      const newRecord = {
        id: `eval-${Date.now()}`,
        companyCode: targetComp.code,
        refNo: newRef,
        date: new Date().toISOString().split('T')[0],
        candidateName: newEvalCandidate || 'Candidate Name',
        position: newEvalPosition || 'Target Role',
        interviewer: newEvalInterviewer,
        technicalRating: newEvalTechRating,
        experienceRating: newEvalExpRating,
        communicationRating: newEvalCommRating,
        safetyRating: newEvalSafetyRating,
        overallScore: newEvalOverallScore,
        testResults: newEvalTestResults,
        recommendation: newEvalRecommendation,
        proposedSalary: newEvalProposedSalary,
        interviewerComments: newEvalComments,
      };
      setEvalList((prev) => [newRecord, ...prev]);
      setSelectedEvalIndex(0);
      setSelectedForm('interview_eval');
      showToast(`New Interview Evaluation Sheet [${newRef}] created!`);
    } else if (createFormType === 'joining') {
      const newRef = `${targetComp.code}-JF-${year}-${randSeq}`;
      const newRecord = {
        id: `join-${Date.now()}`,
        companyCode: targetComp.code,
        refNo: newRef,
        joiningDate: newJoinDate,
        empNo: newJoinEmpNo || `EMP-${randSeq}`,
        fullName: newJoinFullName || 'New Hire Name',
        designation: newJoinDesignation || 'Engineer',
        department: newJoinDept,
        reportingTo: newJoinReportingTo || 'Operations Manager',
        passportNo: newJoinPassport || 'A00000000',
        emiratesId: newJoinEmiratesId || '784-1990-0000000-1',
        bankName: newJoinBank,
        iban: newJoinIban,
        emergencyContact: newJoinEmergency || 'Next of Kin - Tel: +971-50-000-0000',
        safetyInductionDate: newJoinDate,
        ppeIssued: newJoinPpe,
      };
      setJoiningList((prev) => [newRecord, ...prev]);
      setSelectedJoiningIndex(0);
      setSelectedForm('joining');
      showToast(`New Employee Joining Declaration [${newRef}] created!`);
    } else if (createFormType === 'clearance') {
      const newRef = `${targetComp.code}-CF-${year}-${randSeq}`;
      const newRecord = {
        id: `clear-${Date.now()}`,
        companyCode: targetComp.code,
        refNo: newRef,
        resignationDate: newClrResignDate,
        lastWorkingDate: newClrLastDate,
        empNo: newClrEmpNo || 'EMP-0000',
        empName: newClrEmpName || 'Departing Employee',
        designation: newClrDesignation || 'Specialist',
        department: newClrDept,
        itStatus: 'CLEARED (ERP account revoked & devices handed over)',
        storeStatus: 'CLEARED (All tools, PPE and locker surrendered)',
        accountsStatus: 'CLEARED (Zero outstanding advances / petty cash settled)',
        adminStatus: 'CLEARED (Keys & company SIM card surrendered)',
        hrStatus: 'CLEARED (Labor cancellation in progress / passport dispatched)',
        gratuityAmount: newClrGratuity,
        finalSettlement: newClrFinalSettlement,
      };
      setClearanceList((prev) => [newRecord, ...prev]);
      setSelectedClearanceIndex(0);
      setSelectedForm('clearance');
      showToast(`New Clearance & Exit Form [${newRef}] generated!`);
    }

    setIsCreateModalOpen(false);
  };

  // Current active form metadata
  const formsConfig: Array<{
    id: FormType;
    label: string;
    icon: any;
    createLabel: string;
    refNo: string;
    recordsCount: number;
  }> = [
    {
      id: 'recruitment',
      label: '1. Recruitment Request Form',
      icon: FileText,
      createLabel: 'Create New Recruitment Request',
      refNo: activeRecruitment.refNo,
      recordsCount: recruitmentList.length,
    },
    {
      id: 'pre_interview',
      label: '2. Pre-Interview Form',
      icon: UserCheck,
      createLabel: 'Create New Pre-Interview Form',
      refNo: activePreInterview.refNo,
      recordsCount: preInterviewList.length,
    },
    {
      id: 'interview_eval',
      label: '3. Interview Evaluation Sheet',
      icon: CheckCircle,
      createLabel: 'Create New Evaluation Sheet',
      refNo: activeEval.refNo,
      recordsCount: evalList.length,
    },
    {
      id: 'joining',
      label: '4. Employee Joining Form',
      icon: Building2,
      createLabel: 'Create New Joining Form',
      refNo: activeJoining.refNo,
      recordsCount: joiningList.length,
    },
    {
      id: 'leave',
      label: '5. Leave Application Form',
      icon: Calendar,
      createLabel: 'Create New Leave Application',
      refNo: activeLeave.refNo,
      recordsCount: leaveList.length,
    },
    {
      id: 'clearance',
      label: '6. Clearance & Exit Form',
      icon: ClipboardList,
      createLabel: 'Create New Clearance Form',
      refNo: activeClearance.refNo,
      recordsCount: clearanceList.length,
    },
  ];

  const currentConfig = formsConfig.find((f) => f.id === selectedForm)!;

  // 100% Guaranteed Vector PDF Export with jsPDF (Immune to Tailwind v4 oklch & DOM canvas crashes)
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    showToast('Generating official corporate PDF document...');
    try {
      const fileName = exportCorporatePdf({
        formType: selectedForm,
        company: selectedCompany,
        tenantName,
        data: {
          recruitment: activeRecruitment,
          preInterview: activePreInterview,
          eval: activeEval,
          joining: activeJoining,
          leave: activeLeave,
          clearance: activeClearance,
        },
      });
      showToast(`Exported ${fileName} successfully! Check your downloads.`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      showToast(`PDF generation error: ${err?.message || 'Check browser permissions'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Robust Print Handler: Attempts clean iframe print, automatically falls back to vector PDF if browser restricts print dialog
  const handlePrint = () => {
    setIsPrinting(true);
    const element = canvasRef.current || document.getElementById('printable-form-canvas');

    try {
      const existingIframe = document.getElementById('cemcon-print-iframe');
      if (existingIframe) existingIframe.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'cemcon-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.opacity = '0';
      printIframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      if (!doc || !element) {
        throw new Error('Print canvas not found');
      }

      // Write standalone document with standard CSS (no oklch colors)
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>CEMCON - ${currentConfig.label} - ${selectedCompany.code}</title>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              * { box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: #0f172a; 
                background: #ffffff; 
                margin: 0; 
                padding: 4mm; 
              }
              .print-container { 
                max-width: 100% !important; 
                padding: 0 !important; 
                border: none !important; 
                box-shadow: none !important; 
              }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${element.innerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          showToast('Print dialog initiated. You can print directly or choose "Save as PDF".');
        } catch (iframeErr) {
          console.warn('Iframe print restricted by browser sandbox, falling back to PDF download:', iframeErr);
          handleExportPdf();
          showToast('Print dialog restricted by sandbox. Official PDF exported for printing!');
        } finally {
          setTimeout(() => {
            try { printIframe.remove(); } catch (_) {}
            setIsPrinting(false);
          }, 1500);
        }
      }, 350);
    } catch (err: any) {
      console.warn('Print handler error, downloading PDF:', err);
      handleExportPdf();
      showToast('Print dialog restricted by sandbox. Official PDF exported for printing!');
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP ACTION & CONTROLS HEADER (Hidden during print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Row 1: Title + 3 Companies Selector Dropdown + Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Official CEMCON Corporate HR Forms Engine
            </div>
            <h2 className="text-lg font-black text-white">
              Enterprise Admin Forms & Standard Operating Procedures
            </h2>
            <p className="text-xs text-slate-400">
              Select between the three operating companies of CEMCON, create new forms, print, or export directly to PDF.
            </p>
          </div>

          {/* Controls: Company Dropdown & Print/Export Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* COMPANY SELECTOR DROPDOWN (3 Companies of CEMCON) */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-inner">
              <Building2 className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Operating Company
                </span>
                <select
                  value={selectedCompany.code}
                  onChange={(e) => {
                    const comp = CEMCON_COMPANIES.find((c) => c.code === e.target.value);
                    if (comp) {
                      setSelectedCompany(comp);
                      showToast(`Switched active header to ${comp.name}`);
                    }
                  }}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-4"
                >
                  {CEMCON_COMPANIES.map((c) => (
                    <option key={c.id} value={c.code} className="bg-slate-900 text-white py-1">
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CREATE NEW FORM BUTTON (for the currently selected form) */}
            <button
              onClick={() => openCreateModalFor(selectedForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{currentConfig.createLabel}</span>
            </button>

            {/* PRINT & PDF EXPORT BUTTONS */}
            <button
              onClick={handlePrint}
              disabled={isPrinting || isExportingPdf}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Print document with official CEMCON header & signature blocks"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 text-blue-400" />
                  <span>Print</span>
                </>
              )}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || isPrinting}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Directly export and download high-resolution corporate PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Export as PDF</span>
                </>
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: 6 Form Selection Tabs */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
          {formsConfig.map((form) => {
            const Icon = form.icon;
            const isCurrent = selectedForm === form.id;
            return (
              <button
                key={form.id}
                onClick={() => setSelectedForm(form.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{form.label}</span>
                {form.recordsCount > 1 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 text-slate-300 font-mono">
                    {form.recordsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Row 3: Record Switcher & Quick "Create New" Bar for current form */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Active Record:</span>
            {selectedForm === 'leave' && (
              <select
                value={selectedLeaveIndex}
                onChange={(e) => setSelectedLeaveIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white font-mono rounded-lg px-2.5 py-1 text-xs"
              >
                {leaveList.map((rec, idx) => (
                  <option key={rec.id} value={idx}>
                    {rec.refNo} — {rec.empName} ({rec.leaveType})
                  </option>
                ))}
              </select>
            )}
            {selectedForm === 'pre_interview' && (
              <select
                value={selectedPreInterviewIndex}
                onChange={(e) => setSelectedPreInterviewIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white font-mono rounded-lg px-2.5 py-1 text-xs"
              >
                {preInterviewList.map((rec, idx) => (
                  <option key={rec.id} value={idx}>
                    {rec.refNo} — {rec.candidateName} ({rec.positionApplied})
                  </option>
                ))}
              </select>
            )}
            {selectedForm === 'recruitment' && (
              <select
                value={selectedRecruitmentIndex}
                onChange={(e) => setSelectedRecruitmentIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white font-mono rounded-lg px-2.5 py-1 text-xs"
              >
                {recruitmentList.map((rec, idx) => (
                  <option key={rec.id} value={idx}>
                    {rec.refNo} — {rec.requestingDept} ({rec.designation})
                  </option>
                ))}
              </select>
            )}
            {selectedForm === 'interview_eval' && (
              <select
                value={selectedEvalIndex}
                onChange={(e) => setSelectedEvalIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white font-mono rounded-lg px-2.5 py-1 text-xs"
              >
                {evalList.map((rec, idx) => (
                  <option key={rec.id} value={idx}>
                    {rec.refNo} — {rec.candidateName} ({rec.recommendation})
                  </option>
                ))}
              </select>
            )}
            {selectedForm === 'joining' && (
              <select
                value={selectedJoiningIndex}
                onChange={(e) => setSelectedJoiningIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white font-mono rounded-lg px-2.5 py-1 text-xs"
              >
                {joiningList.map((rec, idx) => (
                  <option key={rec.id} value={idx}>
                    {rec.refNo} — {rec.fullName} ({rec.empNo})
                  </option>
                ))}
              </select>
            )}
            {selectedForm === 'clearance' && (
              <select
                value={selectedClearanceIndex}
                onChange={(e) => setSelectedClearanceIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white font-mono rounded-lg px-2.5 py-1 text-xs"
              >
                {clearanceList.map((rec, idx) => (
                  <option key={rec.id} value={idx}>
                    {rec.refNo} — {rec.empName} ({rec.department})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Create Link */}
          <button
            onClick={() => openCreateModalFor(selectedForm)}
            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New {currentConfig.label.replace(/^\d+\.\s*/, '')}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PRINTABLE FORM CANVAS                                        */}
      {/* High-quality corporate stationery with official CEMCON seals */}
      {/* ============================================================ */}
      <div
        ref={canvasRef}
        id="printable-form-canvas"
        className="print-container bg-white text-slate-900 rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-200 max-w-4xl mx-auto font-sans relative overflow-hidden"
      >
        {/* Subtle Watermark for authenticity */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none text-9xl font-black rotate-[-25deg] text-slate-900">
          CEMCON
        </div>

        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 relative">
          <div className="flex items-start justify-between">
            <div className="max-w-[70%]">
              <div className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {selectedCompany.name}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-0.5 tracking-wide uppercase">
                A MEMBER OF {tenantName} • {selectedCompany.division}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {selectedCompany.address} • Tel: {selectedCompany.phone}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                TRN: {selectedCompany.trn} • Commercial Reg. No: {selectedCompany.regNo} • ISO 9001 / ISO 45001 Certified
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded uppercase tracking-wider">
                HR & ADMIN DEPT
              </span>
              <div className="text-[11px] font-mono text-slate-600 mt-2 font-bold">
                DOC REF: {currentConfig.refNo}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                ENTITY CODE: {selectedCompany.code}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-300 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
              {selectedForm === 'recruitment' && 'Manpower / Recruitment Requisition Form'}
              {selectedForm === 'pre_interview' && 'Candidate Pre-Interview Information Sheet'}
              {selectedForm === 'interview_eval' && 'Candidate Interview & Technical Evaluation Sheet'}
              {selectedForm === 'joining' && 'Employee Joining & Onboarding Declaration Form'}
              {selectedForm === 'leave' && 'Employee Leave & Absence Application Form'}
              {selectedForm === 'clearance' && 'Employee Clearance & Handover Sign-Off Form'}
            </h1>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FORM 1: RECRUITMENT REQUISITION                                */}
        {/* ------------------------------------------------------------- */}
        {selectedForm === 'recruitment' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-700">Requesting Department:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activeRecruitment.requestingDept}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Requisition Date:</span>
                <p className="font-mono text-slate-900 mt-0.5">{activeRecruitment.date}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Job Title / Designation:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activeRecruitment.designation}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Number of Positions Required:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activeRecruitment.vacancies} Personnel</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Employment Nature:</span>
                <p className="text-slate-900 mt-0.5">{activeRecruitment.jobType}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Required Mobilization Date:</span>
                <p className="font-mono text-slate-900 mt-0.5">{activeRecruitment.targetDate}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                1. Justification & Project Allocation
              </h3>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-relaxed">
                {activeRecruitment.justification}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                2. Key Responsibilities & Technical Competencies
              </h3>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-relaxed">
                {activeRecruitment.jobDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-700">Approved Salary Scale:</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-900 mt-1">
                  {activeRecruitment.budgetSalary}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Minimum Experience Required:</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 mt-1">
                  {activeRecruitment.minExperience}
                </p>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-8 mt-8 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Head of Requesting Dept</div>
                <div className="text-[10px] text-slate-500">Sign & Date</div>
              </div>
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Mariam Al-Ali</div>
                <div className="text-[10px] text-slate-500">HR & Admin Director</div>
              </div>
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Managing Director</div>
                <div className="text-[10px] text-slate-500">Final Authorization & Seal</div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FORM 2: PRE-INTERVIEW INFORMATION                             */}
        {/* ------------------------------------------------------------- */}
        {selectedForm === 'pre_interview' && (
          <div className="space-y-6 text-xs">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-slate-700">Candidate Full Name:</span>
                  <p className="text-sm font-bold text-slate-900">{activePreInterview.candidateName}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Position Applied For:</span>
                  <p className="text-sm font-bold text-blue-700">{activePreInterview.positionApplied}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Contact Telephone:</span>
                  <p className="font-mono text-slate-900">{activePreInterview.phone}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Email Address:</span>
                  <p className="font-mono text-slate-900">{activePreInterview.email}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Nationality & DOB:</span>
                  <p className="text-slate-900">
                    {activePreInterview.nationality} • {activePreInterview.dob}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Current UAE Visa Status:</span>
                  <p className="text-slate-900 font-semibold">{activePreInterview.visaStatus}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Compensation & Notice Availability
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Remuneration</span>
                  <span className="font-bold text-slate-900 text-sm">{activePreInterview.currentSalary}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Expected Remuneration</span>
                  <span className="font-bold text-emerald-700 text-sm">{activePreInterview.expectedSalary}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Earliest Joining Date</span>
                  <span className="font-bold text-slate-900 text-sm">{activePreInterview.noticePeriod}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Educational Background & Certifications
              </h3>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-relaxed font-medium">
                {activePreInterview.highestQualification}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Applicant Declaration
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded border border-slate-200">
                I hereby declare that all the information provided in this pre-interview questionnaire and accompanying curriculum vitae is true, complete, and accurate. I understand that any false statements or omissions will disqualify me from employment with {selectedCompany.name} and CEMCON Group Holding.
              </p>
            </div>

            <div className="pt-8 mt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Candidate Signature</div>
                <div className="text-[10px] text-slate-500">Date: {activePreInterview.date}</div>
              </div>
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">HR Recruitment Officer</div>
                <div className="text-[10px] text-slate-500">Document Received & Verified</div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FORM 3: INTERVIEW EVALUATION                                  */}
        {/* ------------------------------------------------------------- */}
        {selectedForm === 'interview_eval' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-700">Candidate Name:</span>
                <p className="text-sm font-bold text-slate-900">{activeEval.candidateName}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Target Role:</span>
                <p className="text-sm font-bold text-blue-700">{activeEval.position}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Lead Evaluator:</span>
                <p className="text-slate-900">{activeEval.interviewer}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Assessment Date:</span>
                <p className="font-mono text-slate-900">{activeEval.date}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Evaluation Criteria & Rating Matrix
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-left">
                <thead className="bg-slate-100 text-[11px] font-bold">
                  <tr>
                    <th className="border border-slate-300 p-2">Assessment Parameter</th>
                    <th className="border border-slate-300 p-2 w-32 text-center">Rating (1 - 10)</th>
                    <th className="border border-slate-300 p-2">Observations</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold">1. Technical Knowledge & Practical Skill</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-blue-700">{activeEval.technicalRating}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">Demonstrated deep knowledge of ASME Sec IX & AWS welding procedures.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold">2. Relevant Industry Track Record</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-blue-700">{activeEval.experienceRating}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">Strong proven heavy fabrication experience in GCC projects.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold">3. HSE Awareness & Workshop Discipline</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-emerald-700">{activeEval.safetyRating}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">Excellent hot-work safety protocol awareness, zero tolerance to violations.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold">4. Communication & Team Compatibility</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-blue-700">{activeEval.communicationRating}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">Articulate and responsive; ready to lead junior apprentices.</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border border-slate-300 p-2 text-slate-900">OVERALL WEIGHTED SCORE</td>
                    <td className="border border-slate-300 p-2 text-center text-sm text-emerald-700">{activeEval.overallScore}</td>
                    <td className="border border-slate-300 p-2 text-emerald-800">PASSED BENCHMARK (MINIMUM 75%)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Trade Test Results & Technical Verification
              </h3>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-relaxed">
                {activeEval.testResults}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Final Recommendation & Proposed Package
              </h3>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Status: {activeEval.recommendation}</span>
                  <span className="font-bold text-emerald-800 font-mono">Proposed: {activeEval.proposedSalary}</span>
                </div>
                <p className="text-slate-700 text-[11px] pt-1">{activeEval.interviewerComments}</p>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Interviewer Signature</div>
                <div className="text-[10px] text-slate-500">{activeEval.interviewer}</div>
              </div>
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Mariam Al-Ali</div>
                <div className="text-[10px] text-slate-500">HR & Administration Director</div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FORM 4: JOINING FORM                                          */}
        {/* ------------------------------------------------------------- */}
        {selectedForm === 'joining' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-700">Assigned Employee No:</span>
                <p className="font-mono text-sm font-bold text-blue-700">{activeJoining.empNo}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Official Date of Joining:</span>
                <p className="font-mono text-sm font-bold text-slate-900">{activeJoining.joiningDate}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Employee Full Legal Name:</span>
                <p className="text-sm font-bold text-slate-900">{activeJoining.fullName}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Department & Reporting Lead:</span>
                <p className="text-slate-900">{activeJoining.department} • {activeJoining.reportingTo}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Passport Number:</span>
                <p className="font-mono text-slate-900">{activeJoining.passportNo}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Emirates ID Number:</span>
                <p className="font-mono text-slate-900">{activeJoining.emiratesId}</p>
              </div>
              <div className="col-span-2">
                <span className="font-bold text-slate-700">Salary Bank & IBAN Account:</span>
                <p className="font-mono font-semibold text-slate-900">{activeJoining.bankName} • {activeJoining.iban}</p>
              </div>
              <div className="col-span-2">
                <span className="font-bold text-slate-700">Emergency Contact:</span>
                <p className="text-slate-900">{activeJoining.emergencyContact}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Onboarding & Mandatory Inductions Checklist
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>MOHRE Labor Contract & Work Permit Issued</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Comprehensive Medical Insurance Enrolled</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Workshop HSE Safety Induction Completed ({activeJoining.safetyInductionDate})</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Personal Protective Equipment (PPE) Issued: {activeJoining.ppeIssued}</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">New Employee Signature</div>
                <div className="text-[10px] text-slate-500">I confirm receipt of employment handbook & policies</div>
              </div>
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">HR Director Acceptance</div>
                <div className="text-[10px] text-slate-500">Mariam Al-Ali • Official Stamp</div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FORM 5: LEAVE APPLICATION                                      */}
        {/* ------------------------------------------------------------- */}
        {selectedForm === 'leave' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-700">Applicant Name & ID:</span>
                <p className="text-sm font-bold text-slate-900">
                  {activeLeave.empName} ({activeLeave.empNo})
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Designation & Department:</span>
                <p className="text-slate-900">
                  {activeLeave.designation} • {activeLeave.department}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Leave Category:</span>
                <p className="font-semibold text-blue-700">{activeLeave.leaveType}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Duration Requested:</span>
                <p className="font-bold text-slate-900">{activeLeave.totalDays}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Start Date:</span>
                <p className="font-mono text-slate-900">{activeLeave.startDate}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Expected Resumption Date:</span>
                <p className="font-mono text-slate-900">{activeLeave.endDate}</p>
              </div>
              <div className="col-span-2">
                <span className="font-bold text-slate-700">Designated Work Reliever:</span>
                <p className="font-semibold text-slate-900">{activeLeave.relieverName}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Leave Justification & Vacation Address
              </h3>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-relaxed">
                {activeLeave.reason} — Vacation Address: {activeLeave.contactAddress} (Emergency Tel:{' '}
                {activeLeave.emergencyPhone})
              </p>
            </div>

            {/* Statutory Compliance Notice */}
            <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
              <strong>Statutory Compliance:</strong> In accordance with UAE Federal Decree-Law No. (33) of 2021 Regarding the Regulation of Employment Relationships, employee is entitled to paid annual leave after completing probation. Leave salary must be settled prior to departure.
            </div>

            <div className="pt-8 mt-8 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Employee Signature</div>
                <div className="text-[10px] text-slate-500">Date: {activeLeave.applicationDate}</div>
              </div>
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Reliever Confirmation</div>
                <div className="text-[10px] text-slate-500">Handover Acknowledged</div>
              </div>
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">HR Approval & Balance Check</div>
                <div className="text-[10px] text-slate-500">Annual Balance Verified</div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FORM 6: CLEARANCE & EXIT                                       */}
        {/* ------------------------------------------------------------- */}
        {selectedForm === 'clearance' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-700">Departing Employee:</span>
                <p className="text-sm font-bold text-slate-900">
                  {activeClearance.empName} ({activeClearance.empNo})
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Designation & Dept:</span>
                <p className="text-slate-900">
                  {activeClearance.designation} • {activeClearance.department}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Date of Resignation:</span>
                <p className="font-mono text-slate-900">{activeClearance.resignationDate}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Last Working Date:</span>
                <p className="font-mono font-bold text-rose-700">{activeClearance.lastWorkingDate}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Inter-Departmental Clearance Verification
              </h3>
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <span className="font-bold text-slate-800">1. IT & Systems Department:</span>
                  <span className="font-bold text-emerald-700">{activeClearance.itStatus}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <span className="font-bold text-slate-800">2. Stores, Workshop & Tools:</span>
                  <span className="font-bold text-emerald-700">{activeClearance.storeStatus}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <span className="font-bold text-slate-800">3. Accounts & Commercial Finance:</span>
                  <span className="font-bold text-emerald-700">{activeClearance.accountsStatus}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <span className="font-bold text-slate-800">4. General Administration & Fleet:</span>
                  <span className="font-bold text-emerald-700">{activeClearance.adminStatus}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <span className="font-bold text-slate-800">5. Human Resources & Labor Affairs:</span>
                  <span className="font-bold text-emerald-700">{activeClearance.hrStatus}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Final Settlement & End of Service Gratuity Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-700">End of Service Gratuity (UAE Law):</span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {activeClearance.gratuityAmount}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Net Final Settlement Disbursement:</span>
                  <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                    {activeClearance.finalSettlement}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Departing Employee Signature</div>
                <div className="text-[10px] text-slate-500">Full & Final Discharge of Claims</div>
              </div>
              <div>
                <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
                <div className="font-bold text-slate-900">Mariam Al-Ali</div>
                <div className="text-[10px] text-slate-500">HR & Admin Director Handover Seal</div>
              </div>
            </div>
          </div>
        )}

        {/* Official Footer Note */}
        <div className="mt-12 pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-400">
          <span>{tenantName} • Human Resources Management System</span>
          <span>Confidential Corporate Record • Retain in Personnel Dossier</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREATE NEW FORM DIALOG                                */}
      {/* Available for ALL 6 FORMS with 3 CEMCON Companies selector   */}
      {/* ============================================================ */}
      {isCreateModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Form Creation Studio
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Create New {formsConfig.find((f) => f.id === createFormType)?.label.replace(/^\d+\.\s*/, '')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fill in the details below. The document will be formatted with official letterhead and reference numbers.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Type Switcher inside Modal */}
            <div className="mb-4">
              <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                Target Form Template:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {formsConfig.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCreateFormType(f.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition truncate border ${
                      createFormType === f.id
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateNewForm} className="space-y-4 text-xs">
              {/* PRIMARY SELECTOR: CEMCON COMPANY DROPDOWN */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <label className="block text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Select CEMCON Operating Company *
                </label>
                <select
                  value={newFormCompanyCode}
                  onChange={(e) => setNewFormCompanyCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-blue-500"
                >
                  {CEMCON_COMPANIES.map((comp) => (
                    <option key={comp.id} value={comp.code}>
                      {comp.name} — ({comp.code}) • TRN: {comp.trn}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  {CEMCON_COMPANIES.find((c) => c.code === newFormCompanyCode)?.division}
                </p>
              </div>

              {/* -------------------------------------------------------- */}
              {/* SPECIFIC FIELDS: LEAVE APPLICATION                       */}
              {/* -------------------------------------------------------- */}
              {createFormType === 'leave' && (
                <div className="space-y-3">
                  {/* Quick autofill helper from existing employees */}
                  {employees.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-lg">
                      <span className="text-[11px] font-bold text-blue-300">Autofill from Roster:</span>
                      <select
                        onChange={(e) => handleAutofillFromEmployee(e.target.value, 'leave')}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 flex-1"
                      >
                        <option value="">Choose an employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.full_name} ({emp.employee_no || emp.employee_id}) - {emp.designation}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Employee ID / No *</label>
                      <input
                        type="text"
                        required
                        value={newLeaveEmpNo}
                        onChange={(e) => setNewLeaveEmpNo(e.target.value)}
                        placeholder="e.g. EMP-1004"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Employee Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newLeaveEmpName}
                        onChange={(e) => setNewLeaveEmpName(e.target.value)}
                        placeholder="e.g. Qaiser Shehzad"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        value={newLeaveDesignation}
                        onChange={(e) => setNewLeaveDesignation(e.target.value)}
                        placeholder="e.g. Chief Estimator"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Department *</label>
                      <select
                        value={newLeaveDept}
                        onChange={(e) => setNewLeaveDept(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      >
                        {CEMCON_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Leave Category *</label>
                      <select
                        value={newLeaveType}
                        onChange={(e) => setNewLeaveType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      >
                        <option value="Annual Vacation">Annual Vacation</option>
                        <option value="Sick Leave (MOHRE Certified)">Sick Leave (MOHRE)</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                        <option value="Unpaid Leave">Unpaid Leave</option>
                        <option value="Hajj Pilgrimage Leave">Hajj Pilgrimage</option>
                        <option value="Maternity / Paternity Leave">Maternity / Paternity</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={newLeaveStart}
                        onChange={(e) => setNewLeaveStart(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Resumption Date *</label>
                      <input
                        type="date"
                        required
                        value={newLeaveEnd}
                        onChange={(e) => setNewLeaveEnd(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Total Days Duration *</label>
                      <input
                        type="text"
                        value={newLeaveDays}
                        onChange={(e) => setNewLeaveDays(e.target.value)}
                        placeholder="e.g. 30 Calendar Days"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Designated Work Reliever *</label>
                      <input
                        type="text"
                        required
                        value={newLeaveReliever}
                        onChange={(e) => setNewLeaveReliever(e.target.value)}
                        placeholder="e.g. Mohsin Afridi"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Emergency Contact Phone</label>
                      <input
                        type="text"
                        value={newLeavePhone}
                        onChange={(e) => setNewLeavePhone(e.target.value)}
                        placeholder="e.g. +971-50-992-0199"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Vacation Address</label>
                      <input
                        type="text"
                        value={newLeaveAddress}
                        onChange={(e) => setNewLeaveAddress(e.target.value)}
                        placeholder="e.g. Dubai Marina, Tower B"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Reason / Justification</label>
                    <textarea
                      rows={2}
                      value={newLeaveReason}
                      onChange={(e) => setNewLeaveReason(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SPECIFIC FIELDS: PRE-INTERVIEW FORM                      */}
              {/* -------------------------------------------------------- */}
              {createFormType === 'pre_interview' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Candidate Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newPiCandidate}
                        onChange={(e) => setNewPiCandidate(e.target.value)}
                        placeholder="e.g. Chen Wei / Bilal Mansoor"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Position Applied For *</label>
                      <input
                        type="text"
                        required
                        value={newPiPosition}
                        onChange={(e) => setNewPiPosition(e.target.value)}
                        placeholder="e.g. Senior Piping Inspector (CSWIP 3.1)"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={newPiPhone}
                        onChange={(e) => setNewPiPhone(e.target.value)}
                        placeholder="+971-50-881-2299"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={newPiEmail}
                        onChange={(e) => setNewPiEmail(e.target.value)}
                        placeholder="candidate@gmail.com"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Nationality *</label>
                      <input
                        type="text"
                        required
                        value={newPiNationality}
                        onChange={(e) => setNewPiNationality(e.target.value)}
                        placeholder="e.g. Pakistani / Indian"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={newPiDob}
                        onChange={(e) => setNewPiDob(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Current UAE Visa Status *</label>
                      <select
                        value={newPiVisaStatus}
                        onChange={(e) => setNewPiVisaStatus(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      >
                        <option value="Employment Visa (Transferable with NOC)">Employment (Transferable)</option>
                        <option value="Visit / Tourist Visa">Visit / Tourist Visa</option>
                        <option value="Cancelled Visa (Grace Period)">Cancelled Visa</option>
                        <option value="Golden Visa / Dependent Visa">Golden / Dependent Visa</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Current Salary (AED)</label>
                      <input
                        type="text"
                        value={newPiCurrentSalary}
                        onChange={(e) => setNewPiCurrentSalary(e.target.value)}
                        placeholder="AED 4,500"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Expected Salary (AED) *</label>
                      <input
                        type="text"
                        required
                        value={newPiExpectedSalary}
                        onChange={(e) => setNewPiExpectedSalary(e.target.value)}
                        placeholder="AED 5,500"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Notice Period *</label>
                      <input
                        type="text"
                        value={newPiNoticePeriod}
                        onChange={(e) => setNewPiNoticePeriod(e.target.value)}
                        placeholder="e.g. Immediate / 15 Days"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Highest Qualification & Certifications</label>
                    <input
                      type="text"
                      value={newPiQualification}
                      onChange={(e) => setNewPiQualification(e.target.value)}
                      placeholder="e.g. Diploma in Mechanical Engineering, AWS Certified, CSWIP 3.1"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SPECIFIC FIELDS: RECRUITMENT REQUISITION                 */}
              {/* -------------------------------------------------------- */}
              {createFormType === 'recruitment' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Requesting Department *</label>
                      <select
                        value={newRecDept}
                        onChange={(e) => setNewRecDept(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      >
                        {CEMCON_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Job Title / Designation *</label>
                      <input
                        type="text"
                        required
                        value={newRecDesignation}
                        onChange={(e) => setNewRecDesignation(e.target.value)}
                        placeholder="e.g. Certified 6G Pipe Welder"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Number of Vacancies *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newRecVacancies}
                        onChange={(e) => setNewRecVacancies(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Employment Type *</label>
                      <select
                        value={newRecJobType}
                        onChange={(e) => setNewRecJobType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      >
                        <option value="Full-Time / Permanent">Full-Time / Permanent</option>
                        <option value="Contract / Project-Based">Contract / Project-Based</option>
                        <option value="Temporary / Shutdown Hire">Temporary / Shutdown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Mobilization Date *</label>
                      <input
                        type="date"
                        required
                        value={newRecTargetDate}
                        onChange={(e) => setNewRecTargetDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Project Justification *</label>
                    <textarea
                      rows={2}
                      required
                      value={newRecJustification}
                      onChange={(e) => setNewRecJustification(e.target.value)}
                      placeholder="Describe contract scope, client milestone or workforce gap requiring this requisition..."
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Budgeted Salary (AED) *</label>
                      <input
                        type="text"
                        value={newRecSalary}
                        onChange={(e) => setNewRecSalary(e.target.value)}
                        placeholder="AED 4,000 - 5,500 + Benefits"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Minimum Experience Required *</label>
                      <input
                        type="text"
                        value={newRecExperience}
                        onChange={(e) => setNewRecExperience(e.target.value)}
                        placeholder="5+ Years in Heavy Steel Fabrication"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SPECIFIC FIELDS: INTERVIEW EVALUATION SHEET              */}
              {/* -------------------------------------------------------- */}
              {createFormType === 'interview_eval' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Candidate Name *</label>
                      <input
                        type="text"
                        required
                        value={newEvalCandidate}
                        onChange={(e) => setNewEvalCandidate(e.target.value)}
                        placeholder="e.g. Bilal Mansoor"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Evaluated Position *</label>
                      <input
                        type="text"
                        required
                        value={newEvalPosition}
                        onChange={(e) => setNewEvalPosition(e.target.value)}
                        placeholder="e.g. Senior Welder 6G"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Lead Interviewer *</label>
                      <input
                        type="text"
                        required
                        value={newEvalInterviewer}
                        onChange={(e) => setNewEvalInterviewer(e.target.value)}
                        placeholder="e.g. Dr. Robert Vance, CEng"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Recommendation *</label>
                      <select
                        value={newEvalRecommendation}
                        onChange={(e) => setNewEvalRecommendation(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-bold text-emerald-400"
                      >
                        <option value="HIRE (Selected for Offer Letter)">HIRE (Selected for Offer Letter)</option>
                        <option value="SECOND ROUND / TRADE TEST">SECOND ROUND / TRADE TEST</option>
                        <option value="ON HOLD / PIPELINE RESERVE">ON HOLD / PIPELINE RESERVE</option>
                        <option value="REJECT (Does not meet standards)">REJECT (Does not meet standards)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold mb-1">Technical (1-10)</label>
                      <input
                        type="text"
                        value={newEvalTechRating}
                        onChange={(e) => setNewEvalTechRating(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold mb-1">Experience (1-10)</label>
                      <input
                        type="text"
                        value={newEvalExpRating}
                        onChange={(e) => setNewEvalExpRating(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold mb-1">HSE Safety (1-10)</label>
                      <input
                        type="text"
                        value={newEvalSafetyRating}
                        onChange={(e) => setNewEvalSafetyRating(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold mb-1">Overall (0-100)</label>
                      <input
                        type="text"
                        value={newEvalOverallScore}
                        onChange={(e) => setNewEvalOverallScore(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-center font-bold text-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Trade Test Results & Comments</label>
                    <textarea
                      rows={2}
                      value={newEvalTestResults}
                      onChange={(e) => setNewEvalTestResults(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SPECIFIC FIELDS: JOINING FORM                            */}
              {/* -------------------------------------------------------- */}
              {createFormType === 'joining' && (
                <div className="space-y-3">
                  {employees.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-lg">
                      <span className="text-[11px] font-bold text-blue-300">Autofill from Roster:</span>
                      <select
                        onChange={(e) => handleAutofillFromEmployee(e.target.value, 'joining')}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 flex-1"
                      >
                        <option value="">Select Employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.full_name} ({emp.employee_no || emp.employee_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Employee ID Number *</label>
                      <input
                        type="text"
                        required
                        value={newJoinEmpNo}
                        onChange={(e) => setNewJoinEmpNo(e.target.value)}
                        placeholder="EMP-1015"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={newJoinFullName}
                        onChange={(e) => setNewJoinFullName(e.target.value)}
                        placeholder="Full Name as in Passport"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        value={newJoinDesignation}
                        onChange={(e) => setNewJoinDesignation(e.target.value)}
                        placeholder="Role / Title"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Department *</label>
                      <select
                        value={newJoinDept}
                        onChange={(e) => setNewJoinDept(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      >
                        {CEMCON_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Joining Date *</label>
                      <input
                        type="date"
                        required
                        value={newJoinDate}
                        onChange={(e) => setNewJoinDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Passport Number</label>
                      <input
                        type="text"
                        value={newJoinPassport}
                        onChange={(e) => setNewJoinPassport(e.target.value)}
                        placeholder="Passport No"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Emirates ID</label>
                      <input
                        type="text"
                        value={newJoinEmiratesId}
                        onChange={(e) => setNewJoinEmiratesId(e.target.value)}
                        placeholder="784-XXXX-XXXXXXX-X"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SPECIFIC FIELDS: CLEARANCE & EXIT FORM                   */}
              {/* -------------------------------------------------------- */}
              {createFormType === 'clearance' && (
                <div className="space-y-3">
                  {employees.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-rose-950/40 border border-rose-800/40 rounded-lg">
                      <span className="text-[11px] font-bold text-rose-300">Autofill Departing Employee:</span>
                      <select
                        onChange={(e) => handleAutofillFromEmployee(e.target.value, 'clearance')}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 flex-1"
                      >
                        <option value="">Select Employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.full_name} ({emp.employee_no || emp.employee_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Departing Employee Name *</label>
                      <input
                        type="text"
                        required
                        value={newClrEmpName}
                        onChange={(e) => setNewClrEmpName(e.target.value)}
                        placeholder="Employee Name"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Employee ID *</label>
                      <input
                        type="text"
                        required
                        value={newClrEmpNo}
                        onChange={(e) => setNewClrEmpNo(e.target.value)}
                        placeholder="EMP-XXXX"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Department *</label>
                      <select
                        value={newClrDept}
                        onChange={(e) => setNewClrDept(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      >
                        {CEMCON_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Designation</label>
                      <input
                        type="text"
                        value={newClrDesignation}
                        onChange={(e) => setNewClrDesignation(e.target.value)}
                        placeholder="Designation"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Resignation Date *</label>
                      <input
                        type="date"
                        required
                        value={newClrResignDate}
                        onChange={(e) => setNewClrResignDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Last Working Day *</label>
                      <input
                        type="date"
                        required
                        value={newClrLastDate}
                        onChange={(e) => setNewClrLastDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Gratuity (AED)</label>
                      <input
                        type="text"
                        value={newClrGratuity}
                        onChange={(e) => setNewClrGratuity(e.target.value)}
                        placeholder="AED 12,000.00"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Final Settlement (AED)</label>
                      <input
                        type="text"
                        value={newClrFinalSettlement}
                        onChange={(e) => setNewClrFinalSettlement(e.target.value)}
                        placeholder="AED 18,500.00"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  <span>Generate & View Form</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
