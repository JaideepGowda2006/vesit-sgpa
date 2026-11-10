import React from 'react';
import {
  Target,
  Sparkles,
  TrendingUp,
  AlertOctagon,
  CheckCircle,
  Award,
  Zap,
  RotateCcw,
  Percent,
  Clock,
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
  overall,
  onAutoSimulate,
  onClearToPending,
  onFillHighMarks,
}) => {
  const quickTargets = [10.0, 9.5, 9.25, 9.0, 8.5, 8.0];

  let statusBannerBg = 'bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
  let statusIcon = <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;

  if (analysis.status === 'unattainable') {
    statusBannerBg = 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200';
    statusIcon = <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />;
  } else if (analysis.status === 'secured') {
    statusBannerBg = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200';
    statusIcon = <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  } else if (analysis.status === 'achievable') {
    statusBannerBg = 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-200';
    statusIcon = <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
  }

  return (
    <section className="mb-6">
      {/* Target SGPA Planner Control Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          {/* Target SGPA Slider & Input */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="target-sgpa-input"
                className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
              >
                <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Reverse Target SGPA Solver</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Target Value:</span>
                <div className="relative">
                  <input
                    id="target-sgpa-input"
                    type="number"
                    min="4.00"
                    max="10.00"
                    step="0.05"
                    value={targetSGPI}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        onTargetChange(Math.min(10.0, Math.max(4.0, val)));
                      }
                    }}
                    className="w-20 px-2 py-1 text-right text-base font-bold bg-slate-50 dark:bg-slate-950 border border-indigo-400 dark:border-indigo-500/50 rounded-lg text-indigo-600 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Range Slider */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="4.00"
                max="10.00"
                step="0.05"
                value={targetSGPI}
                onChange={(e) => onTargetChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>4.00 (Pass)</span>
                <span>6.00 (First Class)</span>
                <span>7.50 (Distinction)</span>
                <span>9.00 (Dean's List)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">10.00 (Max)</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Quick Target:</span>
              {quickTargets.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => onTargetChange(qt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                    Math.abs(targetSGPI - qt) < 0.01
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {qt.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Simulation Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
            <button
              type="button"
              onClick={onAutoSimulate}
              disabled={analysis.unfilledCredits === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25 transition active:scale-95 disabled:opacity-40"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Auto-Solve Target Marks</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onFillHighMarks}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                title="Fill all courses with ~85% marks (Grade O)"
              >
                <Award className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Fill Distinctions</span>
              </button>

              <button
                type="button"
                onClick={onClearToPending}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700/80 transition"
                title="Mark all subjects pending to run fresh reverse planner"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear to Pending</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Status Alert Banner */}
        <div className={`mt-5 p-4 rounded-xl border flex items-start gap-3.5 transition-all ${statusBannerBg}`}>
          {statusIcon}
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {analysis.status === 'unattainable' && '⚠️ Target Impossible With Existing Grades'}
                {analysis.status === 'secured' && '🎉 Target Secured / Guaranteed Safe'}
                {analysis.status === 'achievable' && '🎯 Active Target Path Available'}
                {analysis.status === 'all-filled' && '📊 Complete Evaluation Result'}
              </h3>
              {analysis.status === 'achievable' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40">
                  Aim Grade: {analysis.recommendedLetterGrade} (Point ≥{' '}
                  {Math.ceil(analysis.requiredAverageGP)})
                </span>
              )}
            </div>
            <p className="text-xs font-medium mt-1 leading-relaxed">{analysis.statusMessage}</p>
          </div>
        </div>

        {/* Top 4 Summary Cards: Current SGPA, Total Scored Marks (%), Target Goal Status, and Remaining Credits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-5">
          {/* Card 1: Current SGPA */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Current SGPA
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                  overall.hasAnyFailedCourse
                    ? 'text-rose-600 dark:text-rose-400'
                    : overall.currentSGPI >= targetSGPI
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-cyan-600 dark:text-cyan-400'
                }`}
              >
                {overall.currentSGPI > 0 ? overall.currentSGPI.toFixed(2) : '--'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 10.00</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {overall.filledCoursesCount} of {overall.totalCoursesCount} evaluated ({analysis.currentSecuredPoints.toFixed(0)} CXG)
            </span>
          </div>

          {/* Card 2: Total Scored Marks (%) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Scored Marks (%)
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {overall.filledCoursesCount > 0 ? `${overall.overallPercentage.toFixed(1)}%` : '--'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {overall.totalObtainedMarks} / {overall.totalMaxMarks} total marks
            </span>
          </div>

          {/* Card 3: Target Goal Status */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Target Goal Status
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-xl sm:text-2xl font-extrabold font-mono ${
                  analysis.status === 'unattainable'
                    ? 'text-rose-600 dark:text-rose-400'
                    : analysis.status === 'secured'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {analysis.status === 'unattainable'
                  ? 'Unattainable'
                  : analysis.status === 'secured'
                  ? 'Target Safe'
                  : `Aim ${analysis.recommendedLetterGrade}`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Deficit: {analysis.deficitPoints > 0 ? `+${analysis.deficitPoints.toFixed(1)} pts` : '0.0 pts'}
            </span>
          </div>

          {/* Card 4: Remaining Credits */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Remaining Credits
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-violet-600 dark:text-violet-400 font-mono">
                {analysis.unfilledCredits}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                / {overall.totalRegisteredCredits} total cr
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {analysis.unfilledCredits > 0
                ? `Req GP: ${analysis.requiredAverageGP.toFixed(2)} / 10`
                : 'All credits finalized'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
