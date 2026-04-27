import { LayoutDashboard, ClipboardList, BarChart2, Lightbulb, BookOpen, Info, Heart, HeartPulse, Settings, Sun, Moon } from 'lucide-react';
import { NavItem, NavSection } from './NavItem';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

export function Sidebar({ onNav }) {
  const { role, patientName, token } = useApp();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-60 flex-shrink-0 bg-white dark:bg-navy-800 border-r border-slate-200 dark:border-navy-700 flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2 mb-1">
          <Heart size={20} className="text-teal-500" />
          <span className="font-bold text-navy-700 dark:text-white text-base">Monitor Bipolar</span>
        </div>
        <div className="flex items-center gap-2 pl-7">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="text-xs text-slate-500 dark:text-slate-400">{patientName}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {role === 'patient' && token && (
          <NavSection title="Mi Evaluación">
            <NavItem to={`/p/${token}/composite`} icon={HeartPulse} label="¿Cómo me siento hoy?" onClick={onNav} />
          </NavSection>
        )}

        {role === 'caregiver' && (
          <>
            <NavSection title="Principal">
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Inicio" onClick={onNav} />
              <NavItem to="/caregiver" icon={ClipboardList} label="Registrar" onClick={onNav} />
              <NavItem to="/analysis" icon={BarChart2} label="Análisis" onClick={onNav} />
            </NavSection>
            <NavSection title="Configuración">
              <NavItem to="/settings" icon={Settings} label="Paciente y Admin" onClick={onNav} />
            </NavSection>
          </>
        )}

        <NavSection title="Información">
          <NavItem to="/tips" icon={Lightbulb} label="Consejos" onClick={onNav} />
          <NavItem to="/resources" icon={BookOpen} label="Recursos" onClick={onNav} />
          <NavItem to="/about" icon={Info} label="Sobre el Trastorno" onClick={onNav} />
        </NavSection>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-navy-700 flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">Monitor Bipolar v2.0</p>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </aside>
  );
}
