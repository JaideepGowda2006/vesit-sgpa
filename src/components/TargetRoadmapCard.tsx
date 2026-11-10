import React, { useState } from 'react';
import type { CourseAssessment, CourseCalculationResult } from '../types/grading';
import {
  generateRoadmapAnalysis,
  type RoadmapPlan,
} from '../utils/roadmapPlanner';
import {
  Target,
  Zap,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Sparkles,
  ShieldCheck,
  FlaskConical,
  Scale,
} from 'lucide-react';

interface TargetRoadmapCardProps {
  courses: CourseAssessment[];
  courseResults: Map<string, CourseCalculationResult>;
  targetSGPI: number;
  onTargetChange?: (newTarget: number) => void;
  onApplyPlan: (plan: RoadmapPlan) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const TargetRoadmapCard: React.FC<TargetRoadmapCardProps> = ({
  courses,
  courseResults,
  targetSGPI,
  onTargetChange,
  onApplyPlan,
  onUndo,
  canUndo = false,
}) => {
  const analysis = generateRoadmapAnalysis(courses, courseResults, targetSGPI);
  const [selectedPlanId, setSelectedPlanId] = useState<'balanced' | 'realistic'>('balanced');

  const activePlan =
    analysis.plans.find((p) => p.id === selectedPlanId) || analysis.plans[0];

  // Quick target preset buttons
  const quickTargets = [9.75, 9.5, 9.25, 9.0, 8.5, 8.0];

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all space-y-6">
      {/* Header: Target SGPA & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff]">
              <Target className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
              Target SGPA Roadmap
            </h2>
            {analysis.unfilledCredits > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                {analysis.unfilledCredits} Cr Remaining
              </span>
            )}
          </div>
          <p className="text-xs text-[#86868b] mt-1">
            Concrete score requirements for pending subjects to hit your exact SGPA target.
          </p>
        </div>

        {/* Target Stepper / Display */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider block">
              Target
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold font-sans text-[#0071e3] dark:text-[#2997ff]">
                {targetSGPI.toFixed(2)}
              </span>
              <span className="text-xs text-[#86868b]">/ 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Target Preset Chips */}
      {onTargetChange && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-[#86868b] mr-1">Quick Target:</span>
          {quickTargets.map((qt) => (
            <button
              key={qt}
              type="button"
              onClick={() => onTargetChange(qt)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                Math.abs(targetSGPI - qt) < 0.01
                  ? 'bg-[#0071e3] text-white font-semibold shadow-sm'
                  : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7]'
              }`}
            >
              {qt.toFixed(2)}
            </button>
          ))}
        </div>
      )}

      {/* Case 1: Target Unreachable */}
      {analysis.status === 'unreachable' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                Target Unreachable
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                Target unreachable. Maximum possible SGPA with your current scores is{' '}
                <strong className="underline">{analysis.maxPossibleSGPI.toFixed(2)}</strong>.
              </p>
            </div>
          </div>

          {onTargetChange && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onTargetChange(analysis.maxPossibleSGPI)}
                className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Adjust Target to Max Possible ({analysis.maxPossibleSGPI.toFixed(2)})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Case 2: Target Already Secured */}
      {analysis.status === 'secured' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Target Secured!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed mt-0.5">
                You only need passing marks (Grade P, 40%) in the {analysis.unfilledCredits} remaining
                credits to secure your target of{' '}
                <strong>{targetSGPI.toFixed(2)} SGPA</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Case 3: All Filled */}
      {analysis.status === 'all-filled' && (
        <div className="p-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#0071e3] dark:text-[#2997ff] shrink-0" />
          <p className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7]">
            All course marks are filled in! Check your estimated SGPA on the summary card above.
          </p>
        </div>
      )}

      {/* Case 4: Target Achievable - Concrete Presets & Roadmap */}
      {analysis.status === 'achievable' && activePlan && (
        <div className="space-y-4">
          {/* Top Clean Summary Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e]/70 border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
              To hit your target of {targetSGPI.toFixed(2)} SGPA with {analysis.unfilledCredits} credits remaining:
            </span>
            <p className="text-sm sm:text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mt-1 leading-snug">
              {activePlan.summarySentence}
            </p>

            {/* Discrete Grade Counts Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {activePlan.gradeCounts.map((gc) => (
                <span
                  key={gc.grade}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    gc.grade === 'O'
                      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                      : gc.grade === 'A'
                      ? 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/20'
                      : gc.grade === 'B'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                  }`}
                >
                  <span className="font-bold">{gc.count}×</span>
                  <span>Grade {gc.grade}</span>
                  <span className="text-[10px] opacity-75 font-mono">({gc.credits} Cr)</span>
                </span>
              ))}

              <span className="text-xs text-[#86868b] ml-auto">
                Yields SGPA: <strong className="text-[#1d1d1f] dark:text-[#f5f5f7] font-sans">{activePlan.achievableSGPI.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          {/* Plan Selector Tabs: Balanced vs Realistic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPlanId('balanced')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                selectedPlanId === 'balanced'
                  ? 'bg-white dark:bg-[#2c2c2e] border-[#0071e3] dark:border-[#2997ff] shadow-sm ring-1 ring-[#0071e3]/20'
                  : 'bg-[#f5f5f7]/60 dark:bg-[#2c2c2e]/40 border-black/[0.04] dark:border-white/[0.06] hover:bg-white dark:hover:bg-[#2c2c2e]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  <Scale className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
                  Balanced Plan
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.1] text-[#86868b]">
                  Even Distribution
                </span>
              </div>
              <p className="text-[11px] text-[#86868b] mt-1 line-clamp-1">
                Distributes required grade points equally across all remaining courses.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlanId('realistic')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                selectedPlanId === 'realistic'
                  ? 'bg-white dark:bg-[#2c2c2e] border-[#0071e3] dark:border-[#2997ff] shadow-sm ring-1 ring-[#0071e3]/20'
                  : 'bg-[#f5f5f7]/60 dark:bg-[#2c2c2e]/40 border-black/[0.04] dark:border-white/[0.06] hover:bg-white dark:hover:bg-[#2c2c2e]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
                  Realistic Plan
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                  Lab Boosted
                </span>
              </div>
              <p className="text-[11px] text-[#86868b] mt-1 line-clamp-1">
                Sets labs to Grade O, relaxing Theory score requirements.
              </p>
            </button>
          </div>

          {/* Roadmap Bullets List */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.06] bg-[#fafafc] dark:bg-[#252528] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-between text-xs text-[#86868b] font-medium">
              <span>Required Score per Pending Subject ({activePlan.items.length})</span>
              <span>Minimum Marks Needed</span>
            </div>

            {activePlan.items.map((item) => (
              <div
                key={item.courseId}
                className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white dark:hover:bg-[#2c2c2e]/50 transition"
              >
                {/* Left: Code, Name, Type */}
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                      {item.courseName}
                    </span>
                    <span className="text-[10px] font-mono text-[#86868b] shrink-0">
                      {item.courseCode}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-black/[0.04] dark:bg-white/[0.08] text-[#86868b] shrink-0">
                      {item.category === 'TH' ? 'Theory' : 'Lab'} • {item.credits} Cr
                    </span>
                  </div>

                  {/* Component Breakdown Hint if MT+CA known */}
                  {item.eseAnalysis && (
                    <div className="text-[11px] font-medium text-[#0071e3] dark:text-[#2997ff] flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{item.eseAnalysis.displayText}</span>
                    </div>
                  )}
                </div>

                {/* Right: Concrete Score Target */}
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      item.targetGrade === 'O'
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                        : item.targetGrade === 'A'
                        ? 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff]'
                        : item.targetGrade === 'B'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    Grade {item.targetGrade}
                  </span>

                  <div className="text-right">
                    <span className="text-xs font-semibold font-mono text-[#1d1d1f] dark:text-[#f5f5f7]">
                      ≥ {item.minMarksNeeded}
                    </span>
                    <span className="text-xs text-[#86868b] font-mono">
                      /{item.totalMax}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer: Apply Plan & Undo */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onApplyPlan(activePlan)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Apply this Plan to Table</span>
              </button>

              {canUndo && onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
                  title="Revert autofilled marks"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#86868b]">
              Sets minimum marks needed to achieve {activePlan.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
