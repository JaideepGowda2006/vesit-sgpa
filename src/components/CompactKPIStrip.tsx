import React from 'react';
import {
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import type { OverallCalculationResult, TargetPlannerAnalysis } from '../types/grading';

interface CompactKPIStripProps {
  overall: OverallCalculationResult;
  analysis: TargetPlannerAnalysis;
  targetSGPI: number;
  onAutoSimulate: () => void;
  onClearToPending?: () => void;
  onSwitchToPlannerTab: () => void;
}

export const CompactKPIStrip: React.FC<CompactKPIStripProps> = ({
  overall,
  analysis,
  targetSGPI,
  onAutoSimulate,
  onSwitchToPlannerTab,
}) => {
  const currentSGPA = overall.currentSGPI > 0 ? overall.currentSGPI.toFixed(2) : '--';

  return (
    <div className="mb-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Prominent Clean SGPA */}
        <div className="flex items-center gap-5">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b]">
              Estimated SGPA
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-4xl sm:text-5xl font-bold tracking-tight font-sans ${
                  overall.hasAnyFailedCourse
                    ? 'text-rose-500'
                    : overall.currentSGPI >= targetSGPI && overall.currentSGPI > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                }`}
              >
                {currentSGPA}
              </span>
              <span className="text-sm font-medium text-[#86868b]">/ 10.00</span>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-black/[0.06] dark:bg-white/[0.1] hidden sm:block mx-1" />

          {/* Key Secondary Stats in Apple Pill Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
              <span className="text-[#86868b] mr-1">Marks:</span>
              <span className="font-semibold">{overall.totalObtainedMarks}</span>
              <span className="text-[#86868b]"> / {overall.totalMaxMarks}</span>
              {overall.filledCoursesCount > 0 && (
                <span className="ml-1 text-[#86868b]">({overall.overallPercentage.toFixed(1)}%)</span>
              )}
            </div>

            <div className="px-3 py-1.5 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
              <span className="text-[#86868b] mr-1">Credits:</span>
              <span className="font-semibold">{overall.totalEarnedCredits}</span>
              <span className="text-[#86868b]"> / {overall.totalRegisteredCredits}</span>
            </div>

            {overall.hasAnyFailedCourse && (
              <div className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Failed Head Detected</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Target SGPA & Solver Action */}
        <div className="flex items-center flex-wrap gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-black/[0.06] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onSwitchToPlannerTab}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] transition"
          >
            <Target className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
            <span>Target: <strong>{targetSGPI.toFixed(2)}</strong></span>
            <ArrowRight className="w-3 h-3 text-[#86868b]" />
          </button>

          {analysis.unfilledCredits > 0 ? (
            <button
              type="button"
              onClick={onAutoSimulate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium shadow-sm transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Auto-Fill Target</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All Evaluated</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Progress Bar */}
      <div className="mt-4 w-full bg-[#f5f5f7] dark:bg-[#2c2c2e] h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            overall.hasAnyFailedCourse
              ? 'bg-rose-500'
              : overall.currentSGPI >= targetSGPI && overall.currentSGPI > 0
              ? 'bg-emerald-500'
              : 'bg-[#0071e3]'
          }`}
          style={{ width: `${Math.max(4, Math.min(100, (overall.currentSGPI / 10) * 100))}%` }}
        />
      </div>
    </div>
  );
};
