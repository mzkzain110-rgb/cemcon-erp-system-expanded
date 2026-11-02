import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileDown,
  Printer,
  ChevronRight,
  RefreshCw,
  Mail,
  Phone,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  ClipboardList,
  Compass,
  FileSignature,
  Edit,
  DollarSign,
  Wrench,
  UserX,
  ExternalLink,
} from 'lucide-react';
import { HRPrintableForms } from './HRPrintableForms';
import { DocumentExpiryModal, ExpiryItem } from './DocumentExpiryModal';

interface HRAdministrationModuleProps {
  session: any;
  departments: any[];
  employees: any[];
  onRefreshEmployees: () => void;
  triggerGoogleSheetsSync?: () => void;
  sheetsSyncing?: boolean;
}

export const HRAdministrationModule: React.FC<HRAdministrationModuleProps> = ({
  session,
  departments,
  employees,
  onRefreshEmployees,
  triggerGoogleSheetsSync,
  sheetsSyncing = false,
}) => {
  // Current active sub-module
  const [activeSubTab, setActiveSubTab] = useState<
    'menu_map' | 'employees' | 'recruitment' | 'insurance' | 'attendance' | 'offboarding' | 'forms' | 'reports' | 'fleet'
  >('menu_map');

  // Document Expiry Modal state
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);

  // Data states
  const [employeeDocs, setEmployeeDocs] = useState<any[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [recruitmentRequests, setRecruitmentRequests] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [clearanceForms, setClearanceForms] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [empStatusFilter, setEmpStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PROBATION' | 'ON_LEAVE' | 'TERMINATED'>('ALL');

  // Modals
  const [isRegisteringEmp, setIsRegisteringEmp] = useState(false);
  const [isAddingReq, setIsAddingReq] = useState(false);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isAddingInsurance, setIsAddingInsurance] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [isAddingFine, setIsAddingFine] = useState(false);
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
  const [isAddingClearance, setIsAddingClearance] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  // New Employee Form State
  const [newEmpNo, setNewEmpNo] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDesignation, setNewEmpDesignation] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpJoiningDate, setNewEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEmpPhoto, setNewEmpPhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // Load HR Data
  const fetchHRData = async () => {
    try {
      setLoading(true);
      const [
        docsRes,
        insRes,
        fleetRes,
        finesRes,
        maintRes,
        recruitRes,
        candRes,
        clearanceRes,
        attRes,
        timesheetRes,
      ] = await Promise.all([
        fetch('/api/hr/documents').then((r) => r.json()),
        fetch('/api/hr/insurance').then((r) => r.json()),
        fetch('/api/hr/fleet').then((r) => r.json()),
        fetch('/api/hr/fleet/fines').then((r) => r.json()),
        fetch('/api/hr/fleet/maintenance').then((r) => r.json()),
        fetch('/api/hr/recruitment').then((r) => r.json()),
        fetch('/api/hr/candidates').then((r) => r.json()),
        fetch('/api/hr/clearance').then((r) => r.json()),
        fetch('/api/hr/attendance').then((r) => r.json()),
        fetch('/api/hr/timesheets').then((r) => r.json()),
      ]);

      setEmployeeDocs(docsRes.data || []);
      setInsurancePolicies(insRes.data || []);
      setVehicles(fleetRes.data || []);
      setFines(finesRes.data || []);
      setMaintenanceLogs(maintRes.data || []);
      setRecruitmentRequests(recruitRes.data || []);
      setCandidates(candRes.data || []);
      setClearanceForms(clearanceRes.data || []);
      setAttendanceLogs(attRes.data || []);
      setTimesheets(timesheetRes.data || []);
    } catch (err) {
      console.error('Failed to load HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [session?.company?.company_id]);

  // Compute Expiry Items for Pop-up and Alerts
  const getExpiryItems = (): ExpiryItem[] => {
    const list: ExpiryItem[] = [];
    const today = new Date();

    // 1. Employee Documents
    employeeDocs.forEach((doc) => {
      const emp = employees.find((e) => e.employee_id === doc.employee_id);
      const expiry = new Date(doc.expiry_date);
      const diffTime = expiry.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      list.push({
        id: doc.doc_id,
        category: 'EMPLOYEE_DOC',
        title: emp?.full_name || 'Employee Document',
        subtitle: `${emp?.designation || 'Staff'} (${emp?.employee_no || ''})`,
        documentType: doc.doc_type,
        documentNumber: doc.doc_number,
        expiryDate: doc.expiry_date,
        daysRemaining,
        status: daysRemaining <= 0 ? 'EXPIRED' : daysRemaining <= 30 ? 'EXPIRING_SOON' : 'VALID',
      });
    });

    // 2. Vehicles Registration (Mulkiya)
    vehicles.forEach((veh) => {
      const expiry = new Date(veh.registration_expiry);
      const diffTime = expiry.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      list.push({
        id: veh.vehicle_id,
        category: 'VEHICLE_REG',
        title: `Vehicle Registration: ${veh.plate_number}`,
        subtitle: `${veh.make_model} (Driver: ${veh.driver_name || 'Unassigned'})`,
        documentType: 'MULKIYA (RTA)',
        documentNumber: veh.plate_number,
        expiryDate: veh.registration_expiry,
        daysRemaining,
        status: daysRemaining <= 0 ? 'EXPIRED' : daysRemaining <= 30 ? 'EXPIRING_SOON' : 'VALID',
      });
    });

    // 3. Corporate Insurance Policies
    insurancePolicies.forEach((ins) => {
      const expiry = new Date(ins.end_date);
      const diffTime = expiry.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      list.push({
        id: ins.policy_id,
        category: 'INSURANCE_POLICY',
        title: `Corporate Policy: ${ins.policy_type}`,
        subtitle: `${ins.provider_name} • Policy #${ins.policy_number}`,
        documentType: 'INSURANCE_POLICY',
        documentNumber: ins.policy_number,
        expiryDate: ins.end_date,
        daysRemaining,
        status: daysRemaining <= 0 ? 'EXPIRED' : daysRemaining <= 30 ? 'EXPIRING_SOON' : 'VALID',
      });
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const expiryItems = getExpiryItems();
  const urgentExpiries = expiryItems.filter((i) => i.daysRemaining <= 30);

  // Handler: Register New Employee
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpNo || !newEmpName || !newEmpDesignation || !newEmpDept || !newEmpEmail) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_no: newEmpNo,
          full_name: newEmpName,
          designation: newEmpDesignation,
          department_id: newEmpDept,
          email: newEmpEmail,
          phone: newEmpPhone,
          joining_date: newEmpJoiningDate,
          profile_photo: newEmpPhoto,
          status: 'ACTIVE',
        }),
      });

      if (res.ok) {
        setIsRegisteringEmp(false);
        setNewEmpNo('');
        setNewEmpName('');
        setNewEmpDesignation('');
        setNewEmpEmail('');
        setNewEmpPhone('');
        onRefreshEmployees();
      }
    } catch (err) {
      console.error('Failed to create employee:', err);
    }
  };

  // Handler: Offboarding - Mark employee as non-active and complete clearance
  const handleCompleteClearance = async (clearance: any) => {
    try {
      // 1. Update clearance record
      await fetch(`/api/hr/clearance/${clearance.clearance_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          it_cleared: true,
          accounts_cleared: true,
          store_cleared: true,
          admin_cleared: true,
          hr_cleared: true,
        }),
      });

      // 2. Change employee status to TERMINATED / NON-ACTIVE
      await fetch(`/api/employees/${clearance.employee_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'TERMINATED',
          cancellation_date: clearance.last_working_day || new Date().toISOString().split('T')[0],
        }),
      });

      fetchHRData();
      onRefreshEmployees();
    } catch (err) {
      console.error('Failed to complete clearance:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <span>{session?.company?.company_name || 'CEMCON Group'}</span>
            <ChevronRight className="h-3 w-3 text-slate-500" />
            <span className="text-white">HR & Administration Directorate</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <Users className="h-5 w-5 text-blue-400" /> HR & Administration Department
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full workforce lifecycle: Personnel files, recruitment, insurance, attendance & shifts, exit clearances, corporate forms, and fleet logistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Expiry Alert Button */}
          <button
            onClick={() => setIsExpiryModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
              urgentExpiries.length > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>Expiry Alerts</span>
            <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-amber-500/30 text-amber-200">
              {urgentExpiries.length}
            </span>
          </button>

          {triggerGoogleSheetsSync && (
            <button
              onClick={triggerGoogleSheetsSync}
              disabled={sheetsSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${sheetsSyncing ? 'animate-spin' : ''}`} />
              {sheetsSyncing ? 'Syncing...' : 'Sync to Sheets'}
            </button>
          )}

          <button
            onClick={() => setIsRegisteringEmp(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition"
          >
            <Plus className="h-4 w-4" /> Register Employee
          </button>
        </div>
      </div>

      {/* URGENT EXPIRY NOTIFICATION BANNER (if any) */}
      {urgentExpiries.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-amber-300">
                Action Required: {urgentExpiries.length} document(s) expiring within 30 days or already expired!
              </span>
              <span className="text-slate-400 ml-2">
                Includes {urgentExpiries.filter((i) => i.category === 'EMPLOYEE_DOC').length} employee documents and{' '}
                {urgentExpiries.filter((i) => i.category === 'VEHICLE_REG').length} fleet registrations.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsExpiryModalOpen(true)}
            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
          >
            Review & Renew <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* HR & ADMIN SUB-NAVIGATION TABS */}
      <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'menu_map', label: 'Menu Map', icon: Compass },
          { id: 'employees', label: 'Employees', icon: UserCheck, count: employees.length },
          { id: 'recruitment', label: 'Recruitment & Onboarding', icon: Briefcase, count: recruitmentRequests.length },
          { id: 'insurance', label: 'Insurance Policies', icon: ShieldCheck, count: insurancePolicies.length },
          { id: 'attendance', label: 'Attendance & Timesheets', icon: Clock },
          { id: 'offboarding', label: 'Offboarding & Clearance', icon: UserX, count: clearanceForms.length },
          { id: 'forms', label: 'HR Admin Forms (Print & PDF)', icon: FileSignature },
          { id: 'reports', label: 'Reports & Settings', icon: TrendingUp },
          { id: 'fleet', label: 'Vehicle & Fleet', icon: Truck, count: vehicles.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 1. SUB-VIEW: MENU MAP                                         */}
      {/* ============================================================ */}
      {activeSubTab === 'menu_map' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
              <Compass className="h-4 w-4" /> HR & Administration Architectural Blueprint
            </div>
            <h2 className="text-lg font-bold text-white">Department Menu Map & Operational Framework</h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-1">
              Interactive structural map connecting all sub-divisions of the Human Resources & General Administration Directorate.
              Click any module card below for instant navigation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Box 1 */}
            <div
              onClick={() => setActiveSubTab('employees')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 cursor-pointer transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 flex items-center justify-between">
                <span>1. Employees & Records</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Profile photos, joining & cancellation dates, passports, visas, Emirates IDs and automated expiry surveillance.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{employees.length} Personnel</span>
                <span className="text-emerald-400 font-bold">ACTIVE ROSTER</span>
              </div>
            </div>

            {/* Box 2 */}
            <div
              onClick={() => setActiveSubTab('recruitment')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 cursor-pointer transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 flex items-center justify-between">
                <span>2. Recruitment & Onboarding</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Manpower requests from departments, candidate pre-interview forms, technical evaluation ratings, and joining workflows.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{recruitmentRequests.length} Open Requisitions</span>
                <span className="text-indigo-400 font-bold">PIPELINE</span>
              </div>
            </div>

            {/* Box 3 */}
            <div
              onClick={() => setActiveSubTab('insurance')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 flex items-center justify-between">
                <span>3. Insurance Policies</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Medical health insurance, Workmen Compensation for fabrication yard, UAE Unemployment (ILOIS), and fleet coverage.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{insurancePolicies.length} Active Policies</span>
                <span className="text-emerald-400 font-bold">MOHRE / DHA</span>
              </div>
            </div>

            {/* Box 4 */}
            <div
              onClick={() => setActiveSubTab('attendance')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 cursor-pointer transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 flex items-center justify-between">
                <span>4. Attendance & Timesheets</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Daily clock-in logs, multi-shift scheduling (Morning, Evening, Night), overtime calculation, and job-wise project hours.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>3 Factory Shifts</span>
                <span className="text-amber-400 font-bold">LOGGED</span>
              </div>
            </div>

            {/* Box 5 */}
            <div
              onClick={() => setActiveSubTab('offboarding')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-850 cursor-pointer transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <UserX className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-300 flex items-center justify-between">
                <span>5. Offboarding & Clearance</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Resignation processing, 5-department clearance sign-off (IT, Accounts, Store, Admin, HR), and status change to Non-Active.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{clearanceForms.length} Clearance Files</span>
                <span className="text-rose-400 font-bold">WORKFLOW</span>
              </div>
            </div>

            {/* Box 6 */}
            <div
              onClick={() => setActiveSubTab('forms')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 cursor-pointer transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileSignature className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 flex items-center justify-between">
                <span>6. HR Admin Forms (Print & PDF)</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                6 official corporate forms with CEMCON header, ISO stamps, editable fields, and one-click Export as PDF and Print.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>6 Templates</span>
                <span className="text-cyan-400 font-bold">READY TO PRINT</span>
              </div>
            </div>

            {/* Box 7 */}
            <div
              onClick={() => setActiveSubTab('reports')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 cursor-pointer transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 flex items-center justify-between">
                <span>7. Reports & Governance</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Active vs non-active workforce analytics, document expiry audits, department headcounts, and approval rules.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>ISO & Audit Logs</span>
                <span className="text-purple-400 font-bold">ANALYTICS</span>
              </div>
            </div>

            {/* Box 8 */}
            <div
              onClick={() => setActiveSubTab('fleet')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 cursor-pointer transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 flex items-center justify-between">
                <span>8. Vehicle & Fleet Logistics</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Fleet vehicles, Mulkiya registration & insurance dates, assigned drivers, traffic fine deductions, and garage servicing.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{vehicles.length} Vehicles</span>
                <span className="text-amber-400 font-bold">RTA TRACKED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. SUB-VIEW: EMPLOYEES                                        */}
      {/* ============================================================ */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search personnel, ID, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
                />
              </div>

              {/* Status Filter */}
              <select
                value={empStatusFilter}
                onChange={(e) => setEmpStatusFilter(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses ({employees.length})</option>
                <option value="ACTIVE">Active ({employees.filter((e) => e.status === 'ACTIVE').length})</option>
                <option value="PROBATION">Probation</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Non-Active / Cancelled ({employees.filter((e) => e.status === 'TERMINATED').length})</option>
              </select>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRegisteringEmp(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Register Employee</span>
              </button>
              <button
                onClick={() => setIsExpiryModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition"
              >
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Check Document Expiries ({employeeDocs.length})</span>
              </button>
            </div>
          </div>

          {/* Personnel Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Employee</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Contact Info</th>
                    <th className="py-3 px-4 font-semibold">Joining Date</th>
                    <th className="py-3 px-4 font-semibold">Cancellation Date</th>
                    <th className="py-3 px-4 font-semibold">Documents</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(() => {
                    const filtered = employees.filter((emp) => {
                      const matchesStatus =
                        empStatusFilter === 'ALL' ||
                        (empStatusFilter === 'TERMINATED' ? emp.status === 'TERMINATED' : emp.status === empStatusFilter);
                      const matchesDept = deptFilter === 'ALL' || emp.department_id === deptFilter;
                      const matchesSearch =
                        !searchQuery ||
                        emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.employee_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.email?.toLowerCase().includes(searchQuery.toLowerCase());
                      return matchesStatus && matchesDept && matchesSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <UserCheck className="h-8 w-8 text-slate-600" />
                              <p className="text-sm font-semibold text-slate-400">No personnel registered yet</p>
                              <p className="text-xs text-slate-500">Click &quot;Register Employee&quot; above to add company personnel.</p>
                              <button
                                onClick={() => setIsRegisteringEmp(true)}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                              >
                                <Plus className="h-3.5 w-3.5" /> Register First Employee
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((emp) => {
                      const dept = departments.find((d) => d.department_id === emp.department_id);
                      const docs = employeeDocs.filter((d) => d.employee_id === emp.employee_id);
                      const hasExpiredDoc = docs.some((d) => d.status === 'EXPIRED');
                      const hasSoonDoc = docs.some((d) => d.status === 'EXPIRING_SOON');

                      return (
                        <tr key={emp.employee_id} className="hover:bg-slate-800/40 transition">
                          {/* Photo & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  emp.profile_photo ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=1e293b&color=94a3b8`
                                }
                                alt={emp.full_name}
                                className="h-9 w-9 rounded-full object-cover border border-slate-700 bg-slate-800 flex-shrink-0"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{emp.full_name}</span>
                                  {emp.status === 'TERMINATED' && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                      CANCELLED
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">{emp.designation}</div>
                                <div className="font-mono text-[10px] text-blue-400 font-semibold">{emp.employee_no}</div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                              {dept ? dept.name : emp.department_id}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="text-slate-300 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <a href={`mailto:${emp.email}`} className="hover:text-blue-400">
                                {emp.email}
                              </a>
                            </div>
                            {emp.phone && (
                              <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" /> {emp.phone}
                              </div>
                            )}
                          </td>

                          {/* Joining Date */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                            {emp.joining_date || '—'}
                          </td>

                          {/* Cancellation Date */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {emp.cancellation_date ? (
                              <span className="text-rose-400 font-bold">{emp.cancellation_date}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Documents & Expiry Indicators */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {docs.length} Docs
                              </span>
                              {hasExpiredDoc && (
                                <span
                                  className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"
                                  title="Has Expired Documents"
                                />
                              )}
                              {hasSoonDoc && !hasExpiredDoc && (
                                <span
                                  className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"
                                  title="Document Expiring Soon"
                                />
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                emp.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : emp.status === 'TERMINATED'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. SUB-VIEW: RECRUITMENT & ONBOARDING                         */}
      {/* ============================================================ */}
      {activeSubTab === 'recruitment' && (
        <div className="space-y-6">
          {/* Manpower Requisitions from Departments */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-400" /> Inter-Departmental Manpower Requisitions
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Official staffing requests submitted from production, QA/QC, design, and other units to HR.
                </p>
              </div>

              <button
                onClick={() => setIsAddingReq(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" /> Submit Manpower Request
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Request ID</th>
                    <th className="py-2.5 px-3 font-semibold">Requesting Department</th>
                    <th className="py-2.5 px-3 font-semibold">Role Requested</th>
                    <th className="py-2.5 px-3 font-semibold">Headcount</th>
                    <th className="py-2.5 px-3 font-semibold">Job Type</th>
                    <th className="py-2.5 px-3 font-semibold">Target Date</th>
                    <th className="py-2.5 px-3 font-semibold">Justification</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {recruitmentRequests.map((req) => (
                    <tr key={req.request_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">{req.request_id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{req.department_name}</td>
                      <td className="py-2.5 px-3 text-slate-200">{req.designation_requested}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{req.quantity}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{req.job_type}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">{req.required_by_date}</td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={req.justification}>
                        {req.justification}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : req.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Candidate Pipeline & Interview Evaluation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400" /> Candidate Pipeline & Technical Interview Evaluations
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pre-interview candidate screening, technical rating scores, and joining offers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('forms')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <FileText className="h-3.5 w-3.5" /> Printable Evaluation Form
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {candidates.map((cand) => (
                <div key={cand.candidate_id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{cand.full_name}</h4>
                      <p className="text-xs text-blue-400 font-semibold">{cand.designation}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                        cand.interview_status === 'EVALUATED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : cand.interview_status === 'INTERVIEW_SCHEDULED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cand.interview_status}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div>Experience: <span className="text-slate-200 font-semibold">{cand.experience_years} Years</span></div>
                    <div>Expected Salary: <span className="font-mono text-emerald-400 font-bold">AED {cand.expected_salary?.toLocaleString()}</span></div>
                    <div>Notice Period: <span className="text-slate-300">{cand.notice_period}</span></div>
                    {cand.evaluation_score && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Technical Rating:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {cand.evaluation_score} / 100
                        </span>
                      </div>
                    )}
                    {cand.interview_notes && (
                      <p className="text-[10px] text-slate-400 italic bg-slate-900 p-2 rounded border border-slate-800 mt-2">
                        "{cand.interview_notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. SUB-VIEW: INSURANCE POLICIES                              */}
      {/* ============================================================ */}
      {activeSubTab === 'insurance' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Corporate Insurance & Statutory Compliance Policies
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Medical insurance (DHA/MOHRE direct billing), Workmen Compensation, and UAE Involuntary Loss of Employment Scheme (ILOIS).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insurancePolicies.map((pol) => {
              const expiry = new Date(pol.end_date);
              const daysRemaining = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysRemaining <= 30;

              return (
                <div key={pol.policy_id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {pol.policy_type}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1.5">{pol.provider_name}</h4>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">Policy #{pol.policy_number}</div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        isUrgent
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {pol.status || 'ACTIVE'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    {pol.coverage_summary}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Start Date</span>
                      <span className="font-mono text-slate-300">{pol.start_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">End Date</span>
                      <span className="font-mono font-bold text-white">{pol.end_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Validity</span>
                      <span className={`font-bold font-mono text-[11px] ${isUrgent ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {daysRemaining} Days left
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SUB-VIEW: ATTENDANCE & TIMESHEETS                          */}
      {/* ============================================================ */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          {/* Shifts Management Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Shift A: Morning Shift</span>
                <span className="font-mono text-[10px] text-blue-400">07:00 AM - 03:30 PM</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Primary fabrication & structural assembly operations.</p>
              <div className="mt-3 text-[10px] text-emerald-400 font-mono">Status: ACTIVE ON FLOOR</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Shift B: Evening Shift</span>
                <span className="font-mono text-[10px] text-indigo-400">03:30 PM - 12:00 AM</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Blasting, painting & surface coating curing cycles.</p>
              <div className="mt-3 text-[10px] text-slate-400 font-mono">Status: SCHEDULED</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Shift C: Night Maintenance</span>
                <span className="font-mono text-[10px] text-purple-400">12:00 AM - 08:30 AM</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Overhead crane preventive maintenance & tooling calibration.</p>
              <div className="mt-3 text-[10px] text-slate-400 font-mono">Status: ON CALL</div>
            </div>
          </div>

          {/* Daily Attendance Logs */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" /> Daily Factory & Office Attendance
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Biometric clock-in and attendance records.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Employee</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Check-in</th>
                    <th className="py-2.5 px-3 font-semibold">Check-out</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {attendanceLogs.map((att) => {
                    const emp = employees.find((e) => e.employee_id === att.employee_id);
                    return (
                      <tr key={att.attendance_id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {emp?.full_name || att.employee_id} ({emp?.employee_no || ''})
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{att.date}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-200">{att.check_in || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-200">{att.check_out || '—'}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                              att.status === 'PRESENT'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : att.status === 'LATE'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Job-wise Timesheets */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-400" /> Job-Wise Project Timesheet Hours
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Employee</th>
                    <th className="py-2.5 px-3 font-semibold">Job Order</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Hours Spent</th>
                    <th className="py-2.5 px-3 font-semibold">Task Description</th>
                    <th className="py-2.5 px-3 font-semibold">Billable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {timesheets.map((ts) => {
                    const emp = employees.find((e) => e.employee_id === ts.employee_id);
                    return (
                      <tr key={ts.timesheet_id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-semibold text-white">{emp?.full_name || ts.employee_id}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-blue-300 font-bold">{ts.job_id}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{ts.date}</td>
                        <td className="py-2.5 px-3 font-mono text-sm font-bold text-emerald-400">
                          {ts.hours_spent} hrs
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{ts.task_description}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {ts.billable ? 'YES (BILLABLE)' : 'NO'}
                          </span>
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

      {/* ============================================================ */}
      {/* 6. SUB-VIEW: OFFBOARDING & CLEARANCE                         */}
      {/* ============================================================ */}
      {activeSubTab === 'offboarding' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserX className="h-4 w-4 text-rose-400" /> Employee Resignation, Clearance & Status Transition
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Multi-department clearance verification across IT, Accounts, Store, Admin and HR before status change to Non-Active.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {clearanceForms.map((clr) => (
              <div key={clr.clearance_id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{clr.employee_name}</h4>
                      <span className="font-mono text-xs text-blue-300 font-semibold">({clr.designation})</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Dept: <span className="text-slate-200">{clr.department_name}</span> • Resigned:{' '}
                      <span className="font-mono text-slate-300">{clr.resignation_date}</span> • Last Working Day:{' '}
                      <span className="font-mono text-rose-400 font-bold">{clr.last_working_day}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                      clr.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {clr.status === 'COMPLETED' ? 'CLEARED & NON-ACTIVE' : 'IN PROGRESS'}
                  </span>
                </div>

                {/* 5 Department Checklist Badges */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div className={`p-2.5 rounded-lg border ${clr.it_cleared ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="font-bold">1. IT & Systems</div>
                    <div className="text-[10px] mt-0.5">{clr.it_cleared ? '✓ Cleared' : 'Pending'}</div>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${clr.accounts_cleared ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="font-bold">2. Accounts</div>
                    <div className="text-[10px] mt-0.5">{clr.accounts_cleared ? '✓ Cleared' : 'Pending'}</div>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${clr.store_cleared ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="font-bold">3. Stores / Tools</div>
                    <div className="text-[10px] mt-0.5">{clr.store_cleared ? '✓ Cleared' : 'Pending'}</div>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${clr.admin_cleared ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="font-bold">4. Admin & Camp</div>
                    <div className="text-[10px] mt-0.5">{clr.admin_cleared ? '✓ Cleared' : 'Pending'}</div>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${clr.hr_cleared ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="font-bold">5. HR / Labor</div>
                    <div className="text-[10px] mt-0.5">{clr.hr_cleared ? '✓ Cleared' : 'Pending'}</div>
                  </div>
                </div>

                {clr.handover_notes && (
                  <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded border border-slate-800">
                    Handover Notes: "{clr.handover_notes}"
                  </p>
                )}

                {clr.status !== 'COMPLETED' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleCompleteClearance(clr)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition"
                    >
                      Sign Off Final Clearance & Change Status to Non-Active
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. SUB-VIEW: HR ADMIN FORMS (PRINT & PDF)                    */}
      {/* ============================================================ */}
      {activeSubTab === 'forms' && (
        <HRPrintableForms
          companyName={session?.company?.company_name || 'Cemcon Mechanical Engineering LLC'}
          companyCode={session?.company?.company_code || 'CEMCON-MECH'}
          tenantName={session?.tenant?.tenant_name || 'CEMCON Group Holding'}
          employees={employees}
          departments={departments}
          companies={session?.companies}
        />
      )}

      {/* ============================================================ */}
      {/* 8. SUB-VIEW: REPORTS & SETTINGS                              */}
      {/* ============================================================ */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Employees</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {employees.filter((e) => e.status === 'ACTIVE').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Sponsored & On Payroll</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Non-Active / Cancelled</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {employees.filter((e) => e.status === 'TERMINATED').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Cleared & Archived</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Expiring / Expired Docs</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {urgentExpiries.length}
              </div>
              <div className="text-[11px] text-amber-300/80 mt-1">Requiring immediate renewal</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fleet Assets Monitored</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{vehicles.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Active commercial fleet</div>
            </div>
          </div>

          {/* Department Headcount Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" /> CEMCON 9 Departments Workforce Allocation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {departments.map((dept) => {
                const count = employees.filter((e) => e.department_id === dept.department_id).length;
                return (
                  <div key={dept.department_id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[10px] text-blue-400 font-bold">{dept.code}</div>
                      <div className="text-xs font-semibold text-white truncate">{dept.name}</div>
                    </div>
                    <span className="text-xs font-bold text-white font-mono bg-slate-800 px-2 py-1 rounded">
                      {count} Staff
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. SUB-VIEW: VEHICLE & FLEET                                 */}
      {/* ============================================================ */}
      {activeSubTab === 'fleet' && (
        <div className="space-y-6">
          {/* Vehicles List */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-400" /> Commercial Fleet Asset Registry
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Vehicles, registration (Mulkiya) dates, assigned drivers, and insurance tracking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((veh) => {
                const expiry = new Date(veh.registration_expiry);
                const daysRemaining = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysRemaining <= 30;

                return (
                  <div key={veh.vehicle_id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {veh.plate_number}
                          </span>
                          <span className="font-semibold text-white text-xs">{veh.make_model}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Type: <span className="text-slate-300">{veh.vehicle_type}</span> • Year:{' '}
                          <span className="text-slate-300">{veh.year}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {veh.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">Assigned Driver</span>
                        <span className="font-semibold text-slate-200">{veh.driver_name || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Registration (Mulkiya) Expiry</span>
                        <span className={`font-mono font-bold ${isUrgent ? 'text-rose-400' : 'text-slate-200'}`}>
                          {veh.registration_expiry} ({daysRemaining}d)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Fines */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-rose-400" /> Traffic Violations & Fines Register
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Fine Number</th>
                    <th className="py-2.5 px-3 font-semibold">Vehicle</th>
                    <th className="py-2.5 px-3 font-semibold">Driver</th>
                    <th className="py-2.5 px-3 font-semibold">Violation Date</th>
                    <th className="py-2.5 px-3 font-semibold">Amount (AED)</th>
                    <th className="py-2.5 px-3 font-semibold">Location & Reason</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {fines.map((fine) => (
                    <tr key={fine.fine_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-300">{fine.fine_number}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-amber-400">{fine.plate_number}</td>
                      <td className="py-2.5 px-3 text-white font-medium">{fine.driver_name}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{fine.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                        AED {Number(fine.amount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {fine.location} • <span className="text-slate-400">{fine.reason}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            fine.status === 'PAID' || fine.status === 'DEDUCTED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {fine.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance & Servicing */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-400" /> Fleet Maintenance, Servicing & Inspection Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Vehicle</th>
                    <th className="py-2.5 px-3 font-semibold">Service Date</th>
                    <th className="py-2.5 px-3 font-semibold">Service Description</th>
                    <th className="py-2.5 px-3 font-semibold">Odometer</th>
                    <th className="py-2.5 px-3 font-semibold">Garage / Vendor</th>
                    <th className="py-2.5 px-3 font-semibold">Cost (AED)</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {maintenanceLogs.map((m) => (
                    <tr key={m.maintenance_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{m.plate_number}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{m.date}</td>
                      <td className="py-2.5 px-3 text-white font-medium">{m.service_type}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                        {m.odometer_km?.toLocaleString()} KM
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{m.garage_vendor}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        AED {Number(m.cost).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            m.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT EXPIRY POP-UP MODAL */}
      <DocumentExpiryModal
        isOpen={isExpiryModalOpen}
        onClose={() => setIsExpiryModalOpen(false)}
        items={expiryItems}
        onRenew={(item) => {
          setIsExpiryModalOpen(false);
          setActiveSubTab(item.category === 'VEHICLE_REG' ? 'fleet' : 'employees');
        }}
      />

      {/* MODAL: REGISTER PERSONNEL */}
      {isRegisteringEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-400" /> Register Enterprise Personnel
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add personnel master data mapped to a CEMCON department and operating company.
            </p>

            <form onSubmit={handleRegisterEmployee} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Employee ID Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-1012"
                    value={newEmpNo}
                    onChange={(e) => setNewEmpNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Department *</label>
                  <select
                    required
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee Full Name"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Designation / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Welding Inspector"
                  value={newEmpDesignation}
                  onChange={(e) => setNewEmpDesignation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. qaiser.s@cemcon.ae"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+971-50-..."
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={newEmpJoiningDate}
                    onChange={(e) => setNewEmpJoiningDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Profile Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newEmpPhoto}
                    onChange={(e) => setNewEmpPhoto(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisteringEmp(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-sm"
                >
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
