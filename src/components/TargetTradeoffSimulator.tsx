import React, { useState, useEffect, useMemo } from 'react';
import type {
  CourseAssessment,
  CourseCalculationResult,
  OverallCalculationResult,
} from '../types/grading';
import {
  initializeSimulationEntries,
  calculateTradeoffSimulation,
  type AutofillStrategy,
  type UnfilledCourseSimulation,
} from '../utils/tradeoffSimulator';
import { getGradeFromPercentage } from '../utils/gradingEngine';
import {
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Undo2,
} from 'lucide-react';

interface TargetTradeoffSimulatorProps {
  courses: CourseAssessment[];
  courseResults: Map<string, CourseCalculationResult>;
  overall: OverallCalculationResult;
  targetSGPI: number;
  onApplySimulatedMarks: (simulatedCourses: CourseAssessment[]) => void;
  onUndoAutofill?: () => void;
  canUndo?: boolean;
}

export const TargetTradeoffSimulator: React.FC<TargetTradeoffSimulatorProps> = ({
  courses,
  courseResults,
  targetSGPI,
  onApplySimulatedMarks,
  onUndoAutofill,
  canUndo = false,
}) => {
  const [strategy, setStrategy] = useState<AutofillStrategy>('balanced');
  const [simulations, setSimulations] = useState<UnfilledCourseSimulation[]>([]);

  // Initialize or update simulations whenever unfilled courses or strategy changes
  useEffect(() => {
    const entries = initializeSimulationEntries(courses, courseResults, strategy, targetSGPI);
    setSimulations(entries);
  }, [courses, courseResults, strategy, targetSGPI]);

  // Recalculate real-time trade-off outcomes
  const tradeoffResult = useMemo(() => {
    return calculateTradeoffSimulation(simulations, courses, courseResults, targetSGPI);
  }, [simulations, courses, courseResults, targetSGPI]);

  const handleSliderChange = (courseId: string, newMarks: number) => {
    setSimulations((prev) =>
      prev.map((sim) => {
        if (sim.courseId !== courseId) return sim;

        const maxMarks = sim.maxMarks;
        const clampedMarks = Math.min(maxMarks, Math.max(sim.minPassingMarks, newMarks));
        const pct = (clampedMarks / maxMarks) * 100;
        const gradeInfo = getGradeFromPercentage(pct);

        return {
          ...sim,
          simulatedMarks: clampedMarks,
          simulatedGrade: gradeInfo.letter,
          simulatedGradePoint: gradeInfo.point,
          simulatedCxG: sim.credits * gradeInfo.point,
        };
      })
    );
  };

  const handleApplyToForm = () => {
    // Convert simulation marks into actual CourseAssessment heads
    const updatedCourses = courses.map((course) => {
      const sim = simulations.find((s) => s.courseId === course.id);
      if (!sim) return course;

      const ratio = sim.simulatedMarks / sim.maxMarks;
      const updated: CourseAssessment = { ...course, isPending: false };

      if (updated.isDirectOverall && updated.directOverall?.enabled) {
        updated.directOverall = {
          ...updated.directOverall,
          obtained: sim.simulatedMarks,
        };
      } else {
        if (updated.midTest?.enabled) {
          const existing = updated.midTest.obtained;
          updated.midTest = {
            ...updated.midTest,
            obtained: existing !== null ? existing : Math.round(updated.midTest.max * ratio),
          };
        }
        if (updated.ca?.enabled) {
          const existing = updated.ca.obtained;
          updated.ca = {
            ...updated.ca,
            obtained: existing !== null ? existing : Math.round(updated.ca.max * ratio),
          };
        }
        if (updated.ese?.enabled) {
          // If internals known, calculate exact needed ESE
          const mt = updated.midTest?.obtained ?? 0;
          const ca = updated.ca?.obtained ?? 0;
          const remainingMarks = sim.simulatedMarks - (mt + ca);
          const finalESE = Math.min(
            updated.ese.max,
            Math.max(updated.ese.min, remainingMarks > 0 ? remainingMarks : Math.round(updated.ese.max * ratio))
          );
          updated.ese = {
            ...updated.ese,
            obtained: finalESE,
          };
        }
        if (updated.termWork?.enabled) {
          const existing = updated.termWork.obtained;
          updated.termWork = {
            ...updated.termWork,
            obtained: existing !== null ? existing : Math.round(updated.termWork.max * ratio),
          };
        }
        if (updated.prOral?.enabled) {
          const existing = updated.prOral.obtained;
          updated.prOral = {
            ...updated.prOral,
            obtained: existing !== null ? existing : Math.round(updated.prOral.max * ratio),
          };
        }
      }
      return updated;
    });

    onApplySimulatedMarks(updatedCourses);
  };

  const handleResetSliders = () => {
    const entries = initializeSimulationEntries(courses, courseResults, strategy, targetSGPI);
    setSimulations(entries);
  };

  if (simulations.length === 0) {
    return (
      <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-6 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
          All Subjects Are Fully Evaluated
        </h3>
        <p className="text-xs text-[#86868b]">
          To run a trade-off simulation, set one or more courses to "Pending" or clear their marks.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all space-y-6">
      {/* Top Banner: Title & Live Trade-off Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] flex items-center justify-center">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
              Target GPA Trade-off Simulator
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff]">
              Live Engine
            </span>
          </div>
          <p className="text-xs text-[#86868b] mt-1">
            Drag any subject slider to simulate trade-offs. Other subjects dynamically recalculate to keep your Target SGPA safe.
          </p>
        </div>

        {/* Live Simulation Score Pill */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:px-4 sm:py-2 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-baseline gap-2">
            <span className="text-xs text-[#86868b]">Simulated SGPA:</span>
            <span
              className={`text-xl sm:text-2xl font-bold font-sans ${
                tradeoffResult.isTargetMet
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-500'
              }`}
            >
              {tradeoffResult.totalSimulatedSGPI.toFixed(2)}
            </span>
            <span className="text-xs text-[#86868b]">/ Target {targetSGPI.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Strategy Toggle Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e]">
        <div className="flex items-center gap-2 text-xs">
          <Layers className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
          <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Autofill Strategy:</span>
        </div>

        <div className="inline-flex p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.1] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStrategy('balanced')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              strategy === 'balanced'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                : 'text-[#86868b]'
            }`}
          >
            Balanced (Uniform GP)
          </button>
          <button
            type="button"
            onClick={() => setStrategy('lab_biased')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              strategy === 'lab_biased'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                : 'text-[#86868b]'
            }`}
            title="Biases labs to 10 GP (Grade O) so Theory requirements stay realistic"
          >
            Realistic (Lab-Biased)
          </button>
        </div>
      </div>

      {/* Interactive Linked Sliders List */}
      <div className="space-y-4">
        {simulations.map((sim) => {
          const impact = tradeoffResult.otherCoursesImpact.get(sim.courseId);
          const isTheory = sim.category === 'TH';

          return (
            <div
              key={sim.courseId}
              className={`p-4 rounded-2xl border transition-all ${
                impact?.isBreached
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                  : 'bg-[#f5f5f7]/60 dark:bg-[#2c2c2e]/50 border-black/[0.04] dark:border-white/[0.06]'
              }`}
            >
              {/* Row Header: Code, Title, Current Simulated Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#0071e3] dark:text-[#2997ff]">
                      {sim.courseCode}
                    </span>
                    <span className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                      {sim.courseName}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#86868b]">
                    {sim.credits} Credits • {isTheory ? 'Theory (Max 100)' : 'Lab / Practicals (Max 50)'}
                  </span>
                </div>

                {/* Score & Grade Bubble */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-bold font-mono text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {sim.simulatedMarks} / {sim.maxMarks}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      sim.simulatedGrade === 'O'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : sim.simulatedGrade === 'A' || sim.simulatedGrade === 'B'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Grade {sim.simulatedGrade} ({sim.simulatedGradePoint} GP)
                  </span>
                </div>
              </div>

              {/* Score Slider */}
              <div className="space-y-1.5 mb-2.5">
                <input
                  type="range"
                  min={sim.minPassingMarks}
                  max={sim.maxMarks}
                  step="1"
                  value={sim.simulatedMarks}
                  onChange={(e) => handleSliderChange(sim.courseId, parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-white dark:bg-[#1c1c1e] rounded-full appearance-none cursor-pointer accent-[#0071e3] dark:accent-[#2997ff]"
                />
                <div className="flex justify-between text-[10px] text-[#86868b] font-mono">
                  <span>Min Pass: {sim.minPassingMarks}</span>
                  <span>75% (A): {Math.ceil(sim.maxMarks * 0.75)}</span>
                  <span>80% (O): {Math.ceil(sim.maxMarks * 0.80)}</span>
                  <span>Max: {sim.maxMarks}</span>
                </div>
              </div>

              {/* Dynamic Linked Impact & ESE Breakdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
                {/* Real-time Linked Trade-Off Impact */}
                <div className="flex items-center gap-1.5">
                  {impact?.isBreached ? (
                    <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {impact.badgeText}
                    </span>
                  ) : impact?.isSafe ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {impact.badgeText}
                    </span>
                  ) : (
                    <span className="text-[#86868b] text-[11px]">
                      ⚡ {impact?.badgeText}
                    </span>
                  )}
                </div>

                {/* Specific ESE Breakdown pill if internals already known */}
                {sim.hasEmptyESE && sim.eseNeededForGradeO !== undefined && (
                  <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1c1c1e] text-[11px] font-medium text-[#0071e3] dark:text-[#2997ff] border border-black/[0.04] dark:border-white/[0.06] shrink-0">
                    🎯 ESE Needed: ≥ {sim.eseNeededForGradeO}/60 for Grade O
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApplyToForm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Apply Simulated Marks to Form</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetSliders}
            className="p-2.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
            title="Reset simulation sliders"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {canUndo && onUndoAutofill && (
          <button
            type="button"
            onClick={onUndoAutofill}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f5f5f7] hover:bg-rose-50 dark:bg-[#2c2c2e] dark:hover:bg-rose-950/40 text-xs font-medium text-[#86868b] hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Last Autofill</span>
          </button>
        )}
      </div>
    </div>
  );
};
