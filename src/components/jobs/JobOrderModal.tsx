import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  FileDown,
  Plus,
  Trash2,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Building2,
  Wrench,
  Users,
  Layers,
  Calculator,
  Loader2,
} from 'lucide-react';
import {
  exportJobOrderPdf,
  JobOrderMaterial,
  JobOrderManpower,
  JobOrderEquipment,
} from '../../utils/corporatePdfGenerator';
import { CemconCompanyInfo, CEMCON_COMPANIES } from '../hr/HRPrintableForms';

export interface JobOrderRecord {
  job_id?: string;
  job_number: string;
  client_name?: string;
  location?: string;
  deadline?: string;
  priority?: 'Normal' | 'Urgent' | 'Critical';
  title?: string;
  scope_description?: string;
  materials_json?: string;
  manpower_json?: string;
  equipment_json?: string;
  overheads_estimate?: number;
  total_estimated_cost?: number;
  prepared_by?: string;
  approved_by?: string;
  received_by?: string;
  status?: string;
  created_at?: string;
}

interface JobOrderModalProps {
  mode: 'create' | 'view';
  job?: JobOrderRecord | null;
  activeCompany: CemconCompanyInfo;
  tenantName: string;
  onClose: () => void;
  onJobCreated?: (newJob: any) => void;
}

export const JobOrderModal: React.FC<JobOrderModalProps> = ({
  mode,
  job,
  activeCompany,
  tenantName,
  onClose,
  onJobCreated,
}) => {
  // Selected operating company for header (defaults to active, selectable)
  const [company, setCompany] = useState<CemconCompanyInfo>(activeCompany);

  // Auto-assigned Job Order Number
  const [autoJobNumber, setAutoJobNumber] = useState(job?.job_number || '0011');
  const [loadingNumber, setLoadingNumber] = useState(false);

  // Core Form Fields
  const [date, setDate] = useState(
    job?.created_at
      ? new Date(job.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [clientName, setClientName] = useState(job?.client_name || '');
  const [location, setLocation] = useState(job?.location || '');
  const [deadline, setDeadline] = useState(job?.deadline || '');
  const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'Critical'>(
    (job?.priority as any) || 'Normal'
  );
  const [jobDescription, setJobDescription] = useState(
    job?.scope_description || job?.title || ''
  );

  // Section 2: Materials
  const initialMaterials: JobOrderMaterial[] = (() => {
    if (job?.materials_json) {
      try {
        return JSON.parse(job.materials_json);
      } catch (_) {}
    }
    return [];
  })();
  const [materials, setMaterials] = useState<JobOrderMaterial[]>(initialMaterials);

  // Section 3: Manpower
  const initialManpower: JobOrderManpower[] = (() => {
    if (job?.manpower_json) {
      try {
        return JSON.parse(job.manpower_json);
      } catch (_) {}
    }
    return [];
  })();
  const [manpower, setManpower] = useState<JobOrderManpower[]>(initialManpower);

  // Section 4: Equipment & Machinery
  const initialEquipment: JobOrderEquipment[] = (() => {
    if (job?.equipment_json) {
      try {
        return JSON.parse(job.equipment_json);
      } catch (_) {}
    }
    return [];
  })();
  const [equipment, setEquipment] = useState<JobOrderEquipment[]>(initialEquipment);

  // Section 5: Overheads Estimate
  const [overheads, setOverheads] = useState<number>(
    job?.overheads_estimate !== undefined ? Number(job.overheads_estimate) : 0
  );

  // Signatures
  const [preparedBy, setPreparedBy] = useState(job?.prepared_by || '');
  const [approvedBy, setApprovedBy] = useState(job?.approved_by || '');
  const [receivedBy, setReceivedBy] = useState(job?.received_by || '');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const printCanvasRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Fetch next sequential job number from backend mutex engine
  useEffect(() => {
    if (mode === 'create') {
      setLoadingNumber(true);
      fetch('/api/jobs/next-number')
        .then((res) => res.json())
        .then((data) => {
          if (data.nextJobNumber) {
            setAutoJobNumber(data.nextJobNumber);
          }
        })
        .catch((err) => {
          console.warn('Could not preview next job number:', err);
        })
        .finally(() => {
          setLoadingNumber(false);
        });
    }
  }, [mode, company.code]);

  // Dynamic calculations
  const materialsSubtotal = materials.reduce(
    (sum, m) => sum + (Number(m.totalCost) || Number(m.qty || 0) * Number(m.rate || 0)),
    0
  );
  const manpowerSubtotal = manpower.reduce(
    (sum, p) =>
      sum +
      (Number(p.totalCost) ||
        (Number(p.totalDays) || Number(p.nos || 1) * Number(p.noOfDays || 1)) *
          Number(p.ratePerDay || 0)),
    0
  );
  const equipmentSubtotal = equipment.reduce((sum, e) => {
    const qty = Number(e.quantity || 1);
    const days =
      typeof e.daysOrHrs === 'number'
        ? e.daysOrHrs
        : parseFloat(String(e.daysOrHrs).replace(/[^0-9.]/g, '')) || 1;
    const rate = Number(e.ratePerDay || 0);
    return sum + (Number(e.totalCost) || qty * days * rate);
  }, 0);

  const totalProjectCost =
    materialsSubtotal + manpowerSubtotal + equipmentSubtotal + (Number(overheads) || 0);

  // Materials handlers
  const handleMaterialChange = (index: number, field: keyof JobOrderMaterial, value: any) => {
    setMaterials((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };
      const qty = Number(field === 'qty' ? value : row.qty) || 0;
      const rate = Number(field === 'rate' ? value : row.rate) || 0;
      row.totalCost = qty * rate;
      updated[index] = row;
      return updated;
    });
  };

  const addMaterialRow = () => {
    setMaterials((prev) => [
      ...prev,
      { srNo: prev.length + 1, description: '', qty: 1, rate: 0, totalCost: 0 },
    ]);
  };

  const removeMaterialRow = (idx: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  // Manpower handlers
  const handleManpowerChange = (index: number, field: keyof JobOrderManpower, value: any) => {
    setManpower((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };
      const nos = Number(field === 'nos' ? value : row.nos) || 1;
      const days = Number(field === 'noOfDays' ? value : row.noOfDays) || 1;
      const rate = Number(field === 'ratePerDay' ? value : row.ratePerDay) || 0;
      row.totalDays = nos * days;
      row.totalCost = row.totalDays * rate;
      updated[index] = row;
      return updated;
    });
  };

  const addManpowerRow = () => {
    setManpower((prev) => [
      ...prev,
      { srNo: prev.length + 1, trade: '', nos: 1, noOfDays: 1, totalDays: 1, ratePerDay: 0, totalCost: 0 },
    ]);
  };

  const removeManpowerRow = (idx: number) => {
    setManpower((prev) => prev.filter((_, i) => i !== idx));
  };

  // Equipment handlers
  const handleEquipmentChange = (index: number, field: keyof JobOrderEquipment, value: any) => {
    setEquipment((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };
      const qty = Number(field === 'quantity' ? value : row.quantity) || 1;
      const daysRaw = field === 'daysOrHrs' ? value : row.daysOrHrs;
      const days = parseFloat(String(daysRaw).replace(/[^0-9.]/g, '')) || 1;
      const rate = Number(field === 'ratePerDay' ? value : row.ratePerDay) || 0;
      row.totalCost = qty * days * rate;
      updated[index] = row;
      return updated;
    });
  };

  const addEquipmentRow = () => {
    setEquipment((prev) => [
      ...prev,
      { srNo: prev.length + 1, machineryType: '', capacity: '', quantity: 1, daysOrHrs: '1 Day', ratePerDay: 0, totalCost: 0 },
    ]);
  };

  const removeEquipmentRow = (idx: number) => {
    setEquipment((prev) => prev.filter((_, i) => i !== idx));
  };

  // EXPORT AS PDF
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    showToast('Generating official vector PDF with ISO letterhead...');
    try {
      const fileName = exportJobOrderPdf({
        jobNumber: autoJobNumber,
        date: date || new Date().toISOString().split('T')[0],
        clientName: clientName || 'Commercial Client',
        location: location || 'Sharjah / Dubai Yard',
        deadline: deadline || 'Per Project Schedule',
        priority,
        jobDescription: jobDescription || 'Fabrication and mechanical works execution',
        materials,
        manpower,
        equipment,
        overheadsEstimate: overheads,
        totalEstimatedCost: totalProjectCost,
        preparedBy,
        approvedBy,
        receivedBy,
        company,
        tenantName,
      });
      showToast(`Exported ${fileName} successfully! Check your downloads.`);
    } catch (err: any) {
      console.error('Job order PDF export failed:', err);
      showToast(`PDF Export failed: ${err.message || 'Check browser permissions'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // PRINT
  const handlePrint = () => {
    setIsPrinting(true);
    try {
      const existingIframe = document.getElementById('cemcon-job-print-frame');
      if (existingIframe) existingIframe.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'cemcon-job-print-frame';
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
      const canvasEl = printCanvasRef.current || document.getElementById('printable-job-order-canvas');

      if (!doc || !canvasEl) {
        throw new Error('Print canvas not found');
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>CEMCON - Job Order #${autoJobNumber} - ${clientName || 'Client'}</title>
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
              table { width: 100%; border-collapse: collapse; margin-top: 6px; }
              th, td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 11px; }
              th { background-color: #f1f5f9; text-align: left; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${canvasEl.innerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          showToast('Print dialog initiated.');
        } catch (iframeErr) {
          console.warn('Iframe print error, falling back to PDF download:', iframeErr);
          handleExportPdf();
          showToast('Print dialog blocked by sandbox. Official PDF exported for printing!');
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
      showToast('Print dialog blocked by sandbox. Official PDF exported for printing!');
      setIsPrinting(false);
    }
  };

  // Submit & Save Job Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() && !clientName.trim()) {
      showToast('Please provide a Client Name and Job Description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim() || 'Commercial Client',
          title: jobDescription.slice(0, 50) || 'Fabrication Job Order',
          scopeDescription: jobDescription.trim(),
          location: location.trim(),
          deadline: deadline || undefined,
          priority,
          materials,
          manpower,
          equipment,
          overheadsEstimate: overheads,
          totalEstimatedCost: totalProjectCost,
          preparedBy,
          approvedBy,
          receivedBy,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create job order.');
      }

      const createdJob = await res.json();
      showToast(`Job Order #${createdJob.job_number} assigned and registered!`);
      if (onJobCreated) {
        onJobCreated(createdJob);
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Error creating job:', err);
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl my-auto max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {mode === 'create' ? 'Create New Controlled Job Order' : `Job Order #${job?.job_number}`}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                  AUTO-ASSIGNED SEQ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Works, Materials, Manpower, Equipment & Overheads Register
              </p>
            </div>
          </div>

          {/* Action Buttons: Company Selector, Export PDF, Print, Close */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Company Header Selector */}
            <select
              value={company.code}
              onChange={(e) => {
                const found = CEMCON_COMPANIES.find((c) => c.code === e.target.value);
                if (found) setCompany(found);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-blue-500"
            >
              {CEMCON_COMPANIES.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              disabled={isPrinting || isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition active:scale-95 disabled:opacity-50"
              title="Print official Job Order with company seals"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
              title="Export high-resolution corporate vector PDF"
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

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Metadata Strip: Job Order No, Date, Client, Location, Deadline, Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            {/* 1. Job Order No */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-blue-400" /> Job Order No:
              </label>
              <div className="font-mono text-sm font-black text-blue-400 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
                {loadingNumber ? 'Querying...' : autoJobNumber}
              </div>
            </div>

            {/* 2. Date */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" /> Date:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 3. Client's Name */}
            <div className="lg:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-slate-400" /> Client's Name:
              </label>
              <input
                type="text"
                placeholder="e.g. ADNOC Gas Processing / Petrofac Emirates"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 4. Location */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" /> Location:
              </label>
              <input
                type="text"
                placeholder="e.g. Industrial Area 11"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 5. Deadline & Priority */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" /> Deadline:
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority selector: Normal | Urgent | Critical */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
            <span className="font-bold text-slate-300">Priority Level:</span>
            <div className="flex items-center gap-2">
              {(['Normal', 'Urgent', 'Critical'] as const).map((p) => {
                const isSelected = priority.toLowerCase() === p.toLowerCase();
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isSelected
                        ? p === 'Normal'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : p === 'Urgent'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                          : 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p === 'Critical' && <Flame className="h-3 w-3" />}
                    {p === 'Urgent' && <AlertTriangle className="h-3 w-3" />}
                    {p === 'Normal' && <CheckCircle2 className="h-3 w-3" />}
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. Job Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4" /> 1. Job Description
              </h3>
            </div>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Detailed description of works, specifications, ASME / AWS standards, radiography testing, fabrication steps, and delivery criteria..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>

          {/* 2. Materials Required */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="h-4 w-4" /> 2. Materials Required
              </h3>
              <button
                type="button"
                onClick={addMaterialRow}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-bold transition"
              >
                <Plus className="h-3 w-3" /> Add Material
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3 font-semibold w-12 text-center">SR. #</th>
                    <th className="py-2 px-3 font-semibold">DESCRIPTION</th>
                    <th className="py-2 px-3 font-semibold w-24">QTY. Nos</th>
                    <th className="py-2 px-3 font-semibold w-36">Rate Per Piece (AED)</th>
                    <th className="py-2 px-3 font-semibold w-40 text-right">Total Est. Cost (AED)</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {materials.map((m, idx) => {
                    const rowCost =
                      Number(m.totalCost) || Number(m.qty || 0) * Number(m.rate || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={m.description}
                            onChange={(e) => handleMaterialChange(idx, 'description', e.target.value)}
                            placeholder="e.g. CS Plate 12mm ASTM A516 Gr 70"
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={m.qty}
                            onChange={(e) => handleMaterialChange(idx, 'qty', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={m.rate}
                            onChange={(e) => handleMaterialChange(idx, 'rate', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                          {rowCost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeMaterialRow(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900/90 font-bold border-t border-slate-800">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-slate-400">
                      Materials Subtotal:
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-400 font-mono text-sm">
                      AED{' '}
                      {materialsSubtotal.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 3. Manpower Required */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4" /> 3. Manpower Required
              </h3>
              <button
                type="button"
                onClick={addManpowerRow}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-bold transition"
              >
                <Plus className="h-3 w-3" /> Add Trade
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3 font-semibold w-12 text-center">SR. #</th>
                    <th className="py-2 px-3 font-semibold">TRADE</th>
                    <th className="py-2 px-3 font-semibold w-20">Nos.</th>
                    <th className="py-2 px-3 font-semibold w-24">No of Days</th>
                    <th className="py-2 px-3 font-semibold w-28">Total Days</th>
                    <th className="py-2 px-3 font-semibold w-32">Per Day Rate (AED)</th>
                    <th className="py-2 px-3 font-semibold w-36 text-right">Total Est. Cost (AED)</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {manpower.map((p, idx) => {
                    const nos = Number(p.nos || 1);
                    const days = Number(p.noOfDays || 1);
                    const totDays = nos * days;
                    const rowCost =
                      Number(p.totalCost) || totDays * Number(p.ratePerDay || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={p.trade}
                            onChange={(e) => handleManpowerChange(idx, 'trade', e.target.value)}
                            placeholder="e.g. Certified 6G Welder"
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={p.nos}
                            onChange={(e) => handleManpowerChange(idx, 'nos', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={p.noOfDays}
                            onChange={(e) => handleManpowerChange(idx, 'noOfDays', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-mono font-semibold">
                          {totDays} Days
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={p.ratePerDay}
                            onChange={(e) => handleManpowerChange(idx, 'ratePerDay', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                          {rowCost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeManpowerRow(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900/90 font-bold border-t border-slate-800">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 text-right text-slate-400">
                      Manpower Subtotal:
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-400 font-mono text-sm">
                      AED{' '}
                      {manpowerSubtotal.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 4. Equipment & Machinery Required */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="h-4 w-4" /> 4. Equipment and Machinery Required
              </h3>
              <button
                type="button"
                onClick={addEquipmentRow}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-bold transition"
              >
                <Plus className="h-3 w-3" /> Add Equipment
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3 font-semibold w-12 text-center">SR. #</th>
                    <th className="py-2 px-3 font-semibold">MACHINERY TYPE</th>
                    <th className="py-2 px-3 font-semibold w-28">CAPACITY</th>
                    <th className="py-2 px-3 font-semibold w-24">QUANTITY</th>
                    <th className="py-2 px-3 font-semibold w-28">Days / Hrs</th>
                    <th className="py-2 px-3 font-semibold w-32">Rate Per Day (AED)</th>
                    <th className="py-2 px-3 font-semibold w-36 text-right">Total Est. Cost (AED)</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {equipment.map((e, idx) => {
                    const qty = Number(e.quantity || 1);
                    const days = parseFloat(String(e.daysOrHrs).replace(/[^0-9.]/g, '')) || 1;
                    const rowCost =
                      Number(e.totalCost) || qty * days * Number(e.ratePerDay || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={e.machineryType}
                            onChange={(eVal) => handleEquipmentChange(idx, 'machineryType', eVal.target.value)}
                            placeholder="e.g. Mobile Crane"
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={e.capacity}
                            onChange={(eVal) => handleEquipmentChange(idx, 'capacity', eVal.target.value)}
                            placeholder="e.g. 50 Ton"
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={e.quantity}
                            onChange={(eVal) => handleEquipmentChange(idx, 'quantity', eVal.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={e.daysOrHrs}
                            onChange={(eVal) => handleEquipmentChange(idx, 'daysOrHrs', eVal.target.value)}
                            placeholder="e.g. 5 Days"
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={e.ratePerDay}
                            onChange={(eVal) => handleEquipmentChange(idx, 'ratePerDay', eVal.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                          {rowCost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeEquipmentRow(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900/90 font-bold border-t border-slate-800">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 text-right text-slate-400">
                      Equipment Subtotal:
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-400 font-mono text-sm">
                      AED{' '}
                      {equipmentSubtotal.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. Overheads Estimate & Total Project Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 5. Over Heads Estimate */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-amber-400" /> 5. Over Heads Estimate
              </h3>
              <p className="text-[11px] text-slate-400">
                Transport, consumables, site supervision, radiography NDT testing, HSE & quality inspections:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-bold">AED</span>
                <input
                  type="number"
                  step="100"
                  value={overheads}
                  onChange={(e) => setOverheads(Number(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm font-mono font-bold w-48 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Total Estimated Cost of the Project */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 border border-blue-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Total Estimated Cost of the Project
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Materials + Manpower + Equipment + Overheads
                </p>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-blue-400">AED</span>
                  <span>
                    {totalProjectCost.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Authorizations: Prepared by | Approved by | Received by */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Authorizations & Execution Sign-Off
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block">Prepared by:</span>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded px-2.5 py-1 text-xs"
                />
                <span className="text-[10px] text-slate-500 block">Project Engineer / Superintendent</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block">Approved by:</span>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded px-2.5 py-1 text-xs"
                />
                <span className="text-[10px] text-slate-500 block">Managing Director / Plant Manager</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block">Received by:</span>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded px-2.5 py-1 text-xs"
                />
                <span className="text-[10px] text-slate-500 block">Workshop Superintendent / Site Lead</span>
              </div>
            </div>
          </div>

          {/* HIDDEN PRINT CANVAS (Rendered for native printing) */}
          <div className="hidden">
            <div
              ref={printCanvasRef}
              id="printable-job-order-canvas"
              className="bg-white text-slate-900 p-8 max-w-4xl mx-auto font-sans"
            >
              {/* Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight">
                      {company.name}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-700 uppercase">
                      A MEMBER OF {tenantName} • {company.division}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {company.address} • Tel: {company.phone}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                      TRN: {company.trn} • Reg. No: {company.regNo} • ISO 9001 / ISO 45001 Certified
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase rounded">
                      OFFICIAL JOB ORDER
                    </span>
                    <div className="text-sm font-mono font-bold text-blue-700 mt-1">
                      JOB NO: {autoJobNumber}
                    </div>
                    <div className="text-[10px] font-bold text-rose-600 font-mono mt-0.5">
                      PRIORITY: {priority.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title Banner */}
              <div className="text-center font-bold text-sm bg-slate-100 border border-slate-300 py-1.5 uppercase mb-4">
                WORKS & FABRICATION JOB ORDER
              </div>

              {/* Top Metadata Table */}
              <table className="w-full mb-4 text-xs border border-slate-300">
                <tbody>
                  <tr className="bg-slate-50">
                    <td className="p-2 font-bold w-1/4">Job Order No:</td>
                    <td className="p-2 font-mono font-bold text-blue-700 w-1/4">{autoJobNumber}</td>
                    <td className="p-2 font-bold w-1/4">Date:</td>
                    <td className="p-2 w-1/4">{date}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">Client's Name:</td>
                    <td className="p-2 font-semibold">{clientName || 'N/A'}</td>
                    <td className="p-2 font-bold">Location:</td>
                    <td className="p-2">{location || 'N/A'}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2 font-bold">Deadline:</td>
                    <td className="p-2">{deadline || 'Per Schedule'}</td>
                    <td className="p-2 font-bold">Priority:</td>
                    <td className="p-2 font-bold">{priority}</td>
                  </tr>
                </tbody>
              </table>

              {/* 1. Job Description */}
              <div className="mb-4 text-xs">
                <div className="font-bold bg-slate-900 text-white px-2 py-1 uppercase text-[11px]">
                  1. Job Description
                </div>
                <div className="p-2.5 border border-slate-300 leading-relaxed bg-white">
                  {jobDescription || 'Standard mechanical engineering works and fabrication execution.'}
                </div>
              </div>

              {/* 2. Materials Required */}
              <div className="mb-4 text-xs">
                <div className="font-bold bg-slate-900 text-white px-2 py-1 uppercase text-[11px]">
                  2. Materials Required
                </div>
                <table className="w-full border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-1.5 border">SR. #</th>
                      <th className="p-1.5 border">DESCRIPTION</th>
                      <th className="p-1.5 border">QTY. Nos</th>
                      <th className="p-1.5 border">Rate Per Piece (AED)</th>
                      <th className="p-1.5 border text-right">Total Estimated Cost (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 border text-center">{idx + 1}</td>
                        <td className="p-1.5 border">{m.description}</td>
                        <td className="p-1.5 border">{m.qty}</td>
                        <td className="p-1.5 border">{Number(m.rate).toFixed(2)}</td>
                        <td className="p-1.5 border text-right font-bold">
                          {(Number(m.totalCost) || Number(m.qty) * Number(m.rate)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={4} className="p-1.5 border text-right">Materials Subtotal:</td>
                      <td className="p-1.5 border text-right">{materialsSubtotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. Manpower Required */}
              <div className="mb-4 text-xs">
                <div className="font-bold bg-slate-900 text-white px-2 py-1 uppercase text-[11px]">
                  3. Manpower Required
                </div>
                <table className="w-full border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-1.5 border">SR. #</th>
                      <th className="p-1.5 border">TRADE</th>
                      <th className="p-1.5 border">Nos.</th>
                      <th className="p-1.5 border">No of Days</th>
                      <th className="p-1.5 border">Total Days Required</th>
                      <th className="p-1.5 border">Per Day Rate (AED)</th>
                      <th className="p-1.5 border text-right">Total Est. Cost (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manpower.map((p, idx) => {
                      const totDays = Number(p.nos || 1) * Number(p.noOfDays || 1);
                      return (
                        <tr key={idx}>
                          <td className="p-1.5 border text-center">{idx + 1}</td>
                          <td className="p-1.5 border">{p.trade}</td>
                          <td className="p-1.5 border">{p.nos}</td>
                          <td className="p-1.5 border">{p.noOfDays}</td>
                          <td className="p-1.5 border">{totDays}</td>
                          <td className="p-1.5 border">{Number(p.ratePerDay).toFixed(2)}</td>
                          <td className="p-1.5 border text-right font-bold">
                            {(Number(p.totalCost) || totDays * Number(p.ratePerDay)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={6} className="p-1.5 border text-right">Manpower Subtotal:</td>
                      <td className="p-1.5 border text-right">{manpowerSubtotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Equipment and Machinery Required */}
              <div className="mb-4 text-xs">
                <div className="font-bold bg-slate-900 text-white px-2 py-1 uppercase text-[11px]">
                  4. Equipment and Machinery Required
                </div>
                <table className="w-full border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-1.5 border">SR. #</th>
                      <th className="p-1.5 border">MACHINERY TYPE</th>
                      <th className="p-1.5 border">CAPACITY</th>
                      <th className="p-1.5 border">QUANTITY</th>
                      <th className="p-1.5 border">Days / Hrs</th>
                      <th className="p-1.5 border">Rate Per Day</th>
                      <th className="p-1.5 border text-right">Total Est. Cost (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((e, idx) => {
                      const days = parseFloat(String(e.daysOrHrs).replace(/[^0-9.]/g, '')) || 1;
                      return (
                        <tr key={idx}>
                          <td className="p-1.5 border text-center">{idx + 1}</td>
                          <td className="p-1.5 border">{e.machineryType}</td>
                          <td className="p-1.5 border">{e.capacity}</td>
                          <td className="p-1.5 border">{e.quantity}</td>
                          <td className="p-1.5 border">{e.daysOrHrs}</td>
                          <td className="p-1.5 border">{Number(e.ratePerDay).toFixed(2)}</td>
                          <td className="p-1.5 border text-right font-bold">
                            {(Number(e.totalCost) || Number(e.quantity) * days * Number(e.ratePerDay)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={6} className="p-1.5 border text-right">Equipment Subtotal:</td>
                      <td className="p-1.5 border text-right">{equipmentSubtotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 5. Overheads & Total Estimated Cost */}
              <div className="mb-6 p-3 border border-slate-300 bg-slate-50 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="font-bold">5. Over Heads Estimate:</span>
                  <span className="font-mono font-bold">AED {Number(overheads).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 font-black text-sm text-slate-900">
                  <span>Total Estimated Cost of the project:</span>
                  <span className="font-mono text-base text-blue-900">
                    AED {totalProjectCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-xs">
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center font-bold text-slate-800">
                    {preparedBy}
                  </div>
                  <div className="font-bold text-slate-900">Prepared by</div>
                  <div className="text-[10px] text-slate-500">Project Engineer / Superintendent</div>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center font-bold text-slate-800">
                    {approvedBy}
                  </div>
                  <div className="font-bold text-slate-900">Approved by</div>
                  <div className="text-[10px] text-slate-500">Managing Director / Plant Manager</div>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center font-bold text-slate-800">
                    {receivedBy}
                  </div>
                  <div className="font-bold text-slate-900">Received by</div>
                  <div className="text-[10px] text-slate-500">Workshop Superintendent / Site Lead</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            {mode === 'create' ? (
              <span>
                Sequential assignment via <strong className="text-blue-400">backend mutex lock</strong>
              </span>
            ) : (
              <span>
                Registered Record: <strong className="text-blue-400">{job?.job_number}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            {mode === 'create' && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Assigning & Saving Job Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save & Assign Job Order #{autoJobNumber}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
