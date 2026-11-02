import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Truck,
  User,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export interface ExpiryItem {
  id: string;
  category: 'EMPLOYEE_DOC' | 'VEHICLE_REG' | 'INSURANCE_POLICY';
  title: string;
  subtitle: string;
  documentType: string;
  documentNumber: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'EXPIRED' | 'EXPIRING_SOON' | 'VALID';
  actionUrl?: string;
}

interface DocumentExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ExpiryItem[];
  onRenew?: (item: ExpiryItem) => void;
}

export const DocumentExpiryModal: React.FC<DocumentExpiryModalProps> = ({
  isOpen,
  onClose,
  items,
  onRenew,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'EXPIRED' | 'SOON' | 'VEHICLES' | 'EMPLOYEES'>('ALL');

  if (!isOpen) return null;

  const expiredCount = items.filter((i) => i.daysRemaining <= 0).length;
  const soonCount = items.filter((i) => i.daysRemaining > 0 && i.daysRemaining <= 30).length;
  const warningCount = items.filter((i) => i.daysRemaining > 30 && i.daysRemaining <= 60).length;

  const filteredItems = items.filter((item) => {
    if (filter === 'EXPIRED') return item.daysRemaining <= 0;
    if (filter === 'SOON') return item.daysRemaining > 0 && item.daysRemaining <= 30;
    if (filter === 'VEHICLES') return item.category === 'VEHICLE_REG';
    if (filter === 'EMPLOYEES') return item.category === 'EMPLOYEE_DOC';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Compliance & Document Expiry Alert Center
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {items.length} Tracked Documents
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated expiry surveillance for UAE Visas, Emirates IDs, Passports, Labor Cards and Fleet Registrations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Severity Metrics Row */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 grid grid-cols-3 gap-3 flex-shrink-0">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Critical Expired
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1">{expiredCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">MOHRE / Traffic fines risk</div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3" /> Expiring Within 30 Days
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{soonCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Urgent renewal required</div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Due in 31 - 60 Days
            </div>
            <div className="text-2xl font-black text-blue-300 mt-1">{warningCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Initiate documentation</div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'ALL', label: `All Alerts (${items.length})` },
              { id: 'EXPIRED', label: `Expired (${expiredCount})`, highlight: 'text-rose-400' },
              { id: 'SOON', label: `Due < 30 Days (${soonCount})`, highlight: 'text-amber-400' },
              { id: 'EMPLOYEES', label: 'Employee Passports / Visas' },
              { id: 'VEHICLES', label: 'Vehicles & Mulkiya' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                } ${f.highlight || ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Cards List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-300">No documents found matching this filter.</p>
              <p className="text-xs text-slate-500 mt-1">All company records are within normal validity parameters.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpired = item.daysRemaining <= 0;
              const isUrgent = item.daysRemaining > 0 && item.daysRemaining <= 30;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isExpired
                      ? 'bg-rose-950/30 border-rose-500/40'
                      : isUrgent
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.category === 'VEHICLE_REG'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : item.category === 'INSURANCE_POLICY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {item.category === 'VEHICLE_REG' ? (
                        <Truck className="h-5 w-5" />
                      ) : item.category === 'INSURANCE_POLICY' ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.title}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.documentType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{item.subtitle}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-300">Doc #: {item.documentNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Expiry Date</div>
                      <div className="font-mono font-bold text-white text-xs">{item.expiryDate}</div>
                      <div
                        className={`text-[11px] font-bold mt-0.5 ${
                          isExpired
                            ? 'text-rose-400'
                            : isUrgent
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isExpired
                          ? `EXPIRED (${Math.abs(item.daysRemaining)} days ago)`
                          : `Expires in ${item.daysRemaining} days`}
                      </div>
                    </div>

                    <button
                      onClick={() => onRenew && onRenew(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        isExpired
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <span>Renew</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span>Alert notifications are synchronized with UAE MOHRE and RTA registries.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
