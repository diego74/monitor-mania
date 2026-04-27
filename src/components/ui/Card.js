export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-navy-800 dark:border dark:border-navy-700 rounded-xl shadow-card p-4 mb-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h2 className={`text-base font-semibold text-navy-700 dark:text-white mb-3 ${className}`}>
      {children}
    </h2>
  );
}

export function CardInfo({ children }) {
  return (
    <div className="text-sm text-slate-600 dark:text-slate-300 bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 px-3 py-2 rounded-r-lg mb-3">
      {children}
    </div>
  );
}
