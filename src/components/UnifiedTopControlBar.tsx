import React from 'react';
import {
  Sparkles,
  RotateCcw,
  Undo2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { SEMESTER_OPTIONS } from '../utils/storageManager';

interface UnifiedTopControlBarProps {
  currentSemesterId: string;
  onSelectSemester: (semesterId: string) => void;
  targetSGPI: number;
  onTargetChange: (newTarget: number) => void;
  currentSGPI: number;
  maxPossibleSGPI: number;
  unfilledCredits: number;
  hasAnyFailedHead: boolean;
  onAutofillMissing: () => void;
  onClearAllMarks: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const UnifiedTopControlBar: React.FC<UnifiedTopControlBarProps> = ({
  currentSemesterId,
  onSelectSemester,
  targetSGPI,
  onTargetChange,
  currentSGPI,
  maxPossibleSGPI,
  unfilledCredits,
  hasAnyFailedHead,
  onAutofillMissing,
  onClearAllMarks,
  onUndo,
  canUndo = false,
}) => {
  const isUnreachable = maxPossibleSGPI < targetSGPI && unfilledCredits > 0;
  const isSecured = currentSGPI >= targetSGPI && unfilledCredits === 0;

  const quickPresets = [10.0, 9.5, 9.25, 9.0, 8.5, 8.0];

  return (
    <div className="space-y-4">
      {/* Main Unified Controls Card */}
      <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-5 transition-all">
        {/* Row 1: Semester Selector + Summary Metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          {/* Semester Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 dark:bg-[#2997ff]/10 flex items-center justify-center text-[#0071e3] dark:text-[#2997ff] shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                Select Academic Semester
              </span>
              <div className="relative inline-flex items-center mt-0.5">
                <select
                  value={currentSemesterId}
                  onChange={(e) => onSelectSemester(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#3a3a3c] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition"
                >
                  {SEMESTER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#86868b] pointer-events-none absolute right-2" />
              </div>
            </div>
          </div>

          {/* Clean Summary Metric Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 self-stretch md:self-auto">
            {/* Current SGPA */}
            <div className="p-3 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e]/60 text-center flex flex-col justify-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                Current SGPA
              </span>
              <div className="mt-0.5 flex items-baseline justify-center gap-1">
                <span
                  className={`text-xl sm:text-2xl font-bold font-sans tracking-tight ${
                    hasAnyFailedHead
                      ? 'text-rose-500'
                      : currentSGPI >= targetSGPI && currentSGPI > 0
                      ? 'text-emerald-500'
                      : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                  }`}
                >
                  {currentSGPI > 0 ? currentSGPI.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] text-[#86868b]">/10</span>
              </div>
            </div>

            {/* Max Possible SGPA */}
            <div className="p-3 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e]/60 text-center flex flex-col justify-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                Max Possible
              </span>
              <div className="mt-0.5 flex items-baseline justify-center gap-1">
                <span className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-[#0071e3] dark:text-[#2997ff]">
                  {maxPossibleSGPI.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#86868b]">/10</span>
              </div>
            </div>

            {/* Credits Left */}
            <div className="p-3 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e]/60 text-center flex flex-col justify-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                Credits Left
              </span>
              <div className="mt-0.5">
                {unfilledCredits > 0 ? (
                  <span className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-amber-500">
                    {unfilledCredits}
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-emerald-500 flex items-center justify-center gap-1 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Done
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Target SGPA Input + Quick Presets + Big Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Target SGPA Stepper / Input */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] block">
                Target SGPA Goal
              </span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="4.00"
                  max="10.00"
                  step="0.05"
                  value={targetSGPI}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onTargetChange(Math.min(10, Math.max(4, val)));
                  }}
                  className="w-24 sm:w-28 h-11 text-center text-lg sm:text-xl font-bold font-sans rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#0071e3] dark:text-[#2997ff] border border-black/[0.08] dark:border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1">
                  {quickPresets.map((qp) => (
                    <button
                      key={qp}
                      type="button"
                      onClick={() => onTargetChange(qp)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        Math.abs(targetSGPI - qp) < 0.01
                          ? 'bg-[#0071e3] text-white shadow-xs'
                          : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7]'
                      }`}
                    >
                      {qp.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Big Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-end">
            {/* Big Primary Autofill Button */}
            <button
              type="button"
              onClick={onAutofillMissing}
              disabled={unfilledCredits === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#0071e3]/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Autofill Missing Marks for Target</span>
            </button>

            {/* Undo Button if available */}
            {canUndo && onUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-xs sm:text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.12] transition"
                title="Undo last autofill"
              >
                <Undo2 className="w-4 h-4 text-[#86868b]" />
                <span>Undo</span>
              </button>
            )}

            {/* Unmistakable Clear All Marks Button */}
            <button
              type="button"
              onClick={onClearAllMarks}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-[#f5f5f7] hover:bg-rose-50 dark:bg-[#2c2c2e] dark:hover:bg-rose-950/30 text-xs sm:text-sm font-semibold text-[#86868b] hover:text-rose-600 dark:hover:text-rose-400 border border-black/[0.08] dark:border-white/[0.12] transition"
              title="Clear all marks and start fresh"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All Marks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Unreachable Alert Banner */}
      {isUnreachable && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-rose-800 dark:text-rose-200">
              Target unreachable. Highest possible SGPA is{' '}
              <strong className="underline font-bold">{maxPossibleSGPI.toFixed(2)}</strong>.
            </span>
          </div>

          <button
            type="button"
            onClick={() => onTargetChange(maxPossibleSGPI)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            Set Target to {maxPossibleSGPI.toFixed(2)}
          </button>
        </div>
      )}

      {/* Target Secured Success Banner */}
      {isSecured && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Target Achieved! Your semester SGPA is {currentSGPI.toFixed(2)} / 10.00.
          </span>
        </div>
      )}
    </div>
  );
};
