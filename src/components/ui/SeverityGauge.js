// Gauge visual de severidad — barra horizontal con marcadores de zona
export function SeverityGauge({ score, max = 4 }) {
  const pct = Math.min(100, (score / max) * 100);

  let barColor = 'bg-emerald-500';
  if (score >= 1.5) barColor = 'bg-amber-500';
  if (score >= 3)   barColor = 'bg-rose-500';

  return (
    <div className="w-full">
      <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
        {/* Zone separators */}
        <div className="absolute inset-y-0 left-[37.5%] w-px bg-white/60 z-10" />
        <div className="absolute inset-y-0 left-[75%] w-px bg-white/60 z-10" />
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
        <span>Bajo</span>
        <span>Moderado</span>
        <span>Elevado</span>
      </div>
    </div>
  );
}
