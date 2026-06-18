import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-slate-200 dark:bg-dark-surface text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-dark-border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};
