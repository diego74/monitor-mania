import { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function QuestionList({ questions, onEdit, onDelete, onToggleActive, onAdd }) {
  const [filterTest, setFilterTest] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const filtered = questions.filter(q => {
    if (filterTest !== 'all' && q.test !== filterTest) return false;
    if (filterRole !== 'all' && q.role !== filterRole) return false;
    return true;
  });

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterTest}
          onChange={(e) => setFilterTest(e.target.value)}
          className="border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-1 text-sm"
        >
          <option value="all">Todos los tests</option>
          <option value="mania">Manía</option>
          <option value="mood">Estado de Ánimo</option>
          <option value="depression">Depresión</option>
        </select>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-1 text-sm"
        >
          <option value="all">Todos los roles</option>
          <option value="caregiver">Cuidador</option>
          <option value="patient">Paciente</option>
          <option value="both">Ambos</option>
        </select>

        <Button variant="primary" size="sm" onClick={onAdd}>
          <Plus size={16} />
          Nueva Pregunta
        </Button>
      </div>

      {/* Tabla */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filtered.map(q => (
          <div key={q._id} className={`flex items-center gap-3 p-3 rounded-lg border ${
            q.active
              ? 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700'
              : 'bg-slate-50 dark:bg-navy-900 border-slate-300 dark:border-navy-600 opacity-60'
          }`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge label={q.test} bg="bg-blue-100" text="text-blue-800" />
                <Badge label={q.role} bg="bg-green-100" text="text-green-800" />
                {!q.active && <Badge label="Inactiva" bg="bg-red-100" text="text-red-800" />}
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                {q.question}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {q.measures} • Orden: {q.order}
              </p>
            </div>

            <div className="flex gap-1">
              <Button variant="secondary" size="sm" onClick={() => onEdit(q)} title={q._source === 'hardcoded' ? 'Editar texto (crea copia personalizada)' : 'Editar'}>
                <Edit size={14} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onToggleActive(q)}
              >
                {q.active ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { if (window.confirm('¿Eliminar esta pregunta?')) onDelete(q); }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No hay preguntas que coincidan con los filtros.
          </div>
        )}
      </div>
    </div>
  );
}