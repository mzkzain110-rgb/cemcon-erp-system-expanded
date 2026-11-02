import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Search,
  Filter,
  Printer,
  FileDown,
  RefreshCw,
  Users,
  Layers,
  Wrench,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  PieChart,
} from 'lucide-react';
import { CemconCompanyInfo } from '../hr/HRPrintableForms';
import { exportJobEstimationPdf } from '../../utils/jobEstimationPdfGenerator';
import { NewJobEstimationModal } from './NewJobEstimationModal';

interface JobEstimationModuleProps {
  activeCompany: CemconCompanyInfo;
  tenantName: string;
  userRole?: string;
  onOpenJobNumbering?: () => void;
}

export const JobEstimationModule: React.FC<JobEstimationModuleProps> = ({
  activeCompany,
  tenantName,
  userRole,
  onOpenJobNumbering,
}) => {
  const [estimations, setEstimations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [stats, setStats] = useState<any>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & inspect
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedEstimation, setSelectedEstimation] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [existingJobs, setExistingJobs] = useState<any[]>([]);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Estimations & Stats
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetch('/api/estimations').then((r) => r.json()),
      fetch('/api/estimations/stats').then((r) => r.json()),
      fetch('/api/jobs').then((r) => r.json()),
    ])
      .then(([estData, statsData, jobsData]) => {
        if (!isMounted) return;
        const estList = Array.isArray(estData) ? estData : estData?.data || [];
        setEstimations(estList);
        setStats(statsData);
        setExistingJobs(Array.isArray(jobsData) ? jobsData : []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load estimations:', err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Safe parse helper
  const parseJsonArray = (val: any) => {
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

  // Filtered estimations
  const filteredEstimations = estimations.filter((e) => {
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      e.estimation_no?.toLowerCase().includes(q) ||
      e.job_number?.toLowerCase().includes(q) ||
      e.project_name?.toLowerCase().includes(q) ||
      e.client_name?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Export PDF Handler
  const handleExportPdf = (est: any) => {
    try {
      showToast(`Generating official vector PDF for ${est.estimation_no}...`);
      exportJobEstimationPdf({
        company: activeCompany,
        tenantName,
        estimation: est,
      });
      showToast(`Downloaded ${est.estimation_no} PDF successfully.`);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  // Direct Browser Print Handler
  const handlePrint = (est: any) => {
    setSelectedEstimation(est);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Delete Estimation Handler
  const handleDelete = async (id: string, estNo: string) => {
    if (!window.confirm(`Are you sure you want to delete estimation ${estNo}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/estimations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete estimation');
      showToast(`Estimation ${estNo} deleted.`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
              {activeCompany.name}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Design & Cost Estimation Suite</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Calculator className="h-6 w-6 text-blue-400" /> Job Cost Estimation
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Multi-tier analytical job costing covering direct <strong className="text-slate-200">Labour Manhours</strong>,{' '}
            <strong className="text-slate-200">Material Cost</strong>, <strong className="text-slate-200">Sub Contractor Expenses</strong>, and{' '}
            <strong className="text-slate-200">Misc Expenses</strong> with real-time gross margin and vector PDF export.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenJobNumbering && (
            <button
              onClick={onOpenJobNumbering}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              title="Switch to Job Numbering"
            >
              <Briefcase className="h-3.5 w-3.5 text-blue-400" />
              <span>Job Sequences</span>
            </button>
          )}

          <button
            onClick={() => setRefreshTrigger((p) => p + 1)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            title="Refresh Estimations"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Job Estimation</span>
          </button>
        </div>
      </div>

      {/* KPI Analytical Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Total Estimated Cost</span>
            <Calculator className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            AED {(stats?.totalJobCost || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-400/90 mt-1 flex items-center gap-1">
            <span>Across {stats?.totalCount || estimations.length} registered job estimates</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Total Contract Target</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            AED {(stats?.totalSellingPrice || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 font-mono">
            Projected Profit: AED {(stats?.totalGrossProfit || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Avg Gross Margin</span>
            <PieChart className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">
            {stats?.avgMarginPercent !== undefined ? stats.avgMarginPercent : 0}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Target benchmark: &gt; 22.0%</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Budgeted Manhours</span>
            <Users className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 font-mono">
            {(stats?.totalManhours || 0).toLocaleString()} <span className="text-xs font-normal">Hrs</span>
          </div>
          <div className="text-[10px] text-purple-400/80 mt-1">
            Direct shop floor & site crafts
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Job #, Estimate #, Project or Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
              <option value="REVISED">Revised</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400 text-xs flex items-center gap-3">
          <span>Showing <strong className="text-white">{filteredEstimations.length}</strong> estimations</span>
        </div>
      </div>

      {/* Estimations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Est. Number</th>
                <th className="py-3 px-4">Job Reference</th>
                <th className="py-3 px-4">Project & Client</th>
                <th className="py-3 px-4 text-right">Job Cost</th>
                <th className="py-3 px-4 text-center">Cost Distribution</th>
                <th className="py-3 px-4 text-center">Manhours</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Loading job cost estimations...
                  </td>
                </tr>
              ) : filteredEstimations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No job estimations found. Click "New Job Estimation" to create one.
                  </td>
                </tr>
              ) : (
                filteredEstimations.map((est) => {
                  const totalCost = Number(est.total_job_cost) || 1;
                  const labourCost = Number(est.total_labour_cost) || 0;
                  const matCost = Number(est.total_material_cost) || 0;
                  const subCost = Number(est.total_subcontract_cost) || 0;
                  const miscCost = Number(est.total_misc_cost) || 0;

                  const labourPct = (labourCost / totalCost) * 100;
                  const matPct = (matCost / totalCost) * 100;
                  const subPct = (subCost / totalCost) * 100;
                  const miscPct = (miscCost / totalCost) * 100;

                  const statusColor =
                    est.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : est.status === 'SUBMITTED'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                  return (
                    <tr key={est.estimation_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-400">{est.estimation_no}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rev: <span className="text-white">{est.revision || 'R0'}</span> • {est.estimation_date}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          <Briefcase className="h-3 w-3 text-blue-400" /> #{est.job_number}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-white truncate" title={est.project_name}>
                          {est.project_name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate" title={est.client_name}>
                          {est.client_name}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {est.currency || 'AED'} {Number(est.total_job_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 4-Color Cost Distribution Micro Bar */}
                      <td className="py-3 px-4 text-center">
                        <div className="w-28 mx-auto h-2 rounded-full overflow-hidden flex bg-slate-800 border border-slate-700/50" title={`Labour: ${labourPct.toFixed(0)}% | Material: ${matPct.toFixed(0)}% | Subcontract: ${subPct.toFixed(0)}% | Misc: ${miscPct.toFixed(0)}%`}>
                          <div style={{ width: `${labourPct}%` }} className="bg-blue-500" />
                          <div style={{ width: `${matPct}%` }} className="bg-emerald-500" />
                          <div style={{ width: `${subPct}%` }} className="bg-amber-500" />
                          <div style={{ width: `${miscPct}%` }} className="bg-purple-500" />
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1 flex justify-center gap-1.5 font-mono">
                          <span className="text-blue-400">L:{labourPct.toFixed(0)}%</span>
                          <span className="text-emerald-400">M:{matPct.toFixed(0)}%</span>
                          <span className="text-amber-400">S:{subPct.toFixed(0)}%</span>
                          <span className="text-purple-400">X:{miscPct.toFixed(0)}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {est.total_manhours || 0} <span className="text-[10px] text-slate-500">h</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                        {est.currency || 'AED'} {Number(est.selling_price || est.contract_target_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className="text-emerald-400">{est.markup_margin_percent || 0}%</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${statusColor}`}>
                          {est.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect View */}
                          <button
                            onClick={() => {
                              setSelectedEstimation(est);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition"
                            title="Inspect 5-Section Breakdown"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Print Option */}
                          <button
                            onClick={() => handlePrint(est)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Print Job Estimation"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* Export as PDF Option */}
                          <button
                            onClick={() => handleExportPdf(est)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition"
                            title="Export Corporate Vector PDF"
                          >
                            <FileDown className="h-3 w-3" />
                            <span>PDF</span>
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingItem(est);
                              setIsNewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Edit Estimation"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(est.estimation_id, est.estimation_no)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL INSPECTION DRAWER / MODAL */}
      {isDetailModalOpen && selectedEstimation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400 text-base">
                    {selectedEstimation.estimation_no}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Rev: {selectedEstimation.revision || 'R0'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {selectedEstimation.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Job #{selectedEstimation.job_number} • {selectedEstimation.project_name} • {selectedEstimation.client_name}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(selectedEstimation)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button
                  onClick={() => handleExportPdf(selectedEstimation)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                >
                  <FileDown className="h-3.5 w-3.5" /> Export as PDF
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Body with 5 Sections */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Job Cost Commercial Summary */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-blue-400" /> 1. Job Cost & Commercial Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Job Cost</div>
                    <div className="text-base font-bold text-white font-mono mt-1">
                      {selectedEstimation.currency || 'AED'} {Number(selectedEstimation.total_job_cost).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Target Selling Price</div>
                    <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                      {selectedEstimation.currency || 'AED'} {Number(selectedEstimation.selling_price || selectedEstimation.contract_target_price || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Estimated Gross Profit</div>
                    <div className="text-base font-bold text-white font-mono mt-1">
                      {selectedEstimation.currency || 'AED'} {Number(selectedEstimation.estimated_gross_profit || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Markup Margin %</div>
                    <div className="text-base font-bold text-amber-400 font-mono mt-1">
                      {selectedEstimation.markup_margin_percent}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Labour Manhours & Manpower Cost */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-400" /> 2. Labour Manhours & Manpower Cost
                  </h3>
                  <span className="text-xs text-blue-400 font-mono font-bold">
                    Total: {selectedEstimation.currency} {Number(selectedEstimation.total_labour_cost).toLocaleString()} ({selectedEstimation.total_manhours} Hrs)
                  </span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px] uppercase font-semibold">
                        <th className="py-2 px-3">Trade / Role</th>
                        <th className="py-2 px-2 text-center">Nos</th>
                        <th className="py-2 px-2 text-center">Reg Hrs</th>
                        <th className="py-2 px-2 text-center">OT Hrs</th>
                        <th className="py-2 px-2 text-right">Rate (AED/h)</th>
                        <th className="py-2 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {parseJsonArray(selectedEstimation.labour_breakdown_json).map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                          <td className="py-1.5 px-3 font-semibold text-white">{item.trade}</td>
                          <td className="py-1.5 px-2 text-center text-slate-300">{item.headcount}</td>
                          <td className="py-1.5 px-2 text-center text-slate-300">{item.regularHours}</td>
                          <td className="py-1.5 px-2 text-center text-slate-400">{item.overtimeHours || 0}</td>
                          <td className="py-1.5 px-2 text-right text-slate-300 font-mono">{Number(item.hourlyRate || 0).toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-blue-300">
                            {selectedEstimation.currency} {Number(item.totalCost || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Material Cost */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-emerald-400" /> 3. Material Cost (Raw Materials)
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    Total: {selectedEstimation.currency} {Number(selectedEstimation.total_material_cost).toLocaleString()}
                  </span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px] uppercase font-semibold">
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-2">Specification & Grade</th>
                        <th className="py-2 px-2 text-right">Qty</th>
                        <th className="py-2 px-2 text-center">UOM</th>
                        <th className="py-2 px-2 text-right">Unit Rate</th>
                        <th className="py-2 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {parseJsonArray(selectedEstimation.materials_breakdown_json).map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                          <td className="py-1.5 px-3 font-semibold text-white">{item.description}</td>
                          <td className="py-1.5 px-2 text-slate-400">{item.specification || '—'}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-300">{item.quantity}</td>
                          <td className="py-1.5 px-2 text-center text-slate-400">{item.uom}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-300">{Number(item.unitRate || 0).toLocaleString()}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-300">
                            {selectedEstimation.currency} {Number(item.totalCost || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Sub Contractor Expenses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-amber-400" /> 4. Sub Contractor Expenses
                  </h3>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    Total: {selectedEstimation.currency} {Number(selectedEstimation.total_subcontract_cost).toLocaleString()}
                  </span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px] uppercase font-semibold">
                        <th className="py-2 px-3">Scope / Service</th>
                        <th className="py-2 px-2">Approved Subcontractor</th>
                        <th className="py-2 px-2 text-right">Units</th>
                        <th className="py-2 px-2 text-center">UOM</th>
                        <th className="py-2 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {parseJsonArray(selectedEstimation.subcontract_breakdown_json).map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                          <td className="py-1.5 px-3 font-semibold text-white">{item.serviceName}</td>
                          <td className="py-1.5 px-2 text-slate-400">{item.subcontractor}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-300">{item.units}</td>
                          <td className="py-1.5 px-2 text-center text-slate-400">{item.uom}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-300">
                            {selectedEstimation.currency} {Number(item.totalCost || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Misc Expenses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-purple-400" /> 5. Miscellaneous Expenses
                  </h3>
                  <span className="text-xs text-purple-400 font-mono font-bold">
                    Total: {selectedEstimation.currency} {Number(selectedEstimation.total_misc_cost).toLocaleString()}
                  </span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px] uppercase font-semibold">
                        <th className="py-2 px-3">Expense Category</th>
                        <th className="py-2 px-2">Description & Notes</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {parseJsonArray(selectedEstimation.misc_breakdown_json).map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                          <td className="py-1.5 px-3 font-semibold text-white">{item.expenseCategory}</td>
                          <td className="py-1.5 px-2 text-slate-400">{item.description}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-purple-300">
                            {selectedEstimation.currency} {Number(item.amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">PREPARED BY</span>
                  <span className="font-bold text-white">{selectedEstimation.prepared_by}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">CHECKED BY</span>
                  <span className="font-bold text-white">{selectedEstimation.reviewed_by || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">APPROVED BY</span>
                  <span className="font-bold text-white">{selectedEstimation.approved_by || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW / EDIT ESTIMATION MODAL */}
      {isNewModalOpen && (
        <NewJobEstimationModal
          isOpen={isNewModalOpen}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={(savedItem) => {
            showToast(`Saved estimation ${savedItem.estimation_no || ''}`);
            setRefreshTrigger((p) => p + 1);
          }}
          activeCompany={activeCompany}
          existingJobs={existingJobs}
          editEstimation={editingItem}
        />
      )}

      {/* PRINT-ONLY CSS CONTAINER (Clean white sheet for browser window.print()) */}
      {selectedEstimation && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-[99999]">
          <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase">{activeCompany.name}</h1>
              <p className="text-xs text-gray-700">{activeCompany.division} • {activeCompany.address}</p>
              <p className="text-[10px] text-gray-600">TRN: {activeCompany.trn} • Tel: {activeCompany.phone}</p>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-bold uppercase">JOB COST ESTIMATION</h2>
              <p className="text-xs font-mono font-bold">REF: {selectedEstimation.estimation_no}</p>
              <p className="text-[11px]">JOB NO: #{selectedEstimation.job_number} • REV: {selectedEstimation.revision || 'R0'}</p>
              <p className="text-[11px]">DATE: {selectedEstimation.estimation_date}</p>
            </div>
          </div>

          <div className="border border-gray-300 p-2 text-xs mb-4 grid grid-cols-3 gap-2 bg-gray-50">
            <div><strong>Project:</strong> {selectedEstimation.project_name}</div>
            <div><strong>Client:</strong> {selectedEstimation.client_name}</div>
            <div><strong>Location:</strong> {selectedEstimation.location || 'Sharjah / Dubai Yard'}</div>
          </div>

          {/* Section 1: Job Cost Summary */}
          <div className="mb-4">
            <h3 className="font-bold text-xs uppercase bg-gray-200 px-2 py-1 border border-gray-400">1. Job Cost Summary & Profitability</h3>
            <table className="w-full text-xs border border-gray-300 mt-1 border-collapse">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="p-1.5 font-bold w-1/4">Total Job Cost:</td>
                  <td className="p-1.5 font-mono font-bold w-1/4">{selectedEstimation.currency} {Number(selectedEstimation.total_job_cost).toLocaleString()}</td>
                  <td className="p-1.5 font-bold w-1/4">Target Selling Price:</td>
                  <td className="p-1.5 font-mono font-bold w-1/4">{selectedEstimation.currency} {Number(selectedEstimation.selling_price || selectedEstimation.contract_target_price || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold">Projected Profit:</td>
                  <td className="p-1.5 font-mono">{selectedEstimation.currency} {Number(selectedEstimation.estimated_gross_profit || 0).toLocaleString()}</td>
                  <td className="p-1.5 font-bold">Gross Margin:</td>
                  <td className="p-1.5 font-mono font-bold">{selectedEstimation.markup_margin_percent}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Labour */}
          <div className="mb-4">
            <div className="flex justify-between items-center bg-gray-200 px-2 py-1 border border-gray-400 font-bold text-xs uppercase">
              <span>2. Labour Manhours & Manpower Cost</span>
              <span>Subtotal: {selectedEstimation.currency} {Number(selectedEstimation.total_labour_cost).toLocaleString()} ({selectedEstimation.total_manhours} Manhours)</span>
            </div>
            <table className="w-full text-[11px] border border-gray-300 mt-1 border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-1 text-left">Trade / Role</th>
                  <th className="p-1 text-center">Nos</th>
                  <th className="p-1 text-center">Reg Hrs</th>
                  <th className="p-1 text-center">OT Hrs</th>
                  <th className="p-1 text-right">Rate</th>
                  <th className="p-1 text-right">Total (AED)</th>
                </tr>
              </thead>
              <tbody>
                {parseJsonArray(selectedEstimation.labour_breakdown_json).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-1">{item.trade}</td>
                    <td className="p-1 text-center">{item.headcount}</td>
                    <td className="p-1 text-center">{item.regularHours}</td>
                    <td className="p-1 text-center">{item.overtimeHours || 0}</td>
                    <td className="p-1 text-right font-mono">{item.hourlyRate}</td>
                    <td className="p-1 text-right font-mono font-bold">{Number(item.totalCost || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Material Cost */}
          <div className="mb-4">
            <div className="flex justify-between items-center bg-gray-200 px-2 py-1 border border-gray-400 font-bold text-xs uppercase">
              <span>3. Material Cost (Raw Materials)</span>
              <span>Subtotal: {selectedEstimation.currency} {Number(selectedEstimation.total_material_cost).toLocaleString()}</span>
            </div>
            <table className="w-full text-[11px] border border-gray-300 mt-1 border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-1 text-left">Description</th>
                  <th className="p-1 text-left">Specification</th>
                  <th className="p-1 text-right">Qty</th>
                  <th className="p-1 text-center">UOM</th>
                  <th className="p-1 text-right">Rate</th>
                  <th className="p-1 text-right">Total (AED)</th>
                </tr>
              </thead>
              <tbody>
                {parseJsonArray(selectedEstimation.materials_breakdown_json).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-1">{item.description}</td>
                    <td className="p-1 text-gray-700">{item.specification || '—'}</td>
                    <td className="p-1 text-right font-mono">{item.quantity}</td>
                    <td className="p-1 text-center">{item.uom}</td>
                    <td className="p-1 text-right font-mono">{Number(item.unitRate || 0).toLocaleString()}</td>
                    <td className="p-1 text-right font-mono font-bold">{Number(item.totalCost || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Subcontractor Expenses */}
          <div className="mb-4">
            <div className="flex justify-between items-center bg-gray-200 px-2 py-1 border border-gray-400 font-bold text-xs uppercase">
              <span>4. Sub Contractor Expenses</span>
              <span>Subtotal: {selectedEstimation.currency} {Number(selectedEstimation.total_subcontract_cost).toLocaleString()}</span>
            </div>
            <table className="w-full text-[11px] border border-gray-300 mt-1 border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-1 text-left">Scope / Service</th>
                  <th className="p-1 text-left">Subcontractor</th>
                  <th className="p-1 text-right">Units</th>
                  <th className="p-1 text-center">UOM</th>
                  <th className="p-1 text-right">Total (AED)</th>
                </tr>
              </thead>
              <tbody>
                {parseJsonArray(selectedEstimation.subcontract_breakdown_json).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-1">{item.serviceName}</td>
                    <td className="p-1 text-gray-700">{item.subcontractor}</td>
                    <td className="p-1 text-right font-mono">{item.units}</td>
                    <td className="p-1 text-center">{item.uom}</td>
                    <td className="p-1 text-right font-mono font-bold">{Number(item.totalCost || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 5: Misc Expenses */}
          <div className="mb-4">
            <div className="flex justify-between items-center bg-gray-200 px-2 py-1 border border-gray-400 font-bold text-xs uppercase">
              <span>5. Miscellaneous Expenses</span>
              <span>Subtotal: {selectedEstimation.currency} {Number(selectedEstimation.total_misc_cost).toLocaleString()}</span>
            </div>
            <table className="w-full text-[11px] border border-gray-300 mt-1 border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-1 text-left">Expense Category</th>
                  <th className="p-1 text-left">Description</th>
                  <th className="p-1 text-right">Amount (AED)</th>
                </tr>
              </thead>
              <tbody>
                {parseJsonArray(selectedEstimation.misc_breakdown_json).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-1">{item.expenseCategory}</td>
                    <td className="p-1 text-gray-700">{item.description}</td>
                    <td className="p-1 text-right font-mono font-bold">{Number(item.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-3 gap-6 text-xs">
            <div className="border border-gray-400 p-3">
              <span className="block font-bold mb-8">PREPARED BY:</span>
              <p className="font-bold">{selectedEstimation.prepared_by}</p>
              <p className="text-[10px] text-gray-600">Cost Estimation Engineer</p>
            </div>
            <div className="border border-gray-400 p-3">
              <span className="block font-bold mb-8">CHECKED BY:</span>
              <p className="font-bold">{selectedEstimation.reviewed_by || 'Technical Lead'}</p>
              <p className="text-[10px] text-gray-600">Technical / Finance Controller</p>
            </div>
            <div className="border border-gray-400 p-3">
              <span className="block font-bold mb-8">APPROVED BY:</span>
              <p className="font-bold">{selectedEstimation.approved_by || 'Managing Director'}</p>
              <p className="text-[10px] text-gray-600">Commercial Director / MD</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
