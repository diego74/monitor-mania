import { useState, useEffect } from 'react';
import { getModuleConfig, saveModuleConfig, deleteModuleConfig, getCompositeConfig, saveCompositeConfig } from '../../services/compositeConfig';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Settings } from 'lucide-react';

export function ModuleConfig() {
  const [modules, setModules] = useState([]);
  const [compositeConfig, setCompositeConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [moduleData, configData] = await Promise.all([
        getModuleConfig(),
        getCompositeConfig(),
      ]);
      setModules(moduleData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setCompositeConfig(configData);
    } catch (err) {
      console.error('Error loading module config:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(moduleData) {
    try {
      await saveModuleConfig(moduleData);
      await loadData();
      setEditing(null);
      setCreating(false);
    } catch (err) {
      console.error('Error saving module:', err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este módulo?')) return;
    try {
      await deleteModuleConfig(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting module:', err);
    }
  }

  function moveModule(index, direction) {
    const newModules = [...modules];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newModules.length) return;
    
    const temp = newModules[index];
    newModules[index] = newModules[targetIndex];
    newModules[targetIndex] = temp;
    
    newModules.forEach((m, i) => {
      m.order = i * 10;
    });
    
    setModules(newModules);
  }

  async function saveOrder() {
    try {
      for (const module of modules) {
        await saveModuleConfig(module);
      }
      await loadData();
    } catch (err) {
      console.error('Error saving order:', err);
    }
  }

  async function updateGlobalThreshold(field, value) {
    if (!compositeConfig) return;
    const newConfig = { 
      ...compositeConfig, 
      [field]: parseFloat(value) || 0 
    };
    setCompositeConfig(newConfig);
    try {
      await saveCompositeConfig(newConfig);
    } catch (err) {
      console.error('Error saving config:', err);
    }
  }

  const moduleTypes = [
    { value: 'mania', label: 'Manía', desc: 'Síntomas maníacos' },
    { value: 'hypomania', label: 'Hipomanía', desc: 'Síntomas hipomaníacos' },
    { value: 'depression', label: 'Depresión', desc: 'Síntomas depresivos' },
    { value: 'psychosis', label: 'Psicosis', desc: 'Síntomas psicóticos' },
  ];

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          <span className="ml-3">Cargando...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Global Thresholds */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-slate-400" />
          <h3 className="text-sm font-semibold">Umbrales Globales del Test</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Umbral Manía</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="4"
              value={compositeConfig?.maniaThreshold || 1.5}
              onChange={e => updateGlobalThreshold('maniaThreshold', e.target.value)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Score ≥ valor activa manía</p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Umbral Hipomanía</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="4"
              value={compositeConfig?.hypomaniaThreshold || 2.2}
              onChange={e => updateGlobalThreshold('hypomaniaThreshold', e.target.value)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Score ≥ valor activa hipomanía</p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Umbral Depresión</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="4"
              value={compositeConfig?.depressionThreshold || 1.5}
              onChange={e => updateGlobalThreshold('depressionThreshold', e.target.value)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Score > valor activa depresión</p>
          </div>
        </div>
      </Card>

      {/* Module List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Módulos Activos</h3>
            <Badge label={modules.filter(m => m.enabled !== false).length} bg="bg-teal-100 dark:bg-teal-900/30" text="text-teal-700 dark:text-teal-300" />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} />
            Nuevo Módulo
          </Button>
        </div>

        <div className="space-y-2">
          {modules.map((module, index) => (
            <div key={module._id} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800">
              <button
                onClick={() => moveModule(index, -1)}
                disabled={index === 0}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-700 disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => moveModule(index, 1)}
                disabled={index === modules.length - 1}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-700 disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>

              <div className="flex-1 min-w-0 ml-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{module.name || module._id}</span>
                  <Badge 
                    label={moduleTypes.find(t => t.value === module.category)?.label || module.category}
                    bg={module.enabled !== false ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-slate-100 dark:bg-slate-800'}
                    text={module.enabled !== false ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500'}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Orden: {module.order || 0} | 
                  Condición: {module.condition?.type === 'score' 
                    ? `${module.condition.dimension} ${module.condition.operator} ${module.condition.threshold}`
                    : 'Personalizada'
                  }
                </p>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(module)}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-700"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(module._id)}
                  className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <Trash2 size={14} className="text-rose-500" />
                </button>
              </div>
            </div>
          ))}

          {modules.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No hay módulos configurados
            </p>
          )}
        </div>

        {modules.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" size="sm" onClick={saveOrder}>
              Guardar Orden
            </Button>
          </div>
        )}
      </Card>

      {/* Create/Edit Form */}
      {(creating || editing) && (
        <ModuleForm
          module={editing}
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

function ModuleForm({ module, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    category: 'mania',
    order: 0,
    enabled: true,
    condition: {
      type: 'score',
      dimension: 'maniaScore',
      operator: '>=',
      threshold: 2.2,
      maxThreshold: null,
    },
  });

  useEffect(() => {
    if (module) {
      setForm({
        name: module.name || '',
        category: module.category || 'mania',
        order: module.order || 0,
        enabled: module.enabled !== false,
        condition: module.condition || {
          type: 'score',
          dimension: 'maniaScore',
          operator: '>=',
          threshold: 2.2,
          maxThreshold: null,
        },
      });
    } else {
      setForm(prev => ({ ...prev, order: Date.now() }));
    }
  }, [module]);

  const moduleTypes = [
    { value: 'mania', label: 'Manía' },
    { value: 'hypomania', label: 'Hipomanía' },
    { value: 'depression', label: 'Depresión' },
    { value: 'psychosis', label: 'Psicosis' },
  ];

  const dimensions = [
    { value: 'maniaScore', label: 'Manía' },
    { value: 'depressionScore', label: 'Depresión' },
    { value: 'moodScore', label: 'Ánimo' },
    { value: 'stressScore', label: 'Estrés' },
    { value: 'sleepHours', label: 'Horas de sueño' },
  ];

  const operators = ['>=', '>', '<=', '<', '=='];

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Ingrese un nombre para el módulo');
      return;
    }
    onSave({ ...form, _id: module?._id });
  }

  return (
    <Card className="mb-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {module ? 'Editar Módulo' : 'Nuevo Módulo'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Módulo manía"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            >
              {moduleTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Orden</label>
            <input
              type="number"
              value={form.order}
              onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={e => setForm({ ...form, enabled: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <label htmlFor="enabled" className="text-sm font-medium">Habilitado</label>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-navy-700 pt-4">
          <h4 className="text-sm font-semibold mb-2">Condición de Activación</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tipo</label>
              <select
                value={form.condition.type}
                onChange={e => setForm({ ...form, condition: { ...form.condition, type: e.target.value } })}
                className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="score">Por Score</option>
                <option value="answer">Por Respuesta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {form.condition.type === 'score' ? 'Dimensión' : 'Pregunta'}
              </label>
              {form.condition.type === 'score' ? (
                <select
                  value={form.condition.dimension}
                  onChange={e => setForm({ ...form, condition: { ...form.condition, dimension: e.target.value } })}
                  className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                >
                  {dimensions.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.condition.questionId || ''}
                  onChange={e => setForm({ ...form, condition: { ...form.condition, questionId: e.target.value } })}
                  className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                  placeholder="ID de pregunta"
                />
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Operador</label>
              <select
                value={form.condition.operator}
                onChange={e => setForm({ ...form, condition: { ...form.condition, operator: e.target.value } })}
                className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
              >
                {operators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Valor</label>
              <input
                type="number"
                step="0.1"
                value={form.condition.threshold}
                onChange={e => setForm({ ...form, condition: { ...form.condition, threshold: parseFloat(e.target.value) || 0 } })}
                className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>

            {form.condition.type === 'score' && form.category === 'hypomania' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Umbral máximo (exclusivo)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.condition.maxThreshold || ''}
                  onChange={e => setForm({ ...form, condition: { ...form.condition, maxThreshold: parseFloat(e.target.value) || null } })}
                  className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                  placeholder="Ej: 2.2"
                />
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Se activa cuando: <span className="font-medium">
              {form.condition.type === 'score'
                ? `${form.condition.dimension} ${form.condition.operator} ${form.condition.threshold}`
                : `respuesta [${form.condition.questionId}] ${form.condition.operator} ${form.condition.threshold}`
              }
            </span>
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary">
            {module ? 'Guardar' : 'Crear'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}