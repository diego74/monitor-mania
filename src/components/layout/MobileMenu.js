import { X, LayoutDashboard, ClipboardList, BarChart2, Lightbulb, BookOpen, Info, Heart, Settings, Sun, Moon } from 'lucide-react';
import { NavItem, NavSection } from './NavItem';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

export function MobileMenu({ isOpen, onClose }) {
  const { patientName, isCaregiver } = useApp();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-navy-800 z-40 flex flex-col shadow-xl transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-teal-500" />
            <div>
              <p className="font-bold text-navy-700 dark:text-white text-sm">Monitor Bipolar</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">{patientName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-700 cursor-pointer"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-700 cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {isCaregiver ? (
            <NavSection title="Principal">
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Inicio" onClick={onClose} />
              <NavItem to="/analysis" icon={BarChart2} label="Análisis y Reportes" onClick={onClose} />
            </NavSection>
          ) : (
            <NavSection title="Principal">
              <NavItem to="/test/composite" icon={ClipboardList} label="Inicio (Evaluación)" onClick={onClose} />
            </NavSection>
          )}

          {isCaregiver && (
            <NavSection title="Administración">
              <NavItem to="/admin/questions" icon={Settings} label="Preguntas" onClick={onClose} />
              <NavItem to="/settings" icon={Settings} label="Ajustes" onClick={onClose} />
            </NavSection>
          )}

          <NavSection title="Información">
            <NavItem to="/tips" icon={Lightbulb} label="Consejos" onClick={onClose} />
            <NavItem to="/resources" icon={BookOpen} label="Recursos" onClick={onClose} />
            <NavItem to="/about" icon={Info} label="Sobre el Trastorno" onClick={onClose} />
          </NavSection>
        </nav>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-navy-700">
          <p className="text-xs text-slate-400 dark:text-slate-500">Monitor Bipolar v2.0</p>
        </div>
      </div>
    </>
  );
}
