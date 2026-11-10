import React from 'react';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  theme?: 'dark' | 'light';
  isDark?: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, isDark, onToggle }) => {
  const darkMode = isDark !== undefined ? isDark : theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative p-2 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm"
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {darkMode ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-200" />
      )}
    </button>
  );
};
