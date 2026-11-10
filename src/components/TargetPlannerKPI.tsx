import React from 'react';
import {
  Target,
  Zap,
  RotateCcw,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { OverallCalculationResult, TargetPlannerAnalysis } from '../types/grading';

interface TargetPlannerKPIProps {
  targetSGPI: number;
  onTargetChange: (newTarget: number) => void;
  analysis: TargetPlannerAnalysis;
  overall: OverallCalculationResult;
  onAutoSimulate: () => void;
  onClearToPending: () => void;
  onFillHighMarks: () => void;
}

export const TargetPlannerKPI: React.FC<TargetPlannerKPIProps> = ({
  targetSGPI,
  onTargetChange,
  analysis,
  onAutoSimulate,
  onClearToPending,
  onFillHighMarks,
}) => {
  const quickTargets = [10.0, 9.5, 9.25, 9.0, 8.5, 8.0];

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all space-y-6">
      {/* Header: Title and Target Value */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#0071e3] dark:text-[#2997ff]" />
            <span>Target SGPA Planner</span>
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Set your target and reverse-solve the minimum marks needed for pending exams.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-[#86868b]">Target:</span>
          <span className="text-2xl font-bold font-sans text-[#0071e3] dark:text-[#2997ff] bg-[#f5f5f7] dark:bg-[#2c2c2e] px-3 py-1 rounded-xl">
            {targetSGPI.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Slider & Presets */}
      <div className="space-y-3">
        <input
          type="range"
          min="4.00"
          max="10.00"
          step="0.05"
          value={targetSGPI}
          onChange={(e) => onTargetChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full appearance-none cursor-pointer accent-[#0071e3] dark:accent-[#2997ff]"
        />

        {/* Quick Target Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-[#86868b] mr-1">Presets:</span>
          {quickTargets.map((qt) => (
            <button
              key={qt}
              type="button"
              onClick={() => onTargetChange(qt)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                Math.abs(targetSGPI - qt) < 0.01
                  ? 'bg-[#0071e3] text-white font-semibold shadow-sm'
                  : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7]'
              }`}
            >
              {qt.toFixed(2)}
            </button>
          ))}
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
          analysis.status === 'unattainable'
            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
            : analysis.status === 'secured'
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
            : 'bg-[#f5f5f7] dark:bg-[#2c2c2e] border-black/[0.04] dark:border-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7]'
        }`}
      >
        {analysis.status === 'unattainable' ? (
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        ) : analysis.status === 'secured' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <Target className="w-5 h-5 text-[#0071e3] dark:text-[#2997ff] shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {analysis.status === 'unattainable' && 'Unattainable Target'}
              {analysis.status === 'secured' && 'Target Secured'}
              {analysis.status === 'achievable' && `Aim Grade: ${analysis.recommendedLetterGrade}`}
              {analysis.status === 'all-filled' && 'All Subjects Evaluated'}
            </span>
            {analysis.unfilledCredits > 0 && (
              <span className="text-xs font-medium text-[#86868b]">
                {analysis.unfilledCredits} credits remaining
              </span>
            )}
          </div>
          <p className="text-xs mt-1 text-[#86868b] leading-relaxed">
            {analysis.statusMessage}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <button
          type="button"
          onClick={onAutoSimulate}
          disabled={analysis.unfilledCredits === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium shadow-sm transition active:scale-95 disabled:opacity-40"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          <span>Auto-Fill Target Marks</span>
        </button>

        <button
          type="button"
          onClick={onFillHighMarks}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] transition"
        >
          <Award className="w-3.5 h-3.5 text-emerald-500" />
          <span>Fill Grade O (85%)</span>
        </button>

        <button
          type="button"
          onClick={onClearToPending}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#f5f5f7] hover:bg-rose-50 dark:bg-[#2c2c2e] dark:hover:bg-rose-950/30 text-xs font-medium text-[#86868b] hover:text-rose-600 dark:hover:text-rose-400 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Pending</span>
        </button>
      </div>
    </div>
  );
};
