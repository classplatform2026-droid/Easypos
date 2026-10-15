import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  X,
  Check,
  Plus,
  Minus,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  Store,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';

export interface ExpiryStoreTarget {
  id: string;
  name: string;
  branch?: string;
  owner?: string;
  ownerName?: string;
  phone?: string;
  plan?: string;
  subscription?: any;
  expiryDate?: string | null;
}

interface AdjustExpiryModalProps {
  isOpen: boolean;
  store: ExpiryStoreTarget | null;
  onClose: () => void;
  onSuccess: (updatedStore: any) => void;
  onShowToast?: (msg: string, type?: 'success' | 'danger') => void;
}

export const AdjustExpiryModal: React.FC<AdjustExpiryModalProps> = ({
  isOpen,
  store,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'preset' | 'customDays' | 'exactDate'>('preset');
  const [daysDelta, setDaysDelta] = useState<number>(30);
  const [exactDateInput, setExactDateInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize dates whenever store changes
  useEffect(() => {
    if (store) {
      setMode('preset');
      setDaysDelta(30);

      const currentIso = store.expiryDate || store.subscription?.expiryDate || store.subscription?.endDate;
      if (currentIso) {
        try {
          const d = new Date(currentIso);
          if (!isNaN(d.getTime())) {
            // Default exact date input to next month or current expiry
            const target = new Date(d.getTime() + 30 * 86400000);
            setExactDateInput(target.toISOString().split('T')[0]);
          }
        } catch {
          setExactDateInput(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
        }
      } else {
        setExactDateInput(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      }
    }
  }, [store]);

  const currentExpiryDate = useMemo(() => {
    if (!store) return null;
    const raw = store.expiryDate || store.subscription?.expiryDate || store.subscription?.endDate;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }, [store]);

  const currentDaysRemaining = useMemo(() => {
    if (!currentExpiryDate) return null;
    const diffMs = currentExpiryDate.getTime() - Date.now();
    return Math.round(diffMs / 86400000);
  }, [currentExpiryDate]);

  // Compute live preview of new expiry date
  const newExpiryDate = useMemo(() => {
    if (!store) return new Date();

    if (mode === 'exactDate') {
      if (!exactDateInput) return new Date();
      const [y, m, d] = exactDateInput.split('-').map(Number);
      if (!y || !m || !d) return new Date();
      return new Date(y, m - 1, d, 23, 59, 59);
    }

    // preset or customDays
    const baseMs = currentExpiryDate ? currentExpiryDate.getTime() : Date.now();
    return new Date(baseMs + (daysDelta || 0) * 86400000);
  }, [store, mode, exactDateInput, daysDelta, currentExpiryDate]);

  const newDaysRemaining = useMemo(() => {
    if (!newExpiryDate) return 0;
    const diffMs = newExpiryDate.getTime() - Date.now();
    return Math.round(diffMs / 86400000);
  }, [newExpiryDate]);

  const isWillBeExpired = useMemo(() => {
    return newExpiryDate.getTime() <= Date.now();
  }, [newExpiryDate]);

  if (!isOpen || !store) return null;

  const handleApply = async () => {
    setLoading(true);
    try {
      let payload: { daysChange?: number; exactExpiryDate?: string };
      if (mode === 'exactDate') {
        if (!exactDateInput) {
          if (onShowToast) onShowToast('Please select a valid date.', 'danger');
          setLoading(false);
          return;
        }
        payload = { exactExpiryDate: newExpiryDate.toISOString() };
      } else {
        payload = { daysChange: daysDelta };
      }

      const res = await api.adminAdjustSubscriptionExpiry(store.id, payload);
      if (onShowToast) {
        onShowToast(
          res.message || `Subscription expiry updated for "${store.name}".`,
          'success'
        );
      }
      onSuccess(res.store);
      onClose();
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to update subscription expiry date.', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  const presetIncreases = [
    { label: '+7 Days', value: 7, desc: '1 Week' },
    { label: '+15 Days', value: 15, desc: 'Half Month' },
    { label: '+30 Days', value: 30, desc: '1 Month' },
    { label: '+90 Days', value: 90, desc: '3 Months' },
    { label: '+365 Days', value: 365, desc: '1 Year' },
  ];

  const presetDecreases = [
    { label: '-7 Days', value: -7, desc: 'Decrease 1 Week' },
    { label: '-15 Days', value: -15, desc: 'Decrease 15 Days' },
    { label: '-30 Days', value: -30, desc: 'Decrease 1 Month' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Adjust Subscription Expiry
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                  {store.plan || store.subscription?.plan || 'Standard'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Store className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-slate-700">{store.name}</span>
                {store.branch && <span className="text-slate-400">({store.branch})</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Current Expiry Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Current Expiry Date
              </span>
              <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                {currentExpiryDate
                  ? currentExpiryDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'No active expiry date'}
              </span>
            </div>
            <div>
              {currentDaysRemaining !== null ? (
                currentDaysRemaining > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>{currentDaysRemaining} days left</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Expired {Math.abs(currentDaysRemaining)}d ago</span>
                  </span>
                )
              ) : (
                <span className="text-slate-400 text-[11px]">Inactive</span>
              )}
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setMode('preset')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'preset' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Quick Presets
            </button>
            <button
              type="button"
              onClick={() => setMode('customDays')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'customDays' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              +/- Days
            </button>
            <button
              type="button"
              onClick={() => setMode('exactDate')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'exactDate' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Exact Date
            </button>
          </div>

          {/* Content based on Mode */}
          {mode === 'preset' && (
            <div className="space-y-3">
              {/* Increase Section */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1 mb-1.5">
                  <Plus className="w-3 h-3" />
                  <span>Increase Expiry (মেয়াদ বৃদ্ধি করুন)</span>
                </span>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {presetIncreases.map((p) => {
                    const isSelected = daysDelta === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setDaysDelta(p.value)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-2xs ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{p.label}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Decrease Section */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1 mb-1.5">
                  <Minus className="w-3 h-3" />
                  <span>Decrease Expiry (মেয়াদ কমান)</span>
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {presetDecreases.map((p) => {
                    const isSelected = daysDelta === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setDaysDelta(p.value)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold shadow-2xs ring-1 ring-rose-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{p.label}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {mode === 'customDays' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  দিন যোগ বা বিয়োগ করুন (+ বা - সংখ্যা দিন)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden flex-1 bg-white">
                    <button
                      type="button"
                      onClick={() => setDaysDelta((prev) => prev - 1)}
                      className="p-2.5 text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      title="Decrease by 1 day"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={daysDelta}
                      onChange={(e) => setDaysDelta(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-center font-mono font-bold text-slate-900 text-sm focus:outline-none"
                      placeholder="e.g. 15 or -7"
                    />
                    <button
                      type="button"
                      onClick={() => setDaysDelta((prev) => prev + 1)}
                      className="p-2.5 text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      title="Increase by 1 day"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Days</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Tip: + সংখ্যা দিলে মেয়াদ বাড়বে, - সংখ্যা দিলে মেয়াদ কমে যাবে।
                </p>
              </div>

              {/* Quick Jump buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[-30, -7, -1, 1, 7, 15, 30, 60, 90].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDaysDelta(num)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      daysDelta === num
                        ? 'bg-blue-600 text-white'
                        : num > 0
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {num > 0 ? `+${num}d` : `${num}d`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'exactDate' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 block">
                নির্দিষ্ট মেয়াদ শেষ হওয়ার তারিখ নির্বাচন করুন
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={exactDateInput}
                  onChange={(e) => setExactDateInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                নির্বাচিত তারিখ অনুযায়ী স্টোরের সাবস্ক্রিপশন স্বয়ংক্রিয়ভাবে একটিভ বা এক্সপায়ার হবে।
              </p>
            </div>
          )}

          {/* Live Preview Card */}
          <div
            className={`rounded-xl p-3 border transition-colors ${
              isWillBeExpired
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-blue-50/60 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <span>New Expiry Preview</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isWillBeExpired
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isWillBeExpired ? 'Will be Expired' : 'Will be Active'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  {newExpiryDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold font-mono">
                  {newDaysRemaining >= 0 ? `In ${newDaysRemaining} days` : `${Math.abs(newDaysRemaining)} days ago`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Apply & Save Expiry</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
