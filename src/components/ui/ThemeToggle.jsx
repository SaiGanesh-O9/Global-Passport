import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeProvider.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-550 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-350 dark:hover:border-slate-700 active:scale-[0.98] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5 text-amber-500 transition-transform duration-200" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-blue-600 transition-transform duration-200" />
      )}
    </button>
  );
}
