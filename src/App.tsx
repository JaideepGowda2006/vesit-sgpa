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
  // Apple Theme state ('dark' | 'light')
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

  // Main navigation tab: 'marks' (default) | 'planner' | 'ocr'
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
    saveSemesterData(currentSemesterId, courses, targetSGPI);
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
      `Extracted ${result.totalCourses} subjects (${result.totalCredits} Credits)`,
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
    showToast(`Removed "${courseToDelete?.courseName || 'Subject'}"`, 'info');
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
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#0071e3', '#34c759', '#5856d6'],
    });

    showToast(
      `Target marks filled to reach SGPA ${targetSGPI.toFixed(2)}`,
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
    showToast('Reset all subjects to pending target state', 'info');
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
    showToast('Distinction marks (Grade O / ~85%) applied', 'success');
  };

  // Reset current semester to defaults
  const handleResetToDefaults = () => {
    const resetData = resetSemesterData(currentSemesterId);
    setCourses(resetData.courses);
    setTargetSGPI(resetData.targetSGPI);
    showToast('Workspace reset to defaults', 'info');
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
    showToast('Downloaded JSON backup', 'success');
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
    showToast('Workspace restored successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased selection:bg-[#0071e3]/20 transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-xl text-xs font-medium animate-in slide-in-from-bottom duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-[#0071e3] shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Apple Minimalist Header */}
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Apple Style Hero Summary */}
        <CompactKPIStrip
          overall={overall}
          analysis={targetAnalysis}
          targetSGPI={targetSGPI}
          onAutoSimulate={handleAutoSimulateTargetMarks}
          onClearToPending={handleClearToPending}
          onSwitchToPlannerTab={() => setActiveTab('planner')}
        />

        {/* Minimal iOS Segmented Navigation Pill */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.1] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setActiveTab('marks')}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                activeTab === 'marks'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
              <span>Subjects</span>
              <span className="text-[11px] opacity-70">({courses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                activeTab === 'planner'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
              <span>Target</span>
              {targetAnalysis.unfilledCredits > 0 && (
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full">
                  {targetAnalysis.unfilledCredits} Cr
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                activeTab === 'ocr'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
              <span>Scanner</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Subjects List & Inline Edit */}
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

        {/* Tab 2: Dedicated Reverse Target Planner */}
        {activeTab === 'planner' && (
          <div className="space-y-6">
            <TargetPlannerKPI
              targetSGPI={targetSGPI}
              onTargetChange={setTargetSGPI}
              analysis={targetAnalysis}
              overall={overall}
              onAutoSimulate={handleAutoSimulateTargetMarks}
              onClearToPending={handleClearToPending}
              onFillHighMarks={handleFillDistinctions}
            />

            <div className="pt-2">
              <h3 className="text-sm font-semibold text-[#86868b] uppercase tracking-wider mb-3 px-1">
                Subject Aim Breakdown
              </h3>
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
          </div>
        )}

        {/* Tab 3: Scheme OCR Scanner */}
        {activeTab === 'ocr' && (
          <div className="space-y-6">
            <DocumentUploadSection
              onParseComplete={handleParseComplete}
              onLoadPreset={handleSelectSemester}
              currentSchemeName={currentSchemeName}
            />
          </div>
        )}
      </main>

      {/* Apple Minimalist Footer */}
      <footer className="mt-16 py-8 border-t border-black/[0.04] dark:border-white/[0.06] text-center text-xs text-[#86868b] transition-colors">
        <p>
          VESIT Autonomous SGPA Calculator & Target Planner
        </p>
        <p className="mt-1 text-[11px] text-[#86868b]">
          Separate Theory (3 Cr / 100M) & Lab (1 Cr / 50M) Rows • Autonomous Mumbai University Scheme
        </p>
      </footer>

      {/* Modals & Drawers */}
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
