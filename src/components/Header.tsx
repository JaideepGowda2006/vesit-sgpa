import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Printer,
  RotateCcw,
  BookOpen,
  Download,
  Upload,
  MoreHorizontal,
  ChevronDown,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f5f5f7]/80 dark:bg-black/80 backdrop-blur-2xl transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Minimal Title & Semester Picker */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#1d1d1f] dark:bg-[#f5f5f7] flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-white dark:text-black" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
              VESIT SGPA
            </h1>

            {/* Semester Selector Pill */}
            <div className="relative inline-flex items-center">
              <select
                value={currentSemesterId}
                onChange={(e) => onSelectSemester(e.target.value)}
                className="appearance-none pl-2.5 pr-6 py-1 rounded-full text-xs font-medium bg-black/[0.05] dark:bg-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.08] dark:hover:bg-white/[0.15] cursor-pointer focus:outline-none transition"
                title="Select Academic Scheme"
              >
                {SEMESTER_OPTIONS.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    className="bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7]"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#86868b] pointer-events-none absolute right-2" />
            </div>
          </div>
        </div>

        {/* Right: Theme Toggle & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Print Grade Card Button (Desktop) */}
          <button
            onClick={onOpenPrintReport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.12] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#2c2c2e] shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
            <span>Grade Card</span>
          </button>

          {/* Theme Switcher */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* More Menu Dropdown ("...") */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#2c2c2e] shadow-sm transition"
              title="More Actions"
              aria-label="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-xl p-1.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenPrintReport();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] sm:hidden"
                >
                  <Printer className="w-4 h-4 text-[#0071e3]" />
                  <span>View Mock Grade Card</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenHowItWorks();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7]"
                >
                  <BookOpen className="w-4 h-4 text-[#0071e3]" />
                  <span>Grading Rules & Passing</span>
                </button>

                <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.08] my-1" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportJSON();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7]"
                >
                  <Download className="w-4 h-4 text-[#86868b]" />
                  <span>Export JSON Backup</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenImportModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7]"
                >
                  <Upload className="w-4 h-4 text-[#86868b]" />
                  <span>Import JSON Backup</span>
                </button>

                <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.08] my-1" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onReset();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
