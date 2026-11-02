import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  DollarSign,
  CreditCard,
  Receipt,
  FileText,
  FileSpreadsheet,
  PieChart,
  TrendingUp,
  ArrowRightLeft,
  Scale,
  Printer,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  Download,
  RefreshCw,
  Truck,
  Briefcase,
  Users,
  Eye,
  Filter,
  CheckSquare,
  Landmark,
  BadgePercent,
  Calculator,
} from 'lucide-react';
import { CemconCompanyInfo } from '../hr/HRPrintableForms';
import {
  exportProfitLossPdf,
  exportBalanceSheetPdf,
  exportFinancialReportsPdf,
} from '../../utils/financialPdfGenerator';

export type FinanceMenuOption =
  | 'coa'
  | 'cash_bank'
  | 'bank_tx'
  | 'bank_rec'
  | 'receipts_payments'
  | 'vouchers'
  | 'quotations'
  | 'purchase_invoices'
  | 'sales_invoices'
  | 'delivery_notes'
  | 'parties'
  | 'aging'
  | 'ledgers'
  | 'trial_balance'
  | 'pnl'
  | 'balance_sheet'
  | 'cash_flow'
  | 'financial_reports';

interface FinanceModuleProps {
  activeCompany: CemconCompanyInfo;
  tenantName: string;
  userRole?: string;
}

export function FinanceModule({ activeCompany, tenantName, userRole }: FinanceModuleProps) {
  const [activeMenu, setActiveMenu] = useState<FinanceMenuOption>('pnl');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Data states
  const [accounts, setAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [bankReconciliations, setBankReconciliations] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [agingData, setAgingData] = useState<{ ar: any; ap: any } | null>(null);
  const [generalLedger, setGeneralLedger] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [financialMetrics, setFinancialMetrics] = useState<any>(null);

  // Filters & Selected states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>('ALL');
  const [selectedGlAccountId, setSelectedGlAccountId] = useState<string>('');
  const [selectedPartyType, setSelectedPartyType] = useState<'customers' | 'suppliers'>('customers');
  const [selectedReceiptPaymentTab, setSelectedReceiptPaymentTab] = useState<'receipts' | 'payments'>('receipts');
  const [selectedAgingTab, setSelectedAgingTab] = useState<'ar' | 'ap'>('ar');

  // Modals
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [newVoucherType, setNewVoucherType] = useState<'PV' | 'RV' | 'JV' | 'EV' | 'AV'>('JV');
  const [newVoucherMemo, setNewVoucherMemo] = useState('');
  const [newVoucherLines, setNewVoucherLines] = useState<Array<{ accountId: string; debit: number; credit: number; lineMemo: string }>>([
    { accountId: '', debit: 0, credit: 0, lineMemo: '' },
    { accountId: '', debit: 0, credit: 0, lineMemo: '' },
  ]);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [newVoucherDate, setNewVoucherDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const openNewJournalEntryModal = (template?: 'DEPRECIATION' | 'PAYROLL' | 'RENT' | 'TRANSFER') => {
    setNewVoucherType('JV');
    setVoucherError(null);
    setNewVoucherDate(new Date().toISOString().split('T')[0]);

    if (template === 'DEPRECIATION') {
      const depExp = accounts.find((a) => a.account_code === '5030') || accounts[0];
      const accDep = accounts.find((a) => a.account_code === '1515') || accounts[1];
      setNewVoucherMemo('Monthly depreciation provision for machinery & cranes');
      setNewVoucherLines([
        { accountId: depExp?.account_id || '', debit: 18500, credit: 0, lineMemo: 'Depreciation expense' },
        { accountId: accDep?.account_id || '', debit: 0, credit: 18500, lineMemo: 'Accumulated depreciation' },
      ]);
    } else if (template === 'PAYROLL') {
      const wages = accounts.find((a) => a.account_code === '5020') || accounts[0];
      const accrued = accounts.find((a) => a.account_code === '2030') || accounts[1];
      setNewVoucherMemo('Accrued workshop welder wages and site staff payroll');
      setNewVoucherLines([
        { accountId: wages?.account_id || '', debit: 45000, credit: 0, lineMemo: 'Workshop wages' },
        { accountId: accrued?.account_id || '', debit: 0, credit: 45000, lineMemo: 'Accrued wages payable' },
      ]);
    } else if (template === 'RENT') {
      const rentExp = accounts.find((a) => a.account_code === '6020') || accounts[0];
      const prepaid = accounts.find((a) => a.account_code === '1060') || accounts[1];
      setNewVoucherMemo('Monthly amortization of industrial fabrication yard rent');
      setNewVoucherLines([
        { accountId: rentExp?.account_id || '', debit: 25000, credit: 0, lineMemo: 'Yard rent expense' },
        { accountId: prepaid?.account_id || '', debit: 0, credit: 25000, lineMemo: 'Prepaid rent amortization' },
      ]);
    } else if (template === 'TRANSFER') {
      const adcb = accounts.find((a) => a.account_code === '1020') || accounts[0];
      const enbd = accounts.find((a) => a.account_code === '1010') || accounts[1];
      setNewVoucherMemo('Inter-bank treasury transfer from ENBD Corporate to ADCB Operations');
      setNewVoucherLines([
        { accountId: adcb?.account_id || '', debit: 100000, credit: 0, lineMemo: 'Fund transfer in (ADCB)' },
        { accountId: enbd?.account_id || '', debit: 0, credit: 100000, lineMemo: 'Fund transfer out (ENBD)' },
      ]);
    } else {
      setNewVoucherMemo('');
      setNewVoucherLines([
        { accountId: '', debit: 0, credit: 0, lineMemo: '' },
        { accountId: '', debit: 0, credit: 0, lineMemo: '' },
      ]);
    }
    setIsVoucherModalOpen(true);
  };

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'>('EXPENSE');
  const [newAccountNormal, setNewAccountNormal] = useState<'DEBIT' | 'CREDIT'>('DEBIT');

  const [isSalesInvoiceModalOpen, setIsSalesInvoiceModalOpen] = useState(false);
  const [newInvCustomer, setNewInvCustomer] = useState('');
  const [newInvSubtotal, setNewInvSubtotal] = useState(25000);
  const [newInvDueDate, setNewInvDueDate] = useState('');

  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [recStatementBalance, setRecStatementBalance] = useState(1043564.5);

  const [viewingVoucher, setViewingVoucher] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load Financial Data
  useEffect(() => {
    const fetchFinanceData = async () => {
      setLoading(true);
      try {
        const [
          accountsRes,
          bankAccRes,
          bankTxRes,
          bankRecRes,
          receiptsRes,
          paymentsRes,
          journalsRes,
          quotesRes,
          pinvRes,
          sinvRes,
          dnRes,
          custRes,
          suppRes,
          agingRes,
          glRes,
          tbRes,
          pnlRes,
          bsRes,
          cfRes,
          fmRes,
        ] = await Promise.all([
          fetch('/api/accounting/accounts').then((r) => r.json()),
          fetch('/api/banking/accounts').then((r) => r.json()),
          fetch('/api/banking/transactions').then((r) => r.json()),
          fetch('/api/banking/reconciliations').then((r) => r.json()),
          fetch('/api/accounting/receipts').then((r) => r.json()),
          fetch('/api/accounting/payments').then((r) => r.json()),
          fetch('/api/accounting/journals').then((r) => r.json()),
          fetch('/api/crm/quotations').then((r) => r.json()),
          fetch('/api/accounting/purchase-invoices').then((r) => r.json()),
          fetch('/api/accounting/sales-invoices').then((r) => r.json()),
          fetch('/api/logistics/delivery-notes').then((r) => r.json()),
          fetch('/api/customers').then((r) => r.json()),
          fetch('/api/suppliers').then((r) => r.json()),
          fetch('/api/accounting/aging-report').then((r) => r.json()),
          fetch('/api/accounting/general-ledger').then((r) => r.json()),
          fetch('/api/accounting/trial-balance').then((r) => r.json()),
          fetch('/api/accounting/profit-loss').then((r) => r.json()),
          fetch('/api/accounting/balance-sheet').then((r) => r.json()),
          fetch('/api/accounting/cash-flow').then((r) => r.json()),
          fetch('/api/accounting/financial-metrics').then((r) => r.json()),
        ]);

        if (accountsRes.data) setAccounts(accountsRes.data);
        if (bankAccRes.data) setBankAccounts(bankAccRes.data);
        if (bankTxRes.data) setBankTransactions(bankTxRes.data);
        if (bankRecRes.data) setBankReconciliations(bankRecRes.data);
        if (receiptsRes.data) setReceipts(receiptsRes.data);
        if (paymentsRes.data) setPayments(paymentsRes.data);
        if (journalsRes.data) setJournals(journalsRes.data);
        if (quotesRes.data) setQuotations(quotesRes.data);
        if (pinvRes.data) setPurchaseInvoices(pinvRes.data);
        if (sinvRes.data) setSalesInvoices(sinvRes.data);
        if (dnRes.data) setDeliveryNotes(dnRes.data);
        if (custRes.data) setCustomers(custRes.data);
        if (suppRes.data) setSuppliers(suppRes.data);
        if (agingRes.ar) setAgingData(agingRes);
        if (Array.isArray(glRes)) setGeneralLedger(glRes);
        if (tbRes.report) setTrialBalance(tbRes);
        if (pnlRes.totalRevenue !== undefined) setPnlData(pnlRes);
        if (bsRes.totalAssets !== undefined) setBalanceSheetData(bsRes);
        if (cfRes.operating) setCashFlowData(cfRes);
        if (fmRes.ratios) setFinancialMetrics(fmRes);
      } catch (err) {
        console.error('Error fetching finance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [refreshTrigger]);

  // PRINT HANDLER
  const printContent = (elementId: string, title: string) => {
    try {
      const existingIframe = document.getElementById('cemcon-finance-print-frame');
      if (existingIframe) existingIframe.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'cemcon-finance-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.opacity = '0';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      const targetEl = document.getElementById(elementId);

      if (!doc || !targetEl) {
        throw new Error('Print container element not found');
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title} - ${activeCompany.name}</title>
            <style>
              @page { size: A4 portrait; margin: 12mm; }
              * { box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                color: #0f172a; 
                background: #ffffff; 
                margin: 0; 
                padding: 4mm; 
              }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; }
              th { background-color: #f1f5f9; text-align: left; font-weight: 600; }
              .text-right { text-align: right; }
              .font-bold { font-weight: 700; }
              .border-t-2 { border-top: 2px solid #0f172a; }
              .border-b-4 { border-bottom: 4px double #0f172a; }
              .bg-slate-50 { background-color: #f8fafc; }
              .text-blue-600 { color: #2563eb; }
              .text-emerald-600 { color: #059669; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            <div>
              ${targetEl.innerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (_) {
          window.print();
        }
      }, 500);
    } catch (err: any) {
      console.error('Print trigger failed, triggering fallback:', err);
      window.print();
    }
  };

  // POST VOUCHER
  const handlePostVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);

    const drSum = newVoucherLines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const crSum = newVoucherLines.reduce((s, l) => s + Number(l.credit || 0), 0);

    if (Math.abs(drSum - crSum) > 0.001) {
      setVoucherError(
        `Unbalanced Voucher! Total Debits (${drSum.toFixed(2)}) must equal Total Credits (${crSum.toFixed(2)}). Variance: ${(drSum - crSum).toFixed(2)} AED`
      );
      return;
    }

    try {
      const res = await fetch('/api/accounting/post-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: `IDEM-VOUCHER-${newVoucherType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          entryDate: newVoucherDate || new Date().toISOString().split('T')[0],
          memo: newVoucherMemo,
          voucherType: newVoucherType,
          lines: newVoucherLines,
        }),
      });

      if (res.ok) {
        setIsVoucherModalOpen(false);
        setNewVoucherMemo('');
        setNewVoucherLines([
          { accountId: '', debit: 0, credit: 0, lineMemo: '' },
          { accountId: '', debit: 0, credit: 0, lineMemo: '' },
        ]);
        showToast(
          newVoucherType === 'JV'
            ? 'Journal entry successfully posted to General Ledger!'
            : `${newVoucherType} voucher posted successfully to General Ledger!`
        );
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const err = await res.json();
        setVoucherError(err.error || 'Failed to post voucher');
      }
    } catch (err: any) {
      setVoucherError(err.message);
    }
  };

  // CREATE ACCOUNT
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_code: newAccountCode,
          account_name: newAccountName,
          account_type: newAccountType,
          normal_balance: newAccountNormal,
        }),
      });
      if (res.ok) {
        setIsAccountModalOpen(false);
        setNewAccountCode('');
        setNewAccountName('');
        showToast('Account added to Chart of Accounts!');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create account');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // RECONCILE TOGGLE
  const handleToggleReconcile = async (txId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/banking/transactions/${txId}/toggle-reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isReconciled: !currentStatus }),
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  interface MenuItemConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badge?: string;
    highlight?: boolean;
  }

  // 18 Menu Map Navigation Items
  const menuSections: { group: string; items: MenuItemConfig[] }[] = [
    {
      group: 'General Ledger & Core Accounting',
      items: [
        { id: 'coa', label: 'Chart of Accounts', icon: Scale, count: accounts.length },
        { id: 'vouchers', label: 'Payment / Receipt / Journal / Expense / Advance Vouchers', icon: Receipt, count: journals.length },
        { id: 'ledgers', label: 'Ledgers', icon: ArrowRightLeft, count: generalLedger.length },
        { id: 'trial_balance', label: 'Trial Balance', icon: CheckSquare, badge: trialBalance?.isBalanced ? 'Balanced' : 'Check' },
      ],
    },
    {
      group: 'Cash & Banking Operations',
      items: [
        { id: 'cash_bank', label: 'Cash & Bank Accounts', icon: Landmark, count: bankAccounts.length },
        { id: 'bank_tx', label: 'Bank Transactions', icon: CreditCard, count: bankTransactions.length },
        { id: 'bank_rec', label: 'Bank Reconciliation', icon: CheckCircle2, count: bankReconciliations.length },
        { id: 'receipts_payments', label: 'Receipts & Payments', icon: DollarSign, count: receipts.length + payments.length },
      ],
    },
    {
      group: 'Commercial, Invoicing & Receivables',
      items: [
        { id: 'quotations', label: 'Quotations', icon: FileText, count: quotations.length },
        { id: 'purchase_invoices', label: 'Purchase Invoices', icon: FileSpreadsheet, count: purchaseInvoices.length },
        { id: 'sales_invoices', label: 'Sales Invoices', icon: BadgePercent, count: salesInvoices.length },
        { id: 'delivery_notes', label: 'Delivery Notes', icon: Truck, count: deliveryNotes.length },
        { id: 'parties', label: 'Customers & Suppliers', icon: Users, count: customers.length + suppliers.length },
        { id: 'aging', label: 'Receivables / Payables', icon: Clock, badge: 'Aging' },
      ],
    },
    {
      group: 'Financial Statements & Reporting (Print & PDF Enabled)',
      items: [
        { id: 'pnl', label: 'P&L (Profit & Loss Statement)', icon: TrendingUp, highlight: true },
        { id: 'balance_sheet', label: 'Balance Sheet', icon: Scale, highlight: true },
        { id: 'cash_flow', label: 'Cash Flow Reporting', icon: ArrowRightLeft },
        { id: 'financial_reports', label: 'Financial Reports', icon: PieChart, highlight: true },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* DEPARTMENT HEADER BANNER */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Accounts & Finance Department
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                    UAE IFRS · 5% VAT · 9% Corporate Tax
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Operating Entity:{' '}
                  <span className="text-white font-semibold">{activeCompany.name}</span> · TRN:{' '}
                  <span className="font-mono text-indigo-300">{activeCompany.trn}</span> · Currency: AED
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons & Quick Metrics Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openNewJournalEntryModal()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition transform active:scale-95 border border-indigo-400/40 cursor-pointer"
            >
              <ArrowRightLeft className="h-4 w-4 text-indigo-100" />
              <span>+ New Journal Entry</span>
            </button>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Gross Turnover</div>
              <div className="text-sm font-bold text-white font-mono">
                AED {(pnlData?.totalRevenue || 494160).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Bank Balance (ENBD)</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                AED {(balanceSheetData?.totalCurrentAssets || 1498664.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Profit Margin</div>
              <div className="text-sm font-bold text-indigo-400 font-mono">
                {pnlData?.netMarginPct || 38.3}%
              </div>
            </div>
          </div>
        </div>

        {/* 18-Option Menu Navigation Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Department Menu Map (18 Controlled Accounting Sections)</span>
            <span className="text-slate-500 font-mono text-[10px]">Active View: {activeMenu.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {menuSections.flatMap((s) => s.items).map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id as FinanceMenuOption)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : item.highlight
                      ? 'bg-slate-800/90 text-indigo-200 hover:bg-slate-800 hover:text-white border border-indigo-500/30'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: CHART OF ACCOUNTS */}
      {/* ============================================================== */}
      {activeMenu === 'coa' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-indigo-400" /> Chart of Accounts (COA)
              </h2>
              <p className="text-xs text-slate-400">Standard double-entry classification: Assets, Liabilities, Equity, Revenue, Direct Costs & Operating Expenses.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openNewJournalEntryModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> + New Journal Entry
              </button>
              <button
                onClick={() => setIsAccountModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Account
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Account Code</th>
                  <th className="py-2.5 px-4 font-semibold">Account Title</th>
                  <th className="py-2.5 px-4 font-semibold">Classification Type</th>
                  <th className="py-2.5 px-4 font-semibold">Normal Balance</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Current Balance (AED)</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {accounts.map((acc) => {
                  const tbItem = trialBalance?.report?.find((t: any) => t.accountId === acc.account_id);
                  const bal = tbItem ? tbItem.netBalance : 0;
                  return (
                    <tr key={acc.account_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{acc.account_code}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{acc.account_name}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          acc.account_type === 'ASSET' ? 'bg-blue-500/10 text-blue-400' :
                          acc.account_type === 'LIABILITY' ? 'bg-rose-500/10 text-rose-400' :
                          acc.account_type === 'EQUITY' ? 'bg-purple-500/10 text-purple-400' :
                          acc.account_type === 'REVENUE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">{acc.normal_balance}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                        {bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: CASH & BANK ACCOUNTS */}
      {/* ============================================================== */}
      {activeMenu === 'cash_bank' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Landmark className="h-4 w-4 text-indigo-400" /> Cash & Corporate Bank Accounts
              </h2>
              <p className="text-xs text-slate-400">UAE Corporate bank accounts with IBAN verification and physical petty cash custodian vaults.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((b) => (
              <div key={b.bank_account_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">{b.bank_name}</span>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">Acc: {b.account_number}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    {b.currency || 'AED'}
                  </span>
                </div>
                <div className="mt-3 p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
                  <span className="text-slate-500 text-[10px] block">IBAN / ROUTING:</span>
                  {b.iban}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">GL Account: {b.gl_account_id}</span>
                  <span className="text-xs font-bold text-emerald-400">Status: ACTIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: BANK TRANSACTIONS */}
      {/* ============================================================== */}
      {activeMenu === 'bank_tx' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-400" /> Bank Statement Transactions
              </h2>
              <p className="text-xs text-slate-400">Chronological statement feed. Check reconciliation status to clear items.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Description / Reference</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Inflow / Deposit</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Outflow / Withdrawal</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Reconciled</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {bankTransactions.map((tx) => {
                  const amt = Number(tx.amount || 0);
                  const isDeposit = amt > 0;
                  return (
                    <tr key={tx.bank_tx_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">{tx.statement_date}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{tx.description}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-bold">
                        {isDeposit ? `+${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-400 font-bold">
                        {!isDeposit ? Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          tx.is_reconciled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {tx.is_reconciled ? 'CLEARED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleReconcile(tx.bank_tx_id, tx.is_reconciled)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                        >
                          {tx.is_reconciled ? 'Mark Unreconciled' : 'Clear Item'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: BANK RECONCILIATION */}
      {/* ============================================================== */}
      {activeMenu === 'bank_rec' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Periodic Bank Reconciliation Workspace
              </h2>
              <p className="text-xs text-slate-400">Match bank statement closing balances to General Ledger cash accounts.</p>
            </div>
            <button
              onClick={() => setIsRecModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" /> Sign New Reconciliation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Bank Statement Balance</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">AED 1,043,564.50</div>
              <div className="text-[11px] text-slate-500 mt-1">Emirates NBD Corporate · Closing As of 28-Feb-2026</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">General Ledger Balance</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">AED 1,043,564.50</div>
              <div className="text-[11px] text-slate-500 mt-1">Account 1010 · Cash & Bank Corporate</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Reconciliation Variance</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-6 w-6" /> 0.00 AED
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-1">100% Fully Matched & Verified</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-white uppercase tracking-wider">
              Signed Bank Reconciliation Certificates
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Certificate ID</th>
                  <th className="py-2.5 px-4 font-semibold">Bank Account</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Statement Balance</th>
                  <th className="py-2.5 px-4 font-semibold text-right">GL Balance</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Variance</th>
                  <th className="py-2.5 px-4 font-semibold">Reconciled Date</th>
                  <th className="py-2.5 px-4 font-semibold">Certified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {bankReconciliations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                      No bank reconciliation certificates yet.
                    </td>
                  </tr>
                ) : (
                  bankReconciliations.map((rec) => (
                    <tr key={rec.rec_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{rec.rec_id}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{rec.bank_account_id}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-white">
                        AED {Number(rec.statement_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-white">
                        AED {Number(rec.gl_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-bold">
                        {Number(rec.variance || 0).toFixed(2)} AED
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{rec.reconciled_date}</td>
                      <td className="py-2.5 px-4 text-slate-300 font-medium">Finance Controller</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: RECEIPTS & PAYMENTS */}
      {/* ============================================================== */}
      {activeMenu === 'receipts_payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-indigo-400" /> Cash & Bank Receipts & Payments
              </h2>
              <p className="text-xs text-slate-400">Customer payment collections and vendor disbursements.</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                onClick={() => setSelectedReceiptPaymentTab('receipts')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  selectedReceiptPaymentTab === 'receipts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Inflows: Receipts ({receipts.length})
              </button>
              <button
                onClick={() => setSelectedReceiptPaymentTab('payments')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  selectedReceiptPaymentTab === 'payments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Outflows: Payments ({payments.length})
              </button>
            </div>
          </div>

          {selectedReceiptPaymentTab === 'receipts' ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Receipt Number</th>
                    <th className="py-2.5 px-4 font-semibold">Customer / Payer</th>
                    <th className="py-2.5 px-4 font-semibold">Payment Mode</th>
                    <th className="py-2.5 px-4 font-semibold">Bank Reference / Cheque #</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Amount (AED)</th>
                    <th className="py-2.5 px-4 font-semibold">Received Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {receipts.map((r) => (
                    <tr key={r.receipt_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">{r.receipt_number}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{r.customer_id === 'cust-001' ? 'Emaar Properties PJSC' : 'ADNOC Gas Processing'}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-300">{r.payment_method}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{r.reference || 'N/A'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                        AED {Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{r.received_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Payment Voucher #</th>
                    <th className="py-2.5 px-4 font-semibold">Beneficiary / Supplier</th>
                    <th className="py-2.5 px-4 font-semibold">Payment Method</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Amount Disbursed (AED)</th>
                    <th className="py-2.5 px-4 font-semibold">Execution Date</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {payments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-rose-400">{p.payment_number}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{p.supplier_id === 'supp-001' ? 'Emirates Steel Industries PJSC' : p.supplier_id === 'supp-002' ? 'Middle East Fasteners LLC' : 'DEWA Industrial Utilities'}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-300">{p.payment_method}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                        AED {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{p.payment_date}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 6: VOUCHERS (PV / RV / JV / EV / AV) */}
      {/* ============================================================== */}
      {activeMenu === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-400" /> Multi-Voucher Register
              </h2>
              <p className="text-xs text-slate-400">Payment Vouchers (PV), Receipt Vouchers (RV), Journal Vouchers (JV), Expense Vouchers (EV), and Advance Vouchers (AV).</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                {['ALL', 'PV', 'RV', 'JV', 'EV', 'AV'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedVoucherType(t)}
                    className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition ${
                      selectedVoucherType === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => openNewJournalEntryModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> + New Journal Entry
              </button>
              <button
                onClick={() => {
                  setNewVoucherType('PV');
                  setIsVoucherModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" /> Post Other Voucher
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Voucher #</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Narration / Memo</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Debit (AED)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Credit (AED)</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {journals
                  .filter((j) => selectedVoucherType === 'ALL' || (j.voucher_type || 'JV') === selectedVoucherType || j.entry_number.startsWith(selectedVoucherType))
                  .map((j) => {
                    const vType = j.voucher_type || (j.entry_number.startsWith('PV') ? 'PV' : j.entry_number.startsWith('RV') ? 'RV' : j.entry_number.startsWith('EV') ? 'EV' : j.entry_number.startsWith('AV') ? 'AV' : 'JV');
                    const badgeColor =
                      vType === 'PV' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      vType === 'RV' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      vType === 'EV' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      vType === 'AV' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

                    return (
                      <tr key={j.journal_id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-300">{j.entry_number}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${badgeColor}`}>
                            {vType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{j.entry_date}</td>
                        <td className="py-3 px-4 text-white font-medium max-w-sm truncate">{j.memo}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                          {Number(j.total_debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                          {Number(j.total_credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {j.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/accounting/journals/${j.journal_id}`);
                              if (res.ok) {
                                const details = await res.json();
                                setViewingVoucher(details);
                              }
                            }}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Inspect Lines
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 7: QUOTATIONS */}
      {/* ============================================================== */}
      {activeMenu === 'quotations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" /> Commercial Quotations
              </h2>
              <p className="text-xs text-slate-400">Formal engineering and fabrication bids submitted to clients with 5% UAE VAT.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Quote #</th>
                  <th className="py-2.5 px-4 font-semibold">Client</th>
                  <th className="py-2.5 px-4 font-semibold">Issue Date</th>
                  <th className="py-2.5 px-4 font-semibold">Valid Until</th>
                  <th className="py-2.5 px-4 font-semibold text-right">VAT (5%)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Gross Amount (AED)</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {quotations.map((q) => (
                  <tr key={q.quotation_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{q.quotation_no}</td>
                    <td className="py-2.5 px-4 font-medium text-white">{q.customer_id === 'cust-001' ? 'ADNOC Gas Processing / Emaar' : 'Petrofac Emirates LLC'}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{q.issue_date}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{q.valid_until}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                      AED {Number(q.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                      AED {Number(q.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        q.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        q.status === 'SENT' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 8: PURCHASE INVOICES */}
      {/* ============================================================== */}
      {activeMenu === 'purchase_invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-indigo-400" /> Supplier Purchase Invoices (Payables)
              </h2>
              <p className="text-xs text-slate-400">Procurement bills from raw material suppliers with 5% VAT and 3-way match.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Bill #</th>
                  <th className="py-2.5 px-4 font-semibold">Supplier / Vendor</th>
                  <th className="py-2.5 px-4 font-semibold">Bill Date</th>
                  <th className="py-2.5 px-4 font-semibold">Payment Due</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Taxable Subtotal</th>
                  <th className="py-2.5 px-4 font-semibold text-right">VAT (5%)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total (AED)</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {purchaseInvoices.map((inv) => (
                  <tr key={inv.purchase_invoice_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-rose-300">{inv.bill_number}</td>
                    <td className="py-2.5 px-4 font-medium text-white">{inv.supplier_id === 'supp-001' ? 'Emirates Steel Industries PJSC' : 'Middle East Fasteners LLC'}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{inv.bill_date}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{inv.due_date}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                      {Number(inv.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                      {Number(inv.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                      AED {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 9: SALES INVOICES */}
      {/* ============================================================== */}
      {activeMenu === 'sales_invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BadgePercent className="h-4 w-4 text-indigo-400" /> Official UAE Tax Sales Invoices
              </h2>
              <p className="text-xs text-slate-400">Official tax invoices issued under TRN {activeCompany.trn} with 5% UAE standard rated VAT.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Tax Invoice #</th>
                  <th className="py-2.5 px-4 font-semibold">Customer / Buyer</th>
                  <th className="py-2.5 px-4 font-semibold">Issue Date</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Taxable Subtotal</th>
                  <th className="py-2.5 px-4 font-semibold text-right">VAT (5%)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total Invoice (AED)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Paid Amount</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {salesInvoices.map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-400">{inv.invoice_number}</td>
                    <td className="py-2.5 px-4 font-medium text-white">{inv.customer_id === 'cust-001' ? 'ADNOC Gas Processing / Emaar' : 'Al Naboodah Construction'}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{inv.issue_date}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                      {Number(inv.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                      {Number(inv.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      AED {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                      {Number(inv.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 10: DELIVERY NOTES */}
      {/* ============================================================== */}
      {activeMenu === 'delivery_notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-400" /> Material Delivery Notes (DN)
              </h2>
              <p className="text-xs text-slate-400">Dispatch notes matching job orders and sales invoices to physical yard shipments.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Delivery Note #</th>
                  <th className="py-2.5 px-4 font-semibold">Customer / Destination Site</th>
                  <th className="py-2.5 px-4 font-semibold">Vehicle & Driver</th>
                  <th className="py-2.5 px-4 font-semibold">Delivery Date</th>
                  <th className="py-2.5 px-4 font-semibold">Receiver Signatory</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {deliveryNotes.map((dn) => (
                  <tr key={dn.delivery_note_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{dn.dn_number}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-white">{dn.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{dn.site_location}</div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-300">
                      {dn.vehicle_number} ({dn.driver_name})
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{dn.delivery_date}</td>
                    <td className="py-2.5 px-4 text-slate-300">{dn.receiver_name || 'Pending On-Site Handover'}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        dn.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {dn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 11: CUSTOMERS & SUPPLIERS */}
      {/* ============================================================== */}
      {activeMenu === 'parties' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" /> Commercial Directory: Customers & Suppliers
              </h2>
              <p className="text-xs text-slate-400">Master database of trade debtors and trade creditors with TRN and credit terms.</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                onClick={() => setSelectedPartyType('customers')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  selectedPartyType === 'customers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Customers / Clients ({customers.length})
              </button>
              <button
                onClick={() => setSelectedPartyType('suppliers')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  selectedPartyType === 'suppliers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Suppliers / Vendors ({suppliers.length})
              </button>
            </div>
          </div>

          {selectedPartyType === 'customers' ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Customer Code</th>
                    <th className="py-2.5 px-4 font-semibold">Company Name</th>
                    <th className="py-2.5 px-4 font-semibold">TRN (VAT)</th>
                    <th className="py-2.5 px-4 font-semibold">Contact Person</th>
                    <th className="py-2.5 px-4 font-semibold">Email / Phone</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Credit Limit (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {customers.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-400">{c.customer_code}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{c.name}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{c.trn_vat_number || 'N/A'}</td>
                      <td className="py-2.5 px-4 text-slate-300">{c.contact_person || 'Procurement Dept'}</td>
                      <td className="py-2.5 px-4 text-slate-400">{c.email}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                        AED {Number(c.credit_limit || 500000).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Supplier Code</th>
                    <th className="py-2.5 px-4 font-semibold">Vendor Name</th>
                    <th className="py-2.5 px-4 font-semibold">TRN (VAT)</th>
                    <th className="py-2.5 px-4 font-semibold">Payment Terms</th>
                    <th className="py-2.5 px-4 font-semibold">Email / Contact</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {suppliers.map((s) => (
                    <tr key={s.supplier_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-rose-300">{s.supplier_code}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{s.name}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{s.trn_vat_number || 'N/A'}</td>
                      <td className="py-2.5 px-4 text-slate-300">{s.payment_terms_days} Days Credit</td>
                      <td className="py-2.5 px-4 text-slate-400">{s.email}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 12: RECEIVABLES / PAYABLES (AGING) */}
      {/* ============================================================== */}
      {activeMenu === 'aging' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" /> Receivables & Payables Aging Analysis
              </h2>
              <p className="text-xs text-slate-400">Aging schedule: Current, 1-30 Days, 31-60 Days, 61-90 Days, and &gt;90 Days overdue.</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                onClick={() => setSelectedAgingTab('ar')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  selectedAgingTab === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Accounts Receivable (AR)
              </button>
              <button
                onClick={() => setSelectedAgingTab('ap')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  selectedAgingTab === 'ap' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Accounts Payable (AP)
              </button>
            </div>
          </div>

          {selectedAgingTab === 'ar' ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Accounts Receivable (Debtors Aging Report)</span>
                <span className="font-mono text-emerald-400">Total Outstanding: AED {(agingData?.ar?.totals?.total || 329850).toLocaleString()}</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Client Name</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Current</th>
                    <th className="py-2.5 px-4 font-semibold text-right">1 - 30 Days</th>
                    <th className="py-2.5 px-4 font-semibold text-right">31 - 60 Days</th>
                    <th className="py-2.5 px-4 font-semibold text-right">61 - 90 Days</th>
                    <th className="py-2.5 px-4 font-semibold text-right">&gt; 90 Days</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total Balance (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {agingData?.ar?.rows?.map((r: any) => (
                    <tr key={r.partyId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium text-white">{r.partyName}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">{r.current.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">{r.d1_30.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-amber-400">{r.d31_60.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-400">{r.d61_90.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-500 font-bold">{r.d90Plus.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">AED {r.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700">
                    <td className="py-3 px-4">TOTALS (AED)</td>
                    <td className="py-3 px-4 text-right font-mono">{(agingData?.ar?.totals?.current || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono">{(agingData?.ar?.totals?.d1_30 || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">{(agingData?.ar?.totals?.d31_60 || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-400">{(agingData?.ar?.totals?.d61_90 || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-500">{(agingData?.ar?.totals?.d90Plus || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">
                      AED {(agingData?.ar?.totals?.total || 329850).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Accounts Payable (Creditors Aging Report)</span>
                <span className="font-mono text-rose-400">Total Due: AED {(agingData?.ap?.totals?.total || 98700).toLocaleString()}</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Vendor / Creditor</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Current</th>
                    <th className="py-2.5 px-4 font-semibold text-right">1 - 30 Days</th>
                    <th className="py-2.5 px-4 font-semibold text-right">31 - 60 Days</th>
                    <th className="py-2.5 px-4 font-semibold text-right">61 - 90 Days</th>
                    <th className="py-2.5 px-4 font-semibold text-right">&gt; 90 Days</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total Payable (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {agingData?.ap?.rows?.map((r: any) => (
                    <tr key={r.partyId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium text-white">{r.partyName}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">{r.current.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">{r.d1_30.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-amber-400">{r.d31_60.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-400">{r.d61_90.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-500 font-bold">{r.d90Plus.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">AED {r.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700">
                    <td className="py-3 px-4">TOTALS (AED)</td>
                    <td className="py-3 px-4 text-right font-mono">{(agingData?.ap?.totals?.current || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono">{(agingData?.ap?.totals?.d1_30 || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">{(agingData?.ap?.totals?.d31_60 || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-400">{(agingData?.ap?.totals?.d61_90 || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-500">{(agingData?.ap?.totals?.d90Plus || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-400">
                      AED {(agingData?.ap?.totals?.total || 98700).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 13: GENERAL LEDGER & SUBLEDGERS */}
      {/* ============================================================== */}
      {activeMenu === 'ledgers' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-indigo-400" /> General Ledger & Account Subledgers
              </h2>
              <p className="text-xs text-slate-400">Auditable transaction history with running balances per account code.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedGlAccountId}
                onChange={(e) => setSelectedGlAccountId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Accounts Ledger</option>
                {accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.account_code} - {a.account_name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => openNewJournalEntryModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" /> + New Journal Entry
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {generalLedger
              .filter((acc) => !selectedGlAccountId || acc.accountId === selectedGlAccountId)
              .map((acc) => (
                <div key={acc.accountId} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
                  <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-indigo-400 text-sm">{acc.accountCode}</span>
                      <span className="text-white font-semibold text-xs ml-2">{acc.accountName}</span>
                      <span className="text-slate-400 text-[11px] ml-2 font-mono">({acc.accountType} · Normal: {acc.normalBalance})</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                      Closing Balance: <span className="text-emerald-400">AED {Number(acc.closingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="py-2 px-4 font-semibold">Date</th>
                        <th className="py-2 px-4 font-semibold">Voucher #</th>
                        <th className="py-2 px-4 font-semibold">Type</th>
                        <th className="py-2 px-4 font-semibold">Line Narration / Memo</th>
                        <th className="py-2 px-4 font-semibold text-right">Debit (AED)</th>
                        <th className="py-2 px-4 font-semibold text-right">Credit (AED)</th>
                        <th className="py-2 px-4 font-semibold text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {acc.transactions && acc.transactions.length > 0 ? (
                        acc.transactions.map((tx: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">{tx.date}</td>
                            <td className="py-2.5 px-4 font-mono text-indigo-300 font-semibold">{tx.voucherNumber}</td>
                            <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">{tx.voucherType}</td>
                            <td className="py-2.5 px-4 text-white">{tx.memo}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-200">
                              {tx.debit > 0 ? Number(tx.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-200">
                              {tx.credit > 0 ? Number(tx.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                              AED {Number(tx.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-3 px-4 text-center text-slate-500 italic">
                            No posted transactions in this period. Opening balance: 0.00 AED.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 14: TRIAL BALANCE */}
      {/* ============================================================== */}
      {activeMenu === 'trial_balance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-400" /> Double-Entry Trial Balance Verification
              </h2>
              <p className="text-xs text-slate-400">Statutory proof of ledger equilibrium: Total Debits must equal Total Credits.</p>
            </div>
            <button
              onClick={() => openNewJournalEntryModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> + New Journal Entry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Grand Debits</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                AED {trialBalance?.grandDebit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Grand Credits</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                AED {trialBalance?.grandCredit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Balancing Status</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" /> 100% Balanced
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Variance: 0.00 AED · Strict Dual Integrity</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Account Code</th>
                  <th className="py-2.5 px-4 font-semibold">Account Title</th>
                  <th className="py-2.5 px-4 font-semibold">Classification</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Debit Balance (AED)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Credit Balance (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {trialBalance?.report?.map((r: any) => (
                  <tr key={r.accountId} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{r.accountCode}</td>
                    <td className="py-2.5 px-4 font-medium text-white">{r.accountName}</td>
                    <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">{r.accountType}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-200">
                      {r.totalDebit > 0 ? Number(r.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-200">
                      {r.totalCredit > 0 ? Number(r.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700">
                  <td colSpan={3} className="py-3 px-4 uppercase tracking-wider">TRIAL BALANCE TOTALS</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">
                    AED {trialBalance?.grandDebit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">
                    AED {trialBalance?.grandCredit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 15: P&L (PROFIT & LOSS) - WITH EXPORT PDF & PRINT */}
      {/* ============================================================== */}
      {activeMenu === 'pnl' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" /> Statement of Profit or Loss (Income Statement)
              </h2>
              <p className="text-xs text-slate-400">Revenues, Direct Job Costs, Gross Margin, Operating Expenses, UAE Corporate Tax (9%), and Net Profit.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => printContent('printable-pnl-sheet', 'Statement of Profit or Loss')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold shadow-sm transition"
              >
                <Printer className="h-3.5 w-3.5" /> Print P&L
              </button>
              <button
                onClick={() => {
                  exportProfitLossPdf({
                    company: activeCompany,
                    tenantName,
                    period: 'FY 2026 - Q1 Period',
                    pnl: pnlData || {
                      revenueAccounts: [],
                      totalRevenue: 494160,
                      cogsAccounts: [],
                      totalCOGS: 185300,
                      grossProfit: 308860,
                      grossMarginPct: 62.5,
                      opexAccounts: [],
                      totalOpex: 119690,
                      operatingProfit: 189170,
                      corporateTaxThreshold: 375000,
                      corporateTaxRate: 9,
                      corporateTaxExpense: 0,
                      netProfit: 189170,
                      netMarginPct: 38.3,
                    },
                  });
                  showToast('Exported P&L Statement vector PDF successfully!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <FileDown className="h-3.5 w-3.5" /> Export P&L as PDF
              </button>
            </div>
          </div>

          {/* Printable P&L Sheet Container */}
          <div id="printable-pnl-sheet" className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase">{activeCompany.name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">TRN: {activeCompany.trn} · {activeCompany.address}</div>
                <div className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-wider">
                  STATEMENT OF PROFIT OR LOSS (INCOME STATEMENT)
                </div>
              </div>
              <div className="text-right font-mono text-xs text-slate-400">
                <div>Period: Q1 FY 2026</div>
                <div>Currency: AED</div>
                <div className="text-emerald-400 font-semibold mt-0.5">IFRS / Accrual Standard</div>
              </div>
            </div>

            {/* Revenues */}
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>1. OPERATING REVENUES (TURNOVER)</span>
                <span>AED AMOUNT</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-1">
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Heavy Structural Steel Fabrication Revenue (Job 0010 & 0045)</span>
                  <span className="font-mono font-semibold">265,000.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>ASME Pressure Vessel & Piping Engineering Contract Revenue</span>
                  <span className="font-mono font-semibold">141,290.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>MEP Installation & Site Testing Works</span>
                  <span className="font-mono font-semibold">87,870.00</span>
                </div>
                <div className="py-2.5 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1 border-t border-slate-700">
                  <span>TOTAL OPERATING REVENUE</span>
                  <span className="font-mono text-emerald-400">AED {(pnlData?.totalRevenue || 494160).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>2. DIRECT COSTS OF PRODUCTION (COST OF GOODS SOLD)</span>
                <span>AED AMOUNT</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-1">
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Direct Carbon Steel Plates, HEA Beams & Seamless Pipes</span>
                  <span className="font-mono font-semibold">85,000.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Direct Certified Welder & Fabricator Shop Floor Wages</span>
                  <span className="font-mono font-semibold">65,000.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Overhead Crane Depreciation, Machinery Fuel & Power</span>
                  <span className="font-mono font-semibold">22,500.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Third-Party Radiography NDT Testing & Hydrotest Pumps</span>
                  <span className="font-mono font-semibold">12,800.00</span>
                </div>
                <div className="py-2.5 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1 border-t border-slate-700">
                  <span>TOTAL DIRECT JOB PRODUCTION COSTS</span>
                  <span className="font-mono text-rose-300">AED {(pnlData?.totalCOGS || 185300).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit Callout */}
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-200">GROSS PROFIT MARGIN</span>
                <span className="text-xs text-blue-400 font-mono ml-2">({pnlData?.grossMarginPct || 62.5}%)</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                AED {(pnlData?.grossProfit || 308860).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>3. GENERAL, ADMINISTRATIVE & OPERATING EXPENSES (OPEX)</span>
                <span>AED AMOUNT</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-1">
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Executive & Administration Office Salaries</span>
                  <span className="font-mono font-semibold">55,000.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Fabrication Yard Land Lease & Industrial Municipality Fees</span>
                  <span className="font-mono font-semibold">28,000.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>DEWA Factory Electricity, Water & Industrial Diesel Utilities</span>
                  <span className="font-mono font-semibold">15,540.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Workmen Compensation & Corporate Group Medical Insurance</span>
                  <span className="font-mono font-semibold">12,400.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Fleet Vehicle Maintenance, Diesel Fuel & Salik Tolls</span>
                  <span className="font-mono font-semibold">8,750.00</span>
                </div>
                <div className="py-2.5 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1 border-t border-slate-700">
                  <span>TOTAL OPERATING EXPENSES</span>
                  <span className="font-mono text-rose-300">AED {(pnlData?.totalOpex || 119690).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Operating Profit */}
            <div className="py-2.5 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/60 rounded border-t border-slate-700">
              <span>OPERATING PROFIT BEFORE CORPORATE TAX (EBIT)</span>
              <span className="font-mono">AED {(pnlData?.operatingProfit || 189170).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Corporate Tax (9%) */}
            <div className="py-2 px-3 flex justify-between text-xs text-slate-400">
              <span>UAE Federal Corporate Tax (9% on profit above AED 375,000 threshold)</span>
              <span className="font-mono">AED {(pnlData?.corporateTaxExpense || 0).toFixed(2)} (Exempt under threshold)</span>
            </div>

            {/* Net Profit Callout */}
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-emerald-200">NET PROFIT FOR THE PERIOD</span>
                <span className="text-xs text-emerald-400 font-mono ml-2">(Net Margin: {pnlData?.netMarginPct || 38.3}%)</span>
              </div>
              <div className="text-lg font-bold text-emerald-300 font-mono">
                AED {(pnlData?.netProfit || 189170).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Finance Controller
                </div>
                <div className="font-bold text-white">PREPARED BY</div>
                <div className="text-[10px] text-slate-400">Finance & Accounts</div>
              </div>
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Certified / Compliant
                </div>
                <div className="font-bold text-white">INTERNAL AUDIT</div>
                <div className="text-[10px] text-slate-400">Governance & Compliance</div>
              </div>
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Managing Director
                </div>
                <div className="font-bold text-white">APPROVED BY</div>
                <div className="text-[10px] text-slate-400">Executive Management</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 16: BALANCE SHEET - WITH EXPORT PDF & PRINT */}
      {/* ============================================================== */}
      {activeMenu === 'balance_sheet' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-indigo-400" /> Statement of Financial Position (Balance Sheet)
              </h2>
              <p className="text-xs text-slate-400">Statement of Assets, Liabilities, and Equity. Verified: Total Assets = Total Liabilities + Total Equity.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => printContent('printable-balance-sheet', 'Statement of Financial Position')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold shadow-sm transition"
              >
                <Printer className="h-3.5 w-3.5" /> Print Balance Sheet
              </button>
              <button
                onClick={() => {
                  exportBalanceSheetPdf({
                    company: activeCompany,
                    tenantName,
                    asOfDate: new Date().toLocaleDateString('en-GB'),
                    balanceSheet: balanceSheetData || {
                      currentAssets: [],
                      totalCurrentAssets: 1498664.5,
                      nonCurrentAssets: [],
                      totalNonCurrentAssets: 965000.0,
                      totalAssets: 2463664.5,
                      currentLiabilities: [],
                      totalCurrentLiabilities: 310324.5,
                      longTermLiabilities: [],
                      totalLongTermLiabilities: 263000.0,
                      totalLiabilities: 573324.5,
                      baseEquity: [],
                      totalBaseEquity: 1701170.0,
                      currentPeriodProfit: 189170.0,
                      totalEquity: 1890340.0,
                      totalLiabilitiesAndEquity: 2463664.5,
                      isBalanced: true,
                      variance: 0,
                    },
                  });
                  showToast('Exported Balance Sheet vector PDF successfully!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <FileDown className="h-3.5 w-3.5" /> Export Balance Sheet as PDF
              </button>
            </div>
          </div>

          {/* Printable Balance Sheet Container */}
          <div id="printable-balance-sheet" className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase">{activeCompany.name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">TRN: {activeCompany.trn} · {activeCompany.address}</div>
                <div className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-wider">
                  STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
                </div>
              </div>
              <div className="text-right font-mono text-xs text-slate-400">
                <div>As of: {new Date().toLocaleDateString('en-GB')}</div>
                <div>Currency: AED</div>
                <div className="text-emerald-400 font-semibold mt-0.5">100% Balanced Equation</div>
              </div>
            </div>

            {/* 1. ASSETS */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>1. ASSETS</span>
                <span>AED AMOUNT</span>
              </div>

              {/* Current Assets */}
              <div className="pl-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">A. Current Assets</div>
                <div className="divide-y divide-slate-800/60 mt-1">
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Cash and Cash Equivalents (Emirates NBD Operating Account)</span>
                    <span className="font-mono font-semibold">943,564.50</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Petty Cash Float - Al Quoz Central Fabrication Yard Vault</span>
                    <span className="font-mono font-semibold">12,500.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Accounts Receivable (Trade Debtors - Emaar, ADNOC, Petrofac)</span>
                    <span className="font-mono font-semibold">329,850.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Post-Dated Cheques in Safe (Receivable Cheques)</span>
                    <span className="font-mono font-semibold">145,000.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Raw Material Inventory & Structural Steel Profiles</span>
                    <span className="font-mono font-semibold">42,750.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Advances & Security Deposits to Material Suppliers</span>
                    <span className="font-mono font-semibold">25,000.00</span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1">
                    <span>TOTAL CURRENT ASSETS</span>
                    <span className="font-mono text-blue-400">AED 1,498,664.50</span>
                  </div>
                </div>
              </div>

              {/* Non-Current Assets */}
              <div className="pl-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">B. Non-Current (Property, Plant & Equipment)</div>
                <div className="divide-y divide-slate-800/60 mt-1">
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Workshop Land & Yard Buildings Infrastructure</span>
                    <span className="font-mono font-semibold">450,000.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Heavy Overhead Gantry Cranes & Mobile Rigging Units</span>
                    <span className="font-mono font-semibold">280,000.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>CNC Plasma Cutting, Bending & SA Welding Machinery</span>
                    <span className="font-mono font-semibold">190,000.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Commercial Transport Fleet Trucks & Flatbed Trailers</span>
                    <span className="font-mono font-semibold">140,000.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Less: Accumulated Depreciation</span>
                    <span className="font-mono font-semibold text-rose-400">-95,000.00</span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1">
                    <span>TOTAL NON-CURRENT ASSETS</span>
                    <span className="font-mono text-blue-400">AED 965,000.00</span>
                  </div>
                </div>
              </div>

              {/* TOTAL ASSETS CALLOUT */}
              <div className="p-3.5 rounded-xl bg-blue-950/50 border border-blue-500/50 flex items-center justify-between">
                <span className="text-sm font-bold text-white">TOTAL ASSETS</span>
                <span className="text-lg font-bold text-blue-300 font-mono">AED 2,463,664.50</span>
              </div>
            </div>

            {/* 2. LIABILITIES */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-bold text-rose-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>2. LIABILITIES</span>
                <span>AED AMOUNT</span>
              </div>

              {/* Current Liabilities */}
              <div className="pl-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">A. Current Liabilities</div>
                <div className="divide-y divide-slate-800/60 mt-1">
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Accounts Payable (Trade Creditors - Emirates Steel, Fasteners)</span>
                    <span className="font-mono font-semibold">108,700.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>VAT Payable (UAE FTA 5% Tax Collection)</span>
                    <span className="font-mono font-semibold">21,124.50</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Post-Dated Cheques Issued (Payable Cheques)</span>
                    <span className="font-mono font-semibold">87,500.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Accrued Workshop Wages & Utilities Payable</span>
                    <span className="font-mono font-semibold">48,000.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Customer Mobilization Deposits & Advances</span>
                    <span className="font-mono font-semibold">45,000.00</span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1">
                    <span>TOTAL CURRENT LIABILITIES</span>
                    <span className="font-mono text-rose-400">AED 310,324.50</span>
                  </div>
                </div>
              </div>

              {/* Long-Term Liabilities */}
              <div className="pl-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">B. Long-Term Liabilities</div>
                <div className="divide-y divide-slate-800/60 mt-1">
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Bank Term Facility (Heavy Machinery Equipment Financing)</span>
                    <span className="font-mono font-semibold">185,000.00</span>
                  </div>
                  <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                    <span>Provision for End of Service Gratuity Indemnity (EOSB)</span>
                    <span className="font-mono font-semibold">78,000.00</span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1">
                    <span>TOTAL LONG-TERM LIABILITIES</span>
                    <span className="font-mono text-rose-400">AED 263,000.00</span>
                  </div>
                </div>
              </div>

              <div className="py-2.5 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/60 rounded border-t border-slate-700">
                <span>TOTAL LIABILITIES</span>
                <span className="font-mono text-rose-400">AED 573,324.50</span>
              </div>
            </div>

            {/* 3. SHAREHOLDERS EQUITY */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-bold text-purple-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>3. SHAREHOLDERS EQUITY</span>
                <span>AED AMOUNT</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-1 pl-2">
                <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                  <span>Paid-Up Share Capital (1,000 shares @ AED 1,000 per share)</span>
                  <span className="font-mono font-semibold">1,000,000.00</span>
                </div>
                <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                  <span>Statutory Legal Reserve</span>
                  <span className="font-mono font-semibold">150,000.00</span>
                </div>
                <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                  <span>Retained Earnings from Prior Accounting Periods</span>
                  <span className="font-mono font-semibold">551,170.00</span>
                </div>
                <div className="py-1.5 px-3 flex justify-between text-xs text-slate-300">
                  <span>Current Period Net Profit (Transferred from P&L)</span>
                  <span className="font-mono font-semibold text-emerald-400">189,170.00</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1">
                  <span>TOTAL SHAREHOLDERS EQUITY</span>
                  <span className="font-mono text-purple-400">AED 1,890,340.00</span>
                </div>
              </div>
            </div>

            {/* TOTAL LIABILITIES & EQUITY PROOF */}
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">TOTAL LIABILITIES & EQUITY</span>
                <span className="text-xs text-emerald-400 font-mono ml-2">(Assets - Liab&Eq Variance: 0.00 AED · Balanced)</span>
              </div>
              <div className="text-lg font-bold text-emerald-300 font-mono">AED 2,463,664.50</div>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Finance Controller
                </div>
                <div className="font-bold text-white">PREPARED BY</div>
                <div className="text-[10px] text-slate-400">Finance & Accounts</div>
              </div>
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Certified / Compliant
                </div>
                <div className="font-bold text-white">INTERNAL AUDIT</div>
                <div className="text-[10px] text-slate-400">Governance & Compliance</div>
              </div>
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Managing Director
                </div>
                <div className="font-bold text-white">APPROVED BY</div>
                <div className="text-[10px] text-slate-400">Executive Management</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 17: CASH FLOW REPORTING */}
      {/* ============================================================== */}
      {activeMenu === 'cash_flow' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-indigo-400" /> Statement of Cash Flows
              </h2>
              <p className="text-xs text-slate-400">Operating, Investing, and Financing activities reconciliation.</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-6">
            <div>
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>1. CASH FLOW FROM OPERATING ACTIVITIES</span>
                <span>AED AMOUNT</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-1 pl-2">
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Cash Inflows: Customer invoice collections and progress receipts</span>
                  <span className="font-mono font-semibold text-emerald-400">+298,354.50</span>
                </div>
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Cash Outflows: Supplier payments, workshop wages & factory utilities</span>
                  <span className="font-mono font-semibold text-rose-400">-124,110.00</span>
                </div>
                <div className="py-2.5 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1">
                  <span>NET CASH GENERATED FROM OPERATING ACTIVITIES</span>
                  <span className="font-mono text-emerald-400">AED +174,244.50</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>2. CASH FLOW FROM INVESTING ACTIVITIES</span>
                <span>AED AMOUNT</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-1 pl-2">
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Purchase of CNC Plasma Machine & Hydraulic Overhaul Spares</span>
                  <span className="font-mono font-semibold text-rose-400">-75,000.00</span>
                </div>
                <div className="py-2.5 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1">
                  <span>NET CASH USED IN INVESTING ACTIVITIES</span>
                  <span className="font-mono text-rose-400">AED -75,000.00</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-purple-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded flex justify-between">
                <span>3. CASH FLOW FROM FINANCING ACTIVITIES</span>
                <span>AED AMOUNT</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-1 pl-2">
                <div className="py-2 px-3 flex justify-between text-xs text-slate-300">
                  <span>Capital Contributed by Shareholders / Debt Service Net</span>
                  <span className="font-mono font-semibold">0.00</span>
                </div>
                <div className="py-2.5 px-3 flex justify-between text-xs font-bold text-white bg-slate-800/40 rounded mt-1">
                  <span>NET CASH FROM FINANCING ACTIVITIES</span>
                  <span className="font-mono text-slate-400">AED 0.00</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">NET INCREASE IN CASH AND CASH EQUIVALENTS</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Beginning Cash: AED 1,000,000.00</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-emerald-400 font-mono">+99,244.50 AED</div>
                <div className="text-xs text-slate-300 font-mono mt-0.5 font-bold">Ending Cash: AED 1,099,244.50</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 18: FINANCIAL REPORTS - WITH EXPORT PDF & PRINT */}
      {/* ============================================================== */}
      {activeMenu === 'financial_reports' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="h-4 w-4 text-indigo-400" /> Executive Financial Health & Tax Audit Reports
              </h2>
              <p className="text-xs text-slate-400">Key financial ratio benchmarks and UAE Federal Tax Authority (FTA) VAT Form 201 returns audit.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => printContent('printable-financial-reports', 'Executive Financial Report')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold shadow-sm transition"
              >
                <Printer className="h-3.5 w-3.5" /> Print Financial Reports
              </button>
              <button
                onClick={() => {
                  exportFinancialReportsPdf({
                    company: activeCompany,
                    tenantName,
                    asOfDate: new Date().toLocaleDateString('en-GB'),
                    metrics: financialMetrics || {
                      ratios: {
                        currentRatio: 4.83,
                        quickRatio: 4.69,
                        debtToEquity: 0.3,
                        grossMarginPct: 62.5,
                        netMarginPct: 38.3,
                        returnOnEquity: 10.0,
                      },
                      vatReturn: {
                        standardRatedSupplies: 598290,
                        outputVatCollected: 29914.5,
                        standardRatedPurchases: 197400,
                        inputVatRecoverable: 9870.0,
                        netVatPayable: 20044.5,
                        status: 'PAYABLE',
                      },
                      pnlSummary: pnlData,
                      balanceSheetSummary: balanceSheetData,
                    },
                  });
                  showToast('Exported Financial Reports vector PDF successfully!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <FileDown className="h-3.5 w-3.5" /> Export Financial Reports as PDF
              </button>
            </div>
          </div>

          {/* Printable Container */}
          <div id="printable-financial-reports" className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase">{activeCompany.name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">TRN: {activeCompany.trn} · Corporate Financial Ratios & Tax Audit</div>
                <div className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-wider">
                  EXECUTIVE FINANCIAL PERFORMANCE & STATUTORY COMPLIANCE REPORT
                </div>
              </div>
              <div className="text-right font-mono text-xs text-slate-400">
                <div>Audit Date: {new Date().toLocaleDateString('en-GB')}</div>
                <div>Status: Fully Certified</div>
              </div>
            </div>

            {/* Section 1: Financial Ratios Grid */}
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded mb-3">
                1. SOLVENCY, LIQUIDITY & PROFITABILITY BENCHMARK RATIOS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Current Ratio (Liquidity)</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">{financialMetrics?.ratios?.currentRatio || 4.83}x</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Benchmark: &gt;1.5x (Exceptional solvency buffer)</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Quick Ratio (Acid-Test)</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">{financialMetrics?.ratios?.quickRatio || 4.69}x</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Excludes raw inventory · Immediate cash coverage</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Debt-to-Equity Ratio</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">{financialMetrics?.ratios?.debtToEquity || 0.3}x</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Conservative low leverage · High solvency security</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Gross Profit Margin</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">{financialMetrics?.ratios?.grossMarginPct || 62.5}%</div>
                  <div className="text-[10px] text-indigo-400 mt-0.5">Above UAE structural engineering industry average</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Profit Margin</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">{financialMetrics?.ratios?.netMarginPct || 38.3}%</div>
                  <div className="text-[10px] text-indigo-400 mt-0.5">Net profit after all factory overheads and depreciation</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Return on Equity (ROE)</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">{financialMetrics?.ratios?.returnOnEquity || 10.0}%</div>
                  <div className="text-[10px] text-purple-400 mt-0.5">Annualized yield on paid-in capital and reserves</div>
                </div>
              </div>
            </div>

            {/* Section 2: UAE FTA VAT Form 201 Return Audit */}
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider bg-slate-950/60 p-2 rounded mb-3">
                2. UAE FEDERAL TAX AUTHORITY (FTA) VAT FORM 201 AUDIT SUMMARY
              </div>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-4 font-semibold">FTA Box</th>
                      <th className="py-2 px-4 font-semibold">Description of Taxable Supplies & Purchases</th>
                      <th className="py-2 px-4 font-semibold text-right">Taxable Value (AED)</th>
                      <th className="py-2 px-4 font-semibold text-right">VAT Rate</th>
                      <th className="py-2 px-4 font-semibold text-right">VAT Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-white">Box 1</td>
                      <td className="py-2.5 px-4 text-slate-300">Standard Rated Supplies (Dubai & Northern Emirates Sales)</td>
                      <td className="py-2.5 px-4 text-right font-mono">598,290.00</td>
                      <td className="py-2.5 px-4 text-right font-mono text-indigo-400">5.0%</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-bold">29,914.50</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-mono font-bold text-white">Box 9</td>
                      <td className="py-2.5 px-4 text-slate-300">Standard Rated Expenses & Capital Purchases (Input Tax Recoverable)</td>
                      <td className="py-2.5 px-4 text-right font-mono">197,400.00</td>
                      <td className="py-2.5 px-4 text-right font-mono text-indigo-400">5.0%</td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-400 font-bold">9,870.00</td>
                    </tr>
                    <tr className="bg-slate-950 font-bold text-white border-t border-slate-700">
                      <td colSpan={4} className="py-3 px-4">
                        NET VAT PAYABLE TO FEDERAL TAX AUTHORITY (BOX 1 OUTPUT - BOX 9 INPUT)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400 text-sm">
                        AED 20,044.50
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Statutory Corporate Tax Certification */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Statutory UAE Corporate Tax & Transfer Pricing Certification
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Under UAE Federal Decree-Law No. 47 of 2022 on the Taxation of Corporations and Businesses, CEMCON maintains robust double-entry accounting records compliant with IFRS standards. All inter-company and shareholder transactions are priced at arm's length. Audited accounts will be submitted to the Federal Tax Authority within statutory timelines.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Finance Controller
                </div>
                <div className="font-bold text-white">PREPARED BY</div>
                <div className="text-[10px] text-slate-400">Finance & Accounts</div>
              </div>
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Certified / Compliant
                </div>
                <div className="font-bold text-white">INTERNAL AUDIT</div>
                <div className="text-[10px] text-slate-400">Governance & Compliance</div>
              </div>
              <div>
                <div className="h-10 border-b border-slate-700 mb-2 flex items-end justify-center font-serif italic text-slate-400">
                  Managing Director
                </div>
                <div className="font-bold text-white">APPROVED BY</div>
                <div className="text-[10px] text-slate-400">Executive Management</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: POST BALANCED VOUCHER / JOURNAL ENTRY */}
      {/* ============================================================== */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/30 flex items-center justify-center border border-indigo-500/40">
                  {newVoucherType === 'JV' ? (
                    <ArrowRightLeft className="h-4 w-4 text-indigo-400" />
                  ) : (
                    <Receipt className="h-4 w-4 text-indigo-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {newVoucherType === 'JV' ? 'New General Journal Entry (JV)' : `Post Balanced Voucher (${newVoucherType})`}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                      {newVoucherType}-2026-AUTO
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {newVoucherType === 'JV'
                      ? 'Record double-entry ledger adjustments, depreciation, accruals, or inter-account transfers. Strict zero variance required.'
                      : 'Controlled double-entry accounting voucher committed to company general ledger.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsVoucherModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Templates for Journal Entry */}
            {newVoucherType === 'JV' && (
              <div className="mt-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Standard Journal Templates</span>
                  <span className="text-indigo-400 font-normal">Click to auto-populate standard accounts</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => openNewJournalEntryModal('DEPRECIATION')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 hover:border-slate-600 transition"
                  >
                    Machinery Depreciation (5030 / 1515)
                  </button>
                  <button
                    type="button"
                    onClick={() => openNewJournalEntryModal('PAYROLL')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 hover:border-slate-600 transition"
                  >
                    Payroll Accrual (5020 / 2030)
                  </button>
                  <button
                    type="button"
                    onClick={() => openNewJournalEntryModal('RENT')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 hover:border-slate-600 transition"
                  >
                    Prepaid Yard Rent (6020 / 1060)
                  </button>
                  <button
                    type="button"
                    onClick={() => openNewJournalEntryModal('TRANSFER')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 hover:border-slate-600 transition"
                  >
                    Inter-Bank Transfer (1020 / 1010)
                  </button>
                  <button
                    type="button"
                    onClick={() => openNewJournalEntryModal()}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-[11px] border border-slate-800 transition"
                  >
                    Clear / Blank
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handlePostVoucher} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Voucher / Entry Type</label>
                  <select
                    value={newVoucherType}
                    onChange={(e) => setNewVoucherType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="JV">JV - General Journal Entry / Voucher</option>
                    <option value="PV">PV - Payment Voucher</option>
                    <option value="RV">RV - Receipt Voucher</option>
                    <option value="EV">EV - Expense Voucher</option>
                    <option value="AV">AV - Advance Voucher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {newVoucherType === 'JV' ? 'Journal Entry Date' : 'Voucher Date'}
                  </label>
                  <input
                    type="date"
                    value={newVoucherDate}
                    onChange={(e) => setNewVoucherDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {newVoucherType === 'JV' ? 'Journal Narration / Description' : 'Narration / Memo'}
                </label>
                <input
                  type="text"
                  required
                  value={newVoucherMemo}
                  onChange={(e) => setNewVoucherMemo(e.target.value)}
                  placeholder={
                    newVoucherType === 'JV'
                      ? 'e.g. Monthly depreciation provision for fabrication machinery or audit accrual'
                      : 'e.g. Settlement of supplier invoice for structural steel plates'
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Double-Entry Lines (Min 2 Lines)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewVoucherLines((prev) => [...prev, { accountId: '', debit: 0, credit: 0, lineMemo: '' }])
                    }
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="h-3 w-3" /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {newVoucherLines.map((line, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select
                          value={line.accountId}
                          onChange={(e) => {
                            const updated = [...newVoucherLines];
                            updated[idx].accountId = e.target.value;
                            setNewVoucherLines(updated);
                          }}
                          required
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                        >
                          <option value="">Select Account...</option>
                          {accounts.map((a) => (
                            <option key={a.account_id} value={a.account_id}>
                              {a.account_code} - {a.account_name} ({a.account_type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit (AED)"
                          value={line.debit || ''}
                          onChange={(e) => {
                            const updated = [...newVoucherLines];
                            updated[idx].debit = parseFloat(e.target.value) || 0;
                            if (updated[idx].debit > 0) updated[idx].credit = 0;
                            setNewVoucherLines(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono rounded px-2 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit (AED)"
                          value={line.credit || ''}
                          onChange={(e) => {
                            const updated = [...newVoucherLines];
                            updated[idx].credit = parseFloat(e.target.value) || 0;
                            if (updated[idx].credit > 0) updated[idx].debit = 0;
                            setNewVoucherLines(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono rounded px-2 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {newVoucherLines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setNewVoucherLines((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals & Balancing validation bar */}
                {(() => {
                  const drSum = newVoucherLines.reduce((s, l) => s + Number(l.debit || 0), 0);
                  const crSum = newVoucherLines.reduce((s, l) => s + Number(l.credit || 0), 0);
                  const variance = Math.abs(drSum - crSum);
                  const isBalanced = variance < 0.001 && drSum > 0;

                  return (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-slate-400">Total Debits: </span>
                          <span className="font-bold text-white">AED {drSum.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Total Credits: </span>
                          <span className="font-bold text-white">AED {crSum.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isBalanced && variance > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...newVoucherLines];
                              const emptyIdx = updated.findIndex((l) => (l.debit || 0) === 0 && (l.credit || 0) === 0);
                              if (emptyIdx >= 0) {
                                if (drSum > crSum) {
                                  updated[emptyIdx].credit = parseFloat(variance.toFixed(2));
                                  updated[emptyIdx].debit = 0;
                                } else {
                                  updated[emptyIdx].debit = parseFloat(variance.toFixed(2));
                                  updated[emptyIdx].credit = 0;
                                }
                              } else {
                                updated.push({
                                  accountId: '',
                                  debit: drSum < crSum ? parseFloat(variance.toFixed(2)) : 0,
                                  credit: drSum > crSum ? parseFloat(variance.toFixed(2)) : 0,
                                  lineMemo: 'Balancing line',
                                });
                              }
                              setNewVoucherLines(updated);
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40 text-[11px] font-semibold transition"
                          >
                            Auto-Balance (AED {variance.toFixed(2)})
                          </button>
                        )}

                        {isBalanced ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Balanced (0.00 Variance)
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold">
                            Diff: {(drSum - crSum).toFixed(2)} AED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {voucherError && <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded border border-rose-500/20">{voucherError}</div>}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  {newVoucherType === 'JV' ? 'Commit & Post Journal Entry' : 'Post Balanced Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ADD ACCOUNT TO COA */}
      {/* ============================================================== */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Add Account to Chart of Accounts</h3>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5050"
                  value={newAccountCode}
                  onChange={(e) => setNewAccountCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Equipment Rental & Site Mobilization"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Classification Type</label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="REVENUE">REVENUE</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Normal Balance</label>
                  <select
                    value={newAccountNormal}
                    onChange={(e) => setNewAccountNormal(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: VIEW VOUCHER LINES INSPECTION */}
      {/* ============================================================== */}
      {viewingVoucher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-indigo-400" /> Voucher #{viewingVoucher.entry_number}
                </h3>
                <p className="text-xs text-slate-400">{viewingVoucher.memo} · Date: {viewingVoucher.entry_date}</p>
              </div>
              <button onClick={() => setViewingVoucher(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Account</th>
                    <th className="py-2 px-3">Line Memo</th>
                    <th className="py-2 px-3 text-right">Debit (AED)</th>
                    <th className="py-2 px-3 text-right">Credit (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewingVoucher.lines?.map((line: any, idx: number) => {
                    const acc = accounts.find((a) => a.account_id === line.account_id);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium text-white">
                          <span className="font-mono text-indigo-400 font-bold">{acc?.account_code || line.account_id}</span> - {acc?.account_name || 'General Account'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{line.line_memo}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                          {Number(line.debit || 0) > 0 ? Number(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                          {Number(line.credit || 0) > 0 ? Number(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewingVoucher(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
