import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  Filter,
  Save,
  Download,
  Printer,
  Plus,
  RefreshCw,
  Building2,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Wrench,
  Award,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  Banknote,
} from 'lucide-react';

interface AttendanceRecord {
  attendance_id?: string;
  employee_id: string;
  date: string;
  status: string; // 'P' | 'A' | 'V' | 'PRESENT' | 'ABSENT' | 'VACATION'
  code?: string;
  trade?: string;
  shift_hours?: number;
  ot_hours?: number;
  notes?: string;
}

interface MonthlyAttendanceModuleProps {
  session: any;
  departments: any[];
  employees: any[];
  onRefreshEmployees?: () => void;
  triggerGoogleSheetsSync?: () => void;
  onOpenSalary?: () => void;
}

export const MonthlyAttendanceModule: React.FC<MonthlyAttendanceModuleProps> = ({
  session,
  departments,
  employees,
  triggerGoogleSheetsSync,
  onOpenSalary,
}) => {
  // Date State: Year & Month
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [totalDaysInMonth, setTotalDaysInMonth] = useState<number>(30); // 30 days as requested

  // Filter State
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Attendance Records: Map of key `${employee_id}_${date}` -> AttendanceRecord
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Quick Daily Mark Modal
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [dailyModalDate, setDailyModalDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dailyMarks, setDailyMarks] = useState<
    Record<string, { status: 'P' | 'A' | 'V'; ot: number; trade: string }>
  >({});

  // Cell OT Edit Popover
  const [activeCellEdit, setActiveCellEdit] = useState<{
    empId: string;
    dayNum: number;
    currentStatus: 'P' | 'A' | 'V';
    currentOt: number;
  } | null>(null);

  // Local Trade custom overrides (if user wants to customize trade beyond designation)
  const [customTrades, setCustomTrades] = useState<Record<string, string>>({});

  // 1. Fetch Attendance from Backend on load or month change
  useEffect(() => {
    fetchAttendance();
  }, [selectedYear, selectedMonth, session?.company?.company_id]);

  const fetchAttendance = async () => {
    setLoading(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/hr/attendance');
      if (res.ok) {
        const json = await res.json();
        const records: AttendanceRecord[] = json.data || [];
        const newMap: Record<string, AttendanceRecord> = {};
        for (const r of records) {
          if (r.employee_id && r.date) {
            newMap[`${r.employee_id}_${r.date}`] = r;
          }
        }
        setAttendanceMap(newMap);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Error loading attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (day: number) => {
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${selectedYear}-${mm}-${dd}`;
  };

  // Helper to resolve employee trade
  const getEmployeeTrade = (emp: any): string => {
    if (customTrades[emp.employee_id]) return customTrades[emp.employee_id];
    if (emp.trade) return emp.trade;
    // Derive from designation or fallback to standard trade
    const des = (emp.designation || '').trim();
    if (des) return des;
    return 'Industrial Craftsman';
  };

  // Filtered employee list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesDept =
        selectedDeptFilter === 'ALL' || emp.department_id === selectedDeptFilter;
      const q = searchQuery.toLowerCase().trim();
      const trade = getEmployeeTrade(emp).toLowerCase();
      const matchesQuery =
        !q ||
        (emp.full_name || '').toLowerCase().includes(q) ||
        (emp.employee_no || '').toLowerCase().includes(q) ||
        trade.includes(q);
      return matchesDept && matchesQuery;
    });
  }, [employees, selectedDeptFilter, searchQuery, customTrades]);

  // Read cell state for employee & day
  const getCellAttendance = (empId: string, day: number) => {
    const dateStr = formatDateStr(day);
    const rec = attendanceMap[`${empId}_${dateStr}`];
    if (!rec) {
      return { status: null, ot: 0, shift: 0 };
    }
    const rawStatus = (rec.status || rec.code || 'P').toUpperCase();
    const status: 'P' | 'A' | 'V' = rawStatus.startsWith('P')
      ? 'P'
      : rawStatus.startsWith('A')
      ? 'A'
      : 'V';
    const ot = Number(rec.ot_hours || 0);
    const shift = status === 'P' ? 8 : status === 'V' ? 8 : 0;
    return { status, ot, shift };
  };

  // Toggle cell status on click: null -> P -> A -> V -> P
  const handleCellClick = (empId: string, day: number) => {
    const dateStr = formatDateStr(day);
    const current = getCellAttendance(empId, day);
    let nextStatus: 'P' | 'A' | 'V' = 'P';
    if (current.status === 'P') nextStatus = 'A';
    else if (current.status === 'A') nextStatus = 'V';
    else if (current.status === 'V') nextStatus = 'P';

    const emp = employees.find((e) => e.employee_id === empId);
    const trade = emp ? getEmployeeTrade(emp) : '';

    setAttendanceMap((prev) => ({
      ...prev,
      [`${empId}_${dateStr}`]: {
        employee_id: empId,
        date: dateStr,
        status: nextStatus,
        code: nextStatus,
        trade,
        shift_hours: nextStatus === 'P' ? 8 : nextStatus === 'V' ? 8 : 0,
        ot_hours: current.ot,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Quick Action: Mark all active employees present (P, 8h) for all 30 days
  const handleMarkAllPresent = () => {
    const newMap = { ...attendanceMap };
    for (const emp of filteredEmployees) {
      const trade = getEmployeeTrade(emp);
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const dateStr = formatDateStr(day);
        const existing = newMap[`${emp.employee_id}_${dateStr}`];
        newMap[`${emp.employee_id}_${dateStr}`] = {
          employee_id: emp.employee_id,
          date: dateStr,
          status: 'P',
          code: 'P',
          trade,
          shift_hours: 8,
          ot_hours: existing ? existing.ot_hours || 0 : 0,
        };
      }
    }
    setAttendanceMap(newMap);
    setHasUnsavedChanges(true);
  };

  // Quick Action: Pre-fill current day with P
  const handleMarkTodayAllP = () => {
    const day = Math.min(today.getDate(), totalDaysInMonth);
    const dateStr = formatDateStr(day);
    const newMap = { ...attendanceMap };
    for (const emp of filteredEmployees) {
      const trade = getEmployeeTrade(emp);
      const existing = newMap[`${emp.employee_id}_${dateStr}`];
      newMap[`${emp.employee_id}_${dateStr}`] = {
        employee_id: emp.employee_id,
        date: dateStr,
        status: 'P',
        code: 'P',
        trade,
        shift_hours: 8,
        ot_hours: existing ? existing.ot_hours || 0 : 0,
      };
    }
    setAttendanceMap(newMap);
    setHasUnsavedChanges(true);
  };

  // Save all attendance records to backend (which automatically syncs to Google Sheets)
  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveSuccessMsg(null);
    try {
      const itemsToSave: any[] = [];
      for (const [key, rec] of Object.entries(attendanceMap)) {
        if (rec && rec.employee_id && rec.date) {
          itemsToSave.push({
            employee_id: rec.employee_id,
            date: rec.date,
            status: rec.status || rec.code || 'P',
            trade: rec.trade || '',
            shift_hours: rec.shift_hours !== undefined ? rec.shift_hours : rec.status === 'P' ? 8 : 0,
            ot_hours: rec.ot_hours || 0,
            notes: rec.notes || '',
          });
        }
      }

      const res = await fetch('/api/hr/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave }),
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        setSaveSuccessMsg(`Attendance records saved and committed to Google Sheets! (${itemsToSave.length} records verified)`);
        if (triggerGoogleSheetsSync) {
          triggerGoogleSheetsSync();
        }
      } else {
        const err = await res.json();
        alert(`Error saving attendance: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Network error saving attendance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculate monthly stats per employee
  const getEmployeeMonthStats = (empId: string) => {
    let presentDays = 0;
    let absentDays = 0;
    let vacationDays = 0;
    let regularHours = 0;
    let otHours = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const cell = getCellAttendance(empId, day);
      if (cell.status === 'P') {
        presentDays++;
        regularHours += 8;
      } else if (cell.status === 'A') {
        absentDays++;
      } else if (cell.status === 'V') {
        vacationDays++;
        regularHours += 8; // Vacation credited hours per UAE standard
      }
      otHours += cell.ot;
    }

    const totalPaidHours = regularHours + otHours;
    return {
      presentDays,
      absentDays,
      vacationDays,
      regularHours,
      otHours,
      totalPaidHours,
    };
  };

  // Global Company Month Stats
  const globalStats = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalVacation = 0;
    let totalShiftHrs = 0;
    let totalOtHrs = 0;

    for (const emp of filteredEmployees) {
      const s = getEmployeeMonthStats(emp.employee_id);
      totalPresent += s.presentDays;
      totalAbsent += s.absentDays;
      totalVacation += s.vacationDays;
      totalShiftHrs += s.regularHours;
      totalOtHrs += s.otHours;
    }

    const totalDaysLogged = totalPresent + totalAbsent + totalVacation;
    const attendanceRate = totalDaysLogged > 0 ? Math.round((totalPresent / totalDaysLogged) * 100) : 0;

    return {
      totalPresent,
      totalAbsent,
      totalVacation,
      totalShiftHrs,
      totalOtHrs,
      attendanceRate,
    };
  }, [filteredEmployees, attendanceMap, totalDaysInMonth]);

  // Export 30-Day Attendance Sheet to CSV
  const handleExportCsv = () => {
    const headers = [
      'Emp No',
      'Employee Name',
      'Trade',
      'Department',
      ...Array.from({ length: totalDaysInMonth }, (_, i) => `Day ${i + 1}`),
      'Total P (Days)',
      'Total A (Days)',
      'Total V (Days)',
      'Normal Shift Hrs (8h)',
      'Total OT Hrs',
      'Total Gross Hrs',
    ];

    const rows = filteredEmployees.map((emp) => {
      const dept = departments.find((d) => d.department_id === emp.department_id);
      const trade = getEmployeeTrade(emp);
      const stats = getEmployeeMonthStats(emp.employee_id);

      const daysCols = Array.from({ length: totalDaysInMonth }, (_, i) => {
        const cell = getCellAttendance(emp.employee_id, i + 1);
        if (!cell.status) return '-';
        if (cell.ot > 0) return `${cell.status} (+${cell.ot}h OT)`;
        return cell.status;
      });

      return [
        emp.employee_no || '',
        `"${emp.full_name || ''}"`,
        `"${trade}"`,
        `"${dept?.name || ''}"`,
        ...daysCols,
        stats.presentDays,
        stats.absentDays,
        stats.vacationDays,
        stats.regularHours,
        stats.otHours,
        stats.totalPaidHours,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `CEMCON_Workforce_Attendance_${selectedYear}_${String(selectedMonth).padStart(2, '0')}_30Days.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print attendance sheet
  const handlePrint = () => {
    window.print();
  };

  // Month names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. MODULE BANNER / HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
              STANDARD SHIFT: 8.0 HOURS
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono text-[10px] font-bold">
              30 DAYS PERIOD
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono text-[10px] font-bold">
              GOOGLE SHEETS SYNC
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-emerald-400" />
            Workforce Monthly Attendance & Overtime Sheet
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Standard industrial muster roll for registered workforce. Single-click marking with status codes{' '}
            <strong className="text-emerald-400 font-mono">P (Present, 8h)</strong>,{' '}
            <strong className="text-rose-400 font-mono">A (Absent, 0h)</strong>, and{' '}
            <strong className="text-indigo-400 font-mono">V (Vacation)</strong>. Complete Trade and Overtime (OT) man-hour accounting with Google Sheets persistence.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="no-print flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              // Initialize daily marks for modal
              const dateStr = dailyModalDate;
              const marks: any = {};
              for (const emp of employees) {
                const rec = attendanceMap[`${emp.employee_id}_${dateStr}`];
                marks[emp.employee_id] = {
                  status: (rec?.status as any) || 'P',
                  ot: rec?.ot_hours || 0,
                  trade: getEmployeeTrade(emp),
                };
              }
              setDailyMarks(marks);
              setIsDailyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Calendar className="h-4 w-4" />
            Mark Daily Attendance
          </button>

          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
            title="Pre-fills all 30 days with P (8.0 Hours) for filtered employees"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Fill 30 Days (P)
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shadow-md transition ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving to Sheets...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Attendance'}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Download className="h-4 w-4 text-blue-400" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Printer className="h-4 w-4 text-slate-400" />
            Print Muster Roll
          </button>

          {onOpenSalary && (
            <button
              onClick={onOpenSalary}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition"
              title="Calculate monthly salary from this attendance sheet"
            >
              <Banknote className="h-4 w-4 text-blue-400" />
              Salary & Payroll Module →
            </button>
          )}
        </div>
      </div>

      {/* SUCCESS / UNSAVED ALERT BANNER */}
      {saveSuccessMsg && (
        <div className="no-print p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-slate-400 hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Workforce</div>
          <div className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            {filteredEmployees.length} Personnel
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active registered staff</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Shift Model</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-emerald-400" />
            8.0 Hours
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5 font-mono">Normal Shift Duration</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Present (P) Logs</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {globalStats.totalPresent} Days
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rate: {globalStats.attendanceRate}%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Absent (A) Logs</div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {globalStats.totalAbsent} Days
          </div>
          <div className="text-[10px] text-rose-400/70 mt-0.5 font-mono">0.0 Shift Hours</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Vacation (V) Logs</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">
            {globalStats.totalVacation} Days
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Approved annual leave</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Overtime (OT)</div>
          <div className="text-xl font-bold text-amber-400 mt-1 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-400" />
            {globalStats.totalOtHrs.toFixed(1)} Hrs
          </div>
          <div className="text-[10px] text-amber-400/80 mt-0.5 font-mono">Payable OT Hours</div>
        </div>
      </div>

      {/* 3. CONTROL BAR: PERIOD & FILTER CONTROLS */}
      <div className="no-print p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 font-semibold focus:ring-1 focus:ring-blue-500"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 font-semibold focus:ring-1 focus:ring-blue-500"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Days In Month (Standard 30 Days) */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-slate-400 font-medium">Days in Period:</span>
            <select
              value={totalDaysInMonth}
              onChange={(e) => setTotalDaysInMonth(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold rounded-lg px-2 py-1.5"
            >
              <option value={30}>30 Days (Standard Commercial Month)</option>
              <option value={31}>31 Days</option>
              <option value={28}>28 Days</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-slate-400 font-medium">Department:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5"
            >
              <option value="ALL">All Departments ({employees.length})</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, trade, emp no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4. CODE LEGEND & INSTRUCTIONS */}
      <div className="no-print p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Attendance Codes:</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              P
            </span>
            <span className="text-slate-300">
              <strong>Present</strong> (8.0 Hours Shift)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30">
              A
            </span>
            <span className="text-slate-300">
              <strong>Absent</strong> (0.0 Hours)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              V
            </span>
            <span className="text-slate-300">
              <strong>Vacation</strong> (Approved Leave)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              +OT
            </span>
            <span className="text-slate-300">
              <strong>Overtime</strong> (Additional Hours)
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
          <span>Click any cell to cycle <strong>P → A → V</strong>. Right-click or click OT badge to edit overtime.</span>
        </div>
      </div>

      {/* PRINT HEADER ONLY (FOR OFFICIAL MUSTER ROLL) */}
      <div className="hidden print:block text-slate-900 mb-4 p-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">CEMCON MECHANICAL ENGINEERING LLC</h1>
            <h2 className="text-base font-semibold">WORKFORCE MONTHLY ATTENDANCE MUSTER ROLL (30 DAYS)</h2>
            <p className="text-xs">
              Period: {monthNames[selectedMonth - 1]} {selectedYear} • Standard Normal Shift: 8.0 Hours
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-mono">Document No: CEMCON-HR-ATT-30D</p>
            <p className="font-mono">Rev: 04 • ISO 9001:2015 Compliant</p>
            <p>Printed on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* 5. THE 30-DAY ATTENDANCE ROSTER GRID */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 sticky top-0 z-20">
              <tr>
                {/* Fixed Columns */}
                <th className="py-3 px-2 font-mono text-[10px] text-slate-500 w-10 text-center border-r border-slate-800">
                  #
                </th>
                <th className="py-3 px-3 font-semibold text-white w-24 border-r border-slate-800">
                  Emp No
                </th>
                <th className="py-3 px-3 font-semibold text-white w-48 border-r border-slate-800">
                  Employee Name
                </th>
                <th className="py-3 px-3 font-semibold text-blue-300 w-36 border-r border-slate-800 bg-blue-950/20">
                  Trade / Skill
                </th>

                {/* 30 Calendar Days Columns */}
                {Array.from({ length: totalDaysInMonth }, (_, i) => {
                  const dayNum = i + 1;
                  const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const isWeekend = dateObj.getDay() === 0; // Sunday weekend

                  return (
                    <th
                      key={dayNum}
                      className={`py-2 px-1 text-center font-mono w-9 border-r border-slate-800/80 ${
                        isWeekend ? 'bg-slate-900/80 text-amber-400' : 'bg-slate-950 text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{dayNum}</div>
                      <div className="text-[9px] text-slate-500 uppercase">{dayName}</div>
                    </th>
                  );
                })}

                {/* Summary Totals Columns */}
                <th className="py-3 px-2.5 font-bold text-center text-emerald-400 bg-emerald-950/20 border-r border-slate-800">
                  P
                </th>
                <th className="py-3 px-2.5 font-bold text-center text-rose-400 bg-rose-950/20 border-r border-slate-800">
                  A
                </th>
                <th className="py-3 px-2.5 font-bold text-center text-indigo-400 bg-indigo-950/20 border-r border-slate-800">
                  V
                </th>
                <th className="py-3 px-2.5 font-bold text-center text-slate-200 border-r border-slate-800">
                  Shift Hrs (8h)
                </th>
                <th className="py-3 px-2.5 font-bold text-center text-amber-400 bg-amber-950/20 border-r border-slate-800">
                  OT Hrs
                </th>
                <th className="py-3 px-3 font-bold text-center text-emerald-300 bg-slate-950">
                  Gross Hrs
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalDaysInMonth + 10}
                    className="py-12 text-center text-slate-500 font-medium"
                  >
                    No personnel found matching your filters. Register employees under "Departments & HR" first.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, empIdx) => {
                  const trade = getEmployeeTrade(emp);
                  const stats = getEmployeeMonthStats(emp.employee_id);

                  return (
                    <tr
                      key={emp.employee_id}
                      className="hover:bg-slate-850/60 transition group"
                    >
                      {/* # Index */}
                      <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500 text-center border-r border-slate-800/80">
                        {empIdx + 1}
                      </td>

                      {/* Emp No */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200 border-r border-slate-800/80 whitespace-nowrap">
                        {emp.employee_no || `CEM-${String(empIdx + 1).padStart(3, '0')}`}
                      </td>

                      {/* Employee Name */}
                      <td className="py-2.5 px-3 font-semibold text-white border-r border-slate-800/80 whitespace-nowrap">
                        <div className="flex items-center justify-between">
                          <span>{emp.full_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono ml-2">
                            {departments.find((d) => d.department_id === emp.department_id)?.code || ''}
                          </span>
                        </div>
                      </td>

                      {/* Trade Column */}
                      <td className="py-2.5 px-3 border-r border-slate-800/80 bg-blue-950/10 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Wrench className="h-3 w-3 text-blue-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={trade}
                            onChange={(e) => {
                              setCustomTrades({
                                ...customTrades,
                                [emp.employee_id]: e.target.value,
                              });
                              setHasUnsavedChanges(true);
                            }}
                            className="bg-transparent border-0 hover:bg-slate-850 focus:bg-slate-800 text-blue-300 font-medium text-xs rounded px-1 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter Trade"
                          />
                        </div>
                      </td>

                      {/* 30 Days Cells */}
                      {Array.from({ length: totalDaysInMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const cell = getCellAttendance(emp.employee_id, dayNum);

                        let badgeClasses = 'bg-slate-800/40 text-slate-500 border-slate-800';
                        if (cell.status === 'P') {
                          badgeClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30';
                        } else if (cell.status === 'A') {
                          badgeClasses = 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30';
                        } else if (cell.status === 'V') {
                          badgeClasses = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30';
                        }

                        return (
                          <td
                            key={dayNum}
                            onClick={() => handleCellClick(emp.employee_id, dayNum)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setActiveCellEdit({
                                empId: emp.employee_id,
                                dayNum,
                                currentStatus: cell.status || 'P',
                                currentOt: cell.ot,
                              });
                            }}
                            className="p-1 text-center border-r border-slate-800/60 cursor-pointer select-none transition"
                            title={`Day ${dayNum}: ${cell.status ? `${cell.status} (${cell.status === 'P' ? '8h' : '0h'})` : 'Click to mark'}. Right-click to set OT.`}
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span
                                className={`h-6 w-6 rounded font-mono font-bold text-xs flex items-center justify-center border transition ${badgeClasses}`}
                              >
                                {cell.status || '-'}
                              </span>
                              {cell.ot > 0 && (
                                <span className="text-[9px] font-mono text-amber-400 font-bold leading-none mt-0.5">
                                  +{cell.ot}h
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* P Total */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-emerald-400 bg-emerald-950/10 border-r border-slate-800/80">
                        {stats.presentDays}
                      </td>

                      {/* A Total */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-rose-400 bg-rose-950/10 border-r border-slate-800/80">
                        {stats.absentDays}
                      </td>

                      {/* V Total */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-indigo-400 bg-indigo-950/10 border-r border-slate-800/80">
                        {stats.vacationDays}
                      </td>

                      {/* Shift Hrs (8h per Present) */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-200 border-r border-slate-800/80">
                        {stats.regularHours}h
                      </td>

                      {/* Total OT Hrs */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-amber-400 bg-amber-950/10 border-r border-slate-800/80">
                        {stats.otHours > 0 ? `${stats.otHours.toFixed(1)}h` : '—'}
                      </td>

                      {/* Gross Paid Hours */}
                      <td className="py-2 px-3 text-center font-mono font-bold text-emerald-300 bg-slate-950">
                        {stats.totalPaidHours.toFixed(1)}h
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Column Summary */}
            <tfoot className="bg-slate-950 font-mono font-bold text-xs border-t-2 border-slate-800 text-slate-300">
              <tr>
                <td colSpan={4} className="py-3 px-3 text-right text-slate-400 border-r border-slate-800 uppercase text-[10px]">
                  Total Monthly Aggregates:
                </td>
                {/* 30 Day columns bottom totals */}
                {Array.from({ length: totalDaysInMonth }, (_, i) => {
                  const dayNum = i + 1;
                  let dayPCount = 0;
                  for (const emp of filteredEmployees) {
                    if (getCellAttendance(emp.employee_id, dayNum).status === 'P') {
                      dayPCount++;
                    }
                  }
                  return (
                    <td
                      key={dayNum}
                      className="py-2 px-1 text-center border-r border-slate-800 text-[10px] text-emerald-400/90"
                    >
                      {dayPCount || '—'}
                    </td>
                  );
                })}
                <td className="py-3 px-2 text-center text-emerald-400 border-r border-slate-800">
                  {globalStats.totalPresent}
                </td>
                <td className="py-3 px-2 text-center text-rose-400 border-r border-slate-800">
                  {globalStats.totalAbsent}
                </td>
                <td className="py-3 px-2 text-center text-indigo-400 border-r border-slate-800">
                  {globalStats.totalVacation}
                </td>
                <td className="py-3 px-2 text-center text-white border-r border-slate-800">
                  {globalStats.totalShiftHrs}h
                </td>
                <td className="py-3 px-2 text-center text-amber-400 border-r border-slate-800">
                  {globalStats.totalOtHrs.toFixed(1)}h
                </td>
                <td className="py-3 px-3 text-center text-emerald-300">
                  {(globalStats.totalShiftHrs + globalStats.totalOtHrs).toFixed(1)}h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PRINT FOOTER SIGNATURES */}
      <div className="hidden print:grid grid-cols-3 gap-8 mt-12 pt-8 text-xs text-slate-900 border-t border-slate-400">
        <div className="space-y-8">
          <div>
            <p className="font-bold">Prepared by (Timekeeper / HR Officer):</p>
            <p className="mt-8 border-b border-slate-400 w-48"></p>
            <p className="text-[10px] text-slate-600 mt-1">Signature & Date</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <p className="font-bold">Verified by (Workshop Foreman / Engineer):</p>
            <p className="mt-8 border-b border-slate-400 w-48"></p>
            <p className="text-[10px] text-slate-600 mt-1">Signature & Date</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <p className="font-bold">Approved by (HR Director / GM):</p>
            <p className="mt-8 border-b border-slate-400 w-48"></p>
            <p className="text-[10px] text-slate-600 mt-1">Signature & Date</p>
          </div>
        </div>
      </div>

      {/* 6. MODAL: MARK DAILY ATTENDANCE (RAPID ENTRY) */}
      {isDailyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  Mark Daily Workforce Attendance & Overtime
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shift: 8.0 Hours Standard • P = Present, A = Absent, V = Vacation
                </p>
              </div>
              <button
                onClick={() => setIsDailyModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Date Picker & Quick Fill */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-semibold">Attendance Date:</span>
                <input
                  type="date"
                  value={dailyModalDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setDailyModalDate(newDate);
                    // Reload marks for this date
                    const marks: any = {};
                    for (const emp of employees) {
                      const rec = attendanceMap[`${emp.employee_id}_${newDate}`];
                      marks[emp.employee_id] = {
                        status: (rec?.status as any) || 'P',
                        ot: rec?.ot_hours || 0,
                        trade: getEmployeeTrade(emp),
                      };
                    }
                    setDailyMarks(marks);
                  }}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...dailyMarks };
                    for (const emp of employees) {
                      updated[emp.employee_id] = {
                        ...(updated[emp.employee_id] || {}),
                        status: 'P',
                        ot: updated[emp.employee_id]?.ot || 0,
                        trade: getEmployeeTrade(emp),
                      };
                    }
                    setDailyMarks(updated);
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 font-semibold text-xs"
                >
                  Set All Present (P)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...dailyMarks };
                    for (const emp of employees) {
                      updated[emp.employee_id] = {
                        ...(updated[emp.employee_id] || {}),
                        status: 'A',
                        ot: 0,
                        trade: getEmployeeTrade(emp),
                      };
                    }
                    setDailyMarks(updated);
                  }}
                  className="px-2.5 py-1 rounded bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-semibold text-xs"
                >
                  Set All Absent (A)
                </button>
              </div>
            </div>

            {/* Employee Daily Table */}
            <div className="overflow-x-auto max-h-[50vh] border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 sticky top-0 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Emp No</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3 text-blue-300">Trade</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Shift Hours</th>
                    <th className="py-2.5 px-3 text-center text-amber-300">OT (Hours)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {employees.map((emp) => {
                    const mark = dailyMarks[emp.employee_id] || {
                      status: 'P',
                      ot: 0,
                      trade: getEmployeeTrade(emp),
                    };

                    return (
                      <tr key={emp.employee_id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-300">
                          {emp.employee_no}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {emp.full_name}
                        </td>
                        <td className="py-2.5 px-3 text-blue-300 font-medium">
                          <input
                            type="text"
                            value={mark.trade}
                            onChange={(e) => {
                              setDailyMarks({
                                ...dailyMarks,
                                [emp.employee_id]: {
                                  ...mark,
                                  trade: e.target.value,
                                },
                              });
                            }}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-36"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex rounded-lg p-0.5 bg-slate-950 border border-slate-800">
                            {(['P', 'A', 'V'] as const).map((code) => {
                              const isActive = mark.status === code;
                              let activeClass = 'bg-emerald-600 text-white';
                              if (code === 'A') activeClass = 'bg-rose-600 text-white';
                              if (code === 'V') activeClass = 'bg-indigo-600 text-white';

                              return (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => {
                                    setDailyMarks({
                                      ...dailyMarks,
                                      [emp.employee_id]: {
                                        ...mark,
                                        status: code,
                                      },
                                    });
                                  }}
                                  className={`px-3 py-1 text-xs font-mono font-bold rounded transition ${
                                    isActive ? activeClass : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {code}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                          {mark.status === 'P' ? '8.0h' : mark.status === 'V' ? '8.0h' : '0.0h'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="16"
                            step="0.5"
                            value={mark.ot}
                            onChange={(e) => {
                              setDailyMarks({
                                ...dailyMarks,
                                [emp.employee_id]: {
                                  ...mark,
                                  ot: Math.max(0, parseFloat(e.target.value) || 0),
                                },
                              });
                            }}
                            className="w-16 bg-slate-800 border border-slate-700 text-amber-300 font-mono text-center rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-amber-500"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Date: <strong className="text-white font-mono">{dailyModalDate}</strong> ({employees.length} employees)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDailyModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Apply dailyMarks to attendanceMap and save
                    const dateStr = dailyModalDate;
                    const itemsToSave: any[] = [];
                    const newMap = { ...attendanceMap };

                    for (const emp of employees) {
                      const mark = dailyMarks[emp.employee_id] || {
                        status: 'P',
                        ot: 0,
                        trade: getEmployeeTrade(emp),
                      };
                      const record: AttendanceRecord = {
                        employee_id: emp.employee_id,
                        date: dateStr,
                        status: mark.status,
                        code: mark.status,
                        trade: mark.trade,
                        shift_hours: mark.status === 'P' ? 8 : mark.status === 'V' ? 8 : 0,
                        ot_hours: mark.ot,
                      };
                      newMap[`${emp.employee_id}_${dateStr}`] = record;
                      itemsToSave.push(record);
                    }

                    setAttendanceMap(newMap);
                    setHasUnsavedChanges(true);
                    setIsDailyModalOpen(false);

                    // Auto-commit to server
                    try {
                      setSaving(true);
                      const res = await fetch('/api/hr/attendance/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: itemsToSave }),
                      });
                      if (res.ok) {
                        setHasUnsavedChanges(false);
                        setSaveSuccessMsg(`Attendance for ${dateStr} saved and synced to Google Sheets!`);
                        if (triggerGoogleSheetsSync) triggerGoogleSheetsSync();
                      }
                    } catch (e: any) {
                      console.error('Error auto-saving daily attendance:', e);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  Save & Apply Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CELL OVERTIME (OT) QUICK EDIT POPOVER */}
      {activeCellEdit && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-80 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Day {activeCellEdit.dayNum} Attendance & OT
              </h4>
              <button
                onClick={() => setActiveCellEdit(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Status Code:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'P', label: 'Present (8h)', color: 'bg-emerald-600' },
                    { code: 'A', label: 'Absent (0h)', color: 'bg-rose-600' },
                    { code: 'V', label: 'Vacation', color: 'bg-indigo-600' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() =>
                        setActiveCellEdit({
                          ...activeCellEdit,
                          currentStatus: item.code as any,
                        })
                      }
                      className={`py-2 px-2 rounded-lg font-bold text-center border transition ${
                        activeCellEdit.currentStatus === item.code
                          ? `${item.color} text-white border-white/40`
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <div className="font-mono text-sm">{item.code}</div>
                      <div className="text-[9px] font-normal">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Overtime (OT Hours):</label>
                <input
                  type="number"
                  min="0"
                  max="16"
                  step="0.5"
                  value={activeCellEdit.currentOt}
                  onChange={(e) =>
                    setActiveCellEdit({
                      ...activeCellEdit,
                      currentOt: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:ring-1 focus:ring-amber-500"
                  placeholder="0.0"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Additional overtime beyond the standard 8-hour shift.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveCellEdit(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const day = activeCellEdit.dayNum;
                  const dateStr = formatDateStr(day);
                  const emp = employees.find((e) => e.employee_id === activeCellEdit.empId);
                  const trade = emp ? getEmployeeTrade(emp) : '';

                  setAttendanceMap((prev) => ({
                    ...prev,
                    [`${activeCellEdit.empId}_${dateStr}`]: {
                      employee_id: activeCellEdit.empId,
                      date: dateStr,
                      status: activeCellEdit.currentStatus,
                      code: activeCellEdit.currentStatus,
                      trade,
                      shift_hours: activeCellEdit.currentStatus === 'P' ? 8 : activeCellEdit.currentStatus === 'V' ? 8 : 0,
                      ot_hours: activeCellEdit.currentOt,
                    },
                  }));
                  setHasUnsavedChanges(true);
                  setActiveCellEdit(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
