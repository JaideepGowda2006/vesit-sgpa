import type { LetterGrade } from '../types/grading';

export interface GradeColorDefinition {
  letter: LetterGrade | 'F';
  badgeClasses: string;
  pillClasses: string;
  borderClasses: string;
  textClasses: string;
  bgClasses: string;
}

/**
 * High-Contrast, Distinct Color Coding for Grades as per university scale:
 * - Grade O (10 / >= 80%): Emerald / Vivid Green
 * - Grade A (9 / 75-79%): Cyan / Sky Blue
 * - Grade B (8 / 70-74%): Indigo / Violet
 * - Grade C (7 / 60-69%): Amber / Yellow
 * - Grade D & E (5-6 / 45-59%): Orange
 * - Grade P (4 / 40-44%): Slate / Gray
 * - Grade F / Failed Head (0 / < 40% or failed min threshold): Bright Rose / Red
 */
export function getGradeBadgeClasses(grade: LetterGrade | 'F'): string {
  switch (grade) {
    case 'O':
      return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 font-bold';
    case 'A':
      return 'bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/40 font-bold';
    case 'B':
      return 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-500/40 font-bold';
    case 'C':
      return 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold';
    case 'D':
    case 'E':
      return 'bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-500/40 font-bold';
    case 'P':
      return 'bg-slate-500/20 text-slate-800 dark:text-slate-300 border border-slate-500/40 font-bold';
    case 'F':
    default:
      return 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 font-bold';
  }
}

/**
 * Target need badge styling (when course is pending/unfilled)
 * e.g. "🎯 Need Grade O (≥ 80/100)"
 */
export function getTargetNeedBadgeClasses(grade: LetterGrade): string {
  switch (grade) {
    case 'O':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
    case 'A':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30';
    case 'B':
      return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30';
    case 'C':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30';
    case 'D':
    case 'E':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30';
    case 'P':
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30';
    default:
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
  }
}
