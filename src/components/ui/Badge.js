export function Badge({ label, bg, text }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${bg} ${text}`}>
      {label}
    </span>
  );
}

export function SeverityBadge({ score }) {
  if (score === undefined || score === null) return null;
  if (score < 1.5) return <Badge label="Bajo" bg="bg-emerald-100" text="text-emerald-800" />;
  if (score < 3)   return <Badge label="Moderado" bg="bg-amber-100" text="text-amber-800" />;
  return <Badge label="Elevado" bg="bg-rose-100" text="text-rose-800" />;
}

export function MoodBadge({ depressionScore }) {
  if (depressionScore === undefined || depressionScore === null) return null;
  if (depressionScore < 1.0) return <Badge label="Estable" bg="bg-emerald-100" text="text-emerald-800" />;
  if (depressionScore < 2.0) return <Badge label="Leve" bg="bg-amber-100" text="text-amber-800" />;
  if (depressionScore < 3.0) return <Badge label="Moderado" bg="bg-orange-100" text="text-orange-800" />;
  return <Badge label="Severo" bg="bg-rose-100" text="text-rose-800" />;
}

export function TestTypeBadge({ testType }) {
  if (testType === 'mood_comprehensive')
    return <Badge label="Test de Ánimo" bg="bg-violet-100" text="text-violet-800" />;
  if (testType === 'mania')
    return <Badge label="Test de Manía" bg="bg-teal-100" text="text-teal-800" />;
  return <Badge label="Test" bg="bg-slate-100" text="text-slate-700" />;
}

export function RoleBadge({ role }) {
  if (role === 'caregiver')
    return <Badge label="Cuidador" bg="bg-navy-100" text="text-navy-700" />;
  return <Badge label="Paciente" bg="bg-violet-100" text="text-violet-800" />;
}
