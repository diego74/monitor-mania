import { useState, useEffect, useRef, useCallback } from 'react';
import {
  stage0Questions,
  stage0QuestionsCaregiver,
  maniaModuleQuestionsCaregiver,
  hypomaniaModuleQuestionsCaregiver,
  depressionModuleQuestionsCaregiver,
  confirmationQuestionCaregiver,
  confirmationFollowUpQuestion,
  confirmationFollowUpQuestionCaregiver,
  computeNextStage,
  computeContext,
  evaluateBranchingRules,
  detectInconsistencies,
  branchingQuestions,
  MEASURES_TO_ORIGIN,
  MODULE_MAP,
} from '../data/compositeTestConfig';
import { DEFAULT_SECTIONS, DEFAULT_BRANCHING_RULES } from '../services/dynamicCompositeEngine';
import { calcCompositeSeverity } from '../utils/compositeScoring';
import { saveComposite, hasFilledToday, COLLECTION_NAMES } from '../services/storage';
import { getCompositeConfig, getBranchingRules } from '../services/compositeConfig';
import { getPatientProfile } from '../services/patientStorage';
import { getAllQuestions } from '../services/questionStorage';
import { buildDynamicFlow } from '../services/dynamicCompositeEngine';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { CheckCircle, ArrowLeft, Send, Loader, AlertTriangle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

function useDebugMode() {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return false;
  return new URLSearchParams(hash.slice(qIdx + 1)).get('debug') === '1';
}

function DebugPanel({ answers, allQuestions, stage, triggeredIds, dateCtx }) {
  const [collapsed, setCollapsed] = useState(false);
  const ctx = allQuestions.length ? computeContext(answers, allQuestions, dateCtx) : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl shadow-2xl overflow-hidden font-mono text-xs border border-teal-500">
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-navy-900 text-teal-400 font-bold"
      >
        <span>DEBUG</span>
        {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {!collapsed && (
        <div className="bg-navy-900/95 text-slate-300 p-3 space-y-2 max-h-96 overflow-y-auto">
          <div className="text-teal-400 font-semibold">Stage: {stage}</div>
          {ctx && (
            <div className="space-y-0.5">
              <div>maniaScore: <span className="text-amber-300">{ctx.maniaScore?.toFixed(2)}</span></div>
              <div>depressionScore: <span className="text-blue-300">{ctx.depressionScore?.toFixed(2)}</span></div>
              <div>moodScore: <span className="text-purple-300">{ctx.moodScore?.toFixed(2)}</span></div>
              <div>stressScore: <span className="text-orange-300">{ctx.stressScore?.toFixed(2)}</span></div>
              <div>sleepHours: <span className="text-emerald-300">{ctx.sleepHours}</span></div>
              <div>irritabilityScore: <span className="text-rose-300">{ctx.irritabilityScore}</span></div>
            </div>
          )}
          {triggeredIds.length > 0 && (
            <div className="border-t border-navy-700 pt-2">
              <div className="text-rose-400 font-semibold mb-1">Triggered:</div>
              {triggeredIds.map(id => <div key={id} className="text-rose-300">• {id}</div>)}
            </div>
          )}
          <div className="border-t border-navy-700 pt-2">
            <div className="text-slate-400 font-semibold mb-1">Answers ({Object.keys(answers).length}/{allQuestions.length}):</div>
            {allQuestions.map(q => (
              <div key={q.id} className={answers[q.id] !== undefined ? 'text-slate-200' : 'text-slate-600'}>
                {q.id}: {answers[q.id] !== undefined ? answers[q.id] : '—'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STAGE_LABELS = {
  gateway:      'Evaluación inicial',
  mania:        'Evaluación manía',
  hypomania:    'Hipomanía',
  depression:   'Evaluación depresión',
  confirmation: 'Confirmación',
  branch:       'Verificando',
  psychosis:    'Evaluación adicional',
  caregiver:    'Evaluación completa',
};

const STAGE_COLORS = {
  gateway:      'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  mania:        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  hypomania:    'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  depression:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  confirmation: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  branch:       'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  psychosis:    'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  caregiver:    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
};

const OPTION_SELECTED = 'border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-900/30 dark:text-teal-100';
const OPTION_DEFAULT  = 'border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20';

export default function CompositeTest() {
  const { role, patientName, patientId } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const debugMode = useDebugMode();

  // Questions state
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);

  // Stage tracking
  const [stage, setStage] = useState('stage0');
  const [stageTransitioning, setStageTransitioning] = useState(false);
  const [triggeredIds, setTriggeredIds] = useState([]);

  // UI state
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState('right'); // 'left' | 'right'
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [filledToday, setFilledToday] = useState(false);
  const [showAnyway, setShowAnyway] = useState(false);
  const [inconsistencies, setInconsistencies] = useState([]);
  const [config, setConfig] = useState(null);
  const [customRules, setCustomRules] = useState([]);
  const [dateCtx, setDateCtx] = useState({});
  const [questionOverrides, setQuestionOverrides] = useState({});
  const [dynamicFlow, setDynamicFlow] = useState(null);

  const autoAdvanceTimer = useRef(null);

  // Load config + profile + overrides + check filled today
  useEffect(() => {
    Promise.all([
      getCompositeConfig().catch(() => null),
      getBranchingRules().catch(() => []),
      hasFilledToday(COLLECTION_NAMES.composite),
      getPatientProfile(patientId).catch(() => null),
      getAllQuestions().catch(() => []),
      buildDynamicFlow(role).catch(() => null),
    ]).then(([cfg, rules, filled, profile, bankQs, flow]) => {
      setConfig(cfg);
      setCustomRules(rules);
      setFilledToday(filled);
      setDynamicFlow(flow);

      // Compute date context from patient profile
      const ctx = {};
      if (profile?.fechaNacimiento) {
        try {
          const birthMonth = new Date(profile.fechaNacimiento).getMonth();
          ctx.nearBirthday = new Date().getMonth() === birthMonth;
        } catch (_) {}
      }
      if (profile?.cicloUltimaFecha && profile?.cicloDuracion) {
        try {
          const lastStart = new Date(profile.cicloUltimaFecha);
          const length = parseInt(profile.cicloDuracion, 10);
          const daysSince = Math.floor((Date.now() - lastStart.getTime()) / 86400000) % length;
          if (daysSince > length - 7) ctx.cyclePhase = 'premenstrual';
          else if (daysSince > length - 14) ctx.cyclePhase = 'luteal';
          else ctx.cyclePhase = null;
        } catch (_) {}
      }
      setDateCtx(ctx);

      // Build override map: originalId → question from question_bank
      const overrides = {};
      bankQs.forEach(q => { if (q._originalId && q._overrides) overrides[q._originalId] = q; });
      setQuestionOverrides(overrides);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, role]);

  // Apply question text/option/multiplier overrides from question_bank
  function applyOverrides(questions) {
    if (!Object.keys(questionOverrides).length) return questions;
    return questions.map(q => {
      const ov = questionOverrides[q.id];
      if (!ov) return q;
      return {
        ...q,
        question: ov.question ?? q.question,
        options:  ov.options  ?? q.options,
        ...(ov.multiplier        !== undefined ? { multiplier:        ov.multiplier        } : {}),
        ...(ov.answerMultipliers !== undefined ? { answerMultipliers: ov.answerMultipliers } : {}),
      };
    });
  }

  // Initialize questions from dynamic flow
  useEffect(() => {
    if (!dynamicFlow) return;

    // Use dynamic flow sections, fallback to hardcoded defaults
    const usingDefaults = dynamicFlow.usingDefaults;
    const sections = usingDefaults ? DEFAULT_SECTIONS : dynamicFlow.sections;

    // Get gateway questions for this role
    const gatewayQuestions = sections.gateway?.[role] || sections.gateway?.patient || [];
    if (gatewayQuestions.length > 0) {
      setAllQuestions(applyOverrides([...gatewayQuestions]));
    } else {
      // Ultimate fallback to hardcoded
      const fallback = role === 'caregiver' ? stage0QuestionsCaregiver : stage0Questions;
      setAllQuestions(applyOverrides([...fallback]));
    }
    setStage('stage0');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, today, patientId, questionOverrides, dynamicFlow]);

  // Stage 0 completion → inject next stage
  useEffect(() => {
    if (stage !== 'stage0' || allQuestions.length === 0 || !dynamicFlow) return;

    // Check if gateway questions are complete
    const stage0Complete = allQuestions.every(q => answers[q.id] !== undefined);
    if (!stage0Complete) return;

    // Cancel any pending auto-advance so it doesn't fire during the transition
    clearTimeout(autoAdvanceTimer.current);
    setStageTransitioning(true);
    setTimeout(() => {
      const usingDefaults = dynamicFlow.usingDefaults;
      const sections = usingDefaults ? DEFAULT_SECTIONS : dynamicFlow.sections;
      const branchingRules = usingDefaults ? DEFAULT_BRANCHING_RULES : dynamicFlow.branchingRules;

      // Use dynamic computeNextStage with module config from flow
      const moduleConfig = dynamicFlow.config?.moduleConfig || {};
      const flowConfig = {
        ...dynamicFlow.config,
        moduleConfig,
      };

      // Get gateway questions for context
      const gatewayQuestions = sections.gateway?.[role] || sections.gateway?.patient || allQuestions;

      const { questions: nextQs, context } = computeNextStage(answers, gatewayQuestions, flowConfig, dateCtx, flowConfig);

      // Evaluate dynamic branching rules
      const activeRuleIds = flowConfig?.activeBranchingRules ?? null;
      const conditionOverrides = Object.fromEntries(
        Object.entries(questionOverrides).filter(([, q]) => q.conditionOverride)
      );
      const { triggered } = evaluateBranchingRules(answers, gatewayQuestions, activeRuleIds, customRules, branchingRules, dateCtx, conditionOverrides);
      const alreadyShown = new Set(allQuestions.map(q => q.id));
      const newBranching = triggered.filter(q => !alreadyShown.has(q.id));

      // Resolve triggersModule: add module questions for any triggered branching rule
      const moduleQs = [];
      for (const rule of newBranching) {
        if (rule.triggersModule && sections[rule.triggersModule]?.[role]) {
          const mqs = sections[rule.triggersModule][role];
          mqs.forEach(mq => { if (!alreadyShown.has(mq.id)) moduleQs.push(mq); });
        } else if (rule.triggersModule && MODULE_MAP[rule.triggersModule]) {
          // Fallback to hardcoded MODULE_MAP
          const mqs = MODULE_MAP[rule.triggersModule][role] ?? MODULE_MAP[rule.triggersModule].patient ?? [];
          mqs.forEach(mq => { if (!alreadyShown.has(mq.id)) moduleQs.push(mq); });
        }
      }

      const deduped = nextQs.filter(q => !alreadyShown.has(q.id));

      const newLen = allQuestions.length + deduped.length + newBranching.length + moduleQs.length;
      setAllQuestions(prev => [
        ...prev,
        ...applyOverrides(deduped),
        ...applyOverrides(newBranching).map(q => ({ ...q, _stage: 'branch', _origin: MEASURES_TO_ORIGIN[q.measures] ?? null })),
        ...applyOverrides(moduleQs).map(q => ({ ...q, _stage: 'branch' })),
      ]);
      setTriggeredIds(prev => [...prev, ...newBranching.map(q => q.id)]);
      setStage('stage1');
      setStageTransitioning(false);

      // Advance to first new question after transition
      if (newLen > allQuestions.length) {
        setCurrentIdx(allQuestions.length);
      }

      const inc = detectInconsistencies(answers, context);
      setInconsistencies(inc);
    }, 900);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, stage, dynamicFlow]);

  // Re-evaluate branching during stage1
  useEffect(() => {
    if (stage !== 'stage1' || allQuestions.length === 0 || !dynamicFlow) return;

    const usingDefaults = dynamicFlow.usingDefaults;
    const branchingRules = usingDefaults ? DEFAULT_BRANCHING_RULES : dynamicFlow.branchingRules;
    const sections = usingDefaults ? DEFAULT_SECTIONS : dynamicFlow.sections;

    const activeRuleIds = dynamicFlow.config?.activeBranchingRules ?? null;
    const conditionOverrides = Object.fromEntries(
      Object.entries(questionOverrides).filter(([, q]) => q.conditionOverride)
    );
    const { triggered } = evaluateBranchingRules(answers, allQuestions, activeRuleIds, customRules, branchingRules, dateCtx, conditionOverrides);
    const alreadyShown = new Set(allQuestions.map(q => q.id));
    const newOnes = triggered.filter(q => !alreadyShown.has(q.id));
    if (newOnes.length > 0) {
      // Resolve triggersModule for newly triggered rules
      const moduleQs = [];
      for (const rule of newOnes) {
        if (rule.triggersModule && sections[rule.triggersModule]?.[role]) {
          const mqs = sections[rule.triggersModule][role];
          mqs.forEach(mq => { if (!alreadyShown.has(mq.id)) moduleQs.push(mq); });
        } else if (rule.triggersModule && MODULE_MAP[rule.triggersModule]) {
          // Fallback to hardcoded MODULE_MAP
          const mqs = MODULE_MAP[rule.triggersModule][role] ?? MODULE_MAP[rule.triggersModule].patient ?? [];
          mqs.forEach(mq => { if (!alreadyShown.has(mq.id)) moduleQs.push(mq); });
        }
      }
      setAllQuestions(prev => [
        ...prev,
        ...applyOverrides(newOnes).map(q => ({ ...q, _stage: 'branch', _origin: MEASURES_TO_ORIGIN[q.measures] ?? null })),
        ...applyOverrides(moduleQs).map(q => ({ ...q, _stage: 'branch' })),
      ]);
      setTriggeredIds(prev => [...prev, ...newOnes.map(q => q.id), ...moduleQs.map(q => q.id)]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, stage, dynamicFlow]);

  // Inject follow-up question when confirm_stable is answered with distress (>= 2)
  useEffect(() => {
    if (stage !== 'stage1') return;
    const confirmAnswer = answers['confirm_stable'];
    if (confirmAnswer === undefined || confirmAnswer < 2) return;
    const alreadyShown = new Set(allQuestions.map(q => q.id));
    if (alreadyShown.has('confirm_followup')) return;
    const followUp = role === 'caregiver' ? confirmationFollowUpQuestionCaregiver : confirmationFollowUpQuestion;
    setAllQuestions(prev => [...prev, followUp]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers['confirm_stable'], stage, role]);

  // After follow-up is answered, re-evaluate module thresholds with updated scores
  useEffect(() => {
    if (stage !== 'stage1') return;
    const followUpAnswer = answers['confirm_followup'];
    if (followUpAnswer === undefined) return;
    const alreadyShown = new Set(allQuestions.map(q => q.id));
    const overrides = role === 'caregiver'
      ? { maniaQ: maniaModuleQuestionsCaregiver, hypomaniaQ: hypomaniaModuleQuestionsCaregiver, depressQ: depressionModuleQuestionsCaregiver, confirmQ: confirmationQuestionCaregiver }
      : {};
    const gateways = role === 'caregiver' ? stage0QuestionsCaregiver : stage0Questions;
    const { questions: moduleQs, stageName } = computeNextStage(answers, [...gateways, ...allQuestions.filter(q => q._stage !== 'gateway')], overrides, dateCtx, config);
    if (stageName === 'modules') {
      const newModuleQs = moduleQs.filter(q => !alreadyShown.has(q.id));
      if (newModuleQs.length > 0) {
        setAllQuestions(prev => [...prev, ...applyOverrides(newModuleQs)]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers['confirm_followup'], stage]);

  function animateTo(nextIdx, direction) {
    setSlideDir(direction);
    setAnimating(true);
    setTimeout(() => {
      setCurrentIdx(nextIdx);
      setAnimating(false);
    }, 220);
  }

  const handleAnswer = useCallback((value) => {
    const q = allQuestions[currentIdx];
    setAnswers(prev => ({ ...prev, [q.id]: value }));

    // Don't auto-advance during stage transition — the transition itself will advance
    if (stageTransitioning) return;

    clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      if (currentIdx < allQuestions.length - 1) {
        animateTo(currentIdx + 1, 'left');
      }
    }, 420);
  }, [allQuestions, currentIdx, stageTransitioning]);

  function prevQuestion() {
    if (currentIdx > 0) animateTo(currentIdx - 1, 'right');
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const scoredQuestions = allQuestions.filter(q => q._stage !== 'distractor');
      const scores = calcCompositeSeverity(answers, scoredQuestions, { collectAudit: true });

      // Aplicar puente estrés→manía al score final si está configurado
      let finalScores = { ...scores.byModule };
      const multCfg = config?.multiplierConfig ?? {};
      if (multCfg.enabled) {
        const ctx = computeContext(answers, scoredQuestions, dateCtx, config);
        if (ctx.maniaScore > (finalScores.mania ?? 0)) {
          finalScores.mania = parseFloat(ctx.maniaScore.toFixed(2));
        }
      }

      const payload = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('es-AR'),
        patientId: patientId || 'daniela',
        testType: 'composite',
        submittedByRole: role,
        severity: scores.overall,
        scoresBySection: finalScores,
        raw: answers,
        stagesCompleted: [stage],
        branchingLog: triggeredIds.map(id => ({
          questionId: id,
          triggered: true,
          condition: branchingQuestions.find(q => q.id === id)?.condition?.toString() || 'custom',
        })),
        inconsistencies,
        multipliersApplied: scores.multipliersApplied ?? [],
        appVersion: 5,
      };
      await saveComposite(payload);
      setDone(true);
    } catch (err) {
      console.error('Error guardando test:', err);
      alert('Error al guardar. Verificá la conexión.');
    } finally {
      setSaving(false);
    }
  }

  // ─── "Filled today" gate ──────────────────────────────────────────────
  if (filledToday && !showAnyway) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-6 gap-4">
          <CheckCircle size={48} className="text-emerald-500" />
          <div>
            <h2 className="text-lg font-bold text-navy-700 dark:text-white mb-1">Ya enviaste tu evaluación hoy</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tus respuestas de hoy ya están registradas. Podés hacer otra si querés.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setShowAnyway(true)}>
            <RotateCcw size={15} />
            Hacer otra igual
          </Button>
        </div>
      </Card>
    );
  }

  // ─── Done screen ──────────────────────────────────────────────────────
  if (done) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle size={36} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-700 dark:text-white mb-1">¡Listo, gracias!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tu evaluación fue guardada correctamente.
            </p>
          </div>
          {inconsistencies.filter(i => i.severity === 'critical').map((inc, i) => (
            <Alert key={`c${i}`} variant="crisis">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span className="text-sm font-semibold">{inc.message}</span>
              </div>
            </Alert>
          ))}
          {inconsistencies.filter(i => i.severity === 'high').map((inc, i) => (
            <Alert key={i} variant="warning">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span className="text-sm">{inc.message}</span>
              </div>
            </Alert>
          ))}
        </div>
      </Card>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <Card>
        <p className="text-center text-slate-400 py-8">Cargando...</p>
      </Card>
    );
  }

  const currentQuestion = allQuestions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const totalCount = allQuestions.length;
  const isLastQuestion = currentIdx === totalCount - 1;
  const isAnswered = answers[currentQuestion?.id] !== undefined;
  const currentStageLabel = STAGE_LABELS[currentQuestion?._stage] ?? 'Evaluación';
  const currentStageColor = STAGE_COLORS[currentQuestion?._stage] ?? STAGE_COLORS.gateway;
  const isBranchQuestion = triggeredIds.includes(currentQuestion?.id);

  // Slide animation classes
  const slideClass = animating
    ? slideDir === 'left'
      ? '-translate-x-4 opacity-0'
      : 'translate-x-4 opacity-0'
    : 'translate-x-0 opacity-100';

  return (
    <div>
      {debugMode && (
        <DebugPanel
          answers={answers}
          allQuestions={allQuestions}
          stage={stage}
          triggeredIds={triggeredIds}
          dateCtx={dateCtx}
        />
      )}

      {/* Stage transitioning overlay */}
      {stageTransitioning && (
        <Card>
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader size={32} className="text-teal-500 animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Evaluando tu estado...
            </p>
          </div>
        </Card>
      )}

      {!stageTransitioning && (
        <div>
          {/* Header info */}
          <div className="mb-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {role === 'patient'
                ? 'Solo agregamos preguntas si detectamos algo importante.'
                : `Evaluación adaptativa de ${patientName}.`}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Pregunta {currentIdx + 1} de {totalCount}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentStageColor}`}>
                {currentStageLabel}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(answeredCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Inconsistency alerts (only when on last question) */}
          {isLastQuestion && inconsistencies.filter(i => i.severity === 'critical').map((inc, i) => (
            <Alert key={`c${i}`} variant="crisis" className="mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span className="text-sm font-semibold">{inc.message}</span>
              </div>
            </Alert>
          ))}
          {isLastQuestion && inconsistencies.filter(i => i.severity === 'high').map((inc, i) => (
            <Alert key={i} variant="warning" className="mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span className="text-sm">{inc.message}</span>
              </div>
            </Alert>
          ))}

          {/* Branch indicator */}
          {isBranchQuestion && (
            <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {role === 'patient'
                  ? 'Esta pregunta adicional nos ayuda a entender mejor tu situación.'
                  : 'Pregunta adicional activada por síntomas detectados.'}
              </p>
            </div>
          )}

          {/* Question card with animation */}
          <div className={`transition-all duration-200 ease-out ${slideClass}`}>
            <Card>
              <p className="text-base font-semibold text-navy-800 dark:text-white leading-snug mb-5">
                {currentQuestion.question}
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, idx) => {
                  const selected = answers[currentQuestion.id] === idx;
                  const colorClass = selected ? OPTION_SELECTED : OPTION_DEFAULT;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-150 cursor-pointer ${colorClass}`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        selected
                          ? 'border-current bg-current'
                          : 'border-slate-300 dark:border-navy-500'
                      }`}>
                        {selected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={prevQuestion}
              disabled={currentIdx === 0}
            >
              <ArrowLeft size={16} />
              Anterior
            </Button>

            {isAnswered && isLastQuestion && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
                disabled={saving}
              >
                <Send size={16} />
                {saving ? 'Guardando...' : 'Enviar evaluación'}
              </Button>
            )}
          </div>

          {/* Branching summary */}
          {triggeredIds.length > 0 && (
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 text-center">
              +{triggeredIds.length} pregunta{triggeredIds.length > 1 ? 's' : ''} adicional{triggeredIds.length > 1 ? 'es' : ''} incluida{triggeredIds.length > 1 ? 's' : ''} para mayor precisión
            </p>
          )}
        </div>
      )}
    </div>
  );
}
