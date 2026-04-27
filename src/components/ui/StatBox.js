export function StatBox({ label, value, sub, colorClass = 'text-navy-700' }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-extrabold ${colorClass}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function StatsGrid({ children }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 mt-2">
      {children}
    </div>
  );
}
