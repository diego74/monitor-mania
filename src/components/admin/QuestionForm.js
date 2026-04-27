import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';

const SECTION_OPTIONS = [
  'Gateway (siempre)',
  'Módulo manía',
  'Módulo depresión',
  'Confirmación',
  'Ramificación',
  'Personalizada',
];

const MEASURES_PRESETS = [
  'sleep', 'depression', 'energy', 'irritability',
  'flight_of_ideas', 'pressured_speech', 'mixed_features',
  'anxiety', 'impulsivity', 'mood', 'general', 'crisis',
];

export function QuestionForm({ question, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    role: 'both',
    section: 'Personalizada',
    question: '',
    options: ['', '', '', '', ''],
    measures: '',
    reversed: false,
    order: 1,
    active: true,
    multiplier: 1,
    answerMultipliers: [1, 1, 1, 1, 1],
  });
  const [customMeasure, setCustomMeasure] = useState('');
  const [useCustomMeasure, setUseCustomMeasure] = useState(false);
  const [showMultipliers, setShowMultipliers] = useState(false);

  useEffect(() => {
    if (question) {
      const opts = (question.options ?? []).filter(o => typeof o === 'string');
      const measures = question.measures ?? '';
      const isPreset = MEASURES_PRESETS.includes(measures);
      setUseCustomMeasure(!isPreset && measures !== '');
      setCustomMeasure(!isPreset ? measures : '');
      setFormData({
        ...question,
        section: question.section ?? 'Personalizada',
        options: opts.length >= 2 ? opts : [...opts, '', ''].slice(0, Math.max(opts.length, 2)),
        measures: isPreset ? measures : '',
        multiplier: question.multiplier ?? 1,
        answerMultipliers: question.answerMultipliers ?? [1, 1, 1, 1, 1],
      });
    }
  }, [question]);

  function handleSubmit(e) {
    e.preventDefault();
    const cleanOptions = formData.options.filter(o => o.trim() !== '');
    if (cleanOptions.length < 2) {
      alert('Necesitás al menos 2 opciones.');
      return;
    }
    const finalMeasures = useCustomMeasure ? customMeasure.trim() : formData.measures;
    if (!finalMeasures) {
      alert('Seleccioná o escribí una medida.');
      return;
    }
    // Trim answerMultipliers to match actual option count
    const trimmedAnsMultipliers = formData.answerMultipliers.slice(0, cleanOptions.length);
    onSave({ ...formData, options: cleanOptions, measures: finalMeasures, answerMultipliers: trimmedAnsMultipliers });
  }

  function updateOption(index, value) {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  }

  function addOption() {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ''],
      answerMultipliers: [...prev.answerMultipliers, 1],
    }));
  }

  function removeOption(index) {
    if (formData.options.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      answerMultipliers: prev.answerMultipliers.filter((_, i) => i !== index),
    }));
  }

  function handleMeasureSelect(val) {
    if (val === '__custom__') {
      setUseCustomMeasure(true);
      setFormData(prev => ({ ...prev, measures: '' }));
    } else {
      setUseCustomMeasure(false);
      setFormData(prev => ({ ...prev, measures: val }));
    }
  }

  function updateAnswerMultiplier(index, value) {
    const next = [...formData.answerMultipliers];
    next[index] = parseFloat(value) || 1;
    setFormData(prev => ({ ...prev, answerMultipliers: next }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sección</label>
          <select
            value={formData.section}
            onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
            className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2"
          >
            {SECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2"
            required
          >
            <option value="caregiver">Cuidador</option>
            <option value="patient">Paciente</option>
            <option value="both">Ambos</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Pregunta</label>
        <textarea
          value={formData.question}
          onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
          className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 h-20 resize-none"
          placeholder="Escribe la pregunta..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Opciones (mín. 2)</label>
        <div className="space-y-2">
          {formData.options.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1 border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2"
                placeholder={`Opción ${index + 1}${index < 2 ? ' *' : ''}`}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={formData.options.length <= 2}
                className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Eliminar opción"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium"
        >
          <Plus size={13} /> Agregar opción
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Medida</label>
          {!useCustomMeasure ? (
            <select
              value={formData.measures}
              onChange={e => handleMeasureSelect(e.target.value)}
              className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2"
            >
              <option value="">— seleccionar —</option>
              {MEASURES_PRESETS.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">Otra...</option>
            </select>
          ) : (
            <div className="flex gap-1">
              <input
                type="text"
                value={customMeasure}
                onChange={e => setCustomMeasure(e.target.value)}
                className="flex-1 border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2"
                placeholder="ej: distractibility"
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setUseCustomMeasure(false); setCustomMeasure(''); }}
                className="text-xs text-slate-400 hover:text-slate-600 px-2"
                title="Volver a lista"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Orden</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
            className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2"
            min="1"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.reversed}
            onChange={(e) => setFormData(prev => ({ ...prev, reversed: e.target.checked }))}
          />
          <span className="text-sm">Escala invertida</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
          />
          <span className="text-sm">Activa</span>
        </label>
      </div>

      {/* ── Multiplicadores de puntuación ─────────────────────────────────── */}
      <div className="border-t border-slate-200 dark:border-navy-700 pt-3">
        <button
          type="button"
          onClick={() => setShowMultipliers(p => !p)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          {showMultipliers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          Multiplicadores de puntuación
        </button>

        {showMultipliers && (
          <div className="mt-3 space-y-4">
            {/* Peso de la pregunta */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Peso de la pregunta <span className="text-slate-400 font-normal">(predeterminado: 1.0)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={formData.multiplier ?? 1}
                onChange={e => setFormData(p => ({ ...p, multiplier: parseFloat(e.target.value) || 1 }))}
                className="w-32 border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                Mayor valor amplifica esta pregunta en el promedio ponderado de su dimensión.
              </p>
            </div>

            {/* Amplificador por respuesta */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Amplificador por respuesta <span className="text-slate-400 font-normal">(1.0 = sin cambio)</span>
              </label>
              <div className="space-y-1.5">
                {formData.options.map((opt, i) => {
                  const amp = (formData.answerMultipliers ?? [])[i] ?? 1;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-48 truncate">
                        Opción {i + 1}: {opt || '—'}
                      </span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="5"
                        value={amp}
                        onChange={e => updateAnswerMultiplier(i, e.target.value)}
                        className="w-24 border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-xs"
                      />
                      {amp !== 1 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          ×{amp.toFixed(2)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Se multiplica con el score base cuando se elige esa opción.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" variant="primary">
          Guardar
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
