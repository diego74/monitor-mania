import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { QuestionForm } from './QuestionForm';

const SECTION_TYPES = [
  { value: 'gateway', label: 'Gateway', desc: 'Preguntas iniciales siempre mostradas al inicio del test' },
  { value: 'module', label: 'Módulo', desc: 'Bloque de preguntas que se muestra condicionalmente según resultados' },
  { value: 'branch', label: 'Ramificación', desc: 'Pregunta condicional que se inserta según criterios' },
  { value: 'confirmation', label: 'Confirmación', desc: 'Preguntas finales de confirmación' },
];

const SECTION_CATEGORIES = [
  { value: 'mania', label: 'Manía' },
  { value: 'hypomania', label: 'Hipomanía' },
  { value: 'depression', label: 'Depresión' },
  { value: 'psychosis', label: 'Psicosis' },
  { value: 'mixed_features', label: 'Características Mixtas' },
  { value: 'anxiety', label: 'Ansiedad' },
  { value: 'stress', label: 'Estrés' },
  { value: 'sleep', label: 'Sueño' },
  { value: 'general', label: 'General' },
  { value: 'confirmation', label: 'Confirmación' },
  { value: 'branch', label: 'Ramificación' },
];

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Paciente' },
  { value: 'caregiver', label: 'Cuidador' },
  { value: 'both', label: 'Ambos (preguntas separadas)' },
];



export function SectionForm({ section, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    type: 'module',
    category: '',
    role: 'patient',
    order: 0,
    enabled: true,
    condition: {
      type: 'score',
      dimension: 'maniaScore',
      operator: '>=',
      threshold: 1.5,
      maxThreshold: null,
    },
    questions: [],
    triggersFrom: [],
    triggersModule: '',
  });

  const [editingQuestionIdx, setEditingQuestionIdx] = useState(null);

  useEffect(() => {
    if (section) {
      setForm({
        name: section.name || '',
        type: section.type || 'module',
        category: section.category || '',
        role: section.role || 'patient',
        order: section.order || 0,
        enabled: section.enabled !== false,
        condition: section.condition || {
          type: 'score',
          dimension: 'maniaScore',
          operator: '>=',
          threshold: 1.5,
          maxThreshold: null,
        },
        questions: section.questions ? [...section.questions] : [],
        triggersFrom: section.triggersFrom || [],
        triggersModule: section.triggersModule || '',
      });
    } else {
      setForm(prev => ({ ...prev, order: Date.now() }));
    }
  }, [section]);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleConditionChange(field, value) {
    setForm(prev => ({
      ...prev,
      condition: { ...prev.condition, [field]: value }
    }));
  }

  function addQuestion() {
    const newQ = {
      id: `q_${Date.now()}`,
      question: '',
      options: ['', '', '', '', ''],
      measures: '',
      reversed: false,
      multiplier: 1,
      answerMultipliers: [1, 1, 1, 1, 1],
    };
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
    setEditingQuestionIdx(form.questions.length);
  }

  function updateQuestion(index, data) {
    setForm(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], ...data };
      return { ...prev, questions: newQuestions };
    });
  }

  function removeQuestion(index) {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
    if (editingQuestionIdx === index) setEditingQuestionIdx(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Por favor ingrese un nombre para la sección');
      return;
    }

    if (form.questions.length === 0) {
      alert('Por favor agregue al menos una pregunta a la sección');
      return;
    }

    // Validate questions
    for (const q of form.questions) {
      if (!q.question.trim()) {
        alert('Por favor complete el texto de todas las preguntas');
        return;
      }
      const validOpts = q.options.filter(o => o.trim());
      if (validOpts.length < 2) {
        alert(`La pregunta "${q.question}" necesita al menos 2 opciones válidas`);
        return;
      }
    }

    const dataToSave = {
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      role: form.role,
      order: form.order,
      enabled: form.enabled,
      condition: form.condition,
      questions: form.questions,
      triggersFrom: form.triggersFrom,
      triggersModule: form.triggersModule,
    };

    if (section && section._id) {
      dataToSave._id = section._id;
    }

    onSave(dataToSave);
  }

  const isModule = form.type === 'module';
  const isBranch = form.type === 'branch';
  const isConfirmation = form.type === 'confirmation';

  return (
    <Card className="mb-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {section ? 'Editar Sección' : 'Nueva Sección'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la Sección</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Módulo manía, Gateway inicial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={e => handleChange('type', e.target.value)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            >
              {SECTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label} - {t.desc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Seleccionar categoría</option>
              {SECTION_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rol</label>
            <select
              value={form.role}
              onChange={e => handleChange('role', e.target.value)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Orden (número, menor = primero)</label>
            <input
              type="number"
              value={form.order}
              onChange={e => handleChange('order', parseInt(e.target.value) || 0)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={e => handleChange('enabled', e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <label htmlFor="enabled" className="text-sm font-medium">Habilitada</label>
          </div>
        </div>

        {/* Condition Builder */}
        {(isModule || isBranch || isConfirmation) && (
          <div className="border-t border-slate-200 dark:border-navy-700 pt-4">
            <h4 className="text-sm font-semibold mb-2">Condición de Activación</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                <select
                  value={form.condition.type}
                  onChange={e => handleConditionChange('type', e.target.value)}
                  className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="score">Por Score</option>
                  <option value="answer">Por Respuesta</option>
                </select>
              </div>
              
              {form.condition.type === 'score' ? (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Dimensión</label>
                    <select
                      value={form.condition.dimension}
                      onChange={e => handleConditionChange('dimension', e.target.value)}
                      className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="maniaScore">Manía</option>
                      <option value="depressionScore">Depresión</option>
                      <option value="moodScore">Ánimo</option>
                      <option value="stressScore">Estrés</option>
                      <option value="sleepHours">Horas de Sueño</option>
                      <option value="irritabilityScore">Irritabilidad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Operador</label>
                    <select
                      value={form.condition.operator}
                      onChange={e => handleConditionChange('operator', e.target.value)}
                      className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value=">=">≥</option>
                      <option value=">">&gt;</option>
                      <option value="<=">≤</option>
                      <option value="<">&lt;</option>
                      <option value="==">=</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Valor</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.condition.threshold}
                      onChange={e => handleConditionChange('threshold', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </div>
                  {form.type === 'module' && form.category === 'hypomania' && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Umbral máximo (exclusivo)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={form.condition.maxThreshold || ''}
                        onChange={e => handleConditionChange('maxThreshold', parseFloat(e.target.value) || null)}
                        className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                        placeholder="Ej: 2.2 para hipomanía"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ID de Pregunta</label>
                    <input
                      type="text"
                      value={form.condition.questionId || ''}
                      onChange={e => handleConditionChange('questionId', e.target.value)}
                      className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                      placeholder="Ej: pt10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Operador</label>
                    <select
                      value={form.condition.operator}
                      onChange={e => handleConditionChange('operator', e.target.value)}
                      className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value=">=">≥</option>
                      <option value=">">&gt;</option>
                      <option value="<=">≤</option>
                      <option value="<">&lt;</option>
                      <option value="==">=</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Valor</label>
                    <input
                      type="number"
                      step="1"
                      value={form.condition.threshold || 0}
                      onChange={e => handleConditionChange('threshold', parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Se activa cuando: <span className="font-medium">
                {form.condition.type === 'score' 
                  ? `${form.condition.dimension} ${form.condition.operator} ${form.condition.threshold}`
                  : `respuesta [${form.condition.questionId}] ${form.condition.operator} ${form.condition.threshold}`
                }
              </span>
            </p>
          </div>
        )}

        {(isBranch || isModule) && (
          <div>
            <label className="block text-sm font-medium mb-1">Disparador de Módulo</label>
            <input
              type="text"
              value={form.triggersModule}
              onChange={e => handleChange('triggersModule', e.target.value)}
              className="w-full border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: psychosis (dispara preguntas adicionales)"
            />
            <p className="text-xs text-slate-400 mt-1">ID del módulo a activar cuando esta sección se dispare.</p>
          </div>
        )}

        {/* Questions */}
        <div className="border-t border-slate-200 dark:border-navy-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Preguntas ({form.questions.length})</h4>
            <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Pregunta
            </Button>
          </div>

          {form.questions.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No hay preguntas. Agrega al menos una.
            </p>
          )}

          {form.questions.map((q, idx) => (
            <div key={idx} className="mb-3 p-3 bg-slate-50 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium">Pregunta {idx + 1}</h5>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingQuestionIdx(editingQuestionIdx === idx ? null : idx)}
                    className="text-xs px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-navy-700"
                  >
                    {editingQuestionIdx === idx ? 'Ocultar' : 'Editar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="text-xs px-2 py-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {editingQuestionIdx === idx ? (
                <QuestionForm
                  question={q}
                  onSave={(data) => updateQuestion(idx, data)}
                  onCancel={() => setEditingQuestionIdx(null)}
                  compact
                />
              ) : (
                <div className="text-sm">
                  <p className="font-medium">{q.question || 'Sin texto'}</p>
                  <p className="text-slate-500">
                    {q.options.filter(o => o.trim()).length} opciones · Mide: {q.measures || 'sin definir'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" variant="primary">
            {section ? 'Guardar Cambios' : 'Crear Sección'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}