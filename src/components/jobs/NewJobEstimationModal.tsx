import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calculator,
  Users,
  Layers,
  Wrench,
  DollarSign,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { CemconCompanyInfo } from '../hr/HRPrintableForms';
import {
  LabourBreakdownItem,
  MaterialBreakdownItem,
  SubcontractBreakdownItem,
  MiscBreakdownItem,
} from '../../utils/jobEstimationPdfGenerator';

interface NewJobEstimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedItem: any) => void;
  activeCompany: CemconCompanyInfo;
  existingJobs?: any[];
  editEstimation?: any | null;
}

export const NewJobEstimationModal: React.FC<NewJobEstimationModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  activeCompany,
  existingJobs = [],
  editEstimation = null,
}) => {
  const [activeTab, setActiveTab] = useState<'job_cost' | 'labour' | 'material' | 'subcontract' | 'misc'>('job_cost');

  // Header & Job Reference
  const [jobNumber, setJobNumber] = useState(editEstimation?.job_number || '');
  const [projectName, setProjectName] = useState(editEstimation?.project_name || '');
  const [clientName, setClientName] = useState(editEstimation?.client_name || '');
  const [location, setLocation] = useState(editEstimation?.location || '');
  const [revision, setRevision] = useState(editEstimation?.revision || 'R0');
  const [status, setStatus] = useState(editEstimation?.status || 'DRAFT');
  const [estimationDate, setEstimationDate] = useState(
    editEstimation?.estimation_date || new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(
    editEstimation?.valid_until ||
      new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState(editEstimation?.currency || 'AED');
  const [sellingPrice, setSellingPrice] = useState<number>(
    editEstimation?.selling_price || editEstimation?.contract_target_price || 0
  );
  const [targetMarkupPercent, setTargetMarkupPercent] = useState<number>(
    editEstimation?.markup_margin_percent || 25
  );
  const [preparedBy, setPreparedBy] = useState(editEstimation?.prepared_by || '');
  const [reviewedBy, setReviewedBy] = useState(editEstimation?.reviewed_by || '');
  const [approvedBy, setApprovedBy] = useState(editEstimation?.approved_by || '');
  const [notes, setNotes] = useState(editEstimation?.notes || '');

  // Section 2: Labour Manhours & Manpower
  const [labourRows, setLabourRows] = useState<LabourBreakdownItem[]>(() => {
    if (editEstimation?.labour_breakdown_json) {
      try {
        const parsed = JSON.parse(editEstimation.labour_breakdown_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [];
  });

  // Section 3: Material Cost
  const [materialRows, setMaterialRows] = useState<MaterialBreakdownItem[]>(() => {
    if (editEstimation?.materials_breakdown_json) {
      try {
        const parsed = JSON.parse(editEstimation.materials_breakdown_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [];
  });

  // Section 4: Subcontractor Expenses
  const [subcontractRows, setSubcontractRows] = useState<SubcontractBreakdownItem[]>(() => {
    if (editEstimation?.subcontract_breakdown_json) {
      try {
        const parsed = JSON.parse(editEstimation.subcontract_breakdown_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [];
  });

  // Section 5: Misc Expenses
  const [miscRows, setMiscRows] = useState<MiscBreakdownItem[]>(() => {
    if (editEstimation?.misc_breakdown_json) {
      try {
        const parsed = JSON.parse(editEstimation.misc_breakdown_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [];
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill project details if existing job is selected
  const handleJobSelect = (jNum: string) => {
    setJobNumber(jNum);
    const matched = existingJobs.find((j) => j.job_number === jNum);
    if (matched) {
      if (matched.title) setProjectName(matched.title);
      if (matched.client_name) setClientName(matched.client_name);
      if (matched.location) setLocation(matched.location);
    }
  };

  // Calculations
  const totalLabourCost = labourRows.reduce((acc, r) => acc + (Number(r.totalCost) || 0), 0);
  const totalManhours = labourRows.reduce(
    (acc, r) => acc + (Number(r.regularHours || 0) + Number(r.overtimeHours || 0)) * (Number(r.headcount) || 1),
    0
  );
  const totalMaterialCost = materialRows.reduce((acc, r) => acc + (Number(r.totalCost) || 0), 0);
  const totalSubcontractCost = subcontractRows.reduce((acc, r) => acc + (Number(r.totalCost) || 0), 0);
  const totalMiscCost = miscRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const totalJobCost = totalLabourCost + totalMaterialCost + totalSubcontractCost + totalMiscCost;

  // Auto update selling price based on markup if selling price is 0
  useEffect(() => {
    if (sellingPrice === 0 && totalJobCost > 0) {
      const suggested = totalJobCost * (1 + targetMarkupPercent / 100);
      setSellingPrice(Math.round(suggested / 100) * 100);
    }
  }, [totalJobCost, targetMarkupPercent]);

  const grossProfit = (Number(sellingPrice) || 0) - totalJobCost;
  const grossMarginPercent =
    totalJobCost > 0 ? Number(((grossProfit / totalJobCost) * 100).toFixed(1)) : targetMarkupPercent;

  // Row update helpers
  const updateLabourRow = (index: number, field: keyof LabourBreakdownItem, val: any) => {
    const updated = [...labourRows];
    const item = { ...updated[index], [field]: val };
    const regHrs = Number(item.regularHours || 0);
    const otHrs = Number(item.overtimeHours || 0);
    const regRate = Number(item.hourlyRate || 0);
    const otRate = Number(item.otRate || regRate * 1.5);
    const heads = Number(item.headcount || 1);
    item.totalCost = Math.round((regHrs * regRate + otHrs * otRate) * heads);
    updated[index] = item;
    setLabourRows(updated);
  };

  const addLabourRow = () => {
    setLabourRows([
      ...labourRows,
      {
        id: String(Date.now()),
        trade: 'Certified Fabricator / Welder',
        headcount: 2,
        regularHours: 160,
        overtimeHours: 20,
        hourlyRate: 45,
        otRate: 67.5,
        totalCost: 19100,
      },
    ]);
  };

  const removeLabourRow = (index: number) => {
    setLabourRows(labourRows.filter((_, i) => i !== index));
  };

  const updateMaterialRow = (index: number, field: keyof MaterialBreakdownItem, val: any) => {
    const updated = [...materialRows];
    const item = { ...updated[index], [field]: val };
    const qty = Number(item.quantity || 0);
    const rate = Number(item.unitRate || 0);
    const waste = Number(item.wastePercent || 0);
    item.totalCost = Math.round(qty * rate * (1 + waste / 100));
    updated[index] = item;
    setMaterialRows(updated);
  };

  const addMaterialRow = () => {
    setMaterialRows([
      ...materialRows,
      {
        id: String(Date.now()),
        itemCode: 'STL-RAW-01',
        description: 'Structural Steel Section / Plate',
        specification: 'EN 10025 S355JR',
        quantity: 10,
        uom: 'TON',
        unitRate: 3500,
        wastePercent: 3,
        totalCost: 36050,
      },
    ]);
  };

  const removeMaterialRow = (index: number) => {
    setMaterialRows(materialRows.filter((_, i) => i !== index));
  };

  const updateSubcontractRow = (index: number, field: keyof SubcontractBreakdownItem, val: any) => {
    const updated = [...subcontractRows];
    const item = { ...updated[index], [field]: val };
    const units = Number(item.units || 0);
    const unitPrice = Number(item.unitPrice || 0);
    item.totalCost = Math.round(units * unitPrice);
    updated[index] = item;
    setSubcontractRows(updated);
  };

  const addSubcontractRow = () => {
    setSubcontractRows([
      ...subcontractRows,
      {
        id: String(Date.now()),
        serviceName: 'Specialized Testing / Coating Subcontract',
        subcontractor: 'Approved Vendor LLC',
        scopeOfWork: 'Inspection and surface protective treatment',
        units: 1,
        uom: 'LOT',
        unitPrice: 5000,
        totalCost: 5000,
      },
    ]);
  };

  const removeSubcontractRow = (index: number) => {
    setSubcontractRows(subcontractRows.filter((_, i) => i !== index));
  };

  const updateMiscRow = (index: number, field: keyof MiscBreakdownItem, val: any) => {
    const updated = [...miscRows];
    const item = { ...updated[index], [field]: val };
    item.amount = Number(item.amount || 0);
    updated[index] = item;
    setMiscRows(updated);
  };

  const addMiscRow = () => {
    setMiscRows([
      ...miscRows,
      {
        id: String(Date.now()),
        expenseCategory: 'Logistics & Consumables',
        description: 'Site permits and consumable replenishment',
        amount: 2500,
        remarks: 'Direct expense',
      },
    ]);
  };

  const removeMiscRow = (index: number) => {
    setMiscRows(miscRows.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    const payload = {
      job_number: jobNumber,
      project_name: projectName || `Engineering Works for Job #${jobNumber}`,
      client_name: clientName || 'Commercial Client',
      location,
      revision,
      status,
      estimation_date: estimationDate,
      valid_until: validUntil,
      currency,
      contract_target_price: Number(sellingPrice),
      selling_price: Number(sellingPrice),
      markup_margin_percent: grossMarginPercent,
      estimated_gross_profit: grossProfit,
      total_job_cost: totalJobCost,
      total_manhours: totalManhours,
      total_labour_cost: totalLabourCost,
      labour_breakdown_json: JSON.stringify(labourRows),
      total_material_cost: totalMaterialCost,
      materials_breakdown_json: JSON.stringify(materialRows),
      total_subcontract_cost: totalSubcontractCost,
      subcontract_breakdown_json: JSON.stringify(subcontractRows),
      total_misc_cost: totalMiscCost,
      misc_breakdown_json: JSON.stringify(miscRows),
      prepared_by: preparedBy,
      reviewed_by: reviewedBy,
      approved_by: approvedBy,
      notes,
    };

    try {
      const url = editEstimation?.estimation_id
        ? `/api/estimations/${editEstimation.estimation_id}`
        : '/api/estimations';
      const method = editEstimation?.estimation_id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save job estimation');
      }

      const data = await res.json();
      onSaved(data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {editEstimation ? `Edit Job Estimation • ${editEstimation.estimation_no}` : 'New Job Cost Estimation'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {activeCompany.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Itemize Labour Manhours, Raw Materials, Subcontract Services & Misc Expenses with real-time gross margin computation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Real-time Job Cost Summary Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-400" /> Labour Manpower
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {currency} {totalLabourCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-blue-300 font-mono">{totalManhours} Manhours</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Layers className="h-3 w-3 text-emerald-400" /> Material Cost
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {currency} {totalMaterialCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-300 font-mono">{materialRows.length} BOM Items</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Wrench className="h-3 w-3 text-amber-400" /> Subcontractors
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {currency} {totalSubcontractCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-300 font-mono">{subcontractRows.length} Scopes</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-purple-400" /> Misc Expenses
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {currency} {totalMiscCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-300 font-mono">{miscRows.length} Items</div>
          </div>

          <div className="p-2 rounded-lg bg-blue-900/30 border border-blue-600/40 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-blue-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-400" /> Total Job Cost
            </span>
            <div className="text-base font-extrabold text-white mt-0.5">
              {currency} {totalJobCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono font-semibold">
              Margin: {grossMarginPercent}%
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'job_cost', label: '1. Job Cost & Target', icon: Calculator },
            { id: 'labour', label: `2. Labour (${totalManhours}h)`, icon: Users },
            { id: 'material', label: `3. Materials (${materialRows.length})`, icon: Layers },
            { id: 'subcontract', label: `4. Subcontractors (${subcontractRows.length})`, icon: Wrench },
            { id: 'misc', label: `5. Misc Expenses (${miscRows.length})`, icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  active
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: JOB COST & PROJECT METADATA */}
          {activeTab === 'job_cost' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Job Number *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0010"
                      value={jobNumber}
                      onChange={(e) => setJobNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                    {existingJobs.length > 0 && (
                      <select
                        onChange={(e) => handleJobSelect(e.target.value)}
                        value={jobNumber}
                        className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-2 text-xs"
                      >
                        <option value="">Select Job</option>
                        {existingJobs.map((j) => (
                          <option key={j.job_id || j.job_number} value={j.job_number}>
                            #{j.job_number} - {j.title?.slice(0, 20)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project Name / Scope *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High Pressure Vessel Fabrication"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Client / Contractor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADNOC Gas Processing"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Site / Yard Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Revision Number</label>
                  <select
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono"
                  >
                    <option value="R0">R0 (Original Draft)</option>
                    <option value="R1">R1 (First Revision)</option>
                    <option value="R2">R2 (Client Revised)</option>
                    <option value="FINAL">FINAL (Approved)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estimation Date</label>
                  <input
                    type="date"
                    required
                    value={estimationDate}
                    onChange={(e) => setEstimationDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Commercial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="APPROVED">APPROVED (Authorized)</option>
                    <option value="SUBMITTED">SUBMITTED (Pending)</option>
                    <option value="DRAFT">DRAFT (In Progress)</option>
                    <option value="REVISED">REVISED</option>
                  </select>
                </div>
              </div>

              {/* Commercial Pricing & Margin Cards */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Calculator className="h-4 w-4 text-blue-400" /> Commercial Contract Pricing & Gross Margin
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Total Calculated Cost ({currency})
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${currency} ${totalJobCost.toLocaleString()}`}
                      className="w-full bg-slate-900 border border-slate-700/80 text-blue-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Selling Price ({currency})
                    </label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-emerald-500/50 text-white rounded-lg px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Markup Margin %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetMarkupPercent}
                      onChange={(e) => setTargetMarkupPercent(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Projected Gross Profit ({currency})
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${currency} ${grossProfit.toLocaleString()} (${grossMarginPercent}%)`}
                      className={`w-full bg-slate-900 border text-xs font-mono font-bold rounded-lg px-3 py-2 ${
                        grossProfit >= 0 ? 'text-emerald-400 border-emerald-500/30' : 'text-rose-400 border-rose-500/30'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Signatures & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prepared By (Estimator)</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Checked By (Finance / Tech)</label>
                  <input
                    type="text"
                    value={reviewedBy}
                    onChange={(e) => setReviewedBy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Approved By (Commercial / MD)</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Commercial Notes & Assumptions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LABOUR MANHOURS & MANPOWER COST */}
          {activeTab === 'labour' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" /> Labour Manhours & Manpower Cost Schedule
                  </h3>
                  <p className="text-xs text-slate-400">
                    Specify direct trade crafts, manpower headcount, regular and overtime hours, and standard labor rates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addLabourRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Trade Role
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Trade / Role</th>
                      <th className="py-2.5 px-2 text-center w-20">Headcount</th>
                      <th className="py-2.5 px-2 text-center w-24">Reg Hrs</th>
                      <th className="py-2.5 px-2 text-center w-24">OT Hrs</th>
                      <th className="py-2.5 px-2 text-right w-24">Rate (AED/h)</th>
                      <th className="py-2.5 px-3 text-right w-28">Total Cost</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {labourRows.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.trade}
                            onChange={(e) => updateLabourRow(i, 'trade', e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={r.headcount}
                            onChange={(e) => updateLabourRow(i, 'headcount', Number(e.target.value))}
                            className="w-16 bg-slate-800/80 border border-slate-700/80 text-white text-center rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={r.regularHours}
                            onChange={(e) => updateLabourRow(i, 'regularHours', Number(e.target.value))}
                            className="w-20 bg-slate-800/80 border border-slate-700/80 text-white text-center rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={r.overtimeHours || 0}
                            onChange={(e) => updateLabourRow(i, 'overtimeHours', Number(e.target.value))}
                            className="w-20 bg-slate-800/80 border border-slate-700/80 text-white text-center rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={r.hourlyRate}
                            onChange={(e) => updateLabourRow(i, 'hourlyRate', Number(e.target.value))}
                            className="w-20 bg-slate-800/80 border border-slate-700/80 text-white text-right rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-300">
                          {currency} {(r.totalCost || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLabourRow(i)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 border-t border-slate-700 font-bold text-white">
                      <td className="py-2.5 px-3">Total Labour & Manpower</td>
                      <td className="py-2.5 px-2 text-center text-slate-300">
                        {labourRows.reduce((a, b) => a + (Number(b.headcount) || 1), 0)} Nos
                      </td>
                      <td colSpan={2} className="py-2.5 px-2 text-center text-blue-400 font-mono">
                        {totalManhours} Total Manhours
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-400">Total</td>
                      <td className="py-2.5 px-3 text-right text-blue-300 font-mono text-sm">
                        {currency} {totalLabourCost.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MATERIAL COST */}
          {activeTab === 'material' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-400" /> Material Cost Schedule (Bill of Materials)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Input raw steel plates, seamless pipes, flanges, structural beams with scrap/wastage percentages.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMaterialRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Material Item
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2">Specification & Grade</th>
                      <th className="py-2.5 px-2 text-right w-20">Qty</th>
                      <th className="py-2.5 px-2 text-center w-16">UOM</th>
                      <th className="py-2.5 px-2 text-right w-24">Unit Rate</th>
                      <th className="py-2.5 px-2 text-center w-20">Waste %</th>
                      <th className="py-2.5 px-3 text-right w-28">Total Cost</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {materialRows.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.description}
                            onChange={(e) => updateMaterialRow(i, 'description', e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={r.specification || ''}
                            onChange={(e) => updateMaterialRow(i, 'specification', e.target.value)}
                            placeholder="e.g. ASME SA-516 Gr 70"
                            className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={r.quantity}
                            onChange={(e) => updateMaterialRow(i, 'quantity', Number(e.target.value))}
                            className="w-16 bg-slate-800/80 border border-slate-700/80 text-white text-right rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select
                            value={r.uom}
                            onChange={(e) => updateMaterialRow(i, 'uom', e.target.value)}
                            className="bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded px-1 py-1 text-xs"
                          >
                            <option value="TON">TON</option>
                            <option value="MTR">MTR</option>
                            <option value="PCS">PCS</option>
                            <option value="KG">KG</option>
                            <option value="SQM">SQM</option>
                            <option value="LOT">LOT</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={r.unitRate}
                            onChange={(e) => updateMaterialRow(i, 'unitRate', Number(e.target.value))}
                            className="w-20 bg-slate-800/80 border border-slate-700/80 text-white text-right rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={r.wastePercent || 0}
                            onChange={(e) => updateMaterialRow(i, 'wastePercent', Number(e.target.value))}
                            className="w-14 bg-slate-800/80 border border-slate-700/80 text-white text-center rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-300">
                          {currency} {(r.totalCost || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeMaterialRow(i)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 border-t border-slate-700 font-bold text-white">
                      <td colSpan={6} className="py-2.5 px-3 text-right">
                        Total Material Cost
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-300 font-mono text-sm">
                        {currency} {totalMaterialCost.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SUBCONTRACTOR EXPENSES */}
          {activeTab === 'subcontract' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-400" /> Sub Contractor Expenses Schedule
                  </h3>
                  <p className="text-xs text-slate-400">
                    Itemize thermal stress relieving (PWHT), NDT examinations (RT/UT/MPI), hot-dip galvanizing, and specialty machining.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSubcontractRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Subcontract Scope
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Subcontract Scope / Service</th>
                      <th className="py-2.5 px-2">Approved Subcontractor</th>
                      <th className="py-2.5 px-2 text-right w-20">Units</th>
                      <th className="py-2.5 px-2 text-center w-20">UOM</th>
                      <th className="py-2.5 px-2 text-right w-24">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right w-28">Total Cost</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {subcontractRows.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.serviceName}
                            onChange={(e) => updateSubcontractRow(i, 'serviceName', e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={r.subcontractor}
                            onChange={(e) => updateSubcontractRow(i, 'subcontractor', e.target.value)}
                            placeholder="e.g. Velosi / SGS Gulf"
                            className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={r.units}
                            onChange={(e) => updateSubcontractRow(i, 'units', Number(e.target.value))}
                            className="w-16 bg-slate-800/80 border border-slate-700/80 text-white text-right rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select
                            value={r.uom}
                            onChange={(e) => updateSubcontractRow(i, 'uom', e.target.value)}
                            className="bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded px-1 py-1 text-xs"
                          >
                            <option value="LOT">LOT</option>
                            <option value="JOINTS">JOINTS</option>
                            <option value="TON">TON</option>
                            <option value="SQM">SQM</option>
                            <option value="HRS">HRS</option>
                            <option value="SHIFTS">SHIFTS</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={r.unitPrice}
                            onChange={(e) => updateSubcontractRow(i, 'unitPrice', Number(e.target.value))}
                            className="w-20 bg-slate-800/80 border border-slate-700/80 text-white text-right rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-300">
                          {currency} {(r.totalCost || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeSubcontractRow(i)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 border-t border-slate-700 font-bold text-white">
                      <td colSpan={5} className="py-2.5 px-3 text-right">
                        Total Sub Contractor Expenses
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-mono text-sm">
                        {currency} {totalSubcontractCost.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MISC EXPENSES */}
          {activeTab === 'misc' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-400" /> Miscellaneous & Logistics Expenses
                  </h3>
                  <p className="text-xs text-slate-400">
                    Include heavy transport permits, welding gases & flux, third-party inspection certifications, and contingency reserves.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMiscRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Misc Item
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3 w-1/3">Expense Category</th>
                      <th className="py-2.5 px-2">Description & Notes</th>
                      <th className="py-2.5 px-3 text-right w-36">Amount ({currency})</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {miscRows.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.expenseCategory}
                            onChange={(e) => updateMiscRow(i, 'expenseCategory', e.target.value)}
                            placeholder="e.g. Heavy Haulage / Site Logistics"
                            className="w-full bg-slate-800/80 border border-slate-700/80 text-white rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={r.description}
                            onChange={(e) => updateMiscRow(i, 'description', e.target.value)}
                            placeholder="Details of allocation"
                            className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={r.amount}
                            onChange={(e) => updateMiscRow(i, 'amount', Number(e.target.value))}
                            className="w-28 bg-slate-800/80 border border-slate-700/80 text-white text-right rounded px-2 py-1 text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeMiscRow(i)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 border-t border-slate-700 font-bold text-white">
                      <td colSpan={2} className="py-2.5 px-3 text-right">
                        Total Miscellaneous Expenses
                      </td>
                      <td className="py-2.5 px-3 text-right text-purple-300 font-mono text-sm">
                        {currency} {totalMiscCost.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-white">Grand Cost: {currency} {totalJobCost.toLocaleString()}</span>
              <span className="mx-2">•</span>
              <span>Margin: {grossMarginPercent}%</span>
              <span className="mx-2">•</span>
              <span>Profit: {currency} {grossProfit.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {saving ? 'Saving...' : editEstimation ? 'Update Job Estimation' : 'Save & Register Estimation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
