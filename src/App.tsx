import { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { CourseAssessment } from './types/grading';
import { calculateCourseResult, calculateOverallResults } from './utils/gradingEngine';
import { analyzeTargetSGPI, getTargetMarksForCourse } from './utils/targetPlanner';
import {
  loadSemesterData,
  saveSemesterData,
  resetSemesterData,
  exportWorkspaceJSON,
  SEMESTER_OPTIONS,
} from './utils/storageManager';
import { Header } from './components/Header';
import { CompactKPIStrip } from './components/CompactKPIStrip';
import { DocumentUploadSection } from './components/DocumentUploadSection';
import { TargetPlannerKPI } from './components/TargetPlannerKPI';
import { CoursesTable } from './components/CoursesTable';
import { CourseRowEditModal } from './components/CourseRowEditModal';
import { HowItWorksDrawer } from './components/HowItWorksDrawer';
import { PrintReportModal } from './components/PrintReportModal';
import { ImportExportModal } from './components/ImportExportModal';
import type { ParseResult } from './utils/documentMatcher';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Target,
  UploadCloud,
} from 'lucide-react';

export function App() {
  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('vesit_theme') as 'dark' | 'light') || 'dark';
  });

  // Apply theme class to <html>
  useEffect(() => {
    localStorage.setItem('vesit_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'marks' | 'planner' | 'ocr'>('marks');

  // Active semester in isolated localStorage
  const [currentSemesterId, setCurrentSemesterId] = useState<string>('vesit_sgpa_sem4');

  // Course state and target SGPA loaded from isolated localStorage
  const [courses, setCourses] = useState<CourseAssessment[]>(() => {
    const init = loadSemesterData('vesit_sgpa_sem4');
    return init.courses;
  });

  const [targetSGPI, setTargetSGPI] = useState<number>(() => {
    const init = loadSemesterData('vesit_sgpa_sem4');
    return init.targetSGPI;
  });

  // Modals & drawers
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<CourseAssessment | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync state whenever active semester changes
  const handleSelectSemester = (newSemesterId: string) => {
    // Save current before switching
    saveSemesterData(currentSemesterId, courses, targetSGPI);

    // Load new semester data
    const loaded = loadSemesterData(newSemesterId);
    setCurrentSemesterId(newSemesterId);
    setCourses(loaded.courses);
    setTargetSGPI(loaded.targetSGPI);

    const opt = SEMESTER_OPTIONS.find((o) => o.id === newSemesterId);
    showToast(`Switched to ${opt?.label || 'Workspace'}`, 'info');
  };

  // Auto-save changes to current isolated localStorage key
  useEffect(() => {
    saveSemesterData(currentSemesterId, courses, targetSGPI);
  }, [currentSemesterId, courses, targetSGPI]);

  // Current scheme display title
  const currentSchemeName = useMemo(() => {
    const opt = SEMESTER_OPTIONS.find((o) => o.id === currentSemesterId);
    return opt?.label || 'Custom Semester Scheme';
  }, [currentSemesterId]);

  // 1. Calculate outcomes for every row independently
  const courseResults = useMemo(() => {
    const map = new Map();
    for (const course of courses) {
      map.set(course.id, calculateCourseResult(course));
    }
    return map;
  }, [courses]);

  // 2. Calculate overall semester results
  const overall = useMemo(() => {
    return calculateOverallResults(courses, courseResults);
  }, [courses, courseResults]);

  // 3. Dynamic reverse target GPA analysis
  const targetAnalysis = useMemo(() => {
    return analyzeTargetSGPI(courses, courseResults, targetSGPI);
  }, [courses, courseResults, targetSGPI]);

  // Handle OCR extraction complete
  const handleParseComplete = (result: ParseResult) => {
    setCourses(result.courses);
    setCurrentSemesterId('vesit_sgpa_custom');
    saveSemesterData('vesit_sgpa_custom', result.courses, targetSGPI);
    setActiveTab('marks');
    showToast(
      `Extracted & Matched ${result.totalCourses} rows (${result.totalCredits} Credits)!`,
      'success'
    );
  };

  // Update a single course
  const handleUpdateCourse = (updatedCourse: CourseAssessment) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );
  };

  // Delete a course
  const handleDeleteCourse = (courseId: string) => {
    const courseToDelete = courses.find((c) => c.id === courseId);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    showToast(`Removed "${courseToDelete?.courseName || 'Course'}"`, 'info');
  };

  // Toggle pending status
  const handleTogglePending = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const nextPending = !c.isPending;
          return { ...c, isPending: nextPending };
        }
        return c;
      })
    );
  };

  // Save from Edit / Add modal
  const handleSaveModalCourse = (savedCourse: CourseAssessment) => {
    const exists = courses.some((c) => c.id === savedCourse.id);
    if (exists) {
      setCourses((prev) => prev.map((c) => (c.id === savedCourse.id ? savedCourse : c)));
      showToast(`Updated "${savedCourse.courseName}"`, 'success');
    } else {
      setCourses((prev) => [...prev, savedCourse]);
      showToast(`Added "${savedCourse.courseName}"`, 'success');
    }
  };

  // Reverse Target Planner: Auto-simulate target marks
  const handleAutoSimulateTargetMarks = () => {
    const targetGrade = targetAnalysis.recommendedLetterGrade;

    setCourses((prev) =>
      prev.map((course) => {
        const res = courseResults.get(course.id);
        if (course.isPending || !res?.isFullyFilled) {
          const aim = getTargetMarksForCourse(course, targetGrade);
          const updated = { ...course, isPending: false };

          if (updated.isDirectOverall && updated.directOverall?.enabled) {
            updated.directOverall = {
              ...updated.directOverall,
              obtained: aim.suggestedHeads.direct ?? 80,
            };
          } else {
            if (updated.midTest?.enabled) {
              updated.midTest = {
                ...updated.midTest,
                obtained: aim.suggestedHeads.mt ?? 16,
              };
            }
            if (updated.ca?.enabled) {
              updated.ca = {
                ...updated.ca,
                obtained: aim.suggestedHeads.ca ?? 16,
              };
            }
            if (updated.ese?.enabled) {
              updated.ese = {
                ...updated.ese,
                obtained: aim.suggestedHeads.ese ?? (updated.ese.max === 100 ? 80 : 48),
              };
            }
            if (updated.termWork?.enabled) {
              updated.termWork = {
                ...updated.termWork,
                obtained: aim.suggestedHeads.tw ?? (updated.termWork.max === 50 ? 42 : 21),
              };
            }
            if (updated.prOral?.enabled) {
              updated.prOral = {
                ...updated.prOral,
                obtained: aim.suggestedHeads.pr ?? 21,
              };
            }
          }
          return updated;
        }
        return course;
      })
    );

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#10b981', '#38bdf8'],
    });

    showToast(
      `Target marks calculated and distributed to hit SGPA ${targetSGPI.toFixed(2)}!`,
      'success'
    );
  };

  // Set all courses to pending
  const handleClearToPending = () => {
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        isPending: true,
        midTest: { ...c.midTest, obtained: null },
        ca: { ...c.ca, obtained: null },
        ese: { ...c.ese, obtained: null },
        termWork: { ...c.termWork, obtained: null },
        prOral: { ...c.prOral, obtained: null },
        directOverall: c.directOverall ? { ...c.directOverall, obtained: null } : undefined,
      }))
    );
    showToast('All subjects marked as pending. Reverse planner is ready!', 'info');
  };

  // Fill distinction marks
  const handleFillDistinctions = () => {
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        isPending: false,
        midTest: c.midTest?.enabled ? { ...c.midTest, obtained: 18 } : c.midTest,
        ca: c.ca?.enabled ? { ...c.ca, obtained: 18 } : c.ca,
        ese: c.ese?.enabled ? { ...c.ese, obtained: c.ese.max === 100 ? 86 : 52 } : c.ese,
        termWork: c.termWork?.enabled ? { ...c.termWork, obtained: c.termWork.max === 50 ? 44 : 22 } : c.termWork,
        prOral: c.prOral?.enabled ? { ...c.prOral, obtained: 23 } : c.prOral,
        directOverall: c.directOverall?.enabled ? { ...c.directOverall, obtained: 88 } : c.directOverall,
      }))
    );
    showToast('Distinction marks (Grade O / ~85%) populated!', 'success');
  };

  // Reset current semester to defaults
  const handleResetToDefaults = () => {
    const resetData = resetSemesterData(currentSemesterId);
    setCourses(resetData.courses);
    setTargetSGPI(resetData.targetSGPI);
    showToast('Reset current workspace to default university scheme', 'info');
  };

  // Export JSON directly
  const handleExportJSON = () => {
    const jsonStr = exportWorkspaceJSON(currentSemesterId, courses, targetSGPI);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VESIT_SGPA_${currentSemesterId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported workspace JSON file', 'success');
  };

  // Import JSON handler
  const handleImportSuccess = (
    importedCourses: CourseAssessment[],
    importedTarget: number,
    importedSemesterId?: string
  ) => {
    if (importedSemesterId && importedSemesterId !== currentSemesterId) {
      setCurrentSemesterId(importedSemesterId);
    }
    setCourses(importedCourses);
    setTargetSGPI(importedTarget);
    saveSemesterData(importedSemesterId || currentSemesterId, importedCourses, importedTarget);
    showToast('Workspace JSON imported successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-500" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
          <span className="text-slate-800 dark:text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Top Navigation & Brand Header */}
      <Header
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
        onReset={handleResetToDefaults}
        currentSemesterId={currentSemesterId}
        onSelectSemester={handleSelectSemester}
        onExportJSON={handleExportJSON}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Compact KPI Strip at the Top (Replaces giant stacked boxes) */}
        <CompactKPIStrip
          overall={overall}
          analysis={targetAnalysis}
          targetSGPI={targetSGPI}
          onAutoSimulate={handleAutoSimulateTargetMarks}
          onClearToPending={handleClearToPending}
          onSwitchToPlannerTab={() => setActiveTab('planner')}
        />

        {/* Decluttered Segmented Tabs for Mobile & Desktop */}
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tab 1: Marks Sheet */}
            <button
              type="button"
              onClick={() => setActiveTab('marks')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'marks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Marks & Grades</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 dark:bg-indigo-950 text-indigo-100 font-mono">
                {courses.length}
              </span>
            </button>

            {/* Tab 2: Target Planner */}
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'planner'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Target Planner</span>
              {targetAnalysis.unfilledCredits > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-500 font-mono">
                  {targetAnalysis.unfilledCredits} Cr left
                </span>
              )}
            </button>

            {/* Tab 3: Scheme OCR Scanner */}
            <button
              type="button"
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'ocr'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Scan Scheme</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0 hidden md:inline">
            Active: <strong className="text-slate-700 dark:text-slate-300">{currentSchemeName}</strong>
          </span>
        </div>

        {/* Tab 1 Content: Course Assessment Marks & Breakdown */}
        {activeTab === 'marks' && (
          <div className="space-y-4">
            <CoursesTable
              courses={courses}
              courseResults={courseResults}
              overall={overall}
              analysis={targetAnalysis}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onOpenAddModal={() => {
                setSelectedCourseForEdit(null);
                setIsEditModalOpen(true);
              }}
              onOpenEditModal={(course) => {
                setSelectedCourseForEdit(course);
                setIsEditModalOpen(true);
              }}
              onTogglePending={handleTogglePending}
            />
          </div>
        )}

        {/* Tab 2 Content: Dedicated Reverse Target GPA Planner & Goal Solver */}
        {activeTab === 'planner' && (
          <div className="space-y-5">
            <TargetPlannerKPI
              targetSGPI={targetSGPI}
              onTargetChange={setTargetSGPI}
              analysis={targetAnalysis}
              overall={overall}
              onAutoSimulate={handleAutoSimulateTargetMarks}
              onClearToPending={handleClearToPending}
              onFillHighMarks={handleFillDistinctions}
            />

            {/* Live Courses Table with Aim Marks */}
            <CoursesTable
              courses={courses}
              courseResults={courseResults}
              overall={overall}
              analysis={targetAnalysis}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onOpenAddModal={() => {
                setSelectedCourseForEdit(null);
                setIsEditModalOpen(true);
              }}
              onOpenEditModal={(course) => {
                setSelectedCourseForEdit(course);
                setIsEditModalOpen(true);
              }}
              onTogglePending={handleTogglePending}
            />
          </div>
        )}

        {/* Tab 3 Content: Multi-Document OCR & Cross-Referencing Extraction */}
        {activeTab === 'ocr' && (
          <div className="space-y-5">
            <DocumentUploadSection
              onParseComplete={handleParseComplete}
              onLoadPreset={handleSelectSemester}
              currentSchemeName={currentSchemeName}
            />

            {/* Preview of current table below scanner */}
            <CoursesTable
              courses={courses}
              courseResults={courseResults}
              overall={overall}
              analysis={targetAnalysis}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onOpenAddModal={() => {
                setSelectedCourseForEdit(null);
                setIsEditModalOpen(true);
              }}
              onOpenEditModal={(course) => {
                setSelectedCourseForEdit(course);
                setIsEditModalOpen(true);
              }}
              onTogglePending={handleTogglePending}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>
          VESIT Autonomous SGPA Calculator, Reverse Target Planner & Scheme Parser • Autonomous NEP Batch R-2025
        </p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          Client-Side Privacy • Separate Theory (3 Cr / 100M) & Lab (1 Cr / 50M) Rows • Individual Head Minimum Passing Checks
        </p>
      </footer>

      {/* Modals & Slide-over Drawers */}
      <CourseRowEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveModalCourse}
        initialCourse={selectedCourseForEdit}
      />

      <HowItWorksDrawer
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        courses={courses}
        courseResults={courseResults}
        overall={overall}
        analysis={targetAnalysis}
        currentSchemeName={currentSchemeName}
      />

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentSemesterId={currentSemesterId}
        courses={courses}
        targetSGPI={targetSGPI}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default App;
