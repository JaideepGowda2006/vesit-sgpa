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
  Target,
  FlaskConical,
  BookOpen,
  ShieldCheck,
  AlertOctagon,
  LayoutGrid,
  Table as TableIcon,
  Filter,
} from 'lucide-react';
import { getAimBadgeDetails } from '../utils/targetPlanner';
import { CourseCardView } from './CourseCardView';

interface CoursesTableProps {
  courses: CourseAssessment[];
  courseResults: Map<string, CourseCalculationResult>;
  overall: OverallCalculationResult;
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
  overall,
  analysis,
  onUpdateCourse,
  onDeleteCourse,
  onOpenAddModal,
  onOpenEditModal,
  onTogglePending,
}) => {
  // View mode: 'cards' is mobile-friendly touch UI, 'table' is desktop spreadsheet
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  // Filter category
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
    } else if (field === 'direct') {
      const val = tempValue === '' ? null : parseInt(tempValue, 10);
      if (updated.directOverall) {
        updated.directOverall = {
          ...updated.directOverall,
          obtained: val !== null && !isNaN(val) ? Math.min(updated.directOverall.max, Math.max(0, val)) : null,
        };
      }
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
    <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden transition-colors">
      {/* Table Control Header */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Course Marks & Scheme
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {courses.length} Rows ({overall.totalRegisteredCredits} Cr)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theory (3 Cr / 100M) and Labs (1 Cr / 50M) are evaluated separately with independent grade points.
          </p>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center flex-wrap gap-2">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Card View (Recommended for Mobile & Fast Tap)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Spreadsheet Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Strip */}
      <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:inline" />
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter('th')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'th'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Theory ({counts.th})
          </button>
          <button
            type="button"
            onClick={() => setFilter('tpo')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'tpo'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-3 h-3" />
            Labs ({counts.tpo})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'pending'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3 h-3" />
            Pending ({counts.pending})
          </button>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
          Showing {filteredCourses.length} of {courses.length}
        </span>
      </div>

      {/* Content Rendering: Card View vs Table View */}
      {viewMode === 'cards' ? (
        <div className="p-4 sm:p-5">
          <CourseCardView
            courses={filteredCourses}
            courseResults={courseResults}
            analysis={analysis}
            onUpdateCourse={onUpdateCourse}
            onDeleteCourse={onDeleteCourse}
            onOpenEditModal={onOpenEditModal}
            onTogglePending={onTogglePending}
          />
        </div>
      ) : (
        /* Full Spreadsheet Table View */
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 text-center w-12">Status</th>
                <th className="py-3 px-3 min-w-[130px]">Course Code</th>
                <th className="py-3 px-3 min-w-[210px]">Course Title</th>
                <th className="py-3 px-2 text-center min-w-[70px]">Category</th>
                <th className="py-3 px-2 text-center min-w-[65px]">Credits (C)</th>
                <th className="py-3 px-2 text-center min-w-[70px]">
                  MT
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Min 8/20)</span>
                </th>
                <th className="py-3 px-2 text-center min-w-[70px]">
                  CA
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Min 8/20)</span>
                </th>
                <th className="py-3 px-2 text-center min-w-[85px]">
                  ESE Theory
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Min 24/60)</span>
                </th>
                <th className="py-3 px-2 text-center min-w-[75px]">
                  Term Work
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Min 10/25)</span>
                </th>
                <th className="py-3 px-2 text-center min-w-[75px]">
                  Pract / Oral
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Min 10/25)</span>
                </th>
                <th className="py-3 px-3 text-center min-w-[85px]">Max / Obt</th>
                <th className="py-3 px-2 text-center min-w-[60px]">Grade</th>
                <th className="py-3 px-2 text-center min-w-[50px]">GP (G)</th>
                <th className="py-3 px-2 text-center min-w-[55px]">C×G</th>
                <th className="py-3 px-3 text-left min-w-[180px]">Target Guidance</th>
                <th className="py-3 px-2 text-center w-16">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {filteredCourses.map((course, idx) => {
                const res = courseResults.get(course.id);
                const isPending = course.isPending || !res?.isFullyFilled;
                const hasFailedHead = res?.hasFailedHead || false;
                const isTheory = course.category === 'TH';

                let rowBg = idx % 2 === 0 ? 'bg-white dark:bg-slate-900/30' : 'bg-slate-50/50 dark:bg-slate-950/30';
                if (hasFailedHead) rowBg = 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/30';
                else if (isPending) rowBg = 'bg-indigo-50/40 dark:bg-indigo-950/10 hover:bg-indigo-100/40 dark:hover:bg-indigo-950/20';
                else rowBg += ' hover:bg-slate-100/70 dark:hover:bg-slate-800/40';

                const aimBadge = getAimBadgeDetails(course, analysis);

                return (
                  <tr key={course.id} className={`${rowBg} transition-colors group`}>
                    {/* Status / Pending Toggle */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onTogglePending(course.id)}
                        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={
                          course.isPending
                            ? 'Marked as Pending / Simulating Target. Click to evaluate.'
                            : 'Evaluated with entered marks. Click to toggle Pending state.'
                        }
                      >
                        {course.isPending ? (
                          <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        ) : hasFailedHead ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        )}
                      </button>
                    </td>

                    {/* Course Code & Type */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                          {course.courseCode}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-mono">
                          {course.courseType}
                        </span>
                      </div>
                    </td>

                    {/* Course Name */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-200 leading-snug">
                        {course.courseName}
                      </div>
                      {course.notes && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {course.notes}
                        </span>
                      )}
                    </td>

                    {/* Category (TH vs TPO) */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isTheory
                            ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80'
                            : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                        }`}
                      >
                        {isTheory ? (
                          <BookOpen className="w-2.5 h-2.5 shrink-0" />
                        ) : (
                          <FlaskConical className="w-2.5 h-2.5 shrink-0" />
                        )}
                        {course.category}
                      </span>
                    </td>

                    {/* Credits */}
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {course.credits}
                    </td>

                    {/* Mid Test (MT) */}
                    <td className="py-2.5 px-2 text-center">
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
                            className="w-14 h-7 text-center font-mono font-bold text-xs bg-white dark:bg-slate-950 border border-indigo-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(course.id, 'mt', course.midTest?.obtained)}
                            className={`cursor-pointer px-2 py-1 rounded font-mono font-semibold transition ${
                              course.midTest.obtained === null
                                ? 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                : course.midTest.obtained < course.midTest.min
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                            title={`Click to edit MT mark (Passing: ≥${course.midTest.min}/${course.midTest.max})`}
                          >
                            {course.midTest.obtained !== null ? course.midTest.obtained : '--'}
                          </div>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono">--</span>
                      )}
                    </td>

                    {/* Continuous Assessment (CA) */}
                    <td className="py-2.5 px-2 text-center">
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
                            className="w-14 h-7 text-center font-mono font-bold text-xs bg-white dark:bg-slate-950 border border-indigo-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(course.id, 'ca', course.ca?.obtained)}
                            className={`cursor-pointer px-2 py-1 rounded font-mono font-semibold transition ${
                              course.ca.obtained === null
                                ? 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                : course.ca.obtained < course.ca.min
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                            title={`Click to edit CA mark (Passing: ≥${course.ca.min}/${course.ca.max})`}
                          >
                            {course.ca.obtained !== null ? course.ca.obtained : '--'}
                          </div>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono">--</span>
                      )}
                    </td>

                    {/* End Sem Exam (ESE Theory) */}
                    <td className="py-2.5 px-2 text-center">
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
                            className="w-14 h-7 text-center font-mono font-bold text-xs bg-white dark:bg-slate-950 border border-indigo-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(course.id, 'ese', course.ese?.obtained)}
                            className={`cursor-pointer px-2 py-1 rounded font-mono font-semibold transition ${
                              course.ese.obtained === null
                                ? 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                : course.ese.obtained < course.ese.min
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                            title={`Click to edit ESE mark (Passing: ≥${course.ese.min}/${course.ese.max})`}
                          >
                            {course.ese.obtained !== null ? course.ese.obtained : '--'}
                          </div>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono">--</span>
                      )}
                    </td>

                    {/* Term Work (TW) */}
                    <td className="py-2.5 px-2 text-center">
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
                            className="w-14 h-7 text-center font-mono font-bold text-xs bg-white dark:bg-slate-950 border border-indigo-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(course.id, 'tw', course.termWork?.obtained)}
                            className={`cursor-pointer px-2 py-1 rounded font-mono font-semibold transition ${
                              course.termWork.obtained === null
                                ? 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                : course.termWork.obtained < course.termWork.min
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                            title={`Click to edit Term Work (Passing: ≥${course.termWork.min}/${course.termWork.max})`}
                          >
                            {course.termWork.obtained !== null ? course.termWork.obtained : '--'}
                          </div>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono">--</span>
                      )}
                    </td>

                    {/* Practical / Oral (PR) */}
                    <td className="py-2.5 px-2 text-center">
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
                            className="w-14 h-7 text-center font-mono font-bold text-xs bg-white dark:bg-slate-950 border border-indigo-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(course.id, 'pr', course.prOral?.obtained)}
                            className={`cursor-pointer px-2 py-1 rounded font-mono font-semibold transition ${
                              course.prOral.obtained === null
                                ? 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                : course.prOral.obtained < course.prOral.min
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                            title={`Click to edit PR/Oral (Passing: ≥${course.prOral.min}/${course.prOral.max})`}
                          >
                            {course.prOral.obtained !== null ? course.prOral.obtained : '--'}
                          </div>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono">--</span>
                      )}
                    </td>

                    {/* Max / Obtained */}
                    <td className="py-2.5 px-3 text-center font-mono">
                      {isPending ? (
                        <span className="text-slate-400">
                          -- / {res?.totalMax}
                        </span>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {res?.totalObtained}
                          </span>
                          <span className="text-slate-400"> / {res?.totalMax}</span>
                        </div>
                      )}
                    </td>

                    {/* Grade */}
                    <td className="py-2.5 px-2 text-center">
                      {hasFailedHead ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900">
                          F
                        </span>
                      ) : isPending ? (
                        <span className="text-slate-400 font-mono text-[11px]">--</span>
                      ) : (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold font-mono ${
                            res?.letterGrade === 'O'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : res?.letterGrade === 'A' || res?.letterGrade === 'B'
                              ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {res?.letterGrade}
                        </span>
                      )}
                    </td>

                    {/* Grade Point (GP) */}
                    <td className="py-2.5 px-2 text-center font-mono font-bold">
                      {hasFailedHead ? (
                        <span className="text-rose-600 dark:text-rose-400">0</span>
                      ) : isPending ? (
                        <span className="text-slate-400">--</span>
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200">{res?.gradePoint}</span>
                      )}
                    </td>

                    {/* C × G */}
                    <td className="py-2.5 px-2 text-center font-mono font-bold">
                      {hasFailedHead ? (
                        <span className="text-rose-600 dark:text-rose-400">0</span>
                      ) : isPending ? (
                        <span className="text-slate-400">--</span>
                      ) : (
                        <span className="text-indigo-600 dark:text-indigo-400">{res?.cxg}</span>
                      )}
                    </td>

                    {/* Target Guidance / Aim */}
                    <td className="py-2.5 px-3">
                      {isPending ? (
                        <div className="space-y-0.5">
                          <div>
                            {aimBadge.status === 'unattainable' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900">
                                <AlertOctagon className="w-2.5 h-2.5 text-rose-500" />
                                {aimBadge.badgeText}
                              </span>
                            ) : aimBadge.status === 'safe' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                                {aimBadge.badgeText}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                <Target className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                                {aimBadge.badgeText}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {aimBadge.marksText}
                          </p>
                        </div>
                      ) : hasFailedHead ? (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          Retake Required
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Done ({res?.cxg} pts)</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(course)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                          title="Edit Full Course Scheme"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCourse(course.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 transition"
                          title="Delete Course Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Summary Footer */}
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-950 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
                  Semester Total:
                </td>
                <td className="py-3 px-2 text-center font-mono text-indigo-600 dark:text-indigo-400">
                  {overall.totalRegisteredCredits} Cr
                </td>
                <td colSpan={5} className="py-3 px-2 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                  {overall.filledCoursesCount} of {overall.totalCoursesCount} Evaluated
                  {overall.hasAnyFailedCourse && (
                    <span className="ml-2 text-rose-600 dark:text-rose-400 font-semibold">
                      (⚠️ {overall.totalFailedCredits} Cr Failed)
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {overall.totalObtainedMarks} / {overall.totalMaxMarks}
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    ({overall.overallPercentage.toFixed(1)}%)
                  </div>
                </td>
                <td className="py-3 px-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                  {overall.overallPercentage >= 80 ? 'O' : overall.overallPercentage >= 75 ? 'A' : overall.overallPercentage >= 70 ? 'B' : overall.overallPercentage >= 60 ? 'C' : 'Pass'}
                </td>
                <td className="py-3 px-2 text-center font-mono text-slate-400">
                  --
                </td>
                <td className="py-3 px-2 text-center font-mono text-indigo-600 dark:text-indigo-300">
                  {analysis.currentSecuredPoints.toFixed(0)}
                </td>
                <td colSpan={2} className="py-3 px-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase">Calculated SGPA:</span>
                    <span
                      className={`font-mono text-base font-extrabold ${
                        overall.hasAnyFailedCourse
                          ? 'text-rose-600 dark:text-rose-400'
                          : overall.currentSGPI >= analysis.targetSGPI
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {overall.currentSGPI > 0 ? overall.currentSGPI.toFixed(2) : '--'}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
};
