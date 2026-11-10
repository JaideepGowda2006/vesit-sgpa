import React, { useMemo } from 'react';
import type {
  CourseAssessment,
  CourseCalculationResult,
  TargetPlannerAnalysis,
} from '../types/grading';
import {
  Trash2,
  Edit3,
  AlertCircle,
  Zap,
  Sparkles,
} from 'lucide-react';
import {
  calculateESENeededForCourse,
  getMinMarksForGrade,
  applySingleCourseMinMarks,
  getCourseTargetNeedsMap,
} from '../utils/roadmapPlanner';
import {
  getGradeBadgeClasses,
  getTargetNeedBadgeClasses,
} from '../utils/gradeColors';

interface CourseCardViewProps {
  courses: CourseAssessment[];
  courseResults: Map<string, CourseCalculationResult>;
  analysis: TargetPlannerAnalysis;
  onUpdateCourse: (updated: CourseAssessment) => void;
  onDeleteCourse: (courseId: string) => void;
  onOpenEditModal: (course: CourseAssessment) => void;
  onTogglePending: (courseId: string) => void;
  onAutofillSingleCourse?: (courseId: string) => void;
}

export const CourseCardView: React.FC<CourseCardViewProps> = ({
  courses,
  courseResults,
  analysis,
  onUpdateCourse,
  onDeleteCourse,
  onOpenEditModal,
  onAutofillSingleCourse,
}) => {
  const targetGrade = analysis.recommendedLetterGrade || 'O';

  // Compute concrete target requirements for each course
  const targetNeedsMap = useMemo(() => {
    return getCourseTargetNeedsMap(courses, courseResults, analysis.targetSGPI);
  }, [courses, courseResults, analysis.targetSGPI]);

  const handleInputChange = (
    course: CourseAssessment,
    field: 'mt' | 'ca' | 'ese' | 'tw' | 'pr' | 'direct',
    rawVal: string
  ) => {
    const updated = { ...course };
    const val = rawVal === '' ? null : parseInt(rawVal, 10);
    const clamp = (v: number | null, max: number) =>
      v !== null && !isNaN(v) ? Math.min(max, Math.max(0, v)) : null;

    if (field === 'mt') {
      updated.midTest = { ...updated.midTest, obtained: clamp(val, updated.midTest.max) };
    } else if (field === 'ca') {
      updated.ca = { ...updated.ca, obtained: clamp(val, updated.ca.max) };
    } else if (field === 'ese') {
      updated.ese = { ...updated.ese, obtained: clamp(val, updated.ese.max) };
    } else if (field === 'tw') {
      updated.termWork = { ...updated.termWork, obtained: clamp(val, updated.termWork.max) };
    } else if (field === 'pr') {
      updated.prOral = { ...updated.prOral, obtained: clamp(val, updated.prOral.max) };
    } else if (field === 'direct' && updated.directOverall) {
      updated.directOverall = {
        ...updated.directOverall,
        obtained: clamp(val, updated.directOverall.max),
      };
    }

    updated.isPending = false;
    onUpdateCourse(updated);
  };

  const handleQuickAutofillRow = (course: CourseAssessment) => {
    if (onAutofillSingleCourse) {
      onAutofillSingleCourse(course.id);
      return;
    }
    const needInfo = targetNeedsMap.get(course.id);
    const gradeToUse = needInfo?.grade || targetGrade;
    const updated = applySingleCourseMinMarks(course, gradeToUse);
    onUpdateCourse(updated);
  };

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const result = courseResults.get(course.id);
        const isTheory = course.category === 'TH';
        const isPending = course.isPending || !result?.isFullyFilled;
        const hasFailedHead = result?.hasFailedHead || false;

        const totalMax = result?.totalMax || (isTheory ? 100 : 50);
        const minMarksNeeded = getMinMarksForGrade(totalMax, targetGrade);

        const needInfo = targetNeedsMap.get(course.id) || {
          grade: targetGrade,
          minMarks: minMarksNeeded,
          totalMax,
          displayText: `🎯 Need Grade ${targetGrade} (≥ ${minMarksNeeded}/${totalMax})`,
        };

        // Component-level ESE calculation when MT or CA are entered
        const eseAnalysis = calculateESENeededForCourse(course, needInfo.grade);

        // Failed head names list
        const failedHeadsText = result?.failedHeads
          ?.map((fh) => `${fh.headName} (${fh.obtained}/${fh.max} < Min ${fh.minRequired})`)
          .join(', ');

        return (
          <div
            key={course.id}
            className={`rounded-2xl p-4 sm:p-5 transition-all border ${
              hasFailedHead
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
            }`}
          >
            {/* Top Bar: Title, Subtitle, Status Grade & Direct 1-Click Action */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight leading-snug">
                    {course.courseName}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#86868b]">
                  <span className="font-mono">{course.courseCode}</span>
                  <span>•</span>
                  <span>{course.credits} Credits</span>
                  <span>•</span>
                  <span>{isTheory ? 'Theory' : 'Practical & Lab'}</span>
                </div>
              </div>

              {/* Status Grade Badge & Inline Autofill */}
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                {isPending && (
                  <button
                    type="button"
                    onClick={() => handleQuickAutofillRow(course)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs transition active:scale-95"
                    title={`Fill minimum marks needed for ${needInfo.grade}`}
                  >
                    <Zap className="w-3 h-3 text-yellow-300" />
                    <span>Fill Target</span>
                  </button>
                )}

                {hasFailedHead ? (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getGradeBadgeClasses('F')}`}>
                    Failed Head (F)
                  </span>
                ) : isPending ? (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-tight border ${getTargetNeedBadgeClasses(
                      needInfo.grade
                    )}`}
                  >
                    {needInfo.displayText}
                  </span>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-tight border ${getGradeBadgeClasses(
                      result?.letterGrade || 'P'
                    )}`}
                  >
                    Grade {result?.letterGrade} ({result?.gradePoint} GP)
                  </span>
                )}
              </div>
            </div>

            {/* Input Row: Big, Clean, Readable Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-2.5">
              {course.isDirectOverall && course.directOverall?.enabled ? (
                /* Overall Direct Head (e.g. MOOC / NPTEL) */
                <div className="col-span-2 sm:col-span-3 flex items-center justify-between p-2.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e]">
                  <span className="text-xs font-medium text-[#86868b]">
                    Overall Marks (Min {course.directOverall.min})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={course.directOverall.max}
                      placeholder="--"
                      value={course.directOverall.obtained ?? ''}
                      onChange={(e) => handleInputChange(course, 'direct', e.target.value)}
                      className="w-16 h-8 text-center text-sm font-semibold rounded-lg bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                    />
                    <span className="text-xs text-[#86868b]">/ {course.directOverall.max}</span>
                  </div>
                </div>
              ) : isTheory ? (
                <>
                  {/* Mid Test (MT) */}
                  {course.midTest?.enabled && (
                    <div className="p-2.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-1 font-medium">
                        <span>Mid Test</span>
                        <span className="text-[10px]">≥ {course.midTest.min}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="number"
                          min="0"
                          max={course.midTest.max}
                          placeholder="--"
                          value={course.midTest.obtained ?? ''}
                          onChange={(e) => handleInputChange(course, 'mt', e.target.value)}
                          className={`w-full h-8 text-center text-sm font-semibold rounded-lg bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border focus:outline-none focus:ring-2 ${
                            course.midTest.obtained !== null && course.midTest.obtained < course.midTest.min
                              ? 'border-rose-400 bg-rose-50 text-rose-600 focus:ring-rose-500'
                              : 'border-black/[0.08] dark:border-white/[0.12] focus:ring-[#0071e3]'
                          }`}
                        />
                        <span className="text-[11px] text-[#86868b] shrink-0">/{course.midTest.max}</span>
                      </div>
                    </div>
                  )}

                  {/* CA */}
                  {course.ca?.enabled && (
                    <div className="p-2.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-1 font-medium">
                        <span>CA</span>
                        <span className="text-[10px]">≥ {course.ca.min}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="number"
                          min="0"
                          max={course.ca.max}
                          placeholder="--"
                          value={course.ca.obtained ?? ''}
                          onChange={(e) => handleInputChange(course, 'ca', e.target.value)}
                          className={`w-full h-8 text-center text-sm font-semibold rounded-lg bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border focus:outline-none focus:ring-2 ${
                            course.ca.obtained !== null && course.ca.obtained < course.ca.min
                              ? 'border-rose-400 bg-rose-50 text-rose-600 focus:ring-rose-500'
                              : 'border-black/[0.08] dark:border-white/[0.12] focus:ring-[#0071e3]'
                          }`}
                        />
                        <span className="text-[11px] text-[#86868b] shrink-0">/{course.ca.max}</span>
                      </div>
                    </div>
                  )}

                  {/* ESE Theory with Tiny Goal Tag under the box */}
                  {course.ese?.enabled && (
                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-1 font-medium">
                        <span>End Sem (ESE)</span>
                        <span className="text-[10px]">≥ {course.ese.min}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="number"
                          min="0"
                          max={course.ese.max}
                          placeholder="--"
                          value={course.ese.obtained ?? ''}
                          onChange={(e) => handleInputChange(course, 'ese', e.target.value)}
                          className={`w-full h-8 text-center text-sm font-semibold rounded-lg bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border focus:outline-none focus:ring-2 ${
                            course.ese.obtained !== null && course.ese.obtained < course.ese.min
                              ? 'border-rose-400 bg-rose-50 text-rose-600 focus:ring-rose-500'
                              : 'border-black/[0.08] dark:border-white/[0.12] focus:ring-[#0071e3]'
                          }`}
                        />
                        <span className="text-[11px] text-[#86868b] shrink-0">/{course.ese.max}</span>
                      </div>

                      {/* Tiny Goal Tag right under empty ESE box when MT and CA are filled */}
                      {course.ese.obtained === null && eseAnalysis && (
                        <div className="mt-1.5 pt-1 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px]">
                          <div className="font-semibold text-[#0071e3] dark:text-[#2997ff] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>Need ≥ {eseAnalysis.neededForGrade}/{course.ese.max} in End Sem</span>
                          </div>
                          {eseAnalysis.isPassingCutoffConstrained && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">
                              Passing minimum is 24/60, so aim for at least 24
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Term Work */}
                  {course.termWork?.enabled && (
                    <div className="p-2.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-1 font-medium">
                        <span>Term Work</span>
                        <span className="text-[10px]">≥ {course.termWork.min}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="number"
                          min="0"
                          max={course.termWork.max}
                          placeholder="--"
                          value={course.termWork.obtained ?? ''}
                          onChange={(e) => handleInputChange(course, 'tw', e.target.value)}
                          className={`w-full h-8 text-center text-sm font-semibold rounded-lg bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border focus:outline-none focus:ring-2 ${
                            course.termWork.obtained !== null && course.termWork.obtained < course.termWork.min
                              ? 'border-rose-400 bg-rose-50 text-rose-600 focus:ring-rose-500'
                              : 'border-black/[0.08] dark:border-white/[0.12] focus:ring-[#0071e3]'
                          }`}
                        />
                        <span className="text-[11px] text-[#86868b] shrink-0">/{course.termWork.max}</span>
                      </div>
                    </div>
                  )}

                  {/* Practical & Oral */}
                  {course.prOral?.enabled && (
                    <div className="p-2.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-1 font-medium">
                        <span>Pract / Oral</span>
                        <span className="text-[10px]">≥ {course.prOral.min}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="number"
                          min="0"
                          max={course.prOral.max}
                          placeholder="--"
                          value={course.prOral.obtained ?? ''}
                          onChange={(e) => handleInputChange(course, 'pr', e.target.value)}
                          className={`w-full h-8 text-center text-sm font-semibold rounded-lg bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border focus:outline-none focus:ring-2 ${
                            course.prOral.obtained !== null && course.prOral.obtained < course.prOral.min
                              ? 'border-rose-400 bg-rose-50 text-rose-600 focus:ring-rose-500'
                              : 'border-black/[0.08] dark:border-white/[0.12] focus:ring-[#0071e3]'
                          }`}
                        />
                        <span className="text-[11px] text-[#86868b] shrink-0">/{course.prOral.max}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Row: Score summary & Aim / Action */}
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
              <div className="flex items-center gap-3">
                {hasFailedHead ? (
                  <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Failed cutoff: {failedHeadsText}
                  </span>
                ) : isPending ? (
                  <span className="text-[#86868b] text-[11px]">
                    Needs minimum <strong className="text-[#1d1d1f] dark:text-[#f5f5f7] font-mono">{needInfo.minMarks}/{needInfo.totalMax}</strong> marks
                  </span>
                ) : (
                  <div className="flex items-center gap-2 text-[#86868b]">
                    <span>
                      Total: <strong className="text-[#1d1d1f] dark:text-[#f5f5f7] font-mono">{result?.totalObtained}</strong> / {result?.totalMax}
                    </span>
                    <span>•</span>
                    <span>{result?.percentage !== null && result?.percentage !== undefined ? result.percentage.toFixed(1) : '0.0'}%</span>
                    <span>•</span>
                    <span>C×G: <strong className="font-mono">{result?.cxg}</strong></span>
                  </div>
                )}
              </div>

              {/* Minimal Action Icons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenEditModal(course)}
                  className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition"
                  title="Configure course heads"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCourse(course.id)}
                  className="p-1.5 rounded-lg text-[#86868b] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  title="Delete row"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
