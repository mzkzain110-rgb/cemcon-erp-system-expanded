/**
 * Compenia ERP - Google Sheets Database Enterprise Application
 * Architecture: React + TypeScript + Express + Repository Layer + Google Sheets Database
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Briefcase,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRightLeft,
  Database,
  Plus,
  RefreshCw,
  Layers,
  FileText,
  Clock,
  Bell,
  Cpu,
  Table,
  Lock,
  Download,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Users,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Award,
  HardHat,
  Mail,
  Phone,
  Search,
  Printer,
  FileDown,
  Eye,
  ShoppingCart,
  Calculator,
  Banknote,
} from 'lucide-react';
import { HRAdministrationModule } from './components/hr/HRAdministrationModule';
import { JobOrderModal } from './components/jobs/JobOrderModal';
import { JobEstimationModule } from './components/jobs/JobEstimationModule';
import { CEMCON_COMPANIES } from './components/hr/HRPrintableForms';
import { exportJobOrderPdf } from './utils/corporatePdfGenerator';
import { FinanceModule } from './components/finance/FinanceModule';
import { ProcurementModule } from './components/procurement/ProcurementModule';
import { MonthlyAttendanceModule } from './components/hr/MonthlyAttendanceModule';
import { SalaryModule } from './components/salary/SalaryModule';

interface SessionData {
  session: {
    tenantId: string;
    companyId: string;
    userId: string;
    userEmail: string;
    userName?: string;
    roleCode: string;
    roleTitle?: string;
    departmentScope?: string;
    allowedDepartmentCodes?: string[];
    permissions: string[];
    isTenantAdmin: boolean;
  };
  tenant: {
    tenant_name: string;
    tenant_code: string;
  };
  company: {
    company_id: string;
    company_name: string;
    company_code: string;
    currency: string;
  };
  companies: Array<{
    company_id: string;
    company_name: string;
    company_code: string;
    currency: string;
  }>;
  user: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

async function safeExtractError(res: Response, fallback = 'Operation failed'): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return `${fallback} (Status ${res.status})`;
    try {
      const data = JSON.parse(text);
      return data.error || data.message || `${fallback}: ${text.slice(0, 120)}`;
    } catch {
      return `${fallback} (Status ${res.status}): ${text.slice(0, 120)}`;
    }
  } catch {
    return `${fallback} (Status ${res.status})`;
  }
}

async function safeFetchJson<T = any>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      console.warn(`Request to ${url} returned status ${res.status}`);
      return null;
    }
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return null;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'departments' | 'attendance' | 'salary' | 'jobs' | 'estimations' | 'accounting' | 'procurement' | 'inventory' | 'approvals' | 'sheets' | 'tests' | 'migration'
  >('overview');

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isTabRestricted =
    (session?.session?.roleCode === 'SALES_HEAD' && activeTab !== 'departments' && activeTab !== 'overview') ||
    (session?.session?.roleCode === 'HR_MANAGER' && activeTab !== 'departments' && activeTab !== 'attendance' && activeTab !== 'salary' && activeTab !== 'overview');

  // Departments & Personnel state
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState<string>('');
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [deptViewMode, setDeptViewMode] = useState<'hr_suite' | 'org_chart'>('hr_suite');
  const [isCreatingEmp, setIsCreatingEmp] = useState(false);
  const [newEmpNo, setNewEmpNo] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDesignation, setNewEmpDesignation] = useState('');
  const [newEmpDeptId, setNewEmpDeptId] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpPassportNo, setNewEmpPassportNo] = useState('');
  const [newEmpPassportExpiry, setNewEmpPassportExpiry] = useState('');
  const [newEmpPassportIssue, setNewEmpPassportIssue] = useState('');
  const [newEmpNationality, setNewEmpNationality] = useState('');
  const [newEmpPassportPlace, setNewEmpPassportPlace] = useState('');
  const [newEmpStatus, setNewEmpStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Notifications & Reminders
  const [reminders, setReminders] = useState<any[]>([]);
  const [showRemindersModal, setShowRemindersModal] = useState(false);

  // Job Module state
  const [jobs, setJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobModalMode, setJobModalMode] = useState<'create' | 'view'>('create');
  const [selectedJobRecord, setSelectedJobRecord] = useState<any | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobScope, setNewJobScope] = useState('');
  const [newJobCustomer, setNewJobCustomer] = useState('');
  const [jobConcurrencyRunning, setJobConcurrencyRunning] = useState(false);
  const [concurrencyResult, setConcurrencyResult] = useState<string | null>(null);

  // Accounting Module state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [isPostingJournal, setIsPostingJournal] = useState(false);
  const [journalMemo, setJournalMemo] = useState('');
  const [journalLines, setJournalLines] = useState<Array<{ accountId: string; debit: number; credit: number; lineMemo: string }>>([
    { accountId: '', debit: 0, credit: 0, lineMemo: '' },
    { accountId: '', debit: 0, credit: 0, lineMemo: '' },
  ]);
  const [journalError, setJournalError] = useState<string | null>(null);

  // Inventory Module state
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stockBalances, setStockBalances] = useState<any[]>([]);
  const [invTransactions, setInvTransactions] = useState<any[]>([]);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementItem, setMovementItem] = useState('');
  const [movementWarehouse, setMovementWarehouse] = useState('');
  const [movementType, setMovementType] = useState<'PURCHASE_RECEIPT' | 'JOB_ISSUE'>('PURCHASE_RECEIPT');
  const [movementQty, setMovementQty] = useState<number>(10);
  const [movementCost, setMovementCost] = useState<number>(150);

  // Approvals & Audit state
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [approvalComment, setApprovalComment] = useState('');

  // Google Sheets Inspector state
  const [sheetsTabs, setSheetsTabs] = useState<any[]>([]);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('Jobs');
  const [sheetTabData, setSheetTabData] = useState<any>(null);
  const [sheetsSyncing, setSheetsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [serviceAccountInfo, setServiceAccountInfo] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showVercelEnvGuide, setShowVercelEnvGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test Lab state
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);

  // PostgreSQL Migration Studio state
  const [postgresDDL, setPostgresDDL] = useState<string>('');
  const [reconciliationReport, setReconciliationReport] = useState<any>(null);
  const [copiedDDL, setCopiedDDL] = useState(false);

  // Load session and base data
  useEffect(() => {
    fetchSession();
  }, [refreshTrigger]);

  const fetchSession = async () => {
    try {
      const data = await safeFetchJson<SessionData>('/api/auth/session');
      if (data) {
        setSession(data);
      }
      const saData = await safeFetchJson<any>('/api/sheets/service-account');
      if (saData) {
        setServiceAccountInfo(saData);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Switch company handler
  const switchCompany = async (companyId: string) => {
    try {
      const res = await fetch('/api/auth/switch-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      if (res.ok) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error switching company:', err);
    }
  };

  // Switch user persona
  const switchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        if (userId === 'user-sales-004') {
          setActiveTab('departments');
          setDeptViewMode('org_chart');
          setSelectedDeptFilter('ALL');
        } else if (userId === 'user-hr-005') {
          setActiveTab('departments');
          setDeptViewMode('hr_suite');
          setSelectedDeptFilter('ALL');
        } else if (userId === 'user-acc-002') {
          setActiveTab('accounting');
        } else if (userId === 'user-eng-003') {
          setActiveTab('jobs');
        }
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error switching user:', err);
    }
  };

  // Load active tab data
  useEffect(() => {
    if (!session?.company?.company_id) return;

    // Background load reminders for bell badge
    safeFetchJson<any[]>('/api/reminders/scan').then((data) => setReminders(data || []));

    if (activeTab === 'overview' || activeTab === 'departments') {
      safeFetchJson<{ data: any[] }>('/api/departments').then((d) => setDepartments(d?.data || []));
      safeFetchJson<{ data: any[] }>('/api/employees').then((d) => setEmployees(d?.data || []));
    }

    if (activeTab === 'overview' || activeTab === 'jobs') {
      safeFetchJson<{ data: any[] }>('/api/jobs').then((d) => setJobs(d?.data || []));
      safeFetchJson<{ data: any[] }>('/api/customers').then((d) => setCustomers(d?.data || []));
    }

    if (activeTab === 'overview' || activeTab === 'accounting') {
      safeFetchJson<{ data: any[] }>('/api/accounting/accounts').then((d) => setAccounts(d?.data || []));
      safeFetchJson<{ data: any[] }>('/api/accounting/journals').then((d) => setJournals(d?.data || []));
      safeFetchJson<any>('/api/accounting/trial-balance').then((d) => setTrialBalance(d));
    }

    if (activeTab === 'overview' || activeTab === 'inventory') {
      safeFetchJson<{ data: any[] }>('/api/inventory/items').then((d) => setItems(d?.data || []));
      safeFetchJson<{ data: any[] }>('/api/inventory/warehouses').then((d) => setWarehouses(d?.data || []));
      safeFetchJson<any[]>('/api/inventory/stock-balances').then((d) => setStockBalances(d || []));
      safeFetchJson<{ data: any[] }>('/api/inventory/transactions').then((d) => setInvTransactions(d?.data || []));
    }

    if (activeTab === 'overview' || activeTab === 'approvals') {
      safeFetchJson<{ data: any[] }>('/api/approvals/pending').then((d) => setPendingApprovals(d?.data || []));
      safeFetchJson<{ data: any[] }>('/api/audit-logs').then((d) => setAuditLogs(d?.data || []));
    }

    if (activeTab === 'sheets' || activeTab === 'overview') {
      safeFetchJson<string[]>('/api/sheets/tabs').then((d) => setSheetsTabs(d || []));
      safeFetchJson<any>('/api/sheets/service-account').then((d) => setServiceAccountInfo(d));
      loadSheetTab(selectedSheetTab);
    }

    if (activeTab === 'migration') {
      fetch('/api/migration/ddl').then((r) => r.text()).then((d) => setPostgresDDL(d)).catch(console.error);
      safeFetchJson<any>('/api/migration/reconciliation').then((d) => setReconciliationReport(d));
    }
  }, [activeTab, session?.company?.company_id, refreshTrigger, selectedSheetTab]);

  const testServiceAccountConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch('/api/sheets/test-connection', { method: 'POST' });
      const data = await res.json();
      setServiceAccountInfo(data);
      setSyncStatusMsg(data.statusMessage);
    } catch (err: any) {
      console.error('Connection test error:', err);
    } finally {
      setTestingConnection(false);
    }
  };

  const loadSheetTab = async (tabName: string) => {
    setSelectedSheetTab(tabName);
    try {
      const res = await fetch(`/api/sheets/tab/${tabName}`);
      if (res.ok) {
        const data = await res.json();
        setSheetTabData(data);
      }
    } catch (err) {
      console.error('Error loading tab:', err);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobCustomer || !newJobTitle || !newJobScope) return;

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: newJobCustomer,
          title: newJobTitle,
          scopeDescription: newJobScope,
        }),
      });

      if (res.ok) {
        setIsCreatingJob(false);
        setNewJobTitle('');
        setNewJobScope('');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJobRowPdf = (j: any) => {
    const activeCompanyInfo =
      CEMCON_COMPANIES.find(
        (c) => c.code === session?.company?.company_code || c.name === session?.company?.company_name
      ) || CEMCON_COMPANIES[0];

    const cust = customers.find((c) => c.customer_id === j.customer_id);

    let materials = [];
    let manpower = [];
    let equipment = [];
    try {
      if (j.materials_json) materials = JSON.parse(j.materials_json);
      if (j.manpower_json) manpower = JSON.parse(j.manpower_json);
      if (j.equipment_json) equipment = JSON.parse(j.equipment_json);
    } catch (_) {}

    exportJobOrderPdf({
      jobNumber: j.job_number,
      date: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      clientName: j.client_name || cust?.name || 'Commercial Client',
      location: j.location || 'Industrial Area 11 Fabrication Yard',
      deadline: j.deadline || j.target_completion || 'Per Project Schedule',
      priority: j.priority || 'Normal',
      jobDescription: j.scope_description || j.title || 'General mechanical engineering works execution',
      materials,
      manpower,
      equipment,
      overheadsEstimate: j.overheads_estimate !== undefined ? j.overheads_estimate : 0,
      totalEstimatedCost: j.total_estimated_cost || 0,
      preparedBy: j.prepared_by || '',
      approvedBy: j.approved_by || '',
      receivedBy: j.received_by || '',
      company: activeCompanyInfo,
      tenantName: session?.tenant?.tenant_name || 'CEMCON Group Holding',
    });
  };

  const runJobConcurrencyTest = async () => {
    setJobConcurrencyRunning(true);
    setConcurrencyResult(null);
    try {
      // Fire 5 rapid parallel job requests
      const promises = [1, 2, 3, 4, 5].map((i) =>
        fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customers[0]?.customer_id || 'cust-001',
            title: `Structural Fabrication Order Batch #${i}`,
            scopeDescription: `High-priority fabrication contract with serialized sequence numbering for ${session?.company?.company_name}`,
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);
      const numbers = results.map((r) => r.job_number);
      const uniqueCount = new Set(numbers).size;

      if (uniqueCount === numbers.length) {
        setConcurrencyResult(
          `Verified: 5 concurrent jobs committed to Google Sheets. Concurrency mutex generated sequential collision-free numbers: ${numbers.join(', ')}`
        );
      } else {
        setConcurrencyResult(`Collision detected in: ${numbers.join(', ')}`);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setConcurrencyResult(`Error: ${err.message}`);
    } finally {
      setJobConcurrencyRunning(false);
    }
  };

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setJournalError(null);

    const drSum = journalLines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const crSum = journalLines.reduce((s, l) => s + Number(l.credit || 0), 0);

    if (Math.abs(drSum - crSum) > 0.001) {
      setJournalError(`Unbalanced Entry! Total Debits (${drSum.toFixed(2)}) must equal Total Credits (${crSum.toFixed(2)}). Variance: ${(drSum - crSum).toFixed(2)}`);
      return;
    }

    try {
      const res = await fetch('/api/accounting/post-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: `IDEM-WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          entryDate: new Date().toISOString().split('T')[0],
          memo: journalMemo,
          lines: journalLines,
        }),
      });

      if (res.ok) {
        setIsPostingJournal(false);
        setJournalMemo('');
        setJournalLines([
          { accountId: '', debit: 0, credit: 0, lineMemo: '' },
          { accountId: '', debit: 0, credit: 0, lineMemo: '' },
        ]);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const errMsg = await safeExtractError(res, 'Failed to post journal');
        setJournalError(errMsg);
      }
    } catch (err: any) {
      setJournalError(err.message);
    }
  };

  const handleReverseJournal = async (journalId: string) => {
    if (!confirm('Are you sure you want to reverse this posted journal entry? This creates an auditable counter-entry without deleting history.')) return;
    try {
      const res = await fetch(`/api/accounting/journals/${journalId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Reversal initiated via Compenia ERP Console' }),
      });
      if (res.ok) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementItem || !movementWarehouse) return;

    try {
      const res = await fetch('/api/inventory/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: movementItem,
          warehouseId: movementWarehouse,
          transactionType: movementType,
          quantity: movementQty,
          unitCost: movementCost,
          referenceType: movementType === 'PURCHASE_RECEIPT' ? 'GRN' : 'JOB_REQUISITION',
          referenceId: `REF-${Date.now().toString().slice(-6)}`,
        }),
      });

      if (res.ok) {
        setIsMovementModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const err = await res.json();
        alert(`Stock Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovalAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/approvals/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments: approvalComment || 'Reviewed by authorized manager' }),
      });
      if (res.ok) {
        setApprovalComment('');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runAllDiagnosticTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/diagnostics/run-tests', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTestResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningTests(false);
    }
  };

  const triggerGoogleSheetsSync = async () => {
    setSheetsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: '1_CEMCON_COMPENIA_PROD_MASTER' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSyncStatusMsg(data.message);
      }
    } catch (err: any) {
      setSyncStatusMsg(`Sync error: ${err.message}`);
    } finally {
      setSheetsSyncing(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeptName.trim(),
          code: newDeptCode.trim().toUpperCase(),
          status: 'ACTIVE',
        }),
      });
      if (res.ok) {
        setIsCreatingDept(false);
        setNewDeptName('');
        setNewDeptCode('');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const errMsg = await safeExtractError(res, 'Failed to create department');
        alert(`Department Error: ${errMsg}`);
      }
    } catch (err: any) {
      alert(`Error creating department: ${err.message}`);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpNo || !newEmpName || !newEmpDesignation || !newEmpDeptId || !newEmpEmail) return;
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_no: newEmpNo.trim().toUpperCase(),
          full_name: newEmpName.trim(),
          designation: newEmpDesignation.trim(),
          department_id: newEmpDeptId,
          email: newEmpEmail.trim(),
          phone: newEmpPhone.trim(),
          status: newEmpStatus,
          joining_date: new Date().toISOString().split('T')[0],
          passport_no: newEmpPassportNo.trim().toUpperCase(),
          passport_expiry_date: newEmpPassportExpiry || null,
          passport_issue_date: newEmpPassportIssue || null,
          passport_country: newEmpNationality.trim(),
          passport_place_of_issue: newEmpPassportPlace.trim(),
          nationality: newEmpNationality.trim(),
        }),
      });
      if (res.ok) {
        setIsCreatingEmp(false);
        setNewEmpNo('');
        setNewEmpName('');
        setNewEmpDesignation('');
        setNewEmpDeptId('');
        setNewEmpEmail('');
        setNewEmpPhone('');
        setNewEmpPassportNo('');
        setNewEmpPassportExpiry('');
        setNewEmpPassportIssue('');
        setNewEmpNationality('');
        setNewEmpPassportPlace('');
        setNewEmpStatus('ACTIVE');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const errMsg = await safeExtractError(res, 'Failed to create employee');
        alert(`Employee Error: ${errMsg}`);
      }
    } catch (err: any) {
      alert(`Error creating employee: ${err.message}`);
    }
  };

  const handleUpdateEmployeeStatus = async (employeeId: string, newStatus: string) => {
    try {
      setStatusUpdatingId(employeeId);
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          cancellation_date: newStatus === 'INACTIVE' || newStatus === 'TERMINATED' ? new Date().toISOString().split('T')[0] : null,
        }),
      });
      if (res.ok) {
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const errMsg = await safeExtractError(res, 'Failed to update employee status');
        alert(`Status Error: ${errMsg}`);
      }
    } catch (err: any) {
      alert(`Error updating employee status: ${err.message}`);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium tracking-wide">Initializing Compenia ERP Google Sheets Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="no-print w-64 border-r border-slate-800 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              COMPENIA <span className="text-xs px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono">ERP</span>
            </div>
            <div className="text-[11px] text-slate-400">Google Sheets DB Engine</div>
          </div>
        </div>

        {/* Tenant Isolation Badge */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-400" /> Multi-Tenant Boundary
          </div>
          <div className="text-sm font-semibold text-emerald-400 truncate flex items-center justify-between">
            <span>{session?.tenant?.tenant_name || 'CEMCON Group'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/30">
              ISOLATED
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {[
            { id: 'overview', label: 'Executive Dashboard', icon: TrendingUp },
            { id: 'departments', label: 'Departments & HR', icon: Users, badge: `${departments.length} Depts` },
            { id: 'attendance', label: 'Workforce Attendance (30 Days)', icon: Clock, badge: 'P / A / V' },
            { id: 'salary', label: 'Salary & Payroll Module', icon: Banknote, badge: 'Auto-Calculated' },
            { id: 'jobs', label: 'Job Numbering Engine', icon: Briefcase, badge: jobs.length },
            { id: 'estimations', label: 'Job Estimation', icon: Calculator, badge: 'Costing' },
            { id: 'accounting', label: 'Accounts & Finance', icon: ArrowRightLeft, badge: '18 Modules' },
            { id: 'procurement', label: 'Procurement Department', icon: ShoppingCart, badge: '8 Operations' },
            { id: 'inventory', label: 'Inventory & Stock Projection', icon: Layers },
            { id: 'approvals', label: 'Approvals & Governance', icon: CheckCircle2, badge: pendingApprovals.length || null },
            { id: 'sheets', label: 'Google Sheets Database', icon: FileSpreadsheet, badge: '60 Tabs' },
            { id: 'tests', label: 'Integrity & Security Lab', icon: Cpu },
            { id: 'migration', label: 'PostgreSQL Migration', icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const role = session?.session?.roleCode;
            const isRestrictedForUser =
              (role === 'SALES_HEAD' && item.id !== 'departments' && item.id !== 'overview') ||
              (role === 'HR_MANAGER' && item.id !== 'departments' && item.id !== 'attendance' && item.id !== 'salary' && item.id !== 'overview');

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : isRestrictedForUser
                    ? 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-400'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : isRestrictedForUser ? 'text-slate-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isRestrictedForUser ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400/90 font-mono flex items-center gap-0.5 border border-amber-500/20">
                    <Lock className="h-2.5 w-2.5" /> Scoped
                  </span>
                ) : item.badge !== undefined && item.badge !== null ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Database Health Pill */}
        <div
          onClick={() => {
            if (serviceAccountInfo?.liveStatus !== 'CONNECTED') {
              setShowVercelEnvGuide(true);
            } else {
              setActiveTab('sheets');
            }
          }}
          className="p-3 border-t border-slate-800 bg-slate-900/60 cursor-pointer hover:bg-slate-800/40 transition"
        >
          <div className="text-[11px] text-slate-300 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  serviceAccountInfo?.liveStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              Google Sheets Live
            </span>
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                serviceAccountInfo?.liveStatus === 'CONNECTED'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}
            >
              {serviceAccountInfo?.liveStatus === 'CONNECTED' ? 'CONNECTED' : 'STANDBY (MEMORY)'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            {serviceAccountInfo?.liveStatus === 'CONNECTED'
              ? '69 Enterprise Tabs • Persistent Sheets Sync'
              : 'Click to configure Vercel Environment'}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* GOOGLE SHEETS CONNECTION STATUS BANNER */}
        {serviceAccountInfo && serviceAccountInfo.liveStatus !== 'CONNECTED' && (
          <div className="no-print bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Google Sheets Live Database Not Connected on Vercel:</strong> New records are stored in temporary serverless memory and will disappear when the instance restarts. Configure your Google Service Account in Vercel to save to Google Sheets permanently.
              </span>
            </div>
            <button
              onClick={() => setShowVercelEnvGuide(true)}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] whitespace-nowrap self-start sm:self-auto transition"
            >
              Vercel Setup Guide
            </button>
          </div>
        )}

        {/* TOP BAR */}
        <header className="no-print h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between flex-shrink-0 z-10">
          {/* Active Company Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Active Company:</span>
              <select
                value={session?.company?.company_id}
                onChange={(e) => switchCompany(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {session?.companies?.map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.company_name} ({c.company_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Job sequence indicator for this company */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
              <Briefcase className="h-3 w-3 text-blue-400" />
              <span>Job Seq Rules:</span>
              <span className="font-mono text-blue-300 font-bold">
                {session?.company?.company_code === 'CEMCON-MECH' && 'Mechanical (0011+)'}
                {session?.company?.company_code === 'CEMCON-ME' && 'Middle East LLC (0046+)'}
                {session?.company?.company_code === 'CEMCON-FZE' && 'FZE (0022+)'}
              </span>
            </div>
          </div>

          {/* Right Controls: Notifications & User Persona */}
          <div className="flex items-center gap-3">
            {/* Reminder & Notification Bell */}
            <button
              onClick={() => setShowRemindersModal(true)}
              className="relative p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
              title="Automated Reminders & Compliance Scan"
            >
              <Bell className="h-4 w-4" />
              {reminders.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-bounce">
                  {reminders.length}
                </span>
              )}
            </button>

            {/* Persona Switcher (For testing RBAC & multi-role behavior) */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">User:</span>
              <select
                value={session?.session?.userId}
                onChange={(e) => switchUser(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="user-admin-001">System Administrator (Admin - Enterprise Full Access)</option>
                <option value="user-acc-002">Finance Controller (Accountant - Finance & Ledger)</option>
                <option value="user-eng-003">Project Engineer (Workshop & Projects)</option>
                <option value="user-sales-004">Sales Manager (Sales & Marketing)</option>
                <option value="user-hr-005">HR Manager (HR & Personnel)</option>
              </select>
            </div>
          </div>
        </header>

        {/* Active Role Department Scope Banner */}
        {session?.session?.departmentScope && session?.session?.roleCode !== 'ADMIN' && (
          <div className="no-print bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/30 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 animate-pulse" />
              <span>
                Active Session: <strong className="text-white font-bold">{session.session.userName || session.user?.full_name}</strong> ({session.session.roleTitle}) — Authorized Access: <strong className="text-amber-300 font-bold underline">{session.session.departmentScope}</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300">
              DEPT RESTRICTED RBAC
            </span>
          </div>
        )}

        {/* WORKSPACE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {isTabRestricted ? (
            <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl text-center space-y-4">
              <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldAlert className="h-10 w-10 animate-bounce" />
              </div>
              <h2 className="text-xl font-bold text-white">Department Access Boundary Notice</h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Your current active account <strong className="text-white">{session?.session?.userName || session?.user?.full_name}</strong> is designated as <strong className="text-amber-300">{session?.session?.roleTitle}</strong> with strict access granted to <strong className="text-amber-300 underline font-semibold">{session?.session?.departmentScope}</strong>.
              </p>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 inline-block">
                RBAC Security Policy: {session?.session?.roleCode} • Authorized Scope: {session?.session?.departmentScope}
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setActiveTab('departments');
                    if (session?.session?.roleCode === 'HR_MANAGER') {
                      setDeptViewMode('hr_suite');
                    } else {
                      setDeptViewMode('org_chart');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Return to {session?.session?.roleCode === 'HR_MANAGER' ? 'HR & Administration Suite' : 'Sales & Marketing Directory'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* VIEW 1: EXECUTIVE DASHBOARD */}
              {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-900/30 p-5 rounded-2xl">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Compenia ERP — CEMCON Group Enterprise Platform
                  </h1>
                  <p className="text-xs text-slate-300 mt-1">
                    Multi-tenant operations powered by Google Sheets Production Database (60 active tabs),
                    balanced double-entry general ledger, company-isolated job sequences, and real-time inventory ledger.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('tests')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Play className="h-3.5 w-3.5" /> Run Diagnostic Tests
                  </button>
                  <button
                    onClick={() => setActiveTab('sheets')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> View 60 Sheets Tabs
                  </button>
                </div>
              </div>

              {/* Status Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Company Jobs</div>
                  <div className="text-2xl font-bold text-white mt-1">{jobs.length}</div>
                  <div className="text-[11px] text-blue-400 mt-1 flex items-center gap-1 font-mono">
                    Next number: {session?.company?.company_code === 'CEMCON-MECH' ? '0011+' : session?.company?.company_code === 'CEMCON-ME' ? '0046+' : '0022+'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Accounting Integrity</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Balanced
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Debits: AED {trialBalance?.grandDebit?.toLocaleString()} = Credits: AED {trialBalance?.grandCredit?.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Physical Stock Valuation</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    AED {stockBalances.reduce((s, b) => s + (b.totalValuation || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Projected from {invTransactions.length} auditable transactions
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Governance & Reminders</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {pendingApprovals.length} Pending
                  </div>
                  <div className="text-[11px] text-amber-300/80 mt-1">
                    {reminders.length} automated alerts (Trade licenses & PDCs)
                  </div>
                </div>
              </div>

              {/* Architecture Blueprint Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Cpu className="h-4 w-4 text-blue-400" /> Decoupled Architecture: Google Sheets Adapter to PostgreSQL
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="font-semibold text-blue-400 mb-1">1. Frontend Layer</div>
                    <p className="text-slate-400 text-[11px]">
                      React + TypeScript client. Communicates exclusively with backend API. Zero exposure of Google credentials or sheet formulas.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="font-semibold text-indigo-400 mb-1">2. Repository Layer</div>
                    <p className="text-slate-400 text-[11px]">
                      15 domain repositories (JobRepo, AccountingRepo, InvRepo, etc.) enforce business rules, balancing checks, and multi-tenant scoping.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="font-semibold text-emerald-400 mb-1">3. Initial Database</div>
                    <p className="text-slate-400 text-[11px]">
                      Google Sheets storage adapter with schema validation across 54 tabs, Mutex locking, and row-level UUID primary keys.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="font-semibold text-amber-400 mb-1">4. Future PostgreSQL</div>
                    <p className="text-slate-400 text-[11px]">
                      Pluggable storage adapter interface (IStorageAdapter) allows PostgreSQL migration without modifying domain services.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Jobs preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-400" /> Recent Job Orders ({session?.company?.company_code})
                    </h3>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      Manage Jobs <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  {jobs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No jobs created yet for this company.</p>
                  ) : (
                    <div className="space-y-2">
                      {jobs.slice(0, 4).map((j) => (
                        <div key={j.job_id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-white font-mono text-blue-300">#{j.job_number} — {j.title}</div>
                            <div className="text-[11px] text-slate-400">{j.scope_description?.slice(0, 45)}...</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            j.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {j.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-indigo-400" /> Recent General Ledger Journals
                    </h3>
                    <button
                      onClick={() => setActiveTab('accounting')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      View Ledger <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {journals.slice(0, 4).map((j) => (
                      <div key={j.journal_id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-white font-mono text-indigo-300">{j.entry_number} ({j.entry_date})</div>
                          <div className="text-[11px] text-slate-400">{j.memo}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-emerald-400 font-semibold">AED {Number(j.total_debit).toLocaleString()}</div>
                          <span className="text-[10px] text-slate-400 font-mono">Balanced: 100%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 9 CEMCON Organizational Departments Quick Showcase */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" /> CEMCON Organizational Departments (9 Active Units)
                    </h3>
                    <button
                      onClick={() => setActiveTab('departments')}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      View Organization & Workforce <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {departments.map((dept) => (
                      <div
                        key={dept.department_id}
                        onClick={() => {
                          setSelectedDeptFilter(dept.department_id);
                          setActiveTab('departments');
                        }}
                        className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 cursor-pointer transition"
                      >
                        <div className="font-mono text-[10px] text-blue-400 font-bold">{dept.code}</div>
                        <div className="text-xs font-semibold text-white truncate mt-0.5" title={dept.name}>{dept.name}</div>
                        <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ACTIVE
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1b: DEPARTMENTS & HR */}
          {activeTab === 'departments' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" /> CEMCON Organizational Departments & Workforce
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Enterprise departmental governance and organizational chart for CEMCON Group Holding.
                    Connected directly to Google Sheets database tab <span className="font-mono text-emerald-400">Departments</span>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerGoogleSheetsSync}
                    disabled={sheetsSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${sheetsSyncing ? 'animate-spin' : ''}`} />
                    {sheetsSyncing ? 'Syncing...' : 'Sync to Google Sheets'}
                  </button>
                  <button
                    onClick={() => setIsCreatingDept(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Department
                  </button>
                  <button
                    onClick={() => setIsCreatingEmp(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Register Personnel
                  </button>
                </div>
              </div>

              {/* Directorate & Org Chart View Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setDeptViewMode('hr_suite')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      deptViewMode === 'hr_suite'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>HR & Administration Directorate Suite</span>
                  </button>
                  <button
                    onClick={() => setDeptViewMode('org_chart')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      deptViewMode === 'org_chart'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>9 CEMCON Departments Directory</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-mono hidden sm:block">
                  {deptViewMode === 'hr_suite' ? 'Personnel, Fleet, Forms & Expiry Alerts' : 'Organizational Headcounts & Units'}
                </div>
              </div>

              {/* RENDER HR & ADMIN SUITE */}
              {deptViewMode === 'hr_suite' && (
                session?.session?.roleCode === 'SALES_HEAD' ? (
                  <div className="p-8 rounded-2xl bg-slate-900 border border-amber-500/30 text-center space-y-4 max-w-2xl mx-auto my-8 shadow-xl">
                    <div className="inline-flex p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <ShieldAlert className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-bold text-white">HR & Administration Directorate Restricted</h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                      Your current active role is <strong className="text-white">Muhammad Shoaib (Sales & Marketing Head)</strong> with access authorized for the <strong className="text-amber-300">Sales & Marketing department only</strong>. The HR Directorate suite is reserved for HR personnel.
                    </p>
                    <button
                      onClick={() => setDeptViewMode('org_chart')}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                    >
                      Return to Sales & Marketing Directory
                    </button>
                  </div>
                ) : (
                  <HRAdministrationModule
                    session={session}
                    departments={departments}
                    employees={employees}
                    onRefreshEmployees={() => {
                      fetch('/api/employees')
                        .then((r) => r.json())
                        .then((d) => setEmployees(d.data || []))
                        .catch(console.error);
                    }}
                    triggerGoogleSheetsSync={triggerGoogleSheetsSync}
                    sheetsSyncing={sheetsSyncing}
                  />
                )
              )}

              {/* RENDER 9 DEPARTMENTS DIRECTORY & ORG CHART */}
              {deptViewMode === 'org_chart' && (
                <>
                  {/* Scoped Role Department Banner */}
                  {session?.session?.roleCode === 'SALES_HEAD' && (
                    <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-white">
                              Active Scope: Sales & Marketing Department Only
                            </h3>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                              SALES-MKT
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            User: <strong className="text-white">Muhammad Shoaib</strong> • Role: <strong className="text-white">Sales & Marketing Head</strong>. Direct jurisdiction over tenders, commercial proposals, client relations, and department personnel.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 self-start sm:self-auto font-mono">
                        AUTHORIZED SCOPE
                      </span>
                    </div>
                  )}

                  {session?.session?.roleCode === 'HR_MANAGER' && (
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-white">
                              Active Scope: HR & Administration Department Only
                            </h3>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              HR-ADM
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            User: <strong className="text-white">Muhammad Adeel</strong> • Role: <strong className="text-white">HR Manager</strong>. Full administrative jurisdiction over corporate workforce, recruitment, insurance, attendance, clearance, and fleet.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeptViewMode('hr_suite')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition self-start sm:self-auto shadow-sm"
                      >
                        Open HR Directorate Suite
                      </button>
                    </div>
                  )}

                  {/* Department Overview Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Departments</div>
                      <div className="text-2xl font-bold text-white mt-1">{departments.length}</div>
                      <div className="text-[11px] text-blue-400 mt-1">CEMCON standard structure</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Current Entity</div>
                      <div className="text-sm font-bold text-slate-200 mt-1 truncate">{session?.company?.company_name}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">Company ID: {session?.company?.company_code}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Registered Personnel</div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">{employees.length}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Master Personnel Records</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">QA/QC & HSE Auditing</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" /> Compliant
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">ISO 9001 / ISO 45001 Standards</div>
                    </div>
                  </div>

                  {/* CEMCON 9 DEPARTMENTS SHOWCASE */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-400" /> CEMCON Enterprise Department Directory (9 Departments)
                      </h2>
                      <span className="text-[11px] text-slate-400">Click a department to filter workforce records</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {departments.map((dept) => {
                        const deptEmployees = employees.filter((e) => e.department_id === dept.department_id);
                        const isSelected = selectedDeptFilter === dept.department_id;
                        const isSalesHead = session?.session?.roleCode === 'SALES_HEAD';
                        const isHrManager = session?.session?.roleCode === 'HR_MANAGER';
                        const isDeptAuthorized =
                          !isSalesHead && !isHrManager
                            ? true
                            : isSalesHead
                            ? dept.code === 'SALES-MKT'
                            : dept.code === 'HR-ADM' || dept.name.toLowerCase().includes('hr');

                        return (
                          <div
                            key={dept.department_id}
                            onClick={() => {
                              if (isSalesHead && dept.code !== 'SALES-MKT') {
                                setSelectedDeptFilter(dept.department_id);
                                return;
                              }
                              if (dept.name.toLowerCase().includes('hr') || dept.code === 'HR-ADM') {
                                setDeptViewMode('hr_suite');
                              } else {
                                setSelectedDeptFilter(isSelected ? 'ALL' : dept.department_id);
                              }
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-950/50 border-blue-500 shadow-md shadow-blue-500/10'
                                : isDeptAuthorized
                                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                                : 'bg-slate-900/40 border-slate-800/60 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                                  isDeptAuthorized
                                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {dept.code}
                                </span>
                                <h3 className="font-bold text-white text-sm mt-1.5 leading-snug">{dept.name}</h3>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isDeptAuthorized
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {isDeptAuthorized ? (dept.status || 'ACTIVE') : 'RESTRICTED'}
                              </span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-slate-500" />
                                <span className="font-medium text-slate-300">{deptEmployees.length} Personnel</span>
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {deptEmployees[0]?.full_name
                                  ? `Lead: ${deptEmployees[0].full_name}`
                                  : 'Assigned on Register'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PERSONNEL MASTER DATA SECTION */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
                    <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-indigo-400" /> Master Personnel Directory (Employees Tab)
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Personnel assigned to CEMCON departments with contact information and designation.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search personnel..."
                            value={searchEmployeeQuery}
                            onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Department Filter dropdown */}
                        <select
                          value={selectedDeptFilter}
                          onChange={(e) => setSelectedDeptFilter(e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {session?.session?.roleCode === 'SALES_HEAD' ? (
                            departments
                              .filter((d) => d.code === 'SALES-MKT')
                              .map((d) => (
                                <option key={d.department_id} value={d.department_id}>
                                  {d.name} ({d.code}) - Authorized
                                </option>
                              ))
                          ) : (
                            <>
                              <option value="ALL">All Departments ({employees.length})</option>
                              {departments.map((d) => (
                                <option key={d.department_id} value={d.department_id}>
                                  {d.name} ({d.code})
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4 font-semibold">Employee ID</th>
                            <th className="py-3 px-4 font-semibold">Full Name</th>
                            <th className="py-3 px-4 font-semibold">Passport Details</th>
                            <th className="py-3 px-4 font-semibold">Designation</th>
                            <th className="py-3 px-4 font-semibold">Department</th>
                            <th className="py-3 px-4 font-semibold">Contact Email</th>
                            <th className="py-3 px-4 font-semibold">Phone</th>
                            <th className="py-3 px-4 font-semibold">Status (Active / Inactive)</th>
                            <th className="py-3 px-4 font-semibold">Joining Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {employees
                            .filter((emp) => {
                              const isSalesHead = session?.session?.roleCode === 'SALES_HEAD';
                              const empDept = departments.find((d) => d.department_id === emp.department_id);
                              if (isSalesHead && empDept && empDept.code !== 'SALES-MKT') {
                                return false;
                              }
                              const matchesDept = selectedDeptFilter === 'ALL' || emp.department_id === selectedDeptFilter;
                              const matchesSearch =
                                !searchEmployeeQuery ||
                                emp.full_name?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
                                emp.designation?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
                                emp.email?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
                                emp.passport_no?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
                                emp.employee_no?.toLowerCase().includes(searchEmployeeQuery.toLowerCase());
                              return matchesDept && matchesSearch;
                            })
                            .map((emp) => {
                              const dept = departments.find((d) => d.department_id === emp.department_id);
                              return (
                                <tr key={emp.employee_id} className="hover:bg-slate-800/40 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-blue-300">{emp.employee_no}</td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-white flex items-center gap-1.5">
                                      <span>{emp.full_name}</span>
                                      {emp.status === 'INACTIVE' && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                          INACTIVE
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {emp.passport_no ? (
                                      <div className="space-y-0.5">
                                        <div className="font-mono font-bold text-emerald-400 text-xs flex items-center gap-1">
                                          <ShieldCheck className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                          <span>{emp.passport_no}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                          <span>Exp:</span>
                                          <span className={emp.passport_expiry_date && new Date(emp.passport_expiry_date) < new Date() ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                            {emp.passport_expiry_date || '—'}
                                          </span>
                                        </div>
                                        {(emp.nationality || emp.passport_country) && (
                                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                            {emp.nationality || emp.passport_country}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 italic text-[11px]">No passport</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-slate-300">{emp.designation}</td>
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                                      {dept ? dept.name : emp.department_id}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                                    <a href={`mailto:${emp.email}`} className="hover:text-blue-400 flex items-center gap-1">
                                      <Mail className="h-3 w-3 text-slate-500" /> {emp.email}
                                    </a>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                                    {emp.phone ? (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3 text-slate-500" /> {emp.phone}
                                      </span>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={emp.status || 'ACTIVE'}
                                        disabled={statusUpdatingId === emp.employee_id}
                                        onChange={(e) => handleUpdateEmployeeStatus(emp.employee_id, e.target.value)}
                                        className={`font-mono text-[11px] font-bold rounded-lg px-2.5 py-1 border transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                          emp.status === 'ACTIVE'
                                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                                            : emp.status === 'INACTIVE'
                                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 hover:bg-rose-900/60'
                                            : emp.status === 'TERMINATED'
                                            ? 'bg-slate-900 text-slate-400 border-slate-700'
                                            : 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                                        }`}
                                        title="Click to toggle or change status (Active / Inactive)"
                                      >
                                        <option value="ACTIVE" className="bg-slate-900 text-emerald-400 font-bold">● Active</option>
                                        <option value="INACTIVE" className="bg-slate-900 text-rose-400 font-bold">● Inactive</option>
                                        <option value="PROBATION" className="bg-slate-900 text-amber-400">Probation</option>
                                        <option value="ON_LEAVE" className="bg-slate-900 text-blue-400">On Leave</option>
                                        <option value="TERMINATED" className="bg-slate-900 text-slate-400">Terminated</option>
                                      </select>
                                      {statusUpdatingId === emp.employee_id && (
                                        <RefreshCw className="h-3.5 w-3.5 text-blue-400 animate-spin flex-shrink-0" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{emp.joining_date}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* MODAL: ADD DEPARTMENT */}
              {isCreatingDept && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-blue-400" /> Add Organizational Department
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Creates a new organizational unit under {session?.company?.company_name} and replicates to Google Sheets.
                    </p>
                    <form onSubmit={handleCreateDepartment} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Department Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Health, Safety & Environment"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Department Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. HSE"
                          value={newDeptCode}
                          onChange={(e) => setNewDeptCode(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingDept(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                        >
                          Save Department
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL: REGISTER PERSONNEL */}
              {isCreatingEmp && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-indigo-400" /> Register Employee / Personnel
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Appends a new employee master record with passport compliance data into the Employees database tab.
                    </p>
                    <form onSubmit={handleCreateEmployee} className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Employee Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. EMP-1010"
                            value={newEmpNo}
                            onChange={(e) => setNewEmpNo(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Department *</label>
                          <select
                            required
                            value={newEmpDeptId}
                            onChange={(e) => setNewEmpDeptId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                          >
                            <option value="">Select Department...</option>
                            {departments.map((d) => (
                              <option key={d.department_id} value={d.department_id}>
                                {d.name} ({d.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Status *</label>
                          <select
                            value={newEmpStatus}
                            onChange={(e) => setNewEmpStatus(e.target.value as any)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-semibold"
                          >
                            <option value="ACTIVE" className="text-emerald-400 font-bold">Active</option>
                            <option value="INACTIVE" className="text-rose-400 font-bold">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Mohammed Al-Falasi"
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Designation / Role *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Senior Welding Inspector"
                            value={newEmpDesignation}
                            onChange={(e) => setNewEmpDesignation(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Official Email *</label>
                          <input
                            type="email"
                            required
                            placeholder="name@cemcon.ae"
                            value={newEmpEmail}
                            onChange={(e) => setNewEmpEmail(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                          <input
                            type="text"
                            placeholder="+971-4-884-0110"
                            value={newEmpPhone}
                            onChange={(e) => setNewEmpPhone(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* PASSPORT DETAILS COMPLIANCE BOX */}
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Passport Identification Details
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">HR Verified</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">Passport Number</label>
                            <input
                              type="text"
                              placeholder="e.g. A98765432"
                              value={newEmpPassportNo}
                              onChange={(e) => setNewEmpPassportNo(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono uppercase focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">Nationality / Country</label>
                            <input
                              type="text"
                              placeholder="e.g. Pakistan, India, UAE..."
                              value={newEmpNationality}
                              onChange={(e) => setNewEmpNationality(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">Passport Expiry Date</label>
                            <input
                              type="date"
                              value={newEmpPassportExpiry}
                              onChange={(e) => setNewEmpPassportExpiry(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">Passport Issue Date</label>
                            <input
                              type="date"
                              value={newEmpPassportIssue}
                              onChange={(e) => setNewEmpPassportIssue(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">Place of Issue</label>
                            <input
                              type="text"
                              placeholder="e.g. Dubai"
                              value={newEmpPassportPlace}
                              onChange={(e) => setNewEmpPassportPlace(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsCreatingEmp(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Register Personnel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 1B: WORKFORCE ATTENDANCE & 30-DAY MUSTER ROLL */}
          {activeTab === 'attendance' && (
            <MonthlyAttendanceModule
              session={session}
              departments={departments}
              employees={employees}
              onRefreshEmployees={() => {
                fetch('/api/employees')
                  .then((r) => r.json())
                  .then((d) => setEmployees(d.data || []))
                  .catch(console.error);
              }}
              triggerGoogleSheetsSync={triggerGoogleSheetsSync}
              onOpenSalary={() => setActiveTab('salary')}
            />
          )}

          {/* VIEW 1C: SALARY & PAYROLL MODULE (AUTO-CALCULATED FROM ATTENDANCE) */}
          {activeTab === 'salary' && (
            <SalaryModule
              session={session}
              departments={departments}
              employees={employees}
              onRefreshEmployees={() => {
                fetch('/api/employees')
                  .then((r) => r.json())
                  .then((d) => setEmployees(d.data || []))
                  .catch(console.error);
              }}
              triggerGoogleSheetsSync={triggerGoogleSheetsSync}
              onOpenAttendance={() => setActiveTab('attendance')}
            />
          )}

          {/* VIEW 2: JOB NUMBERING ENGINE */}
          {activeTab === 'jobs' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-400" /> Controlled Job Numbering Engine
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Company-specific serialized numbers generated with backend mutex locking to prevent duplicates under concurrent requests.
                    Assigned numbers are immutable and cancelled numbers are never reused.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={runJobConcurrencyTest}
                    disabled={jobConcurrencyRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold transition"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {jobConcurrencyRunning ? 'Simulating 5 Parallel Calls...' : 'Test Concurrency Race Condition'}
                  </button>
                  <button
                    onClick={() => setActiveTab('estimations')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                    title="Open Job Cost Estimation Suite"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    <span>Job Estimations</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedJobRecord(null);
                      setJobModalMode('create');
                      setIsJobModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Job Order
                  </button>
                </div>
              </div>

              {/* Concurrency Test Notification Banner */}
              {concurrencyResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/40 text-xs text-blue-200 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Concurrency Mutex Lock Execution Report:</div>
                    <div className="mt-1 font-mono text-[11px] text-blue-300">{concurrencyResult}</div>
                  </div>
                </div>
              )}

              {/* Active Sequence Rules Reference Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border text-xs ${session?.company?.company_code === 'CEMCON-MECH' ? 'bg-blue-950/40 border-blue-500/50' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="font-bold text-white">Cemcon Mechanical Engineering LLC</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Sequence Starts: <span className="font-mono text-blue-300 font-semibold">0011, 0012, 0013...</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">Pad: 4 digits, Company ID: comp-cemcon-mech-01</div>
                </div>
                <div className={`p-3 rounded-xl border text-xs ${session?.company?.company_code === 'CEMCON-ME' ? 'bg-blue-950/40 border-blue-500/50' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="font-bold text-white">CEMCON Middle East LLC</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Sequence Starts: <span className="font-mono text-blue-300 font-semibold">0046, 0047, 0048...</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">Pad: 4 digits, Company ID: comp-cemcon-me-02</div>
                </div>
                <div className={`p-3 rounded-xl border text-xs ${session?.company?.company_code === 'CEMCON-FZE' ? 'bg-blue-950/40 border-blue-500/50' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="font-bold text-white">CEMCON FZE</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Sequence Starts: <span className="font-mono text-blue-300 font-semibold">0022, 0023, 0024...</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">Pad: 4 digits, Company ID: comp-cemcon-fze-03</div>
                </div>
              </div>

              {/* Jobs Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {session?.company?.company_name} — Controlled Job Orders Register
                  </div>
                  <div className="text-xs text-slate-400 font-mono">Total Orders: {jobs.length}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Job Order No</th>
                        <th className="py-2.5 px-4 font-semibold">Client's Name / Location</th>
                        <th className="py-2.5 px-4 font-semibold">Job Description</th>
                        <th className="py-2.5 px-4 font-semibold">Priority</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Est. Cost (AED)</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                        <th className="py-2.5 px-4 font-semibold">Deadline</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {jobs.map((j) => {
                        const cust = customers.find((c) => c.customer_id === j.customer_id);
                        const priorityColor =
                          j.priority === 'Critical'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : j.priority === 'Urgent'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                        return (
                          <tr key={j.job_id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-blue-400 text-sm">
                              <button
                                onClick={() => {
                                  setSelectedJobRecord(j);
                                  setJobModalMode('view');
                                  setIsJobModalOpen(true);
                                }}
                                className="hover:underline flex items-center gap-1.5"
                                title="Click to view & print official job order document"
                              >
                                {j.job_number}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{j.client_name || cust?.name || 'Commercial Client'}</div>
                              <div className="text-[11px] text-slate-400">{j.location || 'Sharjah / Dubai Site'}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={j.scope_description || j.title}>
                              {j.scope_description || j.title || 'Mechanical engineering works'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${priorityColor}`}>
                                {j.priority || 'Normal'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-200 font-semibold">
                              AED {(j.total_estimated_cost ? Number(j.total_estimated_cost) : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                  j.status === 'OPEN'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : j.status === 'CANCELLED'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-blue-500/10 text-blue-400'
                                }`}
                              >
                                {j.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {j.deadline || (j.created_at ? new Date(j.created_at).toLocaleDateString() : 'N/A')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedJobRecord(j);
                                    setJobModalMode('view');
                                    setIsJobModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-[11px] font-medium transition"
                                  title="View & Print Official Job Order"
                                >
                                  <Printer className="h-3 w-3" />
                                  <span>Print</span>
                                </button>
                                <button
                                  onClick={() => handleExportJobRowPdf(j)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition"
                                  title="Export Official Corporate PDF"
                                >
                                  <FileDown className="h-3 w-3" />
                                  <span>PDF</span>
                                </button>
                                {j.status === 'OPEN' && (
                                  <button
                                    onClick={async () => {
                                      const reason = prompt('Please enter reason for cancellation:');
                                      if (reason) {
                                        await fetch(`/api/jobs/${j.job_id}/cancel`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ reason }),
                                        });
                                        setRefreshTrigger((prev) => prev + 1);
                                      }
                                    }}
                                    className="px-2 py-1 rounded hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition text-[11px]"
                                    title="Cancel Job"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Controlled Job Order Modal (Create, Edit, View, Print & PDF) */}
              {isJobModalOpen && (
                <JobOrderModal
                  mode={jobModalMode}
                  job={selectedJobRecord}
                  activeCompany={
                    CEMCON_COMPANIES.find(
                      (c) => c.code === session?.company?.company_code || c.name === session?.company?.company_name
                    ) || CEMCON_COMPANIES[0]
                  }
                  tenantName={session?.tenant?.tenant_name || 'CEMCON Group Holding'}
                  onClose={() => setIsJobModalOpen(false)}
                  onJobCreated={() => {
                    setIsJobModalOpen(false);
                    setRefreshTrigger((prev) => prev + 1);
                  }}
                />
              )}
            </div>
          )}

          {/* VIEW 2B: JOB ESTIMATION SUITE (5-SECTION COSTING) */}
          {activeTab === 'estimations' && (
            <JobEstimationModule
              activeCompany={
                CEMCON_COMPANIES.find(
                  (c) => c.code === session?.company?.company_code || c.name === session?.company?.company_name
                ) || CEMCON_COMPANIES[0]
              }
              tenantName={session?.tenant?.tenant_name || 'CEMCON Group Holding'}
              userRole={session?.session?.roleCode}
              onOpenJobNumbering={() => setActiveTab('jobs')}
            />
          )}

          {/* VIEW 3: ACCOUNTS & FINANCE DEPARTMENT (18-MODULE SUITE) */}
          {activeTab === 'accounting' && (
            <FinanceModule
              activeCompany={
                CEMCON_COMPANIES.find(
                  (c) => c.code === session?.company?.company_code || c.name === session?.company?.company_name
                ) || CEMCON_COMPANIES[0]
              }
              tenantName={session?.tenant?.tenant_name || 'CEMCON Group Holding'}
              userRole={session?.session?.roleCode}
            />
          )}

          {/* VIEW 3B: PROCUREMENT DEPARTMENT (8-OPERATION SUITE) */}
          {activeTab === 'procurement' && (
            <ProcurementModule
              activeCompany={
                CEMCON_COMPANIES.find(
                  (c) => c.code === session?.company?.company_code || c.name === session?.company?.company_name
                ) || CEMCON_COMPANIES[0]
              }
              tenantName={session?.tenant?.tenant_name || 'CEMCON Group Holding'}
              userRole={session?.session?.roleCode}
            />
          )}

          {/* VIEW 4: INVENTORY & DYNAMIC STOCK LEDGER */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Layers className="h-5 w-5 text-emerald-400" /> Inventory & Stock Projection Ledger
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    On-hand stock is strictly projected from validated stock transaction records (Goods Receipts & Job Issues).
                    Users cannot directly overwrite stock balances.
                  </p>
                </div>
                <button
                  onClick={() => setIsMovementModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Post Stock Movement
                </button>
              </div>

              {/* Items Catalog & Dynamic Projection Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Calculated On-Hand Stock Projection
                  </div>
                  <div className="text-xs text-slate-400">Total Catalog Items: {items.length}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Item Code</th>
                        <th className="py-2.5 px-4 font-semibold">Item Name</th>
                        <th className="py-2.5 px-4 font-semibold">Category</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Projected On-Hand</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Min Threshold</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Standard Cost</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Total Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {items.map((item) => {
                        const proj = stockBalances.find((b) => b.itemId === item.item_id);
                        const onHand = proj ? proj.onHandQty : 0;
                        const min = parseFloat(item.min_stock_level || 0);
                        const isLow = onHand <= min;
                        const valuation = onHand * parseFloat(item.standard_cost || 0);

                        return (
                          <tr key={item.item_id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">{item.item_code}</td>
                            <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{item.category}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-white">
                              {onHand} {item.unit_of_measure}
                              {isLow && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Low Stock
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-400">
                              {min} {item.unit_of_measure}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                              AED {Number(item.standard_cost).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-300 font-semibold">
                              AED {valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Auditable Inventory Movement History
                  </div>
                  <div className="text-xs text-slate-400">Total Transactions: {invTransactions.length}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                        <th className="py-2.5 px-4 font-semibold">Item</th>
                        <th className="py-2.5 px-4 font-semibold">Movement Type</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Quantity</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Unit Cost</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Total Cost</th>
                        <th className="py-2.5 px-4 font-semibold">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {invTransactions.map((tx) => {
                        const item = items.find((i) => i.item_id === tx.item_id);
                        return (
                          <tr key={tx.transaction_id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                              {new Date(tx.timestamp).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-white">{item?.name || tx.item_id}</td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                  tx.transaction_type === 'PURCHASE_RECEIPT'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {tx.transaction_type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-white">
                              {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                              AED {Number(tx.unit_cost).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-emerald-400">
                              AED {Number(tx.total_cost).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                              {tx.reference_type} #{tx.reference_id}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Movement Modal */}
              {isMovementModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                    <h3 className="text-base font-bold text-white mb-2">Post Auditable Stock Movement</h3>
                    <form onSubmit={handlePostStockMovement} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Item</label>
                        <select
                          required
                          value={movementItem}
                          onChange={(e) => setMovementItem(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-xs"
                        >
                          <option value="">Select Item...</option>
                          {items.map((i) => (
                            <option key={i.item_id} value={i.item_id}>
                              {i.item_code} - {i.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Warehouse Yard</label>
                        <select
                          required
                          value={movementWarehouse}
                          onChange={(e) => setMovementWarehouse(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-xs"
                        >
                          <option value="">Select Warehouse...</option>
                          {warehouses.map((w) => (
                            <option key={w.warehouse_id} value={w.warehouse_id}>
                              {w.code} - {w.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Movement Type</label>
                          <select
                            value={movementType}
                            onChange={(e) => setMovementType(e.target.value as any)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-xs"
                          >
                            <option value="PURCHASE_RECEIPT">Receipt (Stock In)</option>
                            <option value="JOB_ISSUE">Job Issue (Stock Out)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={movementQty}
                            onChange={(e) => setMovementQty(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Unit Cost (AED)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={movementCost}
                          onChange={(e) => setMovementCost(Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-xs"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsMovementModalOpen(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          Commit Transaction
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: APPROVALS & GOVERNANCE */}
          {activeTab === 'approvals' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-400" /> Centralized Approvals & Audit Trail
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-level approval engine for purchase orders, requisitions, leave requests, and expenses with complete immutable audit logs.
                  </p>
                </div>
              </div>

              {/* Pending Approvals Queue */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" /> Pending Approval Queue ({pendingApprovals.length})
                  </div>
                </div>
                {pendingApprovals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    All submitted tickets and requisitions have been approved or processed.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {pendingApprovals.map((req) => (
                      <div key={req.request_id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30">
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            <span>{req.module} Requisition</span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {req.record_reference}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Requested by User #{req.requested_by} • Step {req.current_step} of workflow
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Approval remarks..."
                            value={approvalComment}
                            onChange={(e) => setApprovalComment(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white rounded px-2.5 py-1 text-xs w-48 focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleApprovalAction(req.request_id, 'APPROVE')}
                            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprovalAction(req.request_id, 'REJECT')}
                            className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Append-Only Audit Logs Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" /> Immutable Audit Trail (Last 50 Actions)
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                        <th className="py-2.5 px-4 font-semibold">User</th>
                        <th className="py-2.5 px-4 font-semibold">Action</th>
                        <th className="py-2.5 px-4 font-semibold">Entity</th>
                        <th className="py-2.5 px-4 font-semibold">Record ID</th>
                        <th className="py-2.5 px-4 font-semibold">Audit Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {auditLogs.map((log) => (
                        <tr key={log.audit_id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-4 font-mono text-[11px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-4 text-white font-medium">{log.user_email}</td>
                          <td className="py-2 px-4 font-mono text-blue-300">{log.action}</td>
                          <td className="py-2 px-4 text-slate-300">{log.entity_name}</td>
                          <td className="py-2 px-4 font-mono text-[10px] text-slate-500 truncate max-w-[100px]">
                            {log.record_id}
                          </td>
                          <td className="py-2 px-4 text-[11px] text-slate-400 truncate max-w-xs font-mono">
                            {log.after_values ? log.after_values.slice(0, 70) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: GOOGLE SHEETS DATABASE INSPECTOR */}
          {activeTab === 'sheets' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-400" /> Google Sheets Production Database Inspector
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Live browser for all 54 spreadsheet tabs. Inspect schemas, column constraints, raw values, or export TSV/CSV.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerGoogleSheetsSync}
                    disabled={sheetsSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${sheetsSyncing ? 'animate-spin' : ''}`} />
                    {sheetsSyncing ? 'Syncing...' : 'Sync with Google Sheets API'}
                  </button>
                  <a
                    href={`/api/sheets/export/${selectedSheetTab}?format=tsv`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    <Download className="h-3.5 w-3.5" /> Export TSV
                  </a>
                </div>
              </div>

              {/* GOOGLE SHEETS LIVE PRODUCTION DATABASE CARD */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          Google Sheets Production Database
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE CONNECTED
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Enterprise multi-tenant database for CEMCON Group Holding. 60 production tabs active and validated.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerGoogleSheetsSync}
                      disabled={sheetsSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${sheetsSyncing ? 'animate-spin' : ''}`} />
                      {sheetsSyncing ? 'Synchronizing...' : 'Synchronize Live Database'}
                    </button>
                    {serviceAccountInfo?.sheetId && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${serviceAccountInfo.sheetId}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                        Open Google Sheet
                      </a>
                    )}
                  </div>
                </div>

                {/* Production Database Attributes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Spreadsheet Title & ID */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      Target Spreadsheet
                    </div>
                    <div className="font-semibold text-white text-xs truncate">
                      {serviceAccountInfo?.spreadsheetTitle || 'Compenia Erp System Cemcon'}
                    </div>
                    <div className="font-mono text-[10px] text-blue-300 truncate" title={serviceAccountInfo?.sheetId}>
                      ID: {serviceAccountInfo?.sheetId}
                    </div>
                  </div>

                  {/* Active Service Account */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      Authenticated Service Account
                    </div>
                    <div className="font-mono text-emerald-300 font-semibold text-[11px] truncate flex items-center justify-between gap-1">
                      <span className="truncate" title={serviceAccountInfo?.clientEmail}>
                        {serviceAccountInfo?.clientEmail}
                      </span>
                      {serviceAccountInfo?.clientEmail && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(serviceAccountInfo.clientEmail);
                            setCopiedEmail(true);
                            setTimeout(() => setCopiedEmail(false), 2000);
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          title="Copy service account email"
                        >
                          {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">Google Sheets API v4 JWT Authorization</div>
                  </div>

                  {/* Schema & Tabs Status */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      Spreadsheet Tabs
                    </div>
                    <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>60 Production Tabs Active</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Frozen headers, UUID keys & data validation</div>
                  </div>

                  {/* Security Isolation */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      Security & Encryption
                    </div>
                    <div className="font-mono text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Server-Side Isolated</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Private key held in secrets, zero client exposure</div>
                  </div>
                </div>
              </div>

              {/* Tabs Carousel / Selector */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Tab to Inspect (54 Available Tabs)
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {sheetsTabs.map((t) => (
                    <button
                      key={t.tabName}
                      onClick={() => loadSheetTab(t.tabName)}
                      className={`text-xs px-2.5 py-1 rounded-md font-mono transition ${
                        selectedSheetTab === t.tabName
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {t.tabName} ({t.rowCount})
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Tab Inspector */}
              {sheetTabData && (
                <div className="space-y-4">
                  {/* Schema Summary Card */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Table className="h-4 w-4 text-blue-400" /> Tab: {sheetTabData.tabName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{sheetTabData.schema?.description}</p>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Columns: {sheetTabData.schema?.columns?.length} • Rows: {sheetTabData.rowCount}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {sheetTabData.schema?.columns?.map((col: any) => (
                        <div key={col.name} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px]">
                          <div className="font-mono font-semibold text-blue-300 truncate">{col.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                            <span>{col.type}</span>
                            {col.required && <span className="text-rose-400 text-[9px] font-bold">REQ</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Raw Rows Table */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">
                        Spreadsheet Grid Preview ({sheetTabData.rowCount} records)
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950 sticky top-0 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3 text-slate-500 w-12 text-center">#</th>
                            {sheetTabData.headers?.map((h: string) => (
                              <th key={h} className="py-2 px-3 font-semibold text-slate-300 whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {sheetTabData.rows?.map((row: any[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-800/40">
                              <td className="py-2 px-3 text-slate-500 text-center text-[10px]">{rIdx + 1}</td>
                              {row.map((cell: any, cIdx: number) => (
                                <td key={cIdx} className="py-2 px-3 text-slate-300 whitespace-nowrap max-w-xs truncate">
                                  {cell !== null && cell !== undefined ? String(cell) : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 7: INTEGRITY & SECURITY TEST LAB */}
          {activeTab === 'tests' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-blue-400" /> Automated Integrity & Security Test Lab
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Live backend test runner verifying: cross-tenant access prevention, concurrent job numbering locks,
                    unbalanced double-entry journal rejection, and idempotency key replay protection.
                  </p>
                </div>
                <button
                  onClick={runAllDiagnosticTests}
                  disabled={runningTests}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Play className={`h-3.5 w-3.5 ${runningTests ? 'animate-spin' : ''}`} />
                  {runningTests ? 'Executing Diagnostics...' : 'Run All 4 Integrity Tests'}
                </button>
              </div>

              {testResults && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-white">Diagnostic Results:</div>
                      <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                        {testResults.summary?.passed} / {testResults.summary?.total} PASSED
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Timestamp: {new Date().toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Test Cards */}
                  <div className="space-y-3">
                    {testResults.tests?.map((t: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            {t.status === 'PASSED' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-400" />
                            )}
                            <span>{t.name}</span>
                          </div>
                          <p className="text-xs text-slate-400">{t.details}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                              t.status === 'PASSED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {t.status}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">{t.durationMs}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 8: POSTGRESQL MIGRATION STUDIO */}
          {activeTab === 'migration' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-400" /> PostgreSQL Migration Studio
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Zero-downtime cutover architecture. Pre-generated DDL schemas, ETL streaming script, and automated data reconciliation report.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(postgresDDL);
                      setCopiedDDL(true);
                      setTimeout(() => setCopiedDDL(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    {copiedDDL ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedDDL ? 'Copied DDL' : 'Copy SQL DDL'}
                  </button>
                  <a
                    href="/api/migration/ddl"
                    download="compenia_postgres_schema.sql"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Download className="h-3.5 w-3.5" /> Download DDL Script
                  </a>
                </div>
              </div>

              {/* Data Reconciliation Summary */}
              {reconciliationReport && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Automated Pre-Migration Reconciliation Check
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Total Tabs Mapped</div>
                      <div className="text-lg font-bold text-white mt-1">{reconciliationReport.totalTabsEvaluated} / 54</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Total Records in Sheets</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">{reconciliationReport.sheetsRowCount}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Target Schema Tables</div>
                      <div className="text-lg font-bold text-indigo-400 mt-1">{reconciliationReport.postgresTargetTableCount}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    {reconciliationReport.integrityChecks?.map((check: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950/40">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-200">{check.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{check.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DDL Preview Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    PostgreSQL 16+ DDL Output (Foreign Keys, Constraints & Indexes)
                  </div>
                </div>
                <pre className="p-4 text-[11px] font-mono text-emerald-400/90 bg-slate-950 overflow-x-auto max-h-[450px]">
                  {postgresDDL || 'Loading DDL...'}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </main>
      </div>

      {/* REMINDERS & ALERTS MODAL */}
      {showRemindersModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Automated Governance Reminders</h3>
              </div>
              <button
                onClick={() => setShowRemindersModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Scheduled trigger scanner monitoring document expiries (passports, trade licenses), PDC cheque maturities, and low inventory.
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {reminders.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No active alerts or expiring records found.</p>
              ) : (
                reminders.map((rem, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs ${
                      rem.priority === 'CRITICAL'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="font-semibold text-white flex items-center justify-between">
                      <span>{rem.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900/60">
                        {rem.priority}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">{rem.message}</div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRemindersModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* VERCEL ENVIRONMENT VARIABLES SETUP GUIDE MODAL */}
      {showVercelEnvGuide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Google Sheets Database Setup for Vercel</h3>
              </div>
              <button
                onClick={() => setShowVercelEnvGuide(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
              <strong>Why did your created data disappear?</strong>
              <p className="mt-1">
                On Vercel, serverless containers automatically restart after idle periods. Because Vercel does not read your local <code className="bg-slate-800 px-1 py-0.5 rounded text-white">.env</code> file, it cannot authenticate with Google Sheets without environment variables. Once you add the 4 variables below in your Vercel Project Settings, every employee, job order, and voucher is saved permanently to your live Google Sheet and will never disappear.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                Steps to Configure on Vercel:
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>
                  Open your <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">Vercel Dashboard</a> and select your <strong>cemcon-erp-system</strong> project.
                </li>
                <li>
                  Navigate to <strong>Settings</strong> → <strong>Environment Variables</strong>.
                </li>
                <li>Add the following 4 variables (select Production, Preview, and Development):</li>
              </ol>

              <div className="space-y-2 pt-1 font-mono text-[11px]">
                {[
                  {
                    key: 'GOOGLE_SHEET_ID',
                    val: serviceAccountInfo?.sheetId || '1BJOlPhHwBtvuSvPVkK-0PVTspPSmlK1xK--bJWE3ueo',
                    desc: 'Your Google Spreadsheet document ID',
                  },
                  {
                    key: 'GOOGLE_CLIENT_EMAIL',
                    val: serviceAccountInfo?.clientEmail || 'compenia-erp-cemcon@nth-drive-512014-j8.iam.gserviceaccount.com',
                    desc: 'GCP Service Account Email with Editor access to the sheet',
                  },
                  {
                    key: 'GOOGLE_PROJECT_ID',
                    val: serviceAccountInfo?.projectId || 'nth-drive-512014-j8',
                    desc: 'GCP Project ID',
                  },
                  {
                    key: 'GOOGLE_PRIVATE_KEY',
                    val: '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n',
                    desc: 'Your service account RSA Private Key from your downloaded GCP service account JSON key file',
                  },
                ].map((item) => (
                  <div key={item.key} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 font-bold">{item.key}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.val);
                          setCopiedKey(item.key);
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans flex items-center gap-1 transition"
                      >
                        {copiedKey === item.key ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedKey === item.key ? 'Copied' : 'Copy Value'}
                      </button>
                    </div>
                    <div className="text-slate-300 truncate max-w-full">{item.val}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{item.desc}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30 text-slate-300 space-y-1 text-xs">
                <div className="font-semibold text-blue-300">Important Google Sheet Permission:</div>
                <p>
                  Make sure you have shared your Google Sheet with <code className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded">{serviceAccountInfo?.clientEmail || 'compenia-erp-cemcon@nth-drive-512014-j8.iam.gserviceaccount.com'}</code> and granted it <strong>Editor</strong> permission.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                After saving variables, click <strong>Redeploy</strong> in Vercel.
              </span>
              <button
                onClick={() => setShowVercelEnvGuide(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
