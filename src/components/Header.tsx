import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Printer,
  RotateCcw,
  BookOpen,
  Layers,
  Download,
  Upload,
} from 'lucide-react';
import { SEMESTER_OPTIONS } from '../utils/storageManager';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenHowItWorks: () => void;
  onOpenPrintReport: () => void;
  onReset: () => void;
  currentSemesterId: string;
  onSelectSemester: (semesterId: string) => void;
  onExportJSON: () => void;
  onOpenImportModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHowItWorks,
  onOpenPrintReport,
  onReset,
  currentSemesterId,
  onSelectSemester,
  onExportJSON,
  onOpenImportModal,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                VESIT SGPA Calculator
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-2.5 h-2.5" /> Autonomous R-2025
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block">
              Separate Theory & Lab Rows • Instant Target Solver
            </p>
          </div>
        </div>

        {/* Action Controls & Top Dropdown */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Top-Level Semester Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs shadow-inner">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <select
              value={currentSemesterId}
              onChange={(e) => onSelectSemester(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer pr-1 text-xs"
              title="Select Active Semester"
            >
              {SEMESTER_OPTIONS.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* Rules / Guide */}
          <button
            onClick={onOpenHowItWorks}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition"
            title="University Grading Rules & Head Criteria"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Rules</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={onOpenImportModal}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition"
            title="Import Workspace JSON"
          >
            <Upload className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden lg:inline">Import</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={onExportJSON}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition"
            title="Export Workspace JSON"
          >
            <Download className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden lg:inline">Export</span>
          </button>

          {/* Save Mock Report (PDF) */}
          <button
            onClick={onOpenPrintReport}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition active:scale-95"
            title="Generate Official Mock Grade Card PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Mock Grade Card</span>
          </button>

          {/* Reset to Defaults Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
            title="Reset active semester to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
