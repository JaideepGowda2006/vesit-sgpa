import React, { useState, useMemo } from 'react';
import type {
  CourseAssessment,
  CourseCalculationResult,
  OverallCalculationResult,
  TargetPlannerAnalysis,
} from '../types/grading';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Plus,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { CourseCardView } from './CourseCardView';

interface CoursesTableProps {
  courses: CourseAssessment[];
  courseResults: Map<string, CourseCalculationResult>;
  overall?: OverallCalculationResult;
  analysis: TargetPlannerAnalysis;
  onUpdateCourse: (updated: CourseAssessment) => void;
  onDeleteCourse: (courseId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (course: CourseAssessment) => void;
  onTogglePending: (courseId: string) => void;
}

export const CoursesTable: React.FC<CoursesTableProps> = ({
  courses,
  courseResults,
  analysis,
  onUpdateCourse,
  onDeleteCourse,
  onOpenAddModal,
  onOpenEditModal,
  onTogglePending,
}) => {
  // Default to clean Card View (minimal, mobile-first)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filter, setFilter] = useState<'all' | 'th' | 'tpo' | 'pending'>('all');

  const [editingCell, setEditingCell] = useState<{
    courseId: string;
    field: string;
  } | null>(null);

  const [tempValue, setTempValue] = useState<string>('');

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (filter === 'th') return c.category === 'TH';
      if (filter === 'tpo') return c.category === 'TPO';
      if (filter === 'pending') {
        const res = courseResults.get(c.id);
        return c.isPending || !res?.isFullyFilled;
      }
      return true;
    });
  }, [courses, filter, courseResults]);

  const counts = useMemo(() => {
    let th = 0;
    let tpo = 0;
    let pending = 0;
    for (const c of courses) {
      if (c.category === 'TH') th++;
      if (c.category === 'TPO') tpo++;
      const res = courseResults.get(c.id);
      if (c.isPending || !res?.isFullyFilled) pending++;
    }
    return { all: courses.length, th, tpo, pending };
  }, [courses, courseResults]);

  const startEditing = (courseId: string, field: string, currentValue: any) => {
    setEditingCell({ courseId, field });
    setTempValue(currentValue === null || currentValue === undefined ? '' : String(currentValue));
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const saveEditing = (course: CourseAssessment) => {
    if (!editingCell) return;
    const { field } = editingCell;
    const updated = { ...course };

    if (field === 'courseCode') {
      updated.courseCode = tempValue.trim();
    } else if (field === 'courseName') {
      updated.courseName = tempValue.trim();
    } else if (field === 'credits') {
      const val = parseInt(tempValue, 10);
      if (!isNaN(val) && val >= 0) updated.credits = val;
    } else if (field === 'mt') {
      const val = tempValue === '' ? null : parseInt(tempValue, 10);
      updated.midTest = {
        ...updated.midTest,
        obtained: val !== null && !isNaN(val) ? Math.min(updated.midTest.max, Math.max(0, val)) : null,
      };
      updated.isPending = false;
    } else if (field === 'ca') {
      const val = tempValue === '' ? null : parseInt(tempValue, 10);
      updated.ca = {
        ...updated.ca,
        obtained: val !== null && !isNaN(val) ? Math.min(updated.ca.max, Math.max(0, val)) : null,
      };
      updated.isPending = false;
    } else if (field === 'ese') {
      const val = tempValue === '' ? null : parseInt(tempValue, 10);
      updated.ese = {
        ...updated.ese,
        obtained: val !== null && !isNaN(val) ? Math.min(updated.ese.max, Math.max(0, val)) : null,
      };
      updated.isPending = false;
    } else if (field === 'tw') {
      const val = tempValue === '' ? null : parseInt(tempValue, 10);
      updated.termWork = {
        ...updated.termWork,
        obtained: val !== null && !isNaN(val) ? Math.min(updated.termWork.max, Math.max(0, val)) : null,
      };
      updated.isPending = false;
    } else if (field === 'pr') {
      const val = tempValue === '' ? null : parseInt(tempValue, 10);
      updated.prOral = {
        ...updated.prOral,
        obtained: val !== null && !isNaN(val) ? Math.min(updated.prOral.max, Math.max(0, val)) : null,
      };
      updated.isPending = false;
    }

    onUpdateCourse(updated);
    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent, course: CourseAssessment) => {
    if (e.key === 'Enter') {
      saveEditing(course);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Chips & View Mode Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* iOS Style Segmented Pill Filter */}
        <div className="inline-flex p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filter === 'all'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter('th')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filter === 'th'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            Theory ({counts.th})
          </button>
          <button
            type="button"
            onClick={() => setFilter('tpo')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filter === 'tpo'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            Labs ({counts.tpo})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filter === 'pending'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            Pending ({counts.pending})
          </button>
        </div>

        {/* View Toggle & Add Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Card / Table Switcher */}
          <div className="inline-flex p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-full text-xs transition ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#0071e3] dark:text-[#2997ff] shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
              title="Card View (Recommended)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-full text-xs transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#0071e3] dark:text-[#2997ff] shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
              title="Spreadsheet Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Course Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Main Content: Card View vs Table View */}
      {viewMode === 'cards' ? (
        <CourseCardView
          courses={filteredCourses}
          courseResults={courseResults}
          analysis={analysis}
          onUpdateCourse={onUpdateCourse}
          onDeleteCourse={onDeleteCourse}
          onOpenEditModal={onOpenEditModal}
          onTogglePending={onTogglePending}
        />
      ) : (
        /* Minimalist Spreadsheet View */
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f5f5f7]/60 dark:bg-[#2c2c2e]/60 text-[#86868b] text-[11px] font-medium">
                  <th className="py-2.5 px-3 text-center w-10">Status</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Code</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Subject</th>
                  <th className="py-2.5 px-2 text-center min-w-[60px]">Type</th>
                  <th className="py-2.5 px-2 text-center min-w-[50px]">Credits</th>
                  <th className="py-2.5 px-2 text-center min-w-[65px]">MT (20)</th>
                  <th className="py-2.5 px-2 text-center min-w-[65px]">CA (20)</th>
                  <th className="py-2.5 px-2 text-center min-w-[75px]">ESE (60)</th>
                  <th className="py-2.5 px-2 text-center min-w-[70px]">TW (25)</th>
                  <th className="py-2.5 px-2 text-center min-w-[70px]">PR (25)</th>
                  <th className="py-2.5 px-3 text-center min-w-[75px]">Total</th>
                  <th className="py-2.5 px-2 text-center min-w-[55px]">Grade</th>
                  <th className="py-2.5 px-2 text-center min-w-[45px]">GP</th>
                  <th className="py-2.5 px-2 text-center min-w-[50px]">C×G</th>
                  <th className="py-2.5 px-2 text-center w-14">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {filteredCourses.map((course) => {
                  const res = courseResults.get(course.id);
                  const isPending = course.isPending || !res?.isFullyFilled;
                  const hasFailedHead = res?.hasFailedHead || false;
                  const isTheory = course.category === 'TH';

                  return (
                    <tr
                      key={course.id}
                      className={`hover:bg-[#f5f5f7]/50 dark:hover:bg-[#2c2c2e]/30 transition ${
                        hasFailedHead ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onTogglePending(course.id)}
                          className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
                        >
                          {course.isPending ? (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          ) : hasFailedHead ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </button>
                      </td>

                      {/* Course Code */}
                      <td className="py-2 px-3 font-mono font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {course.courseCode}
                      </td>

                      {/* Course Name */}
                      <td className="py-2 px-3 font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {course.courseName}
                      </td>

                      {/* Type */}
                      <td className="py-2 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#86868b]">
                          {isTheory ? 'TH' : 'LAB'}
                        </span>
                      </td>

                      {/* Credits */}
                      <td className="py-2 px-2 text-center font-medium">
                        {course.credits}
                      </td>

                      {/* MT */}
                      <td className="py-2 px-2 text-center">
                        {course.midTest?.enabled ? (
                          editingCell?.courseId === course.id && editingCell.field === 'mt' ? (
                            <input
                              type="number"
                              min="0"
                              max={course.midTest.max}
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => saveEditing(course)}
                              onKeyDown={(e) => handleKeyDown(e, course)}
                              autoFocus
                              className="w-12 h-6 text-center text-xs font-semibold rounded bg-white dark:bg-[#2c2c2e] border border-[#0071e3] focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => startEditing(course.id, 'mt', course.midTest?.obtained)}
                              className={`cursor-pointer px-1.5 py-0.5 rounded font-mono font-medium ${
                                course.midTest.obtained !== null && course.midTest.obtained < course.midTest.min
                                  ? 'text-rose-600 font-bold'
                                  : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                              }`}
                            >
                              {course.midTest.obtained ?? '--'}
                            </span>
                          )
                        ) : (
                          <span className="text-[#86868b]">--</span>
                        )}
                      </td>

                      {/* CA */}
                      <td className="py-2 px-2 text-center">
                        {course.ca?.enabled ? (
                          editingCell?.courseId === course.id && editingCell.field === 'ca' ? (
                            <input
                              type="number"
                              min="0"
                              max={course.ca.max}
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => saveEditing(course)}
                              onKeyDown={(e) => handleKeyDown(e, course)}
                              autoFocus
                              className="w-12 h-6 text-center text-xs font-semibold rounded bg-white dark:bg-[#2c2c2e] border border-[#0071e3] focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => startEditing(course.id, 'ca', course.ca?.obtained)}
                              className={`cursor-pointer px-1.5 py-0.5 rounded font-mono font-medium ${
                                course.ca.obtained !== null && course.ca.obtained < course.ca.min
                                  ? 'text-rose-600 font-bold'
                                  : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                              }`}
                            >
                              {course.ca.obtained ?? '--'}
                            </span>
                          )
                        ) : (
                          <span className="text-[#86868b]">--</span>
                        )}
                      </td>

                      {/* ESE */}
                      <td className="py-2 px-2 text-center">
                        {course.ese?.enabled ? (
                          editingCell?.courseId === course.id && editingCell.field === 'ese' ? (
                            <input
                              type="number"
                              min="0"
                              max={course.ese.max}
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => saveEditing(course)}
                              onKeyDown={(e) => handleKeyDown(e, course)}
                              autoFocus
                              className="w-12 h-6 text-center text-xs font-semibold rounded bg-white dark:bg-[#2c2c2e] border border-[#0071e3] focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => startEditing(course.id, 'ese', course.ese?.obtained)}
                              className={`cursor-pointer px-1.5 py-0.5 rounded font-mono font-medium ${
                                course.ese.obtained !== null && course.ese.obtained < course.ese.min
                                  ? 'text-rose-600 font-bold'
                                  : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                              }`}
                            >
                              {course.ese.obtained ?? '--'}
                            </span>
                          )
                        ) : (
                          <span className="text-[#86868b]">--</span>
                        )}
                      </td>

                      {/* Term Work */}
                      <td className="py-2 px-2 text-center">
                        {course.termWork?.enabled ? (
                          editingCell?.courseId === course.id && editingCell.field === 'tw' ? (
                            <input
                              type="number"
                              min="0"
                              max={course.termWork.max}
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => saveEditing(course)}
                              onKeyDown={(e) => handleKeyDown(e, course)}
                              autoFocus
                              className="w-12 h-6 text-center text-xs font-semibold rounded bg-white dark:bg-[#2c2c2e] border border-[#0071e3] focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => startEditing(course.id, 'tw', course.termWork?.obtained)}
                              className={`cursor-pointer px-1.5 py-0.5 rounded font-mono font-medium ${
                                course.termWork.obtained !== null && course.termWork.obtained < course.termWork.min
                                  ? 'text-rose-600 font-bold'
                                  : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                              }`}
                            >
                              {course.termWork.obtained ?? '--'}
                            </span>
                          )
                        ) : (
                          <span className="text-[#86868b]">--</span>
                        )}
                      </td>

                      {/* PR */}
                      <td className="py-2 px-2 text-center">
                        {course.prOral?.enabled ? (
                          editingCell?.courseId === course.id && editingCell.field === 'pr' ? (
                            <input
                              type="number"
                              min="0"
                              max={course.prOral.max}
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => saveEditing(course)}
                              onKeyDown={(e) => handleKeyDown(e, course)}
                              autoFocus
                              className="w-12 h-6 text-center text-xs font-semibold rounded bg-white dark:bg-[#2c2c2e] border border-[#0071e3] focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => startEditing(course.id, 'pr', course.prOral?.obtained)}
                              className={`cursor-pointer px-1.5 py-0.5 rounded font-mono font-medium ${
                                course.prOral.obtained !== null && course.prOral.obtained < course.prOral.min
                                  ? 'text-rose-600 font-bold'
                                  : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                              }`}
                            >
                              {course.prOral.obtained ?? '--'}
                            </span>
                          )
                        ) : (
                          <span className="text-[#86868b]">--</span>
                        )}
                      </td>

                      {/* Total Marks */}
                      <td className="py-2 px-3 text-center font-mono">
                        {isPending ? (
                          <span className="text-[#86868b]">--/{res?.totalMax}</span>
                        ) : (
                          <span>
                            <strong>{res?.totalObtained}</strong>
                            <span className="text-[#86868b]">/{res?.totalMax}</span>
                          </span>
                        )}
                      </td>

                      {/* Grade */}
                      <td className="py-2 px-2 text-center">
                        {hasFailedHead ? (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40">
                            F
                          </span>
                        ) : isPending ? (
                          <span className="text-[#86868b]">--</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                            {res?.letterGrade}
                          </span>
                        )}
                      </td>

                      {/* GP */}
                      <td className="py-2 px-2 text-center font-mono font-medium">
                        {hasFailedHead ? '0' : isPending ? '--' : res?.gradePoint}
                      </td>

                      {/* C×G */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-[#0071e3] dark:text-[#2997ff]">
                        {hasFailedHead ? '0' : isPending ? '--' : res?.cxg}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(course)}
                            className="p-1 rounded text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCourse(course.id)}
                            className="p-1 rounded text-[#86868b] hover:text-rose-500 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
