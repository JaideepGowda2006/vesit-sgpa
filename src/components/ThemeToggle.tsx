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
      className="p-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#2c2c2e] shadow-sm transition active:scale-95 focus:outline-none"
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {darkMode ? (
        <Sun className="w-4 h-4 text-amber-400 transition" />
      ) : (
        <Moon className="w-4 h-4 text-[#1d1d1f] transition" />
      )}
    </button>
  );
};
