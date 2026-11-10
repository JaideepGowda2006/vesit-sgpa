import React from 'react';
import {
  TrendingUp,
  Target,
  Percent,
  Clock,
  Zap,
  Sparkles,
  AlertOctagon,
  CheckCircle,
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
  return (
    <div className="mb-5 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Current SGPA */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Current SGPA
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl sm:text-2xl font-black font-mono leading-none ${
                  overall.hasAnyFailedCourse
                    ? 'text-rose-600 dark:text-rose-400'
                    : overall.currentSGPI >= targetSGPI && overall.currentSGPI > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {overall.currentSGPI > 0 ? overall.currentSGPI.toFixed(2) : '--'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">/ 10</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
              {overall.filledCoursesCount}/{overall.totalCoursesCount} evaluated ({analysis.currentSecuredPoints.toFixed(0)} pts)
            </span>
          </div>
        </div>

        {/* Metric 2: Total Scored Marks % */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Marks Scored
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 leading-none">
                {overall.filledCoursesCount > 0 ? `${overall.overallPercentage.toFixed(1)}%` : '--'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
              {overall.totalObtainedMarks} / {overall.totalMaxMarks} total marks
            </span>
          </div>
        </div>

        {/* Metric 3: Target SGPA & Status */}
        <div
          onClick={onSwitchToPlannerTab}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:border-indigo-400/50 transition group"
          title="Click to open reverse target planner"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Target SGPA
              </span>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 underline font-semibold">
                Adjust
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 leading-none">
                {targetSGPI.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
              {analysis.status === 'unattainable' ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                  <AlertOctagon className="w-3 h-3" /> Unattainable
                </span>
              ) : analysis.status === 'secured' ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3" /> Target Safe
                </span>
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> Aim Grade {analysis.recommendedLetterGrade}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Metric 4: Remaining Credits & Quick Action */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Pending Credits
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-violet-600 dark:text-violet-400 leading-none">
                  {analysis.unfilledCredits}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  / {overall.totalRegisteredCredits} cr
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                {analysis.unfilledCredits > 0
                  ? `Req GP: ${analysis.requiredAverageGP.toFixed(2)}/10`
                  : 'All Evaluated'}
              </span>
            </div>
          </div>

          {/* Auto-Solve quick button */}
          {analysis.unfilledCredits > 0 && (
            <button
              type="button"
              onClick={onAutoSimulate}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition active:scale-95 shrink-0"
              title="Auto-solve marks to meet Target SGPA"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
