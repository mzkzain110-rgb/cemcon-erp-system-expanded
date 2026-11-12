import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  X,
  Save,
  Check,
  CreditCard,
  Layers,
  ChevronDown,
  Info,
  Banknote,
  Receipt,
  FileText,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export interface SalaryStructure {
  structure_id?: string;
  employee_id: string;
  employee_no: string;
  employee_name: string;
  designation?: string;
  salary_type: 'FIXED' | 'FIXED_PLUS_OT' | 'PER_DAY' | 'PER_HOUR';
  base_rate: number;
  overtime_rate?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  other_allowances?: number;
  currency: string;
  payment_method?: 'BANK_WPS' | 'CASH' | 'CHEQUE';
  bank_name?: string;
  iban?: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface MonthlyPayrollItem {
  payroll_id: string;
  payroll_month: string;
  month_days: number;
  employee_id: string;
  employee_no: string;
  employee_name: string;
  designation?: string;
  trade?: string;
  salary_type: 'FIXED' | 'FIXED_PLUS_OT' | 'PER_DAY' | 'PER_HOUR';
  present_days: number;
  vacation_days: number;
  absent_days: number;
  normal_shift_hours: number;
  overtime_hours: number;
  total_paid_hours: number;
  base_rate: number;
  overtime_rate: number;
  basic_salary_earned: number;
  overtime_pay: number;
  allowances_total: number;
  gross_salary: number;
  absence_deduction: number;
  other_deductions: number;
  net_salary: number;
  currency: string;
  status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'PAID';
  payment_date?: string | null;
  remarks?: string;
  created_at: string;
}

interface SalaryModuleProps {
  session: any;
  departments: any[];
  employees: any[];
  onRefreshEmployees?: () => void;
  triggerGoogleSheetsSync?: () => void;
  onOpenAttendance?: () => void;
}

export const SalaryModule: React.FC<SalaryModuleProps> = ({
  session,
  departments,
  employees,
  triggerGoogleSheetsSync,
  onOpenAttendance,
}) => {
  // Navigation / sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'payroll_run' | 'structures'>('payroll_run');

  // Month & Basis Configuration
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [monthBasis, setMonthBasis] = useState<30 | 31>(30); // 30 days or 31 days selector

  // Data States
  const [payrollRecords, setPayrollRecords] = useState<MonthlyPayrollItem[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Payslip Modal State
  const [selectedPayslip, setSelectedPayslip] = useState<MonthlyPayrollItem | null>(null);

  // Structure Form Modal State
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [selectedEmpForStruct, setSelectedEmpForStruct] = useState<string>('');
  const [formSalaryType, setFormSalaryType] = useState<'FIXED' | 'FIXED_PLUS_OT' | 'PER_DAY' | 'PER_HOUR'>('FIXED');
  const [formBaseRate, setFormBaseRate] = useState<string>('0');
  const [formOtRate, setFormOtRate] = useState<string>('0');
  const [formHousing, setFormHousing] = useState<string>('0');
  const [formTransport, setFormTransport] = useState<string>('0');
  const [formOtherAllow, setFormOtherAllow] = useState<string>('0');
  const [formPayMethod, setFormPayMethod] = useState<'BANK_WPS' | 'CASH' | 'CHEQUE'>('BANK_WPS');
  const [formBankName, setFormBankName] = useState<string>('Emirates NBD');
  const [formIban, setFormIban] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formNotes, setFormNotes] = useState<string>('');
  const [savingStruct, setSavingStruct] = useState(false);

  // Inline adjustment state
  const [editingDeductionId, setEditingDeductionId] = useState<string | null>(null);
  const [tempDeductionVal, setTempDeductionVal] = useState<string>('0');

  // 1. Initial Load & on Month Change
  useEffect(() => {
    fetchPayrollData();
    fetchSalaryStructures();
  }, [selectedMonth, session?.company?.company_id]);

  const fetchPayrollData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/payroll/records?month=${selectedMonth}`);
      if (res.ok) {
        const json = await res.json();
        setPayrollRecords(json.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load payroll records:', err);
      setErrorMsg('Failed to fetch payroll records from database');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryStructures = async () => {
    try {
      const res = await fetch('/api/payroll/structures');
      if (res.ok) {
        const json = await res.json();
        setSalaryStructures(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load salary structures:', err);
    }
  };

  // 2. ⚡ Generate Salary from Attendance
  const handleGeneratePayroll = async () => {
    setGenerating(true);
    setErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          month_days: monthBasis,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Generation failed: ${text}`);
      }

      const json = await res.json();
      setPayrollRecords(json.data || []);
      setActionSuccessMsg(`Successfully generated payroll for ${json.count || json.data?.length || 0} employees based on ${monthBasis}-day attendance!`);
      if (triggerGoogleSheetsSync) triggerGoogleSheetsSync();
    } catch (err: any) {
      console.error('Error generating payroll:', err);
      setErrorMsg(err.message || 'Error generating salary from attendance');
    } finally {
      setGenerating(false);
    }
  };

  // 3. Update single payroll item (deductions)
  const handleSaveInlineDeduction = async (payrollId: string) => {
    try {
      const deductionNum = Math.max(0, parseFloat(tempDeductionVal) || 0);
      const res = await fetch(`/api/payroll/records/${payrollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ other_deductions: deductionNum }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPayrollRecords((prev) =>
          prev.map((r) => (r.payroll_id === payrollId ? { ...r, ...updated } : r))
        );
        setEditingDeductionId(null);
        if (triggerGoogleSheetsSync) triggerGoogleSheetsSync();
      }
    } catch (err: any) {
      console.error('Failed to update deduction:', err);
    }
  };

  // 4. Batch approve or mark as paid
  const handleBatchStatusUpdate = async (newStatus: 'APPROVED' | 'PAID') => {
    if (payrollRecords.length === 0) return;
    const confirmText =
      newStatus === 'APPROVED'
        ? `Approve all ${payrollRecords.length} payroll records for ${selectedMonth}?`
        : `Mark all ${payrollRecords.length} records as PAID via Bank WPS / Cash?`;

    if (!window.confirm(confirmText)) return;

    try {
      const ids = payrollRecords.map((r) => r.payroll_id);
      const paymentDate = newStatus === 'PAID' ? new Date().toISOString().split('T')[0] : undefined;

      const res = await fetch('/api/payroll/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: newStatus, payment_date: paymentDate }),
      });

      if (res.ok) {
        setActionSuccessMsg(`Updated ${ids.length} records to ${newStatus}`);
        fetchPayrollData();
        if (triggerGoogleSheetsSync) triggerGoogleSheetsSync();
      }
    } catch (err: any) {
      setErrorMsg('Failed to update batch status');
    }
  };

  // 5. Save Salary Structure
  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForStruct) {
      alert('Please select an employee');
      return;
    }

    const empObj = employees.find((e) => e.employee_id === selectedEmpForStruct);
    if (!empObj) {
      alert('Employee record not found');
      return;
    }

    setSavingStruct(true);
    try {
      const payload: Partial<SalaryStructure> = {
        employee_id: empObj.employee_id,
        employee_no: empObj.employee_no,
        employee_name: empObj.full_name,
        designation: empObj.designation,
        salary_type: formSalaryType,
        base_rate: parseFloat(formBaseRate) || 0,
        overtime_rate: parseFloat(formOtRate) || 0,
        housing_allowance: parseFloat(formHousing) || 0,
        transport_allowance: parseFloat(formTransport) || 0,
        other_allowances: parseFloat(formOtherAllow) || 0,
        currency: 'AED',
        payment_method: formPayMethod,
        bank_name: formBankName,
        iban: formIban,
        status: formStatus,
        notes: formNotes,
      };

      const res = await fetch('/api/payroll/structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save salary structure');
      }

      await fetchSalaryStructures();
      setIsStructureModalOpen(false);
      setActionSuccessMsg(`Compensation package updated for ${empObj.full_name}`);
      if (triggerGoogleSheetsSync) triggerGoogleSheetsSync();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingStruct(false);
    }
  };

  const openEditStructureModal = (empId: string) => {
    setSelectedEmpForStruct(empId);
    const existing = salaryStructures.find((s) => s.employee_id === empId);
    const emp = employees.find((e) => e.employee_id === empId);

    if (existing) {
      setEditingStructure(existing);
      setFormSalaryType(existing.salary_type || 'FIXED');
      setFormBaseRate(String(existing.base_rate || 0));
      setFormOtRate(String(existing.overtime_rate || 0));
      setFormHousing(String(existing.housing_allowance || 0));
      setFormTransport(String(existing.transport_allowance || 0));
      setFormOtherAllow(String(existing.other_allowances || 0));
      setFormPayMethod(existing.payment_method || 'BANK_WPS');
      setFormBankName(existing.bank_name || 'Emirates NBD');
      setFormIban(existing.iban || '');
      setFormStatus(existing.status || 'ACTIVE');
      setFormNotes(existing.notes || '');
    } else {
      setEditingStructure(null);
      // Auto-detect recommended structure from designation
      const des = (emp?.designation || '').toLowerCase();
      const isTradeWorker = des.includes('welder') || des.includes('fabricator') || des.includes('fitter') || des.includes('mechanic');
      setFormSalaryType(isTradeWorker ? 'FIXED_PLUS_OT' : 'FIXED');
      setFormBaseRate(isTradeWorker ? '2500' : '6500');
      setFormOtRate(isTradeWorker ? '13' : '0');
      setFormHousing('0');
      setFormTransport('0');
      setFormOtherAllow('0');
      setFormPayMethod('BANK_WPS');
      setFormBankName('Emirates NBD');
      setFormIban('AE');
      setFormStatus('ACTIVE');
      setFormNotes('');
    }
    setIsStructureModalOpen(true);
  };

  // 6. Export UAE WPS (SIF File Format)
  const handleExportWpsSif = () => {
    if (payrollRecords.length === 0) {
      alert('No payroll records to export. Please generate payroll first.');
      return;
    }

    const companyCode = 'CEMCON1001';
    const employerCr = '10023456';
    const dateFormatted = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

    let sifContent = `SCR,${employerCr},${companyCode},${selectedMonth.replace('-', '')},${payrollRecords.length},AED,${dateFormatted}\n`;

    payrollRecords.forEach((item, idx) => {
      const struct = salaryStructures.find((s) => s.employee_id === item.employee_id);
      const iban = struct?.iban || `AE030331000000000${String(idx + 1).padStart(4, '0')}`;
      const bankName = struct?.bank_name || 'ENBD';
      const fixedPay = (item.basic_salary_earned + item.allowances_total).toFixed(2);
      const varPay = item.overtime_pay.toFixed(2);
      const daysCount = item.present_days + item.vacation_days;

      sifContent += `EDR,${item.employee_no},${iban},${bankName},${item.net_salary.toFixed(2)},${fixedPay},${varPay},${item.absence_deduction.toFixed(2)},${daysCount}\n`;
    });

    const blob = new Blob([sifContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WPS_SIF_${companyCode}_${selectedMonth.replace('-', '')}.sif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 7. Export CSV
  const handleExportCsv = () => {
    if (payrollRecords.length === 0) {
      alert('No payroll records to export.');
      return;
    }

    const headers = [
      'Employee No',
      'Name',
      'Designation',
      'Trade',
      'Salary Structure',
      'Month Days',
      'Present Days (P)',
      'Absent Days (A)',
      'Vacation Days (V)',
      'Normal Shift Hours (8h)',
      'Overtime Hours (OT)',
      'Base Rate',
      'OT Rate',
      'Basic Earned (AED)',
      'Overtime Pay (AED)',
      'Allowances (AED)',
      'Gross Salary (AED)',
      'Absence Deduction (AED)',
      'Other Deductions (AED)',
      'Net Salary (AED)',
      'Status',
    ];

    const rows = payrollRecords.map((r) => [
      `"${r.employee_no}"`,
      `"${r.employee_name}"`,
      `"${r.designation || ''}"`,
      `"${r.trade || ''}"`,
      `"${r.salary_type}"`,
      r.month_days,
      r.present_days,
      r.absent_days,
      r.vacation_days,
      r.normal_shift_hours,
      r.overtime_hours,
      r.base_rate,
      r.overtime_rate,
      r.basic_salary_earned,
      r.overtime_pay,
      r.allowances_total,
      r.gross_salary,
      r.absence_deduction,
      r.other_deductions,
      r.net_salary,
      `"${r.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cemcon_Monthly_Payroll_${selectedMonth}_${monthBasis}Days.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered Payroll List
  const filteredRecords = useMemo(() => {
    return payrollRecords.filter((rec) => {
      const matchesSearch =
        rec.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employee_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.trade || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'ALL' || rec.salary_type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [payrollRecords, searchQuery, typeFilter, statusFilter]);

  // Aggregate KPI Calculations
  const stats = useMemo(() => {
    const totalNet = payrollRecords.reduce((acc, r) => acc + (Number(r.net_salary) || 0), 0);
    const totalBasic = payrollRecords.reduce((acc, r) => acc + (Number(r.basic_salary_earned) || 0), 0);
    const totalOtPay = payrollRecords.reduce((acc, r) => acc + (Number(r.overtime_pay) || 0), 0);
    const totalOtHours = payrollRecords.reduce((acc, r) => acc + (Number(r.overtime_hours) || 0), 0);
    const totalAbsenceDeductions = payrollRecords.reduce((acc, r) => acc + (Number(r.absence_deduction) || 0), 0);
    const approvedCount = payrollRecords.filter((r) => r.status === 'APPROVED' || r.status === 'PAID').length;

    return {
      totalNet,
      totalBasic,
      totalOtPay,
      totalOtHours,
      totalAbsenceDeductions,
      headcount: payrollRecords.length,
      approvedCount,
    };
  }, [payrollRecords]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <Banknote className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Salary & Payroll Management Module
                </h1>
                <p className="text-xs text-slate-400">
                  Cemcon Mechanical Engineering LLC • Multi-Structure Automated Attendance Engine
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
              Supports <strong className="text-white">Fix Salary</strong> (supervisors & office staff),{' '}
              <strong className="text-white">Fix + Overtime</strong> (welders & fabricators),{' '}
              <strong className="text-white">Per Day Salary</strong>, and{' '}
              <strong className="text-white">Per Hour Salary</strong> based on customizable 30-day or 31-day attendance records.
            </p>
          </div>

          {/* Sub-tab Pill Switcher */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 self-start lg:self-center">
            <button
              onClick={() => setActiveSubTab('payroll_run')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'payroll_run'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Receipt className="h-4 w-4" />
              Monthly Payroll Run
            </button>
            <button
              onClick={() => setActiveSubTab('structures')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'structures'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="h-4 w-4" />
              Salary Structure Packages ({salaryStructures.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {actionSuccessMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. PRIMARY VIEW: MONTHLY PAYROLL RUN */}
      {activeSubTab === 'payroll_run' && (
        <div className="space-y-6">
          {/* Controls Bar: Month Picker, 30/31 Days, 1-Click Generate, SIF Export */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            {/* Left: Month and 30/31 Day Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-slate-400">Payroll Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* 30 Days or 31 Days Month Basis Toggle as specifically requested */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 px-2.5">Month Basis:</span>
                <button
                  type="button"
                  onClick={() => setMonthBasis(30)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    monthBasis === 30
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setMonthBasis(31)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    monthBasis === 31
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  31 Days
                </button>
              </div>

              {onOpenAttendance && (
                <button
                  onClick={onOpenAttendance}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  View Attendance Sheet
                </button>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleGeneratePayroll}
                disabled={generating}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Calculating From Attendance...' : '⚡ Generate Salary from Attendance'}
              </button>

              <button
                type="button"
                onClick={handleExportWpsSif}
                disabled={payrollRecords.length === 0}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                title="Generates UAE Central Bank WPS SIF format for direct corporate payroll transfer"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                UAE Bank WPS (SIF)
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={payrollRecords.length === 0}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Download className="h-4 w-4 text-slate-400" />
                Export CSV
              </button>

              <div className="h-6 w-px bg-slate-800 hidden sm:block" />

              <button
                type="button"
                onClick={() => handleBatchStatusUpdate('APPROVED')}
                disabled={payrollRecords.length === 0}
                className="px-3 py-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Check className="h-4 w-4 text-indigo-400" />
                Approve All
              </button>

              <button
                type="button"
                onClick={() => handleBatchStatusUpdate('PAID')}
                disabled={payrollRecords.length === 0}
                className="px-3 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <CreditCard className="h-4 w-4 text-emerald-400" />
                Mark Paid
              </button>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Net Payroll</span>
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Banknote className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  AED {stats.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Net payable across {stats.headcount} workforce members
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Basic Earned Salary</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                  AED {stats.totalBasic.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                After AED {stats.totalAbsenceDeductions.toLocaleString()} absence deductions
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Overtime (OT) Pay</span>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400 tracking-tight">
                  AED {stats.totalOtPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-medium text-slate-400">({stats.totalOtHours}h total OT)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Fix+OT, Per Day & Per Hour workforce OT
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Payroll Approval Status</span>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <UserCheck className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {stats.approvedCount} / {stats.headcount}
                </span>
                <span className="text-xs text-indigo-400 font-semibold">Approved</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Month period calculated: <span className="text-slate-200 font-medium">{monthBasis} Days</span>
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee by name, ID, or trade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span>Structure:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Structures</option>
                  <option value="FIXED">Fix Salary (Office / Supervisors)</option>
                  <option value="FIXED_PLUS_OT">Fix + Overtime (Welders / Fabricators)</option>
                  <option value="PER_DAY">Per Day Salary</option>
                  <option value="PER_HOUR">Per Hour Salary</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="GENERATED">Generated</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="text-white font-bold">{filteredRecords.length}</span> of {payrollRecords.length} entries
            </div>
          </div>

          {/* Master Payroll Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Emp ID & Name</th>
                    <th className="py-3 px-3">Trade / Role</th>
                    <th className="py-3 px-3">Salary Structure</th>
                    <th className="py-3 px-2 text-center" title="Present Days (8h shift)">P</th>
                    <th className="py-3 px-2 text-center" title="Absent Days">A</th>
                    <th className="py-3 px-2 text-center" title="Paid Vacation Days">V</th>
                    <th className="py-3 px-2 text-center" title="Total Overtime Hours">OT (h)</th>
                    <th className="py-3 px-3 text-right">Base Rate</th>
                    <th className="py-3 px-3 text-right">Basic Earned</th>
                    <th className="py-3 px-3 text-right">OT Pay</th>
                    <th className="py-3 px-3 text-right">Allowances</th>
                    <th className="py-3 px-3 text-right text-rose-400">Absence Ded.</th>
                    <th className="py-3 px-3 text-right text-amber-400">Other Ded.</th>
                    <th className="py-3 px-3 text-right text-blue-400 font-bold">Net Salary</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-400 font-sans">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                        Loading payroll data for {selectedMonth}...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-400 font-sans">
                        <FileSpreadsheet className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-300 font-medium">No payroll records generated for {selectedMonth} yet.</p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                          Click <strong className="text-blue-400">"⚡ Generate Salary from Attendance"</strong> above to auto-calculate payroll from marked attendance records.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((item) => {
                      const isEditingDeduction = editingDeductionId === item.payroll_id;

                      return (
                        <tr
                          key={item.payroll_id}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Emp ID & Name */}
                          <td className="py-3 px-3 font-sans">
                            <div className="font-semibold text-white">{item.employee_name}</div>
                            <div className="text-[11px] text-blue-400 font-mono">{item.employee_no}</div>
                          </td>

                          {/* Trade / Designation */}
                          <td className="py-3 px-3 font-sans">
                            <div className="text-slate-200 font-medium">{item.trade || item.designation || 'General'}</div>
                            <div className="text-[10px] text-slate-500">{item.designation}</div>
                          </td>

                          {/* Structure Badge */}
                          <td className="py-3 px-3 font-sans">
                            {item.salary_type === 'FIXED' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-500/30">
                                Fix Salary
                              </span>
                            )}
                            {item.salary_type === 'FIXED_PLUS_OT' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-500/30">
                                Fix + Overtime
                              </span>
                            )}
                            {item.salary_type === 'PER_DAY' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                Per Day Salary
                              </span>
                            )}
                            {item.salary_type === 'PER_HOUR' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-500/30">
                                Per Hour Salary
                              </span>
                            )}
                          </td>

                          {/* Attendance: P, A, V, OT */}
                          <td className="py-3 px-2 text-center font-bold text-emerald-400">
                            {item.present_days}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-rose-400">
                            {item.absent_days}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-blue-400">
                            {item.vacation_days}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-amber-400">
                            {item.overtime_hours > 0 ? `${item.overtime_hours}h` : '-'}
                          </td>

                          {/* Base Rate */}
                          <td className="py-3 px-3 text-right text-slate-300">
                            {item.base_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-[10px] text-slate-500 font-sans block">
                              {item.salary_type === 'PER_DAY' ? '/day' : item.salary_type === 'PER_HOUR' ? '/hr' : '/mo'}
                            </span>
                          </td>

                          {/* Basic Salary Earned */}
                          <td className="py-3 px-3 text-right text-slate-100 font-medium">
                            {item.basic_salary_earned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* Overtime Pay */}
                          <td className="py-3 px-3 text-right text-amber-300">
                            {item.overtime_pay > 0
                              ? item.overtime_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })
                              : '-'}
                          </td>

                          {/* Allowances */}
                          <td className="py-3 px-3 text-right text-slate-300">
                            {item.allowances_total > 0
                              ? item.allowances_total.toLocaleString(undefined, { minimumFractionDigits: 2 })
                              : '-'}
                          </td>

                          {/* Absence Deduction */}
                          <td className="py-3 px-3 text-right text-rose-400">
                            {item.absence_deduction > 0
                              ? `-${item.absence_deduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>

                          {/* Other Deductions (Inline Editable) */}
                          <td className="py-3 px-3 text-right">
                            {isEditingDeduction ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  value={tempDeductionVal}
                                  onChange={(e) => setTempDeductionVal(e.target.value)}
                                  className="w-16 px-1 py-0.5 bg-slate-950 border border-blue-500 rounded text-right text-xs text-white"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveInlineDeduction(item.payroll_id)}
                                  className="p-1 text-emerald-400 hover:text-white"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingDeductionId(null)}
                                  className="p-1 text-slate-500 hover:text-white"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingDeductionId(item.payroll_id);
                                  setTempDeductionVal(String(item.other_deductions || 0));
                                }}
                                className="cursor-pointer hover:bg-slate-800/80 px-1 py-0.5 rounded text-amber-400 flex items-center justify-end gap-1 group/ded"
                                title="Click to edit deductions"
                              >
                                {item.other_deductions > 0
                                  ? `-${item.other_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                  : '0.00'}
                                <Edit className="h-2.5 w-2.5 opacity-0 group-hover/ded:opacity-100 text-slate-400" />
                              </div>
                            )}
                          </td>

                          {/* NET SALARY */}
                          <td className="py-3 px-3 text-right text-blue-400 font-bold text-sm bg-blue-950/20">
                            {item.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center font-sans">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === 'PAID'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : item.status === 'APPROVED'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          {/* Payslip Action */}
                          <td className="py-3 px-3 text-center font-sans">
                            <button
                              type="button"
                              onClick={() => setSelectedPayslip(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-[11px] font-medium flex items-center gap-1 mx-auto transition-all"
                            >
                              <FileText className="h-3 w-3" />
                              Payslip
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary Breakdown */}
            {filteredRecords.length > 0 && (
              <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>
                    Total Present Days: <strong className="text-emerald-400">{filteredRecords.reduce((s, r) => s + r.present_days, 0)}</strong>
                  </span>
                  <span>
                    Total Absent Days: <strong className="text-rose-400">{filteredRecords.reduce((s, r) => s + r.absent_days, 0)}</strong>
                  </span>
                  <span>
                    Total OT Hours: <strong className="text-amber-400">{filteredRecords.reduce((s, r) => s + r.overtime_hours, 0)}h</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-semibold">Total Net Payable ({selectedMonth}):</span>
                  <span className="text-base font-bold text-blue-400 font-mono">
                    AED {filteredRecords.reduce((s, r) => s + r.net_salary, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SECONDARY VIEW: SALARY STRUCTURE PACKAGES */}
      {activeSubTab === 'structures' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                Employee Compensation & Salary Structure Configuration
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure base wages, overtime formulas, and allowances for all personnel.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (employees.length > 0) {
                    openEditStructureModal(employees[0].employee_id);
                  } else {
                    alert('Please add employees in the Departments & HR section first.');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" />
                Configure Compensation Package
              </button>
            </div>
          </div>

          {/* Structures List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Salary Structure</th>
                    <th className="py-3 px-4 text-right">Base Rate (AED)</th>
                    <th className="py-3 px-4 text-right">OT Rate / Hour</th>
                    <th className="py-3 px-4 text-right">Allowances</th>
                    <th className="py-3 px-4">Payment Method & Bank</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {employees.map((emp) => {
                    const struct = salaryStructures.find((s) => s.employee_id === emp.employee_id);
                    const salaryType = struct?.salary_type || 'FIXED';
                    const baseRate = struct?.base_rate || 0;
                    const otRate = struct?.overtime_rate || 0;
                    const allow = (struct?.housing_allowance || 0) + (struct?.transport_allowance || 0) + (struct?.other_allowances || 0);

                    return (
                      <tr key={emp.employee_id} className="hover:bg-slate-800/40 transition-colors font-sans">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{emp.full_name}</div>
                          <div className="text-[11px] text-blue-400 font-mono">{emp.employee_no}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{emp.designation}</td>
                        <td className="py-3 px-4">
                          {salaryType === 'FIXED' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-500/30">
                              Fix Salary (Supervisors / Staff)
                            </span>
                          )}
                          {salaryType === 'FIXED_PLUS_OT' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-500/30">
                              Fix + Overtime (Welders / Fabricators)
                            </span>
                          )}
                          {salaryType === 'PER_DAY' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                              Per Day Salary
                            </span>
                          )}
                          {salaryType === 'PER_HOUR' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-500/30">
                              Per Hour Salary
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-white font-medium">
                          {baseRate > 0 ? baseRate.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          <span className="text-[10px] text-slate-500 font-sans block">
                            {salaryType === 'PER_DAY' ? 'AED / day' : salaryType === 'PER_HOUR' ? 'AED / hr' : 'AED / month'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-300">
                          {otRate > 0 ? `${otRate.toFixed(2)} AED/h` : salaryType === 'FIXED' ? 'N/A' : '1.25x'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {allow > 0 ? `${allow.toLocaleString()} AED` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-white">{struct?.payment_method || 'BANK_WPS'}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
                            {struct?.iban || 'No IBAN set'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              (emp.status || 'ACTIVE') === 'ACTIVE'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {emp.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => openEditStructureModal(emp.employee_id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 mx-auto"
                          >
                            <Edit className="h-3 w-3" />
                            Configure
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: EDIT / CREATE SALARY STRUCTURE */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-blue-400" />
                  Configure Salary Package
                </h3>
                <p className="text-xs text-slate-400">
                  Select salary structure type and define rates for attendance calculation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStructureModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStructure} className="p-6 space-y-5">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employee</label>
                <select
                  value={selectedEmpForStruct}
                  onChange={(e) => {
                    setSelectedEmpForStruct(e.target.value);
                    openEditStructureModal(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_no} - {emp.full_name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary Structure Radio Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Salary Structure Model (Attendance-Driven)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formSalaryType === 'FIXED'
                        ? 'bg-blue-600/15 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="salary_type"
                      checked={formSalaryType === 'FIXED'}
                      onChange={() => setFormSalaryType('FIXED')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Fix Salary</div>
                      <div className="text-[11px] text-slate-400">e.g. Supervisors, Office Staff, Engineers. Fixed monthly base; absent days deducted based on 30/31 days. No OT.</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formSalaryType === 'FIXED_PLUS_OT'
                        ? 'bg-amber-600/15 border-amber-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="salary_type"
                      checked={formSalaryType === 'FIXED_PLUS_OT'}
                      onChange={() => setFormSalaryType('FIXED_PLUS_OT')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Fix + Overtime</div>
                      <div className="text-[11px] text-slate-400">e.g. Welder, Fabricator. Fixed monthly base salary + paid overtime hours from attendance sheet.</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formSalaryType === 'PER_DAY'
                        ? 'bg-emerald-600/15 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="salary_type"
                      checked={formSalaryType === 'PER_DAY'}
                      onChange={() => setFormSalaryType('PER_DAY')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Per Day Salary</div>
                      <div className="text-[11px] text-slate-400">Daily rate workers. Paid for Present days (P) + Vacation (V) + overtime hours.</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formSalaryType === 'PER_HOUR'
                        ? 'bg-purple-600/15 border-purple-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="salary_type"
                      checked={formSalaryType === 'PER_HOUR'}
                      onChange={() => setFormSalaryType('PER_HOUR')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Per Hour Salary</div>
                      <div className="text-[11px] text-slate-400">Hourly rate workers. Paid for normal 8h shift hours + recorded OT hours.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {formSalaryType === 'PER_DAY'
                      ? 'Base Daily Rate (AED / day)'
                      : formSalaryType === 'PER_HOUR'
                      ? 'Base Hourly Rate (AED / hour)'
                      : 'Fixed Base Monthly Salary (AED)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formBaseRate}
                    onChange={(e) => setFormBaseRate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="e.g. 5000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Overtime Rate (AED / hour)
                    {formSalaryType === 'FIXED' && <span className="text-slate-500 ml-1 font-normal">(N/A for Fixed)</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formOtRate}
                    onChange={(e) => setFormOtRate(e.target.value)}
                    disabled={formSalaryType === 'FIXED'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-40"
                    placeholder={formSalaryType === 'FIXED' ? 'Not Applicable' : 'Leave 0 for auto 1.25x'}
                  />
                </div>
              </div>

              {/* Allowances */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Housing Allow. (AED)</label>
                  <input
                    type="number"
                    value={formHousing}
                    onChange={(e) => setFormHousing(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Transport Allow. (AED)</label>
                  <input
                    type="number"
                    value={formTransport}
                    onChange={(e) => setFormTransport(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Other Allow. (AED)</label>
                  <input
                    type="number"
                    value={formOtherAllow}
                    onChange={(e) => setFormOtherAllow(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Banking & WPS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={formPayMethod}
                    onChange={(e: any) => setFormPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="BANK_WPS">Bank Transfer (UAE WPS)</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="Emirates NBD / ADCB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">WPS IBAN Number</label>
                  <input
                    type="text"
                    value={formIban}
                    onChange={(e) => setFormIban(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none"
                    placeholder="AE03033..."
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  placeholder="e.g. Approved contract terms 2026"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStruct}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {savingStruct ? 'Saving Package...' : 'Save Compensation Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: OFFICIAL PRINTABLE CORPORATE PAYSLIP */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 text-slate-200">
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 print:hidden">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-blue-400" />
                Official Employee Payslip Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Payslip (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Container (Styled for both dark UI preview & Clean White Corporate Print) */}
            <div id="corporate-payslip-print" className="p-8 bg-white text-slate-900 print:p-0">
              {/* Corporate Letterhead Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    CEMCON MECHANICAL ENGINEERING L.L.C
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Heavy Steel Fabrication, Piping & Industrial Engineering Solutions
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Industrial Area 2, Al Quoz, P.O. Box 48219, Dubai, United Arab Emirates
                  </p>
                  <p className="text-[11px] text-slate-500">
                    TRN / VAT: 100234567800003 • Tel: +971 4 338 9911
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase rounded">
                    SALARY PAYSLIP
                  </span>
                  <p className="text-xs text-slate-700 font-bold mt-1.5">
                    Pay Period: {selectedPayslip.payroll_month}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Basis: {selectedPayslip.month_days} Days Month
                  </p>
                </div>
              </div>

              {/* Employee Meta Details Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 font-sans">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Employee Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedPayslip.employee_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Employee Number</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedPayslip.employee_no}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Designation / Role</span>
                  <span className="font-medium text-slate-800">{selectedPayslip.designation || 'Personnel'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Workforce Trade</span>
                  <span className="font-medium text-slate-800">{selectedPayslip.trade || selectedPayslip.designation || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Salary Structure Type</span>
                  <span className="font-semibold text-blue-800">
                    {selectedPayslip.salary_type === 'FIXED' && 'Fix Salary (Supervisors / Office Staff)'}
                    {selectedPayslip.salary_type === 'FIXED_PLUS_OT' && 'Fix + Overtime (Welders / Fabricators)'}
                    {selectedPayslip.salary_type === 'PER_DAY' && 'Per Day Salary'}
                    {selectedPayslip.salary_type === 'PER_HOUR' && 'Per Hour Salary'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Payment Status</span>
                  <span className="font-semibold text-emerald-700 uppercase">{selectedPayslip.status}</span>
                </div>
              </div>

              {/* Attendance Statistics Strip */}
              <div className="mb-6">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Monthly Workforce Attendance Summary ({selectedPayslip.month_days} Days Calendar)
                </h4>
                <div className="grid grid-cols-5 border border-slate-200 rounded-lg text-center overflow-hidden">
                  <div className="p-2.5 bg-slate-100 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Present Days (P)</span>
                    <span className="font-bold text-emerald-700 text-sm">{selectedPayslip.present_days}</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Vacation Days (V)</span>
                    <span className="font-bold text-blue-700 text-sm">{selectedPayslip.vacation_days}</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Absent Days (A)</span>
                    <span className="font-bold text-rose-700 text-sm">{selectedPayslip.absent_days}</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 border-r border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Shift Hours (8h)</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedPayslip.normal_shift_hours}h</span>
                  </div>
                  <div className="p-2.5 bg-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase">Overtime Hours</span>
                    <span className="font-bold text-amber-700 text-sm">{selectedPayslip.overtime_hours}h</span>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Two-Column Ledger */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Earnings Column */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-800 text-xs uppercase border-b border-slate-200">
                    Earnings
                  </div>
                  <div className="p-3.5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">Basic Salary Earned:</span>
                      <span className="font-semibold text-slate-900">AED {selectedPayslip.basic_salary_earned.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">
                        Overtime Pay ({selectedPayslip.overtime_hours}h @ AED {selectedPayslip.overtime_rate}/h):
                      </span>
                      <span className="font-semibold text-slate-900">AED {selectedPayslip.overtime_pay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">Allowances (Housing & Transport):</span>
                      <span className="font-semibold text-slate-900">AED {selectedPayslip.allowances_total.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                      <span className="font-sans">Gross Earnings:</span>
                      <span>AED {selectedPayslip.gross_salary.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-800 text-xs uppercase border-b border-slate-200">
                    Deductions
                  </div>
                  <div className="p-3.5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-rose-700">
                      <span className="text-slate-600 font-sans">Absence Deduction ({selectedPayslip.absent_days} days):</span>
                      <span className="font-semibold">AED {selectedPayslip.absence_deduction.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span className="text-slate-600 font-sans">Other Deductions / Fines:</span>
                      <span className="font-semibold">AED {selectedPayslip.other_deductions.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                      <span className="font-sans">Total Deductions:</span>
                      <span>AED {(selectedPayslip.absence_deduction + selectedPayslip.other_deductions).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-300 block">Net Payable Salary (WPS Transfer)</span>
                  <span className="text-[11px] text-slate-400">Payment Currency: UAE Dirham (AED)</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono tracking-tight">
                    AED {selectedPayslip.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Signatures & Corporate Authorizations */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-xs text-slate-700">
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-bold block">Prepared By</span>
                  <span className="text-[10px] text-slate-500">Payroll Accountant</span>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-bold block">Approved By</span>
                  <span className="text-[10px] text-slate-500">Managing Director / HR Head</span>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-1" />
                  <span className="font-bold block">Employee Signature</span>
                  <span className="text-[10px] text-slate-500">Received & Verified</span>
                </div>
              </div>

              {/* Footer Disclaimers */}
              <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
                <span>Compenia ERP • Automated Attendance & Payroll System</span>
                <span>Generated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
