import React from 'react';
import type {
  CourseAssessment,
  CourseCalculationResult,
  TargetPlannerAnalysis,
} from '../types/grading';
import {
  Clock,
  Trash2,
  Edit3,
  BookOpen,
  FlaskConical,
  Target,
  AlertOctagon,
} from 'lucide-react';
import { getAimBadgeDetails } from '../utils/targetPlanner';

interface CourseCardViewProps {
  courses: CourseAssessment[];
  courseResults: Map<string, CourseCalculationResult>;
  analysis: TargetPlannerAnalysis;
  onUpdateCourse: (updated: CourseAssessment) => void;
  onDeleteCourse: (courseId: string) => void;
  onOpenEditModal: (course: CourseAssessment) => void;
  onTogglePending: (courseId: string) => void;
}

export const CourseCardView: React.FC<CourseCardViewProps> = ({
  courses,
  courseResults,
  analysis,
  onUpdateCourse,
  onDeleteCourse,
  onOpenEditModal,
  onTogglePending,
}) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {courses.map((course) => {
        const result = courseResults.get(course.id);
        const aim = getAimBadgeDetails(course, analysis);
        const isTheory = course.category === 'TH';

        return (
          <div
            key={course.id}
            className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
              result?.hasFailedHead
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-sm'
                : course.isPending
                ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-400/40'
                : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400/40'
            }`}
          >
            {/* Card Header: Code, Category, Actions */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {/* Category Pill */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                    isTheory
                      ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                  }`}
                >
                  {isTheory ? (
                    <BookOpen className="w-3 h-3 shrink-0" />
                  ) : (
                    <FlaskConical className="w-3 h-3 shrink-0" />
                  )}
                  {course.category}
                </span>

                {/* Course Code */}
                <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {course.courseCode}
                </span>

                {/* Credits */}
                <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {course.credits} Cr
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onTogglePending(course.id)}
                  title={course.isPending ? 'Mark as completed' : 'Set to pending/target'}
                  className={`p-1.5 rounded-lg text-xs font-medium transition ${
                    course.isPending
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEditModal(course)}
                  title="Edit course configuration"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCourse(course.id)}
                  title="Remove row"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Course Title */}
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug mb-3">
              {course.courseName}
            </h3>

            {/* Input Component Grid: Tailored for Theory vs Lab */}
            <div className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
              {course.isDirectOverall && course.directOverall?.enabled ? (
                /* Direct Overall Head (e.g. MOOC / NPTEL) */
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Overall Marks
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Passing Min: {course.directOverall.min} / {course.directOverall.max}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={course.directOverall.max}
                      placeholder="--"
                      value={course.directOverall.obtained ?? ''}
                      onChange={(e) => handleInputChange(course, 'direct', e.target.value)}
                      className="w-16 h-9 px-2 text-center text-sm font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-400">/ {course.directOverall.max}</span>
                  </div>
                </div>
              ) : isTheory ? (
                /* Theory Head Inputs: MT, CA, ESE */
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Mid Test */}
                  {course.midTest?.enabled && (
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>MT</span>
                        <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                          ≥{course.midTest.min}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={course.midTest.max}
                          placeholder="--"
                          value={course.midTest.obtained ?? ''}
                          onChange={(e) => handleInputChange(course, 'mt', e.target.value)}
                          className={`w-full h-9 px-2 text-center text-xs sm:text-sm font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                            course.midTest.obtained !== null && course.midTest.obtained < course.midTest.min
                              ? 'border-rose-400 focus:ring-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                              : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                          }`}
                        />
                        <span className="absolute right-1.5 bottom-2 text-[9px] text-slate-400 pointer-events-none hidden sm:inline">
                          /{course.midTest.max}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* CA */}
                  {course.ca?.enabled && (
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>CA</span>
                        <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                          ≥{course.ca.min}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={course.ca.max}
                          placeholder="--"
                          value={course.ca.obtained ?? ''}
                          onChange={(e) => handleInputChange(course, 'ca', e.target.value)}
                          className={`w-full h-9 px-2 text-center text-xs sm:text-sm font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                            course.ca.obtained !== null && course.ca.obtained < course.ca.min
                              ? 'border-rose-400 focus:ring-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                              : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                          }`}
                        />
                        <span className="absolute right-1.5 bottom-2 text-[9px] text-slate-400 pointer-events-none hidden sm:inline">
                          /{course.ca.max}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ESE Theory */}
                  {course.ese?.enabled && (
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>ESE</span>
                        <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                          ≥{course.ese.min}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={course.ese.max}
                          placeholder="--"
                          value={course.ese.obtained ?? ''}
                          onChange={(e) => handleInputChange(course, 'ese', e.target.value)}
                          className={`w-full h-9 px-2 text-center text-xs sm:text-sm font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                            course.ese.obtained !== null && course.ese.obtained < course.ese.min
                              ? 'border-rose-400 focus:ring-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                              : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                          }`}
                        />
                        <span className="absolute right-1.5 bottom-2 text-[9px] text-slate-400 pointer-events-none hidden sm:inline">
                          /{course.ese.max}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Lab Head Inputs: Term Work (TW), Practical / Oral (PR) */
                <div className="grid grid-cols-2 gap-3">
                  {/* Term Work */}
                  {course.termWork?.enabled && (
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Term Work</span>
                        <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                          ≥{course.termWork.min} / {course.termWork.max}
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={course.termWork.max}
                        placeholder="--"
                        value={course.termWork.obtained ?? ''}
                        onChange={(e) => handleInputChange(course, 'tw', e.target.value)}
                        className={`w-full h-9 px-2 text-center text-xs sm:text-sm font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                          course.termWork.obtained !== null && course.termWork.obtained < course.termWork.min
                            ? 'border-rose-400 focus:ring-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                  )}

                  {/* Practical & Oral */}
                  {course.prOral?.enabled && (
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Pract / Oral</span>
                        <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                          ≥{course.prOral.min} / {course.prOral.max}
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={course.prOral.max}
                        placeholder="--"
                        value={course.prOral.obtained ?? ''}
                        onChange={(e) => handleInputChange(course, 'pr', e.target.value)}
                        className={`w-full h-9 px-2 text-center text-xs sm:text-sm font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                          course.prOral.obtained !== null && course.prOral.obtained < course.prOral.min
                            ? 'border-rose-400 focus:ring-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card Result Footer: Marks, Grade, GP, C×G, or Target Aim */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              {result?.hasFailedHead ? (
                /* Failed Head Alert */
                <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                  <span className="flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    Failed Head (Below Cutoff)
                  </span>
                  <span className="font-mono font-bold">Grade F • GP 0</span>
                </div>
              ) : course.isPending || !result?.isFullyFilled ? (
                /* Target Guidance / Aim Marker */
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Target:</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      aim.status === 'unattainable'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        : aim.status === 'safe'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {aim.badgeText} ({aim.marksText})
                  </span>
                </div>
              ) : (
                /* Evaluated Outcome */
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-baseline gap-1 text-slate-600 dark:text-slate-300">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {result?.totalObtained ?? '--'}
                    </span>
                    <span className="text-[10px] text-slate-400">/ {result?.totalMax}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                      ({result?.percentage !== null && result?.percentage !== undefined ? result.percentage.toFixed(1) : '0.0'}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-xs font-mono ${
                        result?.letterGrade === 'O'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : result?.letterGrade === 'A' || result?.letterGrade === 'B'
                          ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Grade {result?.letterGrade} [{result?.gradePoint}]
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs">
                      C×G: {result?.cxg}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
