/**
 * Compenia ERP - Procurement Department Suite
 * Complete 8-Operation Menu Map:
 * 1. Purchase Requests
 * 2. Approval Hierarchy
 * 3. Supplier Quotations/ RFQ
 * 4. Goods Received / Delivery Notes
 * 5. Supplier Invoices
 * 6. Purchase Approvals
 * 7. Payments
 * 8. Procurement Reports (Print & Export as PDF)
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  FileText,
  GitBranch,
  FileCheck,
  PackageCheck,
  Receipt,
  CheckCircle2,
  XCircle,
  CreditCard,
  BarChart3,
  Plus,
  RefreshCw,
  Search,
  Printer,
  FileDown,
  Building2,
  Clock,
  AlertTriangle,
  Award,
  Eye,
  Truck,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  X,
  Check,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { CemconCompanyInfo } from '../hr/HRPrintableForms';
import { exportProcurementReportPdf } from '../../utils/procurementPdfGenerator';

export type ProcurementMenuOption =
  | 'purchase_requests'
  | 'approval_hierarchy'
  | 'rfq_quotations'
  | 'goods_received'
  | 'supplier_invoices'
  | 'purchase_approvals'
  | 'payments'
  | 'procurement_reports';

interface ProcurementModuleProps {
  activeCompany: CemconCompanyInfo;
  tenantName: string;
  userRole?: string;
}

export const ProcurementModule: React.FC<ProcurementModuleProps> = ({
  activeCompany,
  tenantName,
  userRole = 'ADMIN',
}) => {
  const [activeMenu, setActiveMenu] = useState<ProcurementMenuOption>('purchase_requests');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Data states
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [approvalHierarchy, setApprovalHierarchy] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [supplierQuotes, setSupplierQuotes] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<any[]>([]);
  const [threeWayMatches, setThreeWayMatches] = useState<any[]>([]);
  const [purchaseApprovals, setPurchaseApprovals] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRfqId, setSelectedRfqId] = useState<string>('');
  const [goodsReceiptTab, setGoodsReceiptTab] = useState<'grn' | 'delivery_notes'>('grn');

  // Modals
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [newPrTitle, setNewPrTitle] = useState('');
  const [newPrJobNo, setNewPrJobNo] = useState('0011');
  const [newPrPriority, setNewPrPriority] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [newPrAmount, setNewPrAmount] = useState<number>(25000);
  const [newPrJustification, setNewPrJustification] = useState('');
  const [newPrItemName, setNewPrItemName] = useState('Structural Steel HEA 200 European Beams S355JR');
  const [newPrItemQty, setNewPrItemQty] = useState<number>(50);
  const [newPrItemUom, setNewPrItemUom] = useState('MTR');

  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [newRfqTitle, setNewRfqTitle] = useState('');
  const [newRfqDeadline, setNewRfqDeadline] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );

  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [newGrnPoNo, setNewGrnPoNo] = useState('PO-CEMCON-2026-0091');
  const [newGrnSupplier, setNewGrnSupplier] = useState('Emirates Steel Industries PJSC');
  const [newGrnVdn, setNewGrnVdn] = useState('');
  const [newGrnVehicle, setNewGrnVehicle] = useState('AD 55201');
  const [newGrnValue, setNewGrnValue] = useState<number>(94000);
  const [newGrnMtc, setNewGrnMtc] = useState('MTC-EN10204-3.1-ES9940');

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newInvSupplier, setNewInvSupplier] = useState('supp-001');
  const [newInvBillNo, setNewInvBillNo] = useState('');
  const [newInvSubtotal, setNewInvSubtotal] = useState<number>(45000);
  const [newInvDueDate, setNewInvDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newPaySupplier, setNewPaySupplier] = useState('supp-001');
  const [newPayAmount, setNewPayAmount] = useState<number>(47250);
  const [newPayMethod, setNewPayMethod] = useState<'BANK_TRANSFER' | 'CHEQUE' | 'PDC'>('BANK_TRANSFER');
  const [newPayRef, setNewPayRef] = useState('');

  const [viewingItemsModal, setViewingItemsModal] = useState<{ title: string; items: any[] } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Procurement Data
  useEffect(() => {
    const fetchProcurementData = async () => {
      setLoading(true);
      try {
        const [
          prRes,
          hierarchyRes,
          rfqRes,
          quotesRes,
          poRes,
          grnRes,
          dnRes,
          pinvRes,
          matchRes,
          approvalsRes,
          paymentsRes,
          analyticsRes,
          suppRes,
        ] = await Promise.all([
          fetch('/api/procurement/purchase-requests').then((r) => r.json()),
          fetch('/api/procurement/approval-hierarchy').then((r) => r.json()),
          fetch('/api/procurement/rfqs').then((r) => r.json()),
          fetch('/api/procurement/supplier-quotations').then((r) => r.json()),
          fetch('/api/procurement/purchase-orders').then((r) => r.json()),
          fetch('/api/procurement/goods-receipts').then((r) => r.json()),
          fetch('/api/logistics/delivery-notes').then((r) => r.json()),
          fetch('/api/accounting/purchase-invoices').then((r) => r.json()),
          fetch('/api/procurement/three-way-match').then((r) => r.json()),
          fetch('/api/procurement/approvals').then((r) => r.json()),
          fetch('/api/accounting/payments').then((r) => r.json()),
          fetch('/api/procurement/analytics').then((r) => r.json()),
          fetch('/api/suppliers').then((r) => r.json()),
        ]);

        if (prRes.data) setPurchaseRequests(prRes.data);
        if (Array.isArray(hierarchyRes)) setApprovalHierarchy(hierarchyRes);
        if (rfqRes.data) {
          setRfqs(rfqRes.data);
          if (rfqRes.data.length > 0 && !selectedRfqId) {
            setSelectedRfqId(rfqRes.data[0].rfq_id);
          }
        }
        if (quotesRes.data) setSupplierQuotes(quotesRes.data);
        if (poRes.data) setPurchaseOrders(poRes.data);
        if (grnRes.data) setGoodsReceipts(grnRes.data);
        if (dnRes.data) setDeliveryNotes(dnRes.data);
        if (pinvRes.data) setSupplierInvoices(pinvRes.data);
        if (Array.isArray(matchRes)) setThreeWayMatches(matchRes);
        if (approvalsRes.data) setPurchaseApprovals(approvalsRes.data);
        if (paymentsRes.data) setPayments(paymentsRes.data);
        if (analyticsRes.kpis) setAnalyticsData(analyticsRes);
        if (suppRes.data) setSuppliers(suppRes.data);
      } catch (err) {
        console.error('Error fetching procurement data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProcurementData();
  }, [refreshTrigger]);

  // Actions
  const handleCreatePr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/procurement/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPrTitle,
          job_number: newPrJobNo,
          priority: newPrPriority,
          estimated_amount: newPrAmount,
          justification: newPrJustification,
          items: [
            {
              itemCode: 'STL-CUSTOM-01',
              description: newPrItemName,
              qty: newPrItemQty,
              uom: newPrItemUom,
              estRate: newPrAmount / (newPrItemQty || 1),
              estTotal: newPrAmount,
            },
          ],
        }),
      });

      if (res.ok) {
        setIsPrModalOpen(false);
        setNewPrTitle('');
        setNewPrJustification('');
        showToast('Purchase Request submitted successfully!');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create PR');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/procurement/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRfqTitle,
          deadline: newRfqDeadline,
          items: [
            { itemCode: 'STL-BEAM-HEA200', description: 'Structural Steel HEA 200 European Beams S355JR', qty: 100, uom: 'MTR' },
          ],
        }),
      });

      if (res.ok) {
        setIsRfqModalOpen(false);
        setNewRfqTitle('');
        showToast('RFQ issued to approved vendors!');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAwardQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/procurement/supplier-quotations/${quoteId}/award`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('Supplier Quotation awarded and Purchase Order generated!');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/procurement/goods-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_number: newGrnPoNo,
          supplier_name: newGrnSupplier,
          vendor_delivery_note_no: newGrnVdn || `VDN-${Math.floor(Math.random() * 90000) + 10000}`,
          vehicle_number: newGrnVehicle,
          total_value: newGrnValue,
          mtc_number: newGrnMtc,
          inspected_by: 'QA/QC Inspector',
          items: [
            { itemCode: 'STL-PLATE-S355', description: 'Consignment structural steel items', qty: 1, uom: 'LOT', totalCost: newGrnValue },
          ],
        }),
      });

      if (res.ok) {
        setIsGrnModalOpen(false);
        showToast('Goods Receipt (GRN) inspected and accepted into warehouse stock!');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vat = Math.round(newInvSubtotal * 0.05 * 100) / 100;
      const res = await fetch('/api/accounting/purchase-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: newInvSupplier,
          bill_number: newInvBillNo || `BILL-SUPP-${Math.floor(Math.random() * 90000) + 10000}`,
          bill_date: new Date().toISOString().split('T')[0],
          due_date: newInvDueDate,
          subtotal: newInvSubtotal,
          tax_amount: vat,
          total_amount: newInvSubtotal + vat,
        }),
      });

      if (res.ok) {
        setIsInvoiceModalOpen(false);
        showToast('Supplier Invoice registered for 3-Way Matching!');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: newPaySupplier,
          amount: newPayAmount,
          payment_method: newPayMethod,
          payment_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        setIsPaymentModalOpen(false);
        showToast('Payment disbursement recorded successfully!');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleProcessApproval = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/approvals/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments: `Procurement signoff by ${userRole}` }),
      });
      if (res.ok) {
        showToast(`Request successfully ${action === 'APPROVE' ? 'Approved' : 'Rejected'}!`);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Print Handler
  const printContent = (elementId: string, title: string) => {
    try {
      const existingIframe = document.getElementById('cemcon-procurement-print-frame');
      if (existingIframe) existingIframe.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'cemcon-procurement-print-frame';
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

      if (!doc || !targetEl) throw new Error('Print container not found');

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
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; }
              th { background-color: #f1f5f9; text-align: left; font-weight: 600; }
              .text-right { text-align: right; }
              .font-mono { font-family: monospace; }
            </style>
          </head>
          <body>
            <div>${targetEl.innerHTML}</div>
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
    } catch (err) {
      console.error(err);
      window.print();
    }
  };

  // 8 Operations Menu Map
  interface MenuItem {
    id: ProcurementMenuOption;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badge?: string;
    highlight?: boolean;
  }

  const menuItems: MenuItem[] = [
    { id: 'purchase_requests', label: 'Purchase Requests', icon: ShoppingCart, count: purchaseRequests.length },
    { id: 'approval_hierarchy', label: 'Approval Hierarchy', icon: GitBranch, badge: '4 Tiers' },
    { id: 'rfq_quotations', label: 'Supplier Quotations/ RFQ', icon: FileCheck, count: rfqs.length },
    { id: 'goods_received', label: 'Goods Received / Delivery Notes', icon: PackageCheck, count: goodsReceipts.length + deliveryNotes.length },
    { id: 'supplier_invoices', label: 'Supplier Invoices', icon: Receipt, count: supplierInvoices.length, highlight: true },
    { id: 'purchase_approvals', label: 'Purchase Approvals', icon: CheckCircle2, badge: purchaseApprovals.length > 0 ? `${purchaseApprovals.length} Due` : undefined, highlight: true },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
    { id: 'procurement_reports', label: 'Procurement Reports', icon: BarChart3, highlight: true },
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
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Procurement & Contracts Department
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                    3-Way Match · Mill Test Traceability · UAE VAT
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Operating Entity: <span className="text-white font-semibold">{activeCompany.name}</span> · TRN:{' '}
                  <span className="font-mono text-blue-300">{activeCompany.trn}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & New PR Action */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPrModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform active:scale-95 border border-blue-400/40 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ New Purchase Request</span>
            </button>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Spend</div>
              <div className="text-sm font-bold text-white font-mono">
                AED {(analyticsData?.kpis?.totalProcurementSpend || 207270).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">3-Way Match</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {analyticsData?.kpis?.threeWayMatchRate || 98.6}%
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Orders</div>
              <div className="text-sm font-bold text-indigo-400 font-mono">
                {purchaseOrders.length || 4} POs
              </div>
            </div>
          </div>
        </div>

        {/* 8-Option Menu Map Navigation Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Procurement Menu Map (8 Controlled Operations)</span>
            <span className="text-slate-500 font-mono text-[10px]">
              Active Operation: {activeMenu.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : item.highlight
                      ? 'bg-slate-800/90 text-blue-200 hover:bg-slate-800 hover:text-white border border-blue-500/30'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
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
      {/* VIEW 1: PURCHASE REQUESTS */}
      {/* ============================================================== */}
      {activeMenu === 'purchase_requests' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-400" /> Material & Service Purchase Requests (PR)
              </h2>
              <p className="text-xs text-slate-400">
                Site requisitions linked to job orders, audited against project bill of quantities (BOQ).
              </p>
            </div>
            <button
              onClick={() => setIsPrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" /> + New Purchase Request
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">PR #</th>
                    <th className="py-2.5 px-4 font-semibold">Requisition Title</th>
                    <th className="py-2.5 px-4 font-semibold">Job Order</th>
                    <th className="py-2.5 px-4 font-semibold">Requested By</th>
                    <th className="py-2.5 px-4 font-semibold">Priority</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Est. Amount (AED)</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {purchaseRequests.map((pr) => {
                    const items = typeof pr.items_json === 'string' ? JSON.parse(pr.items_json || '[]') : [];
                    return (
                      <tr key={pr.pr_id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-300">{pr.pr_no}</td>
                        <td className="py-3 px-4 font-medium text-white max-w-xs truncate">{pr.title}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                          {pr.job_number ? `Job #${pr.job_number}` : 'Operational'}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{pr.requested_by}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                              pr.priority === 'CRITICAL'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : pr.priority === 'URGENT'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {pr.priority || 'NORMAL'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          AED {Number(pr.estimated_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              pr.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : pr.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {pr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setViewingItemsModal({ title: `${pr.pr_no}: ${pr.title}`, items })}
                            className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                          >
                            View Items ({items.length})
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

      {/* ============================================================== */}
      {/* VIEW 2: APPROVAL HIERARCHY */}
      {/* ============================================================== */}
      {activeMenu === 'approval_hierarchy' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-blue-400" /> Procurement Approval Hierarchy & Threshold Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Tiered financial authority governance matrix enforcing delegation of authority (DOA) and co-signing rules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {approvalHierarchy.map((tier) => (
              <div
                key={tier.level}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      LEVEL {tier.level}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" /> SLA {tier.slaHours}h
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{tier.tierName}</h3>
                  <div className="text-xs font-semibold text-blue-300 mt-1">{tier.roleTitle}</div>
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Spending Authority Limit</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                      {tier.maxLimit >= 999999999 ? 'Unlimited / Board' : `Up to AED ${tier.maxLimit.toLocaleString()}`}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">{tier.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Designated Authorizers</div>
                  <div className="space-y-1">
                    {tier.activeDelegates.map((del: string, idx: number) => (
                      <div key={idx} className="text-xs text-slate-200 flex items-center gap-1.5 font-medium">
                        <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                        <span>{del}</span>
                      </div>
                    ))}
                  </div>
                  {tier.requiresCoSign && (
                    <div className="mt-2 text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-amber-400" />
                      <span>Co-sign required: {tier.coSignerTitle}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: SUPPLIER QUOTATIONS / RFQ */}
      {/* ============================================================== */}
      {activeMenu === 'rfq_quotations' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-400" /> Requests for Quotation (RFQ) & Comparative Bidding
              </h2>
              <p className="text-xs text-slate-400">
                Issue RFQs to vetted vendors, compare side-by-side quotations, and award contracts with 1-click PO generation.
              </p>
            </div>
            <button
              onClick={() => setIsRfqModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" /> + Create New RFQ
            </button>
          </div>

          {/* RFQ Selector tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {rfqs.map((rfq) => (
              <button
                key={rfq.rfq_id}
                onClick={() => setSelectedRfqId(rfq.rfq_id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap border ${
                  selectedRfqId === rfq.rfq_id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className="font-mono font-bold">{rfq.rfq_no}</span>
                <span className="truncate max-w-[200px]">{rfq.title}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    rfq.status === 'AWARDED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {rfq.status}
                </span>
              </button>
            ))}
          </div>

          {/* Comparative Bid Matrix */}
          {(() => {
            const currentRfq = rfqs.find((r) => r.rfq_id === selectedRfqId) || rfqs[0];
            const quotes = supplierQuotes.filter((q) => q.rfq_id === (currentRfq?.rfq_id || ''));

            return (
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Comparative Bid Evaluation Table · {currentRfq?.rfq_no}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">{currentRfq?.title} · Deadline: {currentRfq?.deadline}</div>
                  </div>
                  <span className="text-[11px] text-blue-300 font-mono">Bids Received: {quotes.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Vendor Name</th>
                        <th className="py-2.5 px-4 font-semibold">Bid Reference</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Total Quoted (AED)</th>
                        <th className="py-2.5 px-4 font-semibold">Delivery Lead Time</th>
                        <th className="py-2.5 px-4 font-semibold">Payment Terms</th>
                        <th className="py-2.5 px-4 font-semibold">Technical Compliance</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Award Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {quotes.map((q) => (
                        <tr
                          key={q.supplier_quotation_id}
                          className={`${q.selected ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'}`}
                        >
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            {q.supplier_name}
                            {q.selected && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                AWARDED
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{q.quote_reference}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                            AED {Number(q.total_quoted).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono">{q.delivery_lead_days} Days Ex-Works</td>
                          <td className="py-3 px-4 text-slate-300">{q.payment_terms}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              {q.compliance_status || 'PASSED'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {q.selected ? (
                              <span className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                                <Check className="h-4 w-4" /> Contract Awarded
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAwardQuote(q.supplier_quotation_id)}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition"
                              >
                                Award & Issue PO
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: GOODS RECEIVED / DELIVERY NOTES */}
      {/* ============================================================== */}
      {activeMenu === 'goods_received' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-blue-400" /> Goods Received Notes (GRN) & Delivery Notes
              </h2>
              <p className="text-xs text-slate-400">
                Warehouse gate intake with QA/QC inspection, mill test certificates (MTC), and client site delivery notes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setGoodsReceiptTab('grn')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    goodsReceiptTab === 'grn' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Inward Receipts (GRN: {goodsReceipts.length})
                </button>
                <button
                  onClick={() => setGoodsReceiptTab('delivery_notes')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    goodsReceiptTab === 'delivery_notes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Delivery Notes ({deliveryNotes.length})
                </button>
              </div>
              {goodsReceiptTab === 'grn' && (
                <button
                  onClick={() => setIsGrnModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" /> + New Goods Receipt
                </button>
              )}
            </div>
          </div>

          {goodsReceiptTab === 'grn' ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">GRN #</th>
                      <th className="py-2.5 px-4 font-semibold">Purchase Order #</th>
                      <th className="py-2.5 px-4 font-semibold">Supplier Name</th>
                      <th className="py-2.5 px-4 font-semibold">Vendor DN #</th>
                      <th className="py-2.5 px-4 font-semibold">Mill Test Cert (MTC)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Intake Value (AED)</th>
                      <th className="py-2.5 px-4 font-semibold">Receipt Date</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {goodsReceipts.map((grn) => (
                      <tr key={grn.grn_id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-300">{grn.grn_number}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{grn.po_number || 'PO-2026-0091'}</td>
                        <td className="py-3 px-4 font-medium text-white">{grn.supplier_name}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{grn.vendor_delivery_note_no}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-indigo-300">{grn.mtc_number}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          AED {Number(grn.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{grn.receipt_date}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {grn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">DN Number</th>
                      <th className="py-2.5 px-4 font-semibold">Customer / Site</th>
                      <th className="py-2.5 px-4 font-semibold">Delivery Date</th>
                      <th className="py-2.5 px-4 font-semibold">Vehicle & Driver</th>
                      <th className="py-2.5 px-4 font-semibold">Site Location</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {deliveryNotes.map((dn) => (
                      <tr key={dn.delivery_note_id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-300">{dn.dn_number}</td>
                        <td className="py-3 px-4 font-medium text-white">{dn.customer_name}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{dn.delivery_date}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {dn.vehicle_number} ({dn.driver_name})
                        </td>
                        <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{dn.site_location}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: SUPPLIER INVOICES (3-WAY MATCHING) */}
      {/* ============================================================== */}
      {activeMenu === 'supplier_invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-400" /> Supplier Invoices & 3-Way Matching Engine
              </h2>
              <p className="text-xs text-slate-400">
                Automated 3-way reconciliation (PO rate vs. GRN inspected quantity vs. Supplier tax invoice) with 0% leak tolerance.
              </p>
            </div>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" /> + Register Supplier Invoice
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                    <th className="py-2.5 px-4 font-semibold">Vendor</th>
                    <th className="py-2.5 px-4 font-semibold">PO #</th>
                    <th className="py-2.5 px-4 font-semibold">GRN #</th>
                    <th className="py-2.5 px-4 font-semibold text-right">PO Amount (AED)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">GRN Value (AED)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Billed Amount (AED)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Variance</th>
                    <th className="py-2.5 px-4 font-semibold text-center">3-Way Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {threeWayMatches.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-blue-300">{m.invoiceNumber}</td>
                      <td className="py-3 px-4 font-medium text-white">{m.supplierName}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{m.poNumber}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{m.grnNumber}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {m.poAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {m.grnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {m.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {m.varianceAmount.toFixed(2)} AED
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1">
                          <Check className="h-3 w-3" /> MATCHED (100%)
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

      {/* ============================================================== */}
      {/* VIEW 6: PURCHASE APPROVALS */}
      {/* ============================================================== */}
      {activeMenu === 'purchase_approvals' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400" /> Pending Purchase Approvals Inbox
              </h2>
              <p className="text-xs text-slate-400">
                Requisitions and purchase contracts awaiting authorization according to company DOA threshold rules.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Request ID</th>
                    <th className="py-2.5 px-4 font-semibold">Module</th>
                    <th className="py-2.5 px-4 font-semibold">Document Reference</th>
                    <th className="py-2.5 px-4 font-semibold">Approval Level Required</th>
                    <th className="py-2.5 px-4 font-semibold">Submission Date</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {purchaseApprovals.map((req) => (
                    <tr key={req.request_id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-blue-300">{req.request_id}</td>
                      <td className="py-3 px-4 font-medium text-white">{req.module.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{req.record_reference}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                          Tier {req.current_step}: {req.current_step >= 3 ? 'CFO / MD Signoff' : 'Procurement Manager'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{req.created_at.split('T')[0]}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleProcessApproval(req.request_id, 'APPROVE')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleProcessApproval(req.request_id, 'REJECT')}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {purchaseApprovals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        All procurement requests have been reviewed and approved. Zero backlog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 7: PAYMENTS */}
      {/* ============================================================== */}
      {activeMenu === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400" /> Vendor Payment Disbursements
              </h2>
              <p className="text-xs text-slate-400">
                Corporate bank transfers, signed account-payee cheques, and post-dated cheques (PDC) settled against verified supplier invoices.
              </p>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" /> + Record Vendor Payment
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Payment Voucher #</th>
                    <th className="py-2.5 px-4 font-semibold">Supplier / Beneficiary</th>
                    <th className="py-2.5 px-4 font-semibold">Payment Mode</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Disbursed Amount (AED)</th>
                    <th className="py-2.5 px-4 font-semibold">Execution Date</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {payments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-400">{p.payment_number}</td>
                      <td className="py-3 px-4 font-medium text-white">
                        {p.supplier_id === 'supp-001'
                          ? 'Emirates Steel Industries PJSC'
                          : p.supplier_id === 'supp-002'
                          ? 'Middle East Fasteners LLC'
                          : 'Gulf Tube & Hollow Sections FZE'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{p.payment_method}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        AED {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{p.payment_date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.status}
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

      {/* ============================================================== */}
      {/* VIEW 8: PROCUREMENT REPORTS */}
      {/* ============================================================== */}
      {activeMenu === 'procurement_reports' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" /> Strategic Procurement & Supply Chain Analytics
              </h2>
              <p className="text-xs text-slate-400">
                Audited vendor performance scorecards, 3-way match reconciliation reports, and spend concentration analysis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => printContent('cemcon-procurement-report-print', 'Procurement Analytics Report')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Printer className="h-3.5 w-3.5 text-blue-400" /> Print
              </button>
              <button
                onClick={() =>
                  analyticsData &&
                  exportProcurementReportPdf(analyticsData, activeCompany, tenantName)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <FileDown className="h-3.5 w-3.5" /> Export as PDF
              </button>
            </div>
          </div>

          <div id="cemcon-procurement-report-print" className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">Total Procurement Spend</div>
                <div className="text-2xl font-bold text-white font-mono mt-1">
                  AED {(analyticsData?.kpis?.totalProcurementSpend || 207270).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Across {purchaseOrders.length || 4} Purchase Orders</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">3-Way Match Success</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {analyticsData?.kpis?.threeWayMatchRate || 98.6}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Zero unapproved price leakage</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">Average Lead Time</div>
                <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
                  {analyticsData?.kpis?.avgLeadTimeDays || 11.4} Days
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Order issue to gate delivery</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">Negotiated Savings YTD</div>
                <div className="text-2xl font-bold text-blue-400 font-mono mt-1">
                  AED {(analyticsData?.kpis?.costSavingsYTD || 42800).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Vs. original project estimation BOQs</div>
              </div>
            </div>

            {/* Supplier Spend & OTIF Scorecard */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-white uppercase tracking-wider">
                Supplier Spend Concentration & OTIF Performance Ratings
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Supplier Name</th>
                    <th className="py-2.5 px-4 font-semibold text-right">PO Volume</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total Spend (AED)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">OTIF Score</th>
                    <th className="py-2.5 px-4 font-semibold text-right">QA/QC Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {analyticsData?.supplierSpend?.map((s: any) => (
                    <tr key={s.supplierId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{s.supplierName}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{s.poCount} POs</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        AED {Number(s.totalSpend).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{s.otifScore}%</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">{s.qualityRating} / 5.0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Governance Sign-Off block */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="h-8 border-b border-slate-700 mb-1 flex items-end justify-center font-serif italic text-slate-400">
                  Procurement Lead
                </div>
                <div className="font-bold text-white">PREPARED BY</div>
                <div className="text-[10px] text-slate-400">Contracts & Procurement Lead</div>
              </div>
              <div>
                <div className="h-8 border-b border-slate-700 mb-1 flex items-end justify-center font-serif italic text-slate-400">
                  Finance Controller
                </div>
                <div className="font-bold text-white">INTERNAL AUDIT & FINANCE</div>
                <div className="text-[10px] text-slate-400">Finance Controller</div>
              </div>
              <div>
                <div className="h-8 border-b border-slate-700 mb-1 flex items-end justify-center font-serif italic text-slate-400">
                  Managing Director
                </div>
                <div className="font-bold text-white">APPROVED BY</div>
                <div className="text-[10px] text-slate-400">Managing Director</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: NEW PURCHASE REQUEST */}
      {/* ============================================================== */}
      {isPrModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-400" /> Create Purchase Request (PR)
              </h3>
              <button onClick={() => setIsPrModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePr} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Requisition Title</label>
                <input
                  type="text"
                  required
                  value={newPrTitle}
                  onChange={(e) => setNewPrTitle(e.target.value)}
                  placeholder="e.g. Structural Steel S355JR plates for canopy fabrication"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Link to Job Order #</label>
                  <input
                    type="text"
                    value={newPrJobNo}
                    onChange={(e) => setNewPrJobNo(e.target.value)}
                    placeholder="e.g. 0011"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPrPriority}
                    onChange={(e) => setNewPrPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITICAL">Critical (Shut-down/Emergency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Material Item</label>
                <input
                  type="text"
                  required
                  value={newPrItemName}
                  onChange={(e) => setNewPrItemName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={newPrItemQty}
                    onChange={(e) => setNewPrItemQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit (UOM)</label>
                  <input
                    type="text"
                    required
                    value={newPrItemUom}
                    onChange={(e) => setNewPrItemUom(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Est. Amount (AED)</label>
                  <input
                    type="number"
                    required
                    value={newPrAmount}
                    onChange={(e) => setNewPrAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Business Justification</label>
                <textarea
                  rows={2}
                  required
                  value={newPrJustification}
                  onChange={(e) => setNewPrJustification(e.target.value)}
                  placeholder="Reason for requisition, client requirements or urgent replacement"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPrModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CREATE RFQ */}
      {/* ============================================================== */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-400" /> Issue Request for Quotation (RFQ)
              </h3>
              <button onClick={() => setIsRfqModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">RFQ Title / Scope</label>
                <input
                  type="text"
                  required
                  value={newRfqTitle}
                  onChange={(e) => setNewRfqTitle(e.target.value)}
                  placeholder="e.g. S355JR Structural Steel Profiles for Creek Canopy"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bid Submission Deadline</label>
                <input
                  type="date"
                  required
                  value={newRfqDeadline}
                  onChange={(e) => setNewRfqDeadline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                This RFQ will be transmitted to approved registered suppliers in the directory.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  Transmit RFQ to Vendors
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: RECORD GOODS RECEIPT (GRN) */}
      {/* ============================================================== */}
      {isGrnModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-blue-400" /> Intake Goods Receipt Note (GRN)
              </h3>
              <button onClick={() => setIsGrnModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGrn} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Order #</label>
                <input
                  type="text"
                  required
                  value={newGrnPoNo}
                  onChange={(e) => setNewGrnPoNo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={newGrnSupplier}
                  onChange={(e) => setNewGrnSupplier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Vendor Delivery Note #</label>
                  <input
                    type="text"
                    value={newGrnVdn}
                    onChange={(e) => setNewGrnVdn(e.target.value)}
                    placeholder="e.g. VDN-ES-99201"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle Plate #</label>
                  <input
                    type="text"
                    value={newGrnVehicle}
                    onChange={(e) => setNewGrnVehicle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Total Intake Value (AED)</label>
                  <input
                    type="number"
                    value={newGrnValue}
                    onChange={(e) => setNewGrnValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mill Test Cert (MTC 3.1)</label>
                  <input
                    type="text"
                    value={newGrnMtc}
                    onChange={(e) => setNewGrnMtc(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGrnModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  Accept & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: REGISTER SUPPLIER INVOICE */}
      {/* ============================================================== */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-400" /> Register Supplier Invoice
              </h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vendor / Creditor</label>
                <select
                  value={newInvSupplier}
                  onChange={(e) => setNewInvSupplier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.name} (TRN: {s.trn_vat_number || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Tax Invoice Number</label>
                <input
                  type="text"
                  required
                  value={newInvBillNo}
                  onChange={(e) => setNewInvBillNo(e.target.value)}
                  placeholder="e.g. BILL-ES-2026-991"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Subtotal (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newInvSubtotal}
                    onChange={(e) => setNewInvSubtotal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">5% VAT (AED)</label>
                  <input
                    type="number"
                    readOnly
                    value={(newInvSubtotal * 0.05).toFixed(2)}
                    className="w-full bg-slate-950 border border-slate-800 text-blue-300 font-mono rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newInvDueDate}
                  onChange={(e) => setNewInvDueDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  Register Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: RECORD VENDOR PAYMENT */}
      {/* ============================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400" /> Disburse Vendor Payment
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Beneficiary Vendor</label>
                <select
                  value={newPaySupplier}
                  onChange={(e) => setNewPaySupplier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Disbursement Amount (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newPayAmount}
                  onChange={(e) => setNewPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={newPayMethod}
                    onChange={(e) => setNewPayMethod(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="BANK_TRANSFER">Bank Wire / TT</option>
                    <option value="CHEQUE">Corporate Cheque</option>
                    <option value="PDC">Post-Dated Cheque (PDC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cheque / TT Reference #</label>
                  <input
                    type="text"
                    value={newPayRef}
                    onChange={(e) => setNewPayRef(e.target.value)}
                    placeholder="e.g. TT-ENBD-88129"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  Execute Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: VIEW ITEMS INSPECTION */}
      {/* ============================================================== */}
      {viewingItemsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">{viewingItemsModal.title}</h3>
              <button onClick={() => setViewingItemsModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
              {viewingItemsModal.items.map((it: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-300">{it.itemCode}</span>
                    <div className="text-white font-medium mt-0.5">{it.description}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-300 font-bold">
                      {it.qty} {it.uom}
                    </span>
                    {it.estTotal && (
                      <div className="font-mono text-emerald-400 text-[11px]">
                        AED {Number(it.estTotal).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {viewingItemsModal.items.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">No items detailed in this record.</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingItemsModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
