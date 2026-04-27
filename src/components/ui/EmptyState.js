import { ClipboardList } from 'lucide-react';

export function EmptyState({ icon: Icon = ClipboardList, title = 'Sin datos', description = 'No hay registros todavía.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-400">
      <Icon size={36} className="mb-3 opacity-40" />
      <p className="font-semibold text-slate-500 mb-1">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  );
}
