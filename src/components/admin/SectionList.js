import { useState, useEffect } from 'react';
import { getCompositeSections, saveCompositeSection, deleteCompositeSection, reorderCompositeSections } from '../../services/compositeConfig';
import { getModuleConfig } from '../../services/compositeConfig';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ArrowUp, ArrowDown, Plus, Edit, Trash2, Copy, GripVertical } from 'lucide-react';
import { SectionForm } from './SectionForm';

const SECTION_TYPES = [
  { value: 'gateway', label: 'Gateway', desc: 'Preguntas iniciales siempre mostradas' },
  { value: 'module', label: 'Módulo', desc: 'Módulo condicional (manía, depresión, etc.)' },
  { value: 'branch', label: 'Ramificación', desc: 'Pregunta de ramificación condicional' },
  { value: 'confirmation', label: 'Confirmación', desc: 'Confirmación y seguimiento final' },
];



const ROLE_OPTIONS = [
  { value: 'patient', label: 'Paciente' },
  { value: 'caregiver', label: 'Cuidador' },
  { value: 'both', label: 'Ambos' },
];

export function SectionList() {
  const [sections, setSections] = useState([]);
  const [moduleConfig, setModuleConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [sectionsData, configData] = await Promise.all([
        getCompositeSections({ includeDisabled: true }),
        getModuleConfig(),
      ]);
      setSections(sectionsData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setModuleConfig(configData);
    } catch (err) {
      console.error('Error loading sections:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(sectionData) {
    try {
      await saveCompositeSection(sectionData);
      await loadData();
      setEditing(null);
      setCreating(false);
    } catch (err) {
      console.error('Error saving section:', err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta sección? Esta acción no se puede deshacer.')) return;
    try {
      await deleteCompositeSection(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting section:', err);
    }
  }

  async function handleDuplicate(section) {
    try {
      await saveCompositeSection({
        ...section,
        name: `${section.name} (copia)`,
        order: section.order + 5,
      });
      await loadData();
    } catch (err) {
      console.error('Error duplicating section:', err);
    }
  }

  async function handleReorder() {
    const ids = sections.map(s => s._id);
    await reorderCompositeSections(ids);
    await loadData();
  }

  function moveSection(index, direction) {
    const newSections = [...sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    
    // Update order values
    newSections.forEach((s, i) => {
      s.order = i * 10;
    });
    
    setSections(newSections);
  }

  function handleDragStart(e, section) {
    setDraggedItem(section);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, targetSection) {
    e.preventDefault();
    if (!draggedItem || draggedItem._id === targetSection._id) return;
    
    const newSections = [...sections];
    const fromIndex = newSections.findIndex(s => s._id === draggedItem._id);
    const toIndex = newSections.findIndex(s => s._id === targetSection._id);
    
    const [removed] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, removed);
    
    newSections.forEach((s, i) => {
      s.order = i * 10;
    });
    
    setSections(newSections);
  }

  const typeColors = {
    gateway: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    module: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    branch: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    confirmation: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-300">Cargando secciones...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy-700 dark:text-white">Secciones del Test</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ordena arrastrando y soltando. El orden determina la secuencia en el test.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleReorder}>
            Guardar Orden
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Nueva Sección
          </Button>
        </div>
      </div>

      {/* Module Config Summary */}
      <Card>
        <h3 className="text-sm font-semibold mb-2 text-slate-600 dark:text-slate-300">Módulos Activos</h3>
        <div className="flex flex-wrap gap-2">
          {moduleConfig.map(m => (
            <Badge
              key={m._id}
              label={`${m.name} ${m.enabled ? '✓' : '✗'}`}
              bg={m.enabled ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-slate-100 dark:bg-slate-800'}
              text={m.enabled ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500'}
            />
          ))}
        </div>
      </Card>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <Card
            key={section._id}
            className={`${!section.enabled ? 'opacity-50' : ''} ${draggedItem?._id === section._id ? 'ring-2 ring-teal-500' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, section)}
            onDragOver={(e) => handleDragOver(e, section)}
            onDragEnd={() => setDraggedItem(null)}
          >
            <div className="flex items-start gap-3">
              {/* Drag handle */}
              <div className="mt-2 cursor-move text-slate-300 hover:text-teal-500" title="Arrastrar para reordenar">
                <GripVertical size={18} />
              </div>

              {/* Reorder buttons */}
              <div className="flex flex-col gap-1 mt-2">
                <button
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-700 disabled:opacity-30"
                  title="Mover arriba"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sections.length - 1}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-700 disabled:opacity-30"
                  title="Mover abajo"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[section.type] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {SECTION_TYPES.find(t => t.value === section.type)?.label || section.type}
                  </span>
                  
                  {section.category && (
                    <Badge
                      label={section.category}
                      bg="bg-blue-100 dark:bg-blue-900/30"
                      text="text-blue-700 dark:text-blue-300"
                    />
                  )}

                  <Badge
                    label={ROLE_OPTIONS.find(r => r.value === (section.role || 'patient'))?.label || 'Paciente'}
                    bg={section.role === 'caregiver' ? 'bg-indigo-100 dark:bg-indigo-900/30' : 
                         section.role === 'both' ? 'bg-purple-100 dark:bg-purple-900/30' :
                         'bg-green-100 dark:bg-green-900/30'}
                    text={section.role === 'caregiver' ? 'text-indigo-700 dark:text-indigo-300' :
                          section.role === 'both' ? 'text-purple-700 dark:text-purple-300' :
                          'text-green-700 dark:text-green-300'}
                  />

                  {!section.enabled && (
                    <Badge label="Desactivada" bg="bg-slate-100 dark:bg-slate-800" text="text-slate-500" />
                  )}
                </div>

                <h3 className="text-sm font-semibold text-navy-700 dark:text-white mb-1">
                  {section.name || 'Sin nombre'}
                </h3>

                {section.condition && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Condición: {section.condition.type === 'score' 
                      ? `${section.condition.dimension} ${section.condition.operator} ${section.condition.threshold}`
                      : section.condition.type === 'answer'
                      ? `Respuesta ${section.condition.questionId} ${section.condition.operator} ${section.condition.threshold}`
                      : 'Personalizada'
                    }
                  </p>
                )}

                <div className="text-xs text-slate-400">
                  {section.questions?.length || 0} pregunta{section.questions?.length !== 1 ? 's' : ''}
                  {section.order !== undefined && ` • Orden: ${section.order}`}
                  {section.triggersFrom?.length > 0 && ` • Activado por: ${section.triggersFrom.join(', ')}`}
                </div>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleDuplicate(section)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"n                  title="Duplicar"
                >
                  <Copy size={15} />
                </button>
                <button
                  onClick={() => setEditing(section)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                  title="Editar"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => handleDelete(section._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {sections.length === 0 && (
          <Card>
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="mb-2">No hay secciones configuradas.</p>
              <p className="text-sm">Crea tu primera sección para comenzar.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Create/Edit Form */}
      {(creating || editing) && (
        <SectionForm
          section={editing}
          onSave={handleSave}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}