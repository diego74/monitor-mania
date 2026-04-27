import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { QuestionForm } from '../components/admin/QuestionForm';
import { SectionList } from '../components/admin/SectionList';
import { ModuleConfig } from '../components/admin/ModuleConfig';
import { getAllQuestionsIncludingInactive, saveQuestion, deleteQuestion } from '../services/questionStorage';
import {
  stage0Questions, stage0QuestionsCaregiver,
  maniaModuleQuestions, maniaModuleQuestionsCaregiver,
  hypomaniaModuleQuestions, hypomaniaModuleQuestionsCaregiver,
  depressionModuleQuestions, depressionModuleQuestionsCaregiver,
  confirmationQuestion, confirmationQuestionCaregiver,
  confirmationFollowUpQuestion, confirmationFollowUpQuestionCaregiver,
  branchingQuestions, branchingQuestionsCaregiver,
} from '../data/compositeTestConfig';
import {
  getCompositeConfig, saveCompositeConfig,
  getBranchingRules, saveBranchingRule, deleteBranchingRule,
} from '../services/compositeConfig';
import { migrateToComposite } from '../services/storage';
import { ArrowLeft, Edit, Trash2, Plus, Settings, GitBranch, ListChecks, ChevronRight, AlertTriangle, Zap } from 'lucide-react';

// ─── Build the full adaptive-test question list ─────────────────────────────
function buildAdaptiveQuestions() {
  const sections = [
    { section: 'Gateway (siempre)',  role: 'patient',   questions: stage0Questions },
    { section: 'Gateway (siempre)',  role: 'caregiver', questions: stage0QuestionsCaregiver },
    { section: 'Módulo manía',       role: 'patient',   questions: maniaModuleQuestions },
    { section: 'Módulo manía',       role: 'caregiver', questions: maniaModuleQuestionsCaregiver },
    { section: 'Módulo hipomanía',   role: 'patient',   questions: hypomaniaModuleQuestions },
    { section: 'Módulo hipomanía',   role: 'caregiver', questions: hypomaniaModuleQuestionsCaregiver },
    { section: 'Módulo depresión',   role: 'patient',   questions: depressionModuleQuestions },
    { section: 'Módulo depresión',   role: 'caregiver', questions: depressionModuleQuestionsCaregiver },
    { section: 'Confirmación',       role: 'patient',   questions: [confirmationQuestion, confirmationFollowUpQuestion] },
    { section: 'Confirmación',       role: 'caregiver', questions: [confirmationQuestionCaregiver, confirmationFollowUpQuestionCaregiver] },
    { section: 'Ramificación',       role: 'patient',   questions: branchingQuestions },
    { section: 'Ramificación',       role: 'caregiver', questions: branchingQuestionsCaregiver },
  ];

  const seen = new Set();
  const result = [];
  for (const { section, role, questions } of sections) {
    for (const q of questions) {
      const key = `${q.id}_${role}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ ...q, _id: `adaptive_${q.id}_${role}`, _source: 'adaptive', _originalId: q.id, section, role });
    }
  }
  return result;
}

const ADAPTIVE_QUESTIONS = buildAdaptiveQuestions();

// ─── Questions selectable for answer-based conditions ────────────────────────
const ANSWER_QUESTIONS = [
  ...stage0Questions,
  ...maniaModuleQuestions,
  ...depressionModuleQuestions,
].map(q => ({ id: q.id, label: `${q.id} — ${q.question.slice(0, 40)}` }));

// ─── Branching rule admin constants ─────────────────────────────────────────
const DIMENSIONS = [
  { value: 'maniaScore',        label: 'Score manía' },
  { value: 'depressionScore',   label: 'Score depresión' },
  { value: 'sleepHours',        label: 'Horas de sueño' },
  { value: 'irritabilityScore', label: 'Irritabilidad' },
  { value: 'moodScore',         label: 'Score ánimo' },
];
const OPERATORS = ['>=', '>', '<=', '<', '=='];
const RULE_TYPES = ['validation', 'risk', 'crisis', 'mixed'];

const EMPTY_RULE = {
  question: '',
  options: ['', '', '', '', ''],
  measures: '',
  type: 'validation',
  conditionType: 'score',
  condition: { dimension: 'maniaScore', operator: '>=', threshold: 2 },
  active: true,
};

const defaultConfig = {
  enabled: true,
  branchingEnabled: true,
  maniaThreshold: 1.5,
  hypomaniaThreshold: 2.2,
  depressionThreshold: 1.5,
  activeBranchingRules: ['mixed_state', 'val_energy', 'impulsivity', 'suicidal_risk', 'birthday_month', 'cycle_premenstrual'],
};

const STAGE_COLORS = {
  'Gateway (siempre)': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
  'Módulo manía':      'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  'Módulo hipomanía':  'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300',
  'Módulo depresión':  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  'Confirmación':      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
  'Ramificación':      'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
};

const TABS = [
  { id: 'questions',    label: 'Preguntas', icon: ListChecks },
  { id: 'sections',     label: 'Secciones', icon: ListChecks },
  { id: 'moduleConfig', label: 'Config. Módulos', icon: Settings },
  { id: 'rules',        label: 'Ramificación', icon: GitBranch },
  { id: 'config',       label: 'Configuración', icon: Settings },
];

// ─── Dynamic test flow summary ───────────────────────────────────────────────
function TestFlowSummary({ config, customRules }) {
  const maniaT  = config.maniaThreshold ?? 1.5;
  const hypoT   = config.hypomaniaThreshold ?? 2.2;
  const depT    = config.depressionThreshold ?? 1.5;
  const activeCount = config.activeBranchingRules?.length ?? 0;
  const customCount = customRules.filter(r => r.active !== false).length;
  const totalBranching = activeCount + customCount;
  const minQ = 4 + 1; // gateway + confirmation
  const maxQ = 4 + 3 + 3 + 2 + totalBranching; // gateway + mania + depression + confirmation follow-up + branching

  const stepCls = 'rounded-xl border p-3 text-sm';
  const arrowCls = 'flex items-center justify-center text-slate-400 my-1';

  return (
    <div className="space-y-1">
      {!config.enabled && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          <AlertTriangle size={15} className="flex-shrink-0" />
          Test deshabilitado — el sistema usa el test de manía simple.
        </div>
      )}

      {/* Step 1: Gateway */}
      <div className={`${stepCls} bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800`}>
        <div className="font-semibold text-teal-800 dark:text-teal-300 mb-1">Paso 1 — Gateway (siempre)</div>
        <div className="text-slate-600 dark:text-slate-400 text-xs">
          4 preguntas fijas: sueño (pt9) · ánimo (mc1) · energía (pt7) · irritabilidad (pt10)
        </div>
      </div>

      {/* Evaluation arrow */}
      <div className={arrowCls}>
        <div className="flex-1 border-t border-dashed border-slate-300 dark:border-navy-600" />
        <div className="mx-2 px-3 py-1.5 bg-slate-100 dark:bg-navy-800 rounded-full text-xs text-slate-600 dark:text-slate-300 space-y-0.5 text-center">
          <div>maniaScore ≥ <strong>{hypoT}</strong> → módulo manía</div>
          <div><strong>{maniaT}</strong> ≤ maniaScore &lt; <strong>{hypoT}</strong> → hipomanía</div>
          <div>depressionScore &gt; <strong>{depT}</strong> → módulo depresión</div>
        </div>
        <div className="flex-1 border-t border-dashed border-slate-300 dark:border-navy-600" />
      </div>

      {/* Step 2: Modules (3 columns) */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`${stepCls} bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800`}>
          <div className="font-semibold text-amber-800 dark:text-amber-300 text-xs mb-1">Manía (+3)</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">pt1 · pt4 · mc16</div>
        </div>
        <div className={`${stepCls} bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800`}>
          <div className="font-semibold text-sky-800 dark:text-sky-300 text-xs mb-1">Hipomanía (+3)</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">hypo1 · hypo2 · hypo3</div>
        </div>
        <div className={`${stepCls} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800`}>
          <div className="font-semibold text-blue-800 dark:text-blue-300 text-xs mb-1">Depresión (+3)</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">mc4 · mc17 · mc10</div>
        </div>
      </div>
      <div className={`${stepCls} bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-center`}>
        <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          Si ningún módulo activa → Confirmación (+1 pregunta, +1 seguimiento si hay malestar)
        </span>
      </div>

      {/* Arrow */}
      <div className={arrowCls}>
        <ChevronRight size={16} className="rotate-90" />
      </div>

      {/* Step 3: Branching */}
      <div className={`${stepCls} ${config.branchingEnabled ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700 opacity-60'}`}>
        <div className="font-semibold text-rose-800 dark:text-rose-300 text-sm mb-1">
          Paso 3 — Ramificación
          {!config.branchingEnabled && <span className="ml-2 text-xs font-normal text-slate-500">(deshabilitada)</span>}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {activeCount} regla{activeCount !== 1 ? 's' : ''} predeterminada{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''}
          {customCount > 0 && ` + ${customCount} personalizada${customCount !== 1 ? 's' : ''}`}
          {totalBranching === 0 && ' — ninguna activa'}
        </div>
      </div>

      {/* Arrow */}
      <div className={arrowCls}>
        <ChevronRight size={16} className="rotate-90" />
      </div>

      {/* Step 4: Submit */}
      <div className={`${stepCls} bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-center`}>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Envío y guardado en Firestore</div>
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-700 flex justify-between text-sm font-semibold">
        <span className="text-slate-500">Rango de preguntas:</span>
        <span>{minQ} – {maxQ}</span>
      </div>
    </div>
  );
}

// ─── Inline edit form for hardcoded branching rule (text + options + condition) ─
function BranchingRuleEditor({ rule, currentOverride, onSave, onCancel }) {
  const [text, setText] = useState(rule.question ?? '');
  const [opts, setOpts] = useState(
    rule.options?.length >= 2 ? [...rule.options] : ['', '', '', '', '']
  );
  const [editCondition, setEditCondition] = useState(!!currentOverride?.conditionOverride);
  const [condType, setCondType]   = useState(currentOverride?.conditionOverride?.conditionType ?? 'score');
  const [condValue, setCondValue] = useState(
    currentOverride?.conditionOverride?.condition ?? { dimension: 'maniaScore', operator: '>=', threshold: 2 }
  );
  const [saving, setSaving] = useState(false);

  function updateOpt(i, v) { const next = [...opts]; next[i] = v; setOpts(next); }
  function updCond(field, val) {
    setCondValue(prev => ({ ...prev, [field]: field === 'threshold' ? parseFloat(val) || 0 : val }));
  }

  async function handleSave() {
    const cleanOpts = opts.filter(o => o.trim());
    if (!text.trim() || cleanOpts.length < 2) return;
    setSaving(true);
    const conditionOverride = editCondition
      ? { conditionType: condType, condition: { ...condValue, conditionType: condType } }
      : null;
    await onSave(rule.id, text.trim(), cleanOpts, conditionOverride);
    setSaving(false);
  }

  return (
    <div className="mt-2 p-3 bg-slate-50 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700 space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Pregunta</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 h-14 resize-none text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Opciones</label>
        <div className="space-y-1.5">
          {opts.map((o, i) => (
            <input key={i} value={o} onChange={e => updateOpt(i, e.target.value)}
              className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-1.5 text-sm"
              placeholder={`Opción ${i + 1}${i < 2 ? ' *' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Condition override toggle */}
      <div className="border-t border-slate-200 dark:border-navy-700 pt-3">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={editCondition} onChange={e => setEditCondition(e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded"
          />
          <span className="text-xs font-medium">Personalizar condición de activación</span>
        </label>
        {editCondition && (
          <div className="space-y-2 bg-white dark:bg-navy-800 rounded-lg p-2 border border-slate-200 dark:border-navy-700">
            <div className="flex gap-2 mb-2">
              {['score', 'answer'].map(t => (
                <button key={t} type="button" onClick={() => setCondType(t)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${condType === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-navy-600'}`}
                >{t === 'score' ? 'Por score' : 'Por respuesta'}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">{condType === 'answer' ? 'Pregunta' : 'Dimensión'}</label>
                {condType === 'answer' ? (
                  <select value={condValue.questionId ?? 'pt10'} onChange={e => updCond('questionId', e.target.value)}
                    className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded px-2 py-1.5 text-xs">
                    {ANSWER_QUESTIONS.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                  </select>
                ) : (
                  <select value={condValue.dimension ?? 'maniaScore'} onChange={e => updCond('dimension', e.target.value)}
                    className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded px-2 py-1.5 text-xs">
                    {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">Operador</label>
                <select value={condValue.operator ?? '>='} onChange={e => updCond('operator', e.target.value)}
                  className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded px-2 py-1.5 text-xs">
                  {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">Valor</label>
                <input type="number" step="0.1" value={condValue.threshold ?? 2} onChange={e => updCond('threshold', e.target.value)}
                  className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded px-2 py-1.5 text-xs"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Se activa cuando: <span className="font-medium text-slate-600 dark:text-slate-300">
                {condType === 'answer'
                  ? `respuesta de ${condValue.questionId} ${condValue.operator} ${condValue.threshold}`
                  : `${DIMENSIONS.find(d => d.value === (condValue.dimension ?? 'maniaScore'))?.label} ${condValue.operator} ${condValue.threshold}`}
              </span>
            </p>
          </div>
        )}
        {!editCondition && (
          <p className="text-xs text-slate-400">Se usa la condición original del código.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

// ─── Main admin page ─────────────────────────────────────────────────────────
export default function QuestionAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('questions');

  // ── Questions tab state ──────────────────────────────────────────────────
  const [firestoreQuestions, setFirestoreQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [filterSection, setFilterSection] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // ── Rules tab state ──────────────────────────────────────────────────────
  const [config, setConfig] = useState(defaultConfig);
  const [customRules, setCustomRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);
  const [editingBranchRule, setEditingBranchRule] = useState(null); // id of default branching rule being edited
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true);
    try {
      const [qs, cfg, rules] = await Promise.all([
        getAllQuestionsIncludingInactive().catch(() => []),
        getCompositeConfig().catch(() => defaultConfig),
        getBranchingRules().catch(() => []),
      ]);
      setFirestoreQuestions(qs.map(q => ({ ...q, _source: 'custom' })));
      setConfig({ ...defaultConfig, ...cfg });
      setCustomRules(rules);
    } catch {
      showMsg('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showMsg(text, type) {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  }

  // ── Override map ─────────────────────────────────────────────────────────
  const overrideMap = {};
  firestoreQuestions.forEach(q => { if (q._originalId) overrideMap[q._originalId] = q; });

  const mergedQuestions = ADAPTIVE_QUESTIONS.map(q => {
    const ov = overrideMap[`${q._originalId}_${q.role}`] ?? overrideMap[q._originalId];
    if (ov) return { ...q, question: ov.question, options: ov.options, _overridden: true, _ovId: ov._id };
    return q;
  });

  const adaptiveOrigIds = new Set(ADAPTIVE_QUESTIONS.map(q => q._originalId));
  const extraCustom = firestoreQuestions.filter(q => !q._originalId || !adaptiveOrigIds.has(q._originalId));

  const allDisplayed = [...mergedQuestions, ...extraCustom];
  const sections = [...new Set(allDisplayed.map(q => q.section).filter(Boolean))];

  const filtered = allDisplayed.filter(q => {
    if (filterSection !== 'all' && q.section !== filterSection) return false;
    if (filterRole !== 'all' && q.role !== filterRole) return false;
    return true;
  });

  // ── Save question ────────────────────────────────────────────────────────
  async function handleSave(questionData) {
    try {
      let dataToSave = { ...questionData };
      if (questionData._source === 'adaptive') {
        const origKey = questionData._originalId;
        const roleKey = questionData.role;
        const existing = firestoreQuestions.find(q => q._originalId === origKey && q.role === roleKey)
          ?? firestoreQuestions.find(q => q._originalId === origKey);
        dataToSave = {
          ...(existing ? { _id: existing._id } : {}),
          test: questionData.test ?? 'composite',
          role: questionData.role,
          question: questionData.question,
          options: questionData.options,
          measures: questionData.measures,
          order: questionData.order,
          active: questionData.active !== false,
          _originalId: origKey,
          _overrides: true,
        };
      }
      await saveQuestion(dataToSave);
      showMsg('Pregunta guardada', 'success');
      setEditing(null);
      await loadAll();
    } catch {
      showMsg('Error al guardar pregunta', 'error');
    }
  }

  async function handleDelete(question) {
    if (question._source === 'adaptive') {
      showMsg('Las preguntas predeterminadas no se pueden eliminar.', 'info');
      return;
    }
    try {
      await deleteQuestion(question._id);
      showMsg('Pregunta eliminada', 'info');
      await loadAll();
    } catch {
      showMsg('Error al eliminar', 'error');
    }
  }

  // ── Data migration ────────────────────────────────────────────────────────
  async function handleMigrate() {
    if (!window.confirm('¿Migrar datos de caregiver_tests, patient_tests y mood_tests a composite_tests?\nSi ya migraste antes, los registros ya migrados se omitirán automáticamente.')) return;
    setMigrating(true);
    setMigrationResult(null);
    try {
      const result = await migrateToComposite();
      setMigrationResult(result);
      showMsg(`Migración completada: ${result.migrated} registros migrados`, 'success');
    } catch (err) {
      showMsg('Error durante la migración', 'error');
      setMigrationResult({ error: err.message });
    } finally {
      setMigrating(false);
    }
  }

  // ── Multiplier config helpers ────────────────────────────────────────────
  function updateMultiplierConfig(field, value) {
    setConfig(prev => ({
      ...prev,
      multiplierConfig: {
        ...(prev.multiplierConfig ?? {
          enabled: false,
          stressManiaBoost: 0,
          stressManiaThreshold: 2.0,
          confirmationMultipliersByAnswer: [0, 0.1, 0.25, 0.4, 0.6],
        }),
        [field]: value,
      },
    }));
  }

  // ── Save config ──────────────────────────────────────────────────────────
  async function saveConfig() {
    setSaving(true);
    try {
      await saveCompositeConfig(config);
      showMsg('Configuración guardada', 'success');
    } catch {
      showMsg('Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Branching rules ──────────────────────────────────────────────────────
  function toggleHardcodedRule(ruleId) {
    setConfig(prev => ({
      ...prev,
      activeBranchingRules: prev.activeBranchingRules.includes(ruleId)
        ? prev.activeBranchingRules.filter(id => id !== ruleId)
        : [...prev.activeBranchingRules, ruleId],
    }));
  }

  function startNewRule() {
    setEditingRule({});
    setRuleForm({ ...EMPTY_RULE, options: ['', '', '', '', ''] });
  }

  function startEditRule(rule) {
    setEditingRule(rule);
    setRuleForm({
      ...rule,
      conditionType: rule.conditionType ?? 'score',
      options: rule.options?.length >= 2 ? [...rule.options, '', '', ''].slice(0, 5) : ['', '', '', '', ''],
      condition: rule.condition || { dimension: 'maniaScore', operator: '>=', threshold: 2 },
    });
  }

  async function saveRule() {
    if (!ruleForm.question.trim()) return showMsg('La pregunta es obligatoria', 'error');
    const cleanOpts = ruleForm.options.filter(o => o.trim());
    if (cleanOpts.length < 2) return showMsg('Necesitás al menos 2 opciones', 'error');
    if (!ruleForm.measures.trim()) return showMsg('El campo "mide" es obligatorio', 'error');

    const conditionToSave = ruleForm.conditionType === 'answer'
      ? { conditionType: 'answer', questionId: ruleForm.condition.questionId ?? 'pt10', operator: ruleForm.condition.operator, threshold: ruleForm.condition.threshold }
      : { conditionType: 'score', dimension: ruleForm.condition.dimension, operator: ruleForm.condition.operator, threshold: ruleForm.condition.threshold };

    setSaving(true);
    try {
      await saveBranchingRule({
        ...(editingRule?._id ? { _id: editingRule._id } : {}),
        question: ruleForm.question.trim(),
        options: cleanOpts,
        measures: ruleForm.measures.trim(),
        type: ruleForm.type,
        conditionType: ruleForm.conditionType,
        condition: conditionToSave,
        active: true,
      });
      showMsg('Regla guardada', 'success');
      setEditingRule(null);
      await loadAll();
    } catch {
      showMsg('Error al guardar regla', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(id) {
    if (!window.confirm('¿Eliminar esta regla personalizada?')) return;
    try {
      await deleteBranchingRule(id);
      showMsg('Regla eliminada', 'info');
      await loadAll();
    } catch {
      showMsg('Error al eliminar', 'error');
    }
  }

  function updateRuleOpt(idx, val) {
    const opts = [...ruleForm.options];
    opts[idx] = val;
    setRuleForm(prev => ({ ...prev, options: opts }));
  }

  function updateCondition(field, val) {
    setRuleForm(prev => ({
      ...prev,
      condition: { ...prev.condition, [field]: field === 'threshold' ? parseFloat(val) || 0 : val },
    }));
  }

  function conditionText(rule) {
    const cond = rule.condition ?? rule;
    if (rule.conditionType === 'answer' || cond.conditionType === 'answer') {
      const qid = cond.questionId ?? '?';
      return `Respuesta a [${qid}] ${cond.operator} ${cond.threshold}`;
    }
    const dimLabel = DIMENSIONS.find(d => d.value === cond?.dimension)?.label ?? cond?.dimension;
    return `${dimLabel} ${cond?.operator} ${cond?.threshold}`;
  }

  // ── Save default branching rule text/options + optional condition override ─
  async function saveBranchingRuleOverride(ruleId, questionText, options, conditionOverride = null) {
    const existing = firestoreQuestions.find(q => q._originalId === ruleId && q._overrides);
    await saveQuestion({
      ...(existing ? { _id: existing._id } : {}),
      test: 'composite',
      role: 'patient',
      question: questionText,
      options,
      measures: branchingQuestions.find(q => q.id === ruleId)?.measures ?? '',
      active: true,
      _originalId: ruleId,
      _overrides: true,
      ...(conditionOverride ? { conditionOverride } : {}),
    });
    showMsg('Pregunta de ramificación actualizada', 'success');
    setEditingBranchRule(null);
    await loadAll();
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
          title="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-navy-700 dark:text-white">Admin del Test Adaptativo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Preguntas, reglas de ramificación y configuración del test.
          </p>
        </div>
      </div>

      {msg.text && <Alert variant={msg.type} className="mb-4">{msg.text}</Alert>}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-700 mb-5 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setEditing(null); setEditingRule(null); setEditingBranchRule(null); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <Card>
          <p className="text-center text-slate-400 py-6">Cargando...</p>
        </Card>
      )}

      {/* ── TAB: PREGUNTAS ─────────────────────────────────────────────────── */}
      {!loading && activeTab === 'questions' && (
        <div>
          {editing ? (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setEditing(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <CardTitle>
                  {editing._source === 'adaptive' ? 'Editar pregunta predeterminada' : (editing._id ? 'Editar pregunta' : 'Nueva pregunta')}
                </CardTitle>
              </div>
              {editing._source === 'adaptive' && (
                <Alert variant="info" className="mb-4">
                  Estás editando una pregunta predeterminada. Los cambios se guardan como personalización y reemplazan el texto en el test.
                </Alert>
              )}
              <QuestionForm
                question={editing}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            </Card>
          ) : (
            <Card>
              <div className="flex flex-wrap gap-2 mb-4">
                <select
                  value={filterSection}
                  onChange={e => setFilterSection(e.target.value)}
                  className="border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-0"
                >
                  <option value="all">Todas las secciones</option>
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="undefined">Extra / personalizadas</option>
                </select>
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-0"
                >
                  <option value="all">Todos los roles</option>
                  <option value="patient">Paciente</option>
                  <option value="caregiver">Cuidador</option>
                </select>
                <Button variant="primary" size="sm" onClick={() => setEditing({})}>
                  <Plus size={14} /> Nueva
                </Button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {filtered.length} pregunta{filtered.length !== 1 ? 's' : ''}
                {Object.keys(overrideMap).length > 0 && ` · ${Object.keys(overrideMap).length} con texto personalizado`}
                {extraCustom.length > 0 && ` · ${extraCustom.length} extra`}
              </p>

              <div className="space-y-2">
                {filtered.map(q => {
                  const sectionColor = STAGE_COLORS[q.section] ?? 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300';
                  return (
                    <div
                      key={q._id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {q.section && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sectionColor}`}>
                              {q.section}
                            </span>
                          )}
                          <Badge
                            label={q.role === 'caregiver' ? 'Cuidador' : 'Paciente'}
                            bg={q.role === 'caregiver' ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-green-100 dark:bg-green-900/30'}
                            text={q.role === 'caregiver' ? 'text-indigo-700 dark:text-indigo-300' : 'text-green-700 dark:text-green-300'}
                          />
                          {q._overridden && (
                            <Badge label="Editada" bg="bg-amber-100 dark:bg-amber-900/30" text="text-amber-700 dark:text-amber-300" />
                          )}
                          {q._source === 'custom' && !q._overridden && (
                            <Badge label="Extra" bg="bg-purple-100 dark:bg-purple-900/30" text="text-purple-700 dark:text-purple-300" />
                          )}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{q.question}</p>
                        <p className="text-xs text-slate-400 mt-1">{q.measures} · {q.options?.length ?? 0} opciones</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 mt-0.5">
                        <button
                          onClick={() => setEditing(q)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                          title="Editar"
                        >
                          <Edit size={15} />
                        </button>
                        {q._source !== 'adaptive' && (
                          <button
                            onClick={() => { if (window.confirm('¿Eliminar esta pregunta?')) handleDelete(q); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <p className="text-center text-slate-400 py-8 text-sm">No hay preguntas con estos filtros.</p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB: REGLAS ─────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'rules' && (
        <div className="space-y-5">
          {/* Default branching rules */}
          <Card>
            <CardTitle icon={<GitBranch size={16} />}>Preguntas de ramificación predeterminadas</CardTitle>
            <p className="text-xs text-slate-500 mb-3">Se activan automáticamente si se cumplen las condiciones durante el test. Podés activar/desactivar cada una y editar su texto.</p>
            <div className="space-y-2">
              {branchingQuestions.map(rule => {
                const override = overrideMap[rule.id];
                const displayQ = override?.question ?? rule.question;
                const isEditing = editingBranchRule === rule.id;
                return (
                  <div key={rule.id}>
                    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                      config.activeBranchingRules.includes(rule.id)
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                        : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700 opacity-60'
                    }`}>
                      <input
                        type="checkbox"
                        checked={config.activeBranchingRules.includes(rule.id)}
                        onChange={() => toggleHardcodedRule(rule.id)}
                        disabled={!config.branchingEnabled}
                        className="w-4 h-4 text-teal-600 mt-1 rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          <Badge label={rule.type} bg="bg-blue-100 dark:bg-blue-900/30" text="text-blue-700 dark:text-blue-300" />
                          {override && <Badge label="Editada" bg="bg-amber-100 dark:bg-amber-900/30" text="text-amber-700 dark:text-amber-300" />}
                          {override?.conditionOverride && <Badge label="Condición custom" bg="bg-violet-100 dark:bg-violet-900/30" text="text-violet-700 dark:text-violet-300" />}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{displayQ}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Condición: {override?.conditionOverride
                            ? (() => { const c = override.conditionOverride; return `${c.conditionType === 'answer' ? c.condition?.questionId : (DIMENSIONS.find(d => d.value === c.condition?.dimension)?.label ?? c.condition?.dimension)} ${c.condition?.operator} ${c.condition?.threshold}`; })()
                            : (rule.conditionLabel ?? rule.condition.toString().replace(/context\./g, '').replace(/^\(ctx\) => /, ''))
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingBranchRule(isEditing ? null : rule.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex-shrink-0"
                        title="Editar texto"
                      >
                        <Edit size={15} />
                      </button>
                    </div>
                    {isEditing && (
                      <BranchingRuleEditor
                        rule={{ ...rule, question: override?.question ?? rule.question, options: override?.options ?? rule.options }}
                        currentOverride={override}
                        onSave={saveBranchingRuleOverride}
                        onCancel={() => setEditingBranchRule(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" size="sm" onClick={saveConfig} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </Card>

          {/* Custom rules */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <CardTitle icon={<GitBranch size={16} />}>Reglas personalizadas</CardTitle>
              <Button variant="primary" size="sm" onClick={startNewRule}>
                <Plus size={14} /> Nueva
              </Button>
            </div>

            {/* Rule form */}
            {editingRule !== null && (
              <div className="mb-4 p-4 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700">
                <h3 className="text-sm font-semibold mb-3">{editingRule._id ? 'Editar regla' : 'Nueva regla'}</h3>
                <div className="space-y-3">

                  {/* Condition type toggle */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tipo de condición</label>
                    <div className="flex gap-2">
                      {['score', 'answer'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setRuleForm(prev => ({ ...prev, conditionType: t }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            ruleForm.conditionType === t
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-navy-600'
                          }`}
                        >
                          {t === 'score' ? 'Por score calculado' : 'Por respuesta de pregunta'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Condition builder */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Condición de activación</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 mb-0.5 block">
                          {ruleForm.conditionType === 'answer' ? 'Pregunta' : 'Dimensión'}
                        </label>
                        {ruleForm.conditionType === 'answer' ? (
                          <select
                            value={ruleForm.condition.questionId ?? 'pt10'}
                            onChange={e => updateCondition('questionId', e.target.value)}
                            className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-xs"
                          >
                            {ANSWER_QUESTIONS.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                          </select>
                        ) : (
                          <select
                            value={ruleForm.condition.dimension}
                            onChange={e => updateCondition('dimension', e.target.value)}
                            className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-xs"
                          >
                            {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-0.5 block">Operador</label>
                        <select
                          value={ruleForm.condition.operator}
                          onChange={e => updateCondition('operator', e.target.value)}
                          className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-xs"
                        >
                          {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-0.5 block">Valor</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={ruleForm.condition.threshold}
                          onChange={e => updateCondition('threshold', e.target.value)}
                          className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Se activa cuando: <strong>{conditionText(ruleForm)}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pregunta</label>
                    <textarea
                      value={ruleForm.question}
                      onChange={e => setRuleForm(p => ({ ...p, question: e.target.value }))}
                      className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 h-16 resize-none text-sm"
                      placeholder="Escribí la pregunta..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Opciones (mín. 2)</label>
                    <div className="space-y-1.5">
                      {ruleForm.options.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={opt}
                          onChange={e => updateRuleOpt(idx, e.target.value)}
                          className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-1.5 text-sm"
                          placeholder={`Opción ${idx + 1}${idx < 2 ? ' *' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Mide</label>
                      <input
                        type="text"
                        value={ruleForm.measures}
                        onChange={e => setRuleForm(p => ({ ...p, measures: e.target.value }))}
                        className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-1.5 text-sm"
                        placeholder="ej: impulsivity"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tipo</label>
                      <select
                        value={ruleForm.type}
                        onChange={e => setRuleForm(p => ({ ...p, type: e.target.value }))}
                        className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-1.5 text-sm"
                      >
                        {RULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="primary" size="sm" onClick={saveRule} disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditingRule(null)}>Cancelar</Button>
                  </div>
                </div>
              </div>
            )}

            {customRules.length === 0 && editingRule === null ? (
              <p className="text-sm text-slate-400 text-center py-4">No hay reglas personalizadas.</p>
            ) : (
              <div className="space-y-2">
                {customRules.map(rule => (
                  <div key={rule._id} className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1 mb-1">
                        <Badge label={rule.type} bg="bg-indigo-100 dark:bg-indigo-900/40" text="text-indigo-700 dark:text-indigo-300" />
                        {rule.conditionType === 'answer' && (
                          <Badge label="por respuesta" bg="bg-violet-100 dark:bg-violet-900/30" text="text-violet-700 dark:text-violet-300" />
                        )}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{rule.question}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Condición: {conditionText(rule)}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEditRule(rule)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => deleteRule(rule._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB: CONFIGURACIÓN ──────────────────────────────────────────────── */}
      {!loading && activeTab === 'config' && (
        <div className="space-y-5">
          <Card>
            <CardTitle icon={<Settings size={16} />}>Configuración General</CardTitle>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={e => setConfig(p => ({ ...p, enabled: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-sm font-medium">Test adaptativo habilitado</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.branchingEnabled}
                  onChange={e => setConfig(p => ({ ...p, branchingEnabled: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-sm font-medium">Ramificación habilitada</span>
              </label>

              {/* Module thresholds */}
              <div className="pt-2 border-t border-slate-200 dark:border-navy-700">
                <p className="text-sm font-medium mb-3">Umbrales de activación de módulos</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Umbral hipomanía (maniaScore ≥ X activa hipomanía)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="4"
                      value={config.maniaThreshold ?? 1.5}
                      onChange={e => setConfig(p => ({ ...p, maniaThreshold: parseFloat(e.target.value) || 1.5 }))}
                      className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-slate-400 mt-1">Predeterminado: 1.5</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Umbral manía plena (maniaScore ≥ X activa manía)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="4"
                      value={config.hypomaniaThreshold ?? 2.2}
                      onChange={e => setConfig(p => ({ ...p, hypomaniaThreshold: parseFloat(e.target.value) || 2.2 }))}
                      className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-slate-400 mt-1">Predeterminado: 2.2</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Umbral depresión (depressionScore &gt; X)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="4"
                      value={config.depressionThreshold ?? 1.5}
                      onChange={e => setConfig(p => ({ ...p, depressionThreshold: parseFloat(e.target.value) || 1.5 }))}
                      className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-slate-400 mt-1">Predeterminado: 1.5</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Multiplicadores Globales */}
          <Card>
            <CardTitle icon={<Zap size={16} />}>Multiplicadores Globales</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Controla cómo ciertas respuestas amplifican el riesgo de manía. Se aplican en tiempo real durante el test adaptativo.
            </p>

            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={config.multiplierConfig?.enabled ?? false}
                onChange={e => updateMultiplierConfig('enabled', e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="text-sm font-medium">Multiplicadores habilitados</span>
            </label>

            {(config.multiplierConfig?.enabled) && (
              <div className="space-y-5 border-t border-slate-200 dark:border-navy-700 pt-4">

                {/* Confirmation multipliers by answer */}
                <div>
                  <p className="text-sm font-medium mb-1">Multiplicador de confirmación por respuesta</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Cuando el paciente responde "¿Cuánto está afectando ese malestar?", este factor amplifica
                    todos los scores (manía, ánimo y depresión).
                  </p>
                  <div className="space-y-1.5">
                    {['Casi nada', 'Un poco', 'Bastante', 'Mucho', 'Totalmente'].map((label, i) => {
                      const val = (config.multiplierConfig?.confirmationMultipliersByAnswer ?? [0, 0.1, 0.25, 0.4, 0.6])[i] ?? 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400 w-20">{label}</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="2"
                            value={val}
                            onChange={e => {
                              const arr = [...(config.multiplierConfig?.confirmationMultipliersByAnswer ?? [0, 0.1, 0.25, 0.4, 0.6])];
                              arr[i] = parseFloat(e.target.value) || 0;
                              updateMultiplierConfig('confirmationMultipliersByAnswer', arr);
                            }}
                            className="w-24 border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2 py-1.5 text-xs"
                          />
                          <span className="text-xs text-slate-400">
                            +{(val * 100).toFixed(0)}% boost
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stress → mania bridge */}
                <div className="border-t border-slate-200 dark:border-navy-700 pt-4">
                  <p className="text-sm font-medium mb-1">Puente estrés → manía</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Si el score de estrés supera el umbral, se suma&nbsp;
                    <code className="text-xs bg-slate-100 dark:bg-navy-700 px-1 rounded">(estrés − umbral) × factor</code>
                    &nbsp;al score de manía (máx. 4.0).
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Umbral de estrés (0–4)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="4"
                        value={config.multiplierConfig?.stressManiaThreshold ?? 2.0}
                        onChange={e => updateMultiplierConfig('stressManiaThreshold', parseFloat(e.target.value) || 2.0)}
                        className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Factor de amplificación</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="2"
                        value={config.multiplierConfig?.stressManiaBoost ?? 0.0}
                        onChange={e => updateMultiplierConfig('stressManiaBoost', parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-slate-400 mt-1">Predeterminado: 0 (desactivado)</p>
                    </div>
                  </div>

                  {/* Live preview */}
                  {(config.multiplierConfig?.stressManiaBoost ?? 0) > 0 && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Ejemplo: estrés = 3.5, umbral = {config.multiplierConfig?.stressManiaThreshold ?? 2.0}, factor = {config.multiplierConfig?.stressManiaBoost ?? 0} →
                        boost manía = +{((3.5 - (config.multiplierConfig?.stressManiaThreshold ?? 2.0)) * (config.multiplierConfig?.stressManiaBoost ?? 0)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Dynamic test flow */}
          <Card>
            <CardTitle>Flujo del test (en tiempo real)</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Vista del flujo actual según la configuración. Los cambios se reflejan aquí antes de guardar.
            </p>
            <TestFlowSummary config={config} customRules={customRules} />
          </Card>

          {/* Migration card */}
          <Card>
            <CardTitle icon={<AlertTriangle size={16} className="text-amber-500" />}>Migración de datos históricos</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Convierte los registros de <code className="text-xs bg-slate-100 dark:bg-navy-700 px-1 py-0.5 rounded">caregiver_tests</code>, <code className="text-xs bg-slate-100 dark:bg-navy-700 px-1 py-0.5 rounded">patient_tests</code> y <code className="text-xs bg-slate-100 dark:bg-navy-700 px-1 py-0.5 rounded">mood_tests</code> al nuevo formato <code className="text-xs bg-slate-100 dark:bg-navy-700 px-1 py-0.5 rounded">composite_tests</code>.
              Los registros ya migrados se omiten automáticamente.
            </p>
            {migrationResult && !migrationResult.error && (
              <Alert variant="success" className="mb-3">
                {migrationResult.migrated} registro{migrationResult.migrated !== 1 ? 's' : ''} migrado{migrationResult.migrated !== 1 ? 's' : ''} · {migrationResult.skipped} ya existían
              </Alert>
            )}
            {migrationResult?.error && (
              <Alert variant="error" className="mb-3">Error: {migrationResult.error}</Alert>
            )}
            <Button variant="secondary" onClick={handleMigrate} disabled={migrating}>
              {migrating ? 'Migrando...' : 'Migrar datos anteriores'}
            </Button>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" onClick={saveConfig} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB: SECCIONES */}
      {!loading && activeTab === "sections" && (
        <div className="space-y-5">
          <SectionList />
        </div>
      )}

      {/* TAB: CONFIG. MODULOS */}
      {!loading && activeTab === "moduleConfig" && (
        <div className="space-y-5">
          <ModuleConfig />
        </div>
      )}
    </div>
  );
}
