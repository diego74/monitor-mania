import { Menu, Heart, Sun, Moon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

export function TopBar({ onMenuToggle }) {
  const { patientName } = useApp();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex-shrink-0 h-14 bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 flex items-center px-4 gap-3 z-20">
      <button
        onClick={onMenuToggle}
        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors cursor-pointer"
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2 flex-1">
        <Heart size={18} className="text-teal-500" />
        <span className="font-bold text-navy-700 dark:text-white text-sm">Monitor Bipolar</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">{patientName}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
