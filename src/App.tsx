import { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { CourseAssessment } from './types/grading';
import { calculateCourseResult, calculateOverallResults } from './utils/gradingEngine';
import { analyzeTargetSGPI } from './utils/targetPlanner';
import {
  loadSemesterData,
  saveSemesterData,
  resetSemesterData,
  exportWorkspaceJSON,
  SEMESTER_OPTIONS,
} from './utils/storageManager';
import { Header } from './components/Header';
import { UnifiedTopControlBar } from './components/UnifiedTopControlBar';
import { CoursesTable } from './components/CoursesTable';
import { CourseRowEditModal } from './components/CourseRowEditModal';
import { HowItWorksDrawer } from './components/HowItWorksDrawer';
import { PrintReportModal } from './components/PrintReportModal';
import { ImportExportModal } from './components/ImportExportModal';
import { DocumentUploadSection } from './components/DocumentUploadSection';
import {
  generateRoadmapAnalysis,
  applyRoadmapPlan,
  applySingleCourseMinMarks,
  type RoadmapPlan,
} from './utils/roadmapPlanner';
import { GradeBotChat } from './components/GradeBotChat';
import type { ParseResult } from './utils/documentMatcher';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  ChevronDown,
  ChevronUp,
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

  // Optional collapsible scheme scanner
  const [showScanner, setShowScanner] = useState(false);

  // Modals & drawers
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<CourseAssessment | null>(null);

  // Undo history for autofill actions
  const [previousCourses, setPreviousCourses] = useState<CourseAssessment[] | null>(null);

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

  // 3. Reverse target GPA analysis
  const targetAnalysis = useMemo(() => {
    return analyzeTargetSGPI(courses, courseResults, targetSGPI);
  }, [courses, courseResults, targetSGPI]);

  // Handle OCR extraction complete
  const handleParseComplete = (result: ParseResult) => {
    setCourses(result.courses);
    setCurrentSemesterId('vesit_sgpa_custom');
    saveSemesterData('vesit_sgpa_custom', result.courses, targetSGPI);
    setShowScanner(false);
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

  // Big Primary Autofill: Fills missing marks to hit Target SGPA
  const handleAutofillMissing = () => {
    const analysis = generateRoadmapAnalysis(courses, courseResults, targetSGPI);
    const plan = analysis.plans.find((p) => p.id === 'realistic') || analysis.plans[0];

    if (!plan) {
      showToast('All subjects are already evaluated or target unreachable.', 'error');
      return;
    }

    setPreviousCourses(JSON.parse(JSON.stringify(courses)));
    const updated = applyRoadmapPlan(courses, plan);
    setCourses(updated);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#0071e3', '#34c759', '#5856d6'],
    });

    showToast(
      `Autofilled missing marks for Target SGPA ${targetSGPI.toFixed(2)}`,
      'success'
    );
  };

  // Apply a specific roadmap plan (e.g., chosen in GradeBot chat)
  const handleApplyRoadmapPlan = (plan: RoadmapPlan) => {
    setPreviousCourses(JSON.parse(JSON.stringify(courses)));
    const updated = applyRoadmapPlan(courses, plan);
    setCourses(updated);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#0071e3', '#34c759', '#5856d6'],
    });

    showToast(`Applied ${plan.title} plan!`, 'success');
  };

  // Undo autofill action
  const handleUndoRoadmap = () => {
    if (previousCourses) {
      setCourses(previousCourses);
      setPreviousCourses(null);
      showToast('Reverted marks to previous state', 'info');
    }
  };

  // Autofill single course with minimum marks for current target grade
  const handleAutofillSingleCourse = (courseId: string) => {
    setPreviousCourses(JSON.parse(JSON.stringify(courses)));
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const targetGrade = targetAnalysis.recommendedLetterGrade || 'O';
    const updated = applySingleCourseMinMarks(course, targetGrade);

    setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)));
    showToast(`Filled marks for "${course.courseName}" (Grade ${targetGrade})`, 'success');
  };

  // Unmistakable Clear All Marks Button
  const handleClearAllMarks = () => {
    setPreviousCourses(JSON.parse(JSON.stringify(courses)));
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
    showToast('Cleared all marks. Ready to start fresh!', 'info');
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

      {/* Main Workspace: ONE Simple, Unified View */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Control Bar: Semester, Target SGPA, Big Autofill Button, Summary Badges */}
        <UnifiedTopControlBar
          currentSemesterId={currentSemesterId}
          onSelectSemester={handleSelectSemester}
          targetSGPI={targetSGPI}
          onTargetChange={setTargetSGPI}
          currentSGPI={overall.currentSGPI}
          maxPossibleSGPI={targetAnalysis.maxPossibleSGPI}
          unfilledCredits={targetAnalysis.unfilledCredits}
          hasAnyFailedHead={overall.hasAnyFailedCourse}
          onAutofillMissing={handleAutofillMissing}
          onClearAllMarks={handleClearAllMarks}
          onUndo={handleUndoRoadmap}
          canUndo={!!previousCourses}
        />

        {/* ONE Simple, Unified Subjects Table */}
        <div className="pt-2">
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
            onAutofillSingleCourse={handleAutofillSingleCourse}
          />
        </div>

        {/* Optional Collapsible Scheme Scanner (kept unobtrusive at bottom) */}
        <div className="pt-6 border-t border-black/[0.05] dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setShowScanner(!showScanner)}
            className="flex items-center gap-2 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
          >
            <UploadCloud className="w-4 h-4 text-[#0071e3] dark:text-[#2997ff]" />
            <span>Upload Custom Scheme / Screenshot from Syllabus</span>
            {showScanner ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showScanner && (
            <div className="mt-4 animate-in fade-in duration-200">
              <DocumentUploadSection
                onParseComplete={handleParseComplete}
                onLoadPreset={handleSelectSemester}
                currentSchemeName={currentSchemeName}
              />
            </div>
          )}
        </div>
      </main>

      {/* Apple Minimalist Footer */}
      <footer className="mt-16 py-8 border-t border-black/[0.04] dark:border-white/[0.06] text-center text-xs text-[#86868b] transition-colors">
        <p>VESIT Autonomous SGPA Calculator & Target Planner</p>
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

      {/* Zero-Dependency Local Academic Advisor Chatbot */}
      <GradeBotChat
        courses={courses}
        courseResults={courseResults}
        targetSGPI={targetSGPI}
        overall={overall}
        onApplyPlan={handleApplyRoadmapPlan}
      />
    </div>
  );
}

export default App;
