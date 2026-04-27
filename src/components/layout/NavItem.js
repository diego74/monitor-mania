import { NavLink } from 'react-router-dom';

export function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
          isActive
            ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-l-2 border-teal-500 pl-[10px]'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 hover:text-slate-900 dark:hover:text-white'
        }`
      }
    >
      {Icon && <Icon size={18} strokeWidth={1.75} />}
      <span>{label}</span>
    </NavLink>
  );
}

export function NavSection({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
