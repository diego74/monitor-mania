import { getCompositeSections, getBranchingRules, getModuleConfig, getCompositeConfig } from './compositeConfig';
import { calcSeverity } from '../data/questions';
import { calcMoodSeverity } from '../utils/scoring';

// ─── Default hardcoded sections as fallback ─────────────────────────────────
export const DEFAULT_SECTIONS = {
  gateway: {
    patient: [
      { id: 'pt9', question: '¿Cuántas horas dormiste anoche?', options: ['6+ horas', '5-6 horas', '4-5 horas', '3-4 horas', '< 3 horas'], measures: 'sleep', _origin: 'mania', _stage: 'gateway', multiplier: 1.5, answerMultipliers: [1, 1, 1.1, 1.3, 1.6] },
      { id: 'mc1', question: '¿Cómo describirías tu estado de ánimo general hoy?', options: ['Bien, equilibrada', 'Un poco triste', 'Bastante triste', 'Muy deprimida', 'Sin esperanza'], measures: 'depression', _origin: 'mood', _stage: 'gateway', multiplier: 1.2, answerMultipliers: [1, 1, 1.1, 1.3, 1.5] },
      { id: 'pt7', question: '¿Qué tan energética te sentís comparado con ayer?', options: ['Mucha menos energía', 'Menos', 'Igual', 'Más', 'Muchísima más energía'], measures: 'energy', _origin: 'mania', _stage: 'gateway', multiplier: 1.2, answerMultipliers: [1, 1, 1, 1.1, 1.4] },
      { id: 'pt10', question: '¿Qué tan fácil es que algo te irrite hoy?', options: ['Nada me irrita', 'Poco', 'Normal', 'Me irrito con facilidad', 'Todo me irrita'], measures: 'irritability', _origin: 'mania', _stage: 'gateway', multiplier: 1.3, answerMultipliers: [1, 1, 1, 1.2, 1.5] },
    ],
    caregiver: [
      { id: 'pt9', question: '¿Cuántas horas durmió Daniela anoche?', options: ['6+ horas', '5-6 horas', '4-5 horas', '3-4 horas', '< 3 horas'], measures: 'sleep', _origin: 'mania', _stage: 'gateway' },
      { id: 'mc1', question: '¿Cómo describirías su estado de ánimo general hoy?', options: ['Bien, equilibrada', 'Un poco triste', 'Bastante triste', 'Muy deprimida', 'Sin esperanza'], measures: 'depression', _origin: 'mood', _stage: 'gateway' },
      { id: 'pt7', question: '¿Qué tan activa o enérgica la ves hoy?', options: ['Con muy poca energía', 'Menos activa de lo normal', 'Normal', 'Más activa de lo normal', 'Muy acelerada o desbordada'], measures: 'energy', _origin: 'mania', _stage: 'gateway' },
      { id: 'pt10', question: '¿Qué tan irritable o sensible la notás hoy?', options: ['Muy tranquila', 'Poco irritable', 'Normal', 'Bastante irritable', 'Muy irritable'], measures: 'irritability', _origin: 'mania', _stage: 'gateway' },
    ]
  },
  mania: {
    patient: [
      { id: 'pt1', question: '¿Cuántas ideas nuevas o proyectos tuviste hoy?', options: ['Ninguno', '1-2', '3-5', '6-10', 'Más de 10'], measures: 'flight_of_ideas', _origin: 'mania', _stage: 'mania' },
      { id: 'pt4', question: '¿Qué tan rápido hablás comparado con lo normal?', options: ['Más lento', 'Normal', 'Un poco más rápido', 'Bastante más rápido', 'Muy rápido'], measures: 'pressured_speech', _origin: 'mania', _stage: 'mania' },
      { id: 'mc16', question: '¿A qué velocidad van tus pensamientos hoy?', options: ['Normal', 'Un poco lentos', 'Muy lentos', 'Un poco acelerados', 'Muy acelerados'], measures: 'mixed_features', _origin: 'mood', _stage: 'mania' },
    ],
    caregiver: [
      { id: 'pt1', question: '¿Cuántas ideas nuevas o proyectos mencionó hoy?', options: ['Ninguno', '1-2', '3-5', '6-10', 'Más de 10'], measures: 'flight_of_ideas', _origin: 'mania', _stage: 'mania' },
      { id: 'pt4', question: '¿Habla más rápido de lo normal?', options: ['Más lento', 'Normal', 'Un poco más rápido', 'Bastante más rápido', 'Muy rápido'], measures: 'pressured_speech', _origin: 'mania', _stage: 'mania' },
      { id: 'mc16', question: '¿Cómo la notás en cuanto a velocidad de pensamiento o distracción?', options: ['Normal', 'Un poco lenta', 'Muy lenta', 'Un poco acelerada', 'Muy acelerada'], measures: 'mixed_features', _origin: 'mood', _stage: 'mania' },
    ]
  },
  hypomania: {
    patient: [
      { id: 'hypo1', question: '¿Te sentís más optimista o con más confianza de lo habitual?', options: ['No, igual que siempre', 'Un poco más', 'Bastante más', 'Mucho más', 'Extremadamente más'], measures: 'grandiosity', _origin: 'mania', _stage: 'hypomania' },
      { id: 'hypo2', question: '¿Estás más sociable o con ganas de conectar con gente que de costumbre?', options: ['Para nada', 'Un poco más de lo normal', 'Bastante más', 'Mucho más', 'Extremadamente sociable'], measures: 'social_drive', _origin: 'mania', _stage: 'hypomania' },
      { id: 'hypo3', question: '¿Sentís que necesitás dormir menos pero igual tenés energía durante el día?', options: ['No, necesito mi horario normal', 'Un poco menos y me siento bien', 'Definitivamente duermo menos sin cansarme', 'Mucho menos sueño y llena de energía', 'Casi no dormí pero me siento activa'], measures: 'sleep', _origin: 'mania', _stage: 'hypomania' },
    ],
    caregiver: [
      { id: 'hypo1', question: '¿La notás más optimista o segura de sí misma de lo habitual?', options: ['No, igual que siempre', 'Un poco más', 'Bastante más', 'Mucho más', 'Extremadamente más'], measures: 'grandiosity', _origin: 'mania', _stage: 'hypomania' },
      { id: 'hypo2', question: '¿La ves más sociable o con más ganas de relacionarse que de costumbre?', options: ['Para nada', 'Un poco más de lo normal', 'Bastante más', 'Mucho más', 'Extremadamente sociable'], measures: 'social_drive', _origin: 'mania', _stage: 'hypomania' },
      { id: 'hypo3', question: '¿Parece que duerme menos pero igual tiene energía durante el día?', options: ['No, duerme su horario normal', 'Un poco menos y se ve bien', 'Definitivamente duerme menos sin cansarse', 'Mucho menos sueño y llena de energía', 'Casi no durmió pero se ve activa'], measures: 'sleep', _origin: 'mania', _stage: 'hypomania' },
    ]
  },
  depression: {
    patient: [
      { id: 'mc4', question: '¿Podés concentrarte y tomar decisiones hoy?', options: ['Sí, con claridad', 'Con algo de dificultad', 'Me cuesta bastante', 'Muy difícil', 'No puedo decidir'], measures: 'depression', _origin: 'mood', _stage: 'depression' },
      { id: 'mc17', question: '¿Pudiste hacer las cosas que planeaste hoy?', options: ['Sí, todo', 'La mayoría', 'La mitad', 'Muy poco', 'Nada'], measures: 'depression', _origin: 'mood', _stage: 'depression' },
      { id: 'mc10', question: '¿Qué tan nerviosa o ansiosa te sentís?', options: ['Tranquila', 'Algo nerviosa', 'Bastante ansiosa', 'Muy ansiosa', 'Ansiedad extrema'], measures: 'anxiety', _origin: 'mood', _stage: 'depression' },
      { id: 'stress1', question: '¿Qué tan estresada te sentís hoy?', options: ['Nada estresada', 'Un poco estresada', 'Bastante estresada', 'Muy estresada', 'Estrés extremo'], measures: 'stress', _origin: 'mood', _stage: 'depression' },
    ],
    caregiver: [
      { id: 'mc4', question: '¿La notás concentrada y capaz de tomar decisiones?', options: ['Sí, con claridad', 'Con algo de dificultad', 'Le cuesta bastante', 'Muy difícil', 'No puede decidir'], measures: 'depression', _origin: 'mood', _stage: 'depression' },
      { id: 'mc17', question: '¿Pudo hacer las cosas que tenía planeadas?', options: ['Sí, todo', 'La mayoría', 'La mitad', 'Muy poco', 'Nada'], measures: 'depression', _origin: 'mood', _stage: 'depression' },
      { id: 'mc10', question: '¿Qué tan nerviosa o ansiosa la notás?', options: ['Tranquila', 'Algo nerviosa', 'Bastante ansiosa', 'Muy ansiosa', 'Ansiedad extrema'], measures: 'anxiety', _origin: 'mood', _stage: 'depression' },
      { id: 'stress1', question: '¿Qué tan estresada la notás hoy?', options: ['Nada estresada', 'Un poco estresada', 'Bastante estresada', 'Muy estresada', 'Estrés extremo'], measures: 'stress', _origin: 'mood', _stage: 'depression' },
    ]
  },
  psychosis: {
    patient: [
      { id: 'psych1', question: '¿Sentís que tenés una misión especial o poderes que otros no comprenden?', options: ['No', 'Un pensamiento pasajero', 'Varias veces hoy', 'Creo que sí con convicción', 'Estoy completamente segura'], measures: 'psychosis', _origin: 'mania', _stage: 'psychosis' },
      { id: 'psych2', question: '¿Escuchaste voces o viste cosas que otros a tu alrededor no perciben?', options: ['No', 'No estoy segura', 'Una vez hoy', 'Varias veces', 'Con frecuencia'], measures: 'psychosis', _origin: 'mania', _stage: 'psychosis' },
    ],
    caregiver: [
      { id: 'psych1', question: '¿Expresó tener una misión especial o poderes que otros no comprenden?', options: ['No', 'Un comentario pasajero', 'Varias veces hoy', 'Lo afirma con convicción', 'Está completamente convencida'], measures: 'psychosis', _origin: 'mania', _stage: 'psychosis' },
      { id: 'psych2', question: '¿Mencionó escuchar voces o ver cosas que vos no podés percibir?', options: ['No', 'No está segura', 'Una vez hoy', 'Varias veces', 'Con frecuencia'], measures: 'psychosis', _origin: 'mania', _stage: 'psychosis' },
    ]
  },
  confirmation: {
    patient: [
      { id: 'confirm_stable', question: '¿Hay algo más que quieras registrar sobre cómo te sentís hoy?', options: ['No, todo bien', 'Me siento un poco diferente', 'Tengo algo de inquietud', 'Sí, no estoy tan bien', 'Estoy bastante mal'], measures: 'general', _origin: 'mood', _stage: 'confirmation' },
      { id: 'confirm_followup', question: '¿Cuánto está afectando ese malestar tu día a día?', options: ['Casi nada, puedo seguir mi rutina', 'Un poco, noto algo diferente', 'Bastante, me cuesta mantener el ritmo', 'Mucho, el día se hace difícil', 'Totalmente, no puedo funcionar bien'], measures: 'general', _origin: 'mood', _stage: 'confirmation' },
    ],
    caregiver: [
      { id: 'confirm_stable', question: '¿Hay algo más que quieras registrar sobre cómo la ves hoy?', options: ['No, todo bien', 'La veo un poco diferente', 'Tiene algo de inquietud', 'No la veo tan bien', 'La veo bastante mal'], measures: 'general', _origin: 'mood', _stage: 'confirmation' },
      { id: 'confirm_followup', question: '¿Cuánto está afectando ese malestar el día de Daniela?', options: ['Casi nada, puede seguir su rutina', 'Un poco, noto algo diferente en ella', 'Bastante, le cuesta mantener el ritmo', 'Mucho, el día se le hace difícil', 'Totalmente, no puede funcionar bien'], measures: 'general', _origin: 'mood', _stage: 'confirmation' },
    ]
  },
  branch: {
    patient: [],
    caregiver: []
  }
};

export const DEFAULT_BRANCHING_RULES = [
  {
    _id: 'mixed_state',
    name: 'Estado mixto',
    question: '¿Sentís que estás agitada y triste al mismo tiempo?',
    options: ['No', 'Un poco', 'Bastante', 'Mucho', 'Extremadamente'],
    measures: 'mixed_features',
    type: 'mixed',
    _stage: 'branch',
    condition: { type: 'score', dimension: 'depressionScore', operator: '>=', threshold: 3 },
    condition2: { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 3 },
    role: 'both',
    active: true,
    order: 10
  },
  {
    _id: 'val_energy',
    name: 'Validación energía',
    question: 'A pesar de dormir poco, ¿te sentís con mucha energía?',
    options: ['No', 'Un poco', 'Bastante', 'Sí, mucha', 'Extremadamente'],
    measures: 'energy',
    type: 'validation',
    _stage: 'branch',
    condition: { type: 'score', dimension: 'sleepHours', operator: '<', threshold: 4 },
    role: 'both',
    active: true,
    order: 20
  },
  {
    _id: 'impulsivity',
    name: 'Impulsividad',
    question: '¿Hiciste compras o gastos impulsivos últimamente?',
    options: ['No', 'Una cosa pequeña', 'Algunas', 'Muchas', 'Excesivamente'],
    measures: 'impulsivity',
    type: 'risk',
    _stage: 'branch',
    condition: { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 3 },
    role: 'both',
    active: true,
    order: 30
  },
  {
    _id: 'psychosis_screen',
    name: 'Screening psicosis',
    question: '¿Tuviste pensamientos o percepciones que otros no comparten, o sentiste que todo tiene un significado especial para vos?',
    options: ['No', 'Una o dos veces', 'Varias veces', 'Con frecuencia', 'Constantemente'],
    measures: 'psychosis',
    type: 'crisis',
    _stage: 'branch',
    condition: { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 3.0 },
    triggersModule: 'psychosis',
    role: 'both',
    active: true,
    order: 40
  },
  {
    _id: 'suicidal_risk',
    name: 'Riesgo suicida',
    question: '¿Tuviste pensamientos de que sería mejor no vivir?',
    options: ['No', 'Pensamientos leves', 'Pensamientos recurrentes', 'Con planes', 'Acciones tomadas'],
    measures: 'crisis',
    type: 'crisis',
    _stage: 'branch',
    condition: { type: 'score', dimension: 'depressionScore', operator: '>=', threshold: 3 },
    role: 'both',
    active: true,
    order: 50
  },
  {
    _id: 'birthday_month',
    name: 'Mes de cumpleaños',
    question: '¿Cómo te sentís en relación a tu cumpleaños este mes?',
    options: ['Bien, lo disfruto', 'Indiferente', 'Un poco melancólica', 'Ansiosa', 'Muy afectada'],
    measures: 'mood',
    type: 'mixed',
    _stage: 'branch',
    condition: { type: 'context', field: 'nearBirthday', operator: '==', value: true },
    role: 'both',
    active: true,
    order: 60
  },
  {
    _id: 'cycle_premenstrual',
    name: 'Fase premenstrual',
    question: '¿Cómo estás notando tu cuerpo y emociones en estos días del ciclo?',
    options: ['Normal', 'Algo más sensible', 'Bastante irritable', 'Muy intensa emocionalmente', 'Muy difícil'],
    measures: 'irritability',
    type: 'validation',
    _stage: 'branch',
    condition: { type: 'context', field: 'cyclePhase', operator: '==', value: 'premenstrual' },
    role: 'both',
    active: true,
    order: 70
  }
];

// ─── Evaluate condition ────────────────────────────────────────────────────
function evaluateCondition(condition, context, answers = {}) {
  if (!condition) return false;
  
  if (condition.type === 'answer') {
    const value = answers[condition.questionId] ?? 0;
    switch (condition.operator) {
      case '>=': return value >= condition.threshold;
      case '>': return value > condition.threshold;
      case '<=': return value <= condition.threshold;
      case '<': return value < condition.threshold;
      case '==': return value === condition.threshold;
      default: return false;
    }
  } else if (condition.type === 'context') {
    const value = context[condition.field];
    switch (condition.operator) {
      case '==': return value === condition.value;
      case '!=': return value !== condition.value;
      default: return false;
    }
  } else {
    // score condition
    let value = context[condition.dimension] ?? 0;
    switch (condition.operator) {
      case '>=': return value >= condition.threshold;
      case '>': return value > condition.threshold;
      case '<=': return value <= condition.threshold;
      case '<': return value < condition.threshold;
      case '==': return value === condition.threshold;
      default: return false;
    }
  }
}





// ─── Determine next stage (modules, confirmation) ──────────────────────────
export function computeNextStage(answers, baseQuestions, config = {}, customSections = [], dateCtx = {}, overrides = {}) {
  const ctx = computeContext(answers, baseQuestions, dateCtx, config);
  
  const maniaThreshold = config.maniaThreshold ?? 1.5;
  const hypomaniaThreshold = config.hypomaniaThreshold ?? 2.2;
  const depressionThreshold = config.depressionThreshold ?? 1.5;
  const moduleConfig = config.moduleConfig || {};
  
  const depressElevated = ctx.depressionScore > depressionThreshold;
  const maniaHigh = ctx.maniaScore >= hypomaniaThreshold;
  const maniaHypo = ctx.maniaScore >= maniaThreshold && ctx.maniaScore < hypomaniaThreshold;
  
  // Check module conditions from config
  const maniaModuleCfg = moduleConfig.mania || {};
  const hypomaniaModuleCfg = moduleConfig.hypomania || {};
  const depressionModuleCfg = moduleConfig.depression || {};
  
  const shouldShowMania = maniaModuleCfg.enabled !== false && maniaHigh;
  const shouldShowHypomania = hypomaniaModuleCfg.enabled !== false && maniaHypo && !maniaHigh;
  const shouldShowDepression = depressionModuleCfg.enabled !== false && depressElevated;
  
  // Override from parameters
  const maniaQ = overrides.maniaQ || (maniaHigh ? DEFAULT_SECTIONS.mania.patient : []);
  const hypomaniaQ = overrides.hypomaniaQ || (maniaHypo ? DEFAULT_SECTIONS.hypomania.patient : []);
  const depressQ = overrides.depressQ || (depressElevated ? DEFAULT_SECTIONS.depression.patient : []);
  const confirmQ = overrides.confirmQ || DEFAULT_SECTIONS.confirmation.patient[0];
  
  if (!shouldShowMania && !shouldShowHypomania && !shouldShowDepression) {
    return { stageName: 'confirmation', questions: [confirmQ], context: ctx };
  }
  
  const next = [];
  if (shouldShowMania) next.push(...maniaQ);
  if (shouldShowHypomania) next.push(...hypomaniaQ);
  if (shouldShowDepression) next.push(...depressQ);
  
  // Deduplicate
  const seen = new Set();
  const unique = next.filter(q => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
  
  return { stageName: 'modules', questions: unique, context: ctx };
}

// ─── Compute context (moved from compositeScoring.js) ───────────────────────
export function computeContext(answers, questions, dateCtx = {}, config = {}) {
  const maniaQ = questions.filter(q => q._origin === 'mania' && !q.isDistractor);
  const moodQ = questions.filter(q => q._origin === 'mood' && !q.isDistractor);
  
  let maniaScore = 0;
  let depressionScore = 0;
  let moodScore = 0;
  let stressScore = 0;
  
  try {
    if (maniaQ.length) maniaScore = calcSeverity(answers, maniaQ).overall ?? 0;
  } catch (_) {}
  try {
    if (moodQ.length) {
      const ms = calcMoodSeverity(answers, moodQ);
      moodScore = ms.overall ?? 0;
      depressionScore = ms.depressionScore ?? moodScore;
      stressScore = ms.stressScore ?? 0;
    }
  } catch (_) {}
  
  if (depressionScore === 0 && moodScore > 0) depressionScore = moodScore;
  
  const mc1 = answers['mc1'];
  if (mc1 != null && mc1 > depressionScore) depressionScore = mc1;
  
  // Multiplier config check
  const confirmFollowup = answers['confirm_followup'];
  const multCfg = config?.multiplierConfig || {};
  if (confirmFollowup !== undefined && multCfg.enabled) {
    const table = multCfg.confirmationMultipliersByAnswer || [0, 0.1, 0.25, 0.4, 0.6];
    const boost = table[confirmFollowup] || 0;
    if (boost > 0) {
      maniaScore = Math.min(4, maniaScore + maniaScore * boost);
      depressionScore = Math.min(4, depressionScore + depressionScore * boost);
      moodScore = Math.min(4, moodScore + moodScore * boost);
    }
  }
  
  // Stress → mania bridge
  if (multCfg.enabled && (multCfg.stressManiaBoost || 0) > 0) {
    const threshold = multCfg.stressManiaThreshold || 2.0;
    if (stressScore > threshold) {
      const bridge = (stressScore - threshold) * multCfg.stressManiaBoost;
      maniaScore = Math.min(4, maniaScore + bridge);
    }
  }
  
  const sleepAns = answers['pt9'] ?? 0;
  const sleepMap = [7, 5.5, 4.5, 3.5, 2];
  const sleepHours = sleepMap[sleepAns] ?? 7;
  
  const irritabilityScore = answers['pt10'] ?? 0;
  
  return {
    maniaScore,
    depressionScore,
    moodScore,
    stressScore,
    sleepHours,
    irritabilityScore,
    nearBirthday: dateCtx.nearBirthday || false,
    cyclePhase: dateCtx.cyclePhase || null,
  };
}

// ─── Evaluate branching rules with dynamic sections ────────────────────────
export async function evaluateBranchingRules(answers, questions, activeRuleIds = null, customRules = [], hardcodedRules = DEFAULT_BRANCHING_RULES, dateCtx = {}, conditionOverrides = {}) {
  const ctx = computeContext(answers, questions, dateCtx);
  
  const hardcodedFiltered = activeRuleIds
    ? hardcodedRules.filter(q => activeRuleIds.includes(q._id || q.id))
    : hardcodedRules;
  
  const triggered = [];
  for (const q of hardcodedFiltered) {
    try {
      const override = conditionOverrides[q._id || q.id];
      let fires;
      if (override?.conditionOverride) {
        fires = evaluateCustomCondition(override.conditionOverride.condition, ctx, answers);
      } else {
        fires = evaluateCondition(q.condition, ctx, answers);
      }
      if (fires) triggered.push(q);
    } catch (_) {}
  }
  
  // Custom Firestore rules
  for (const rule of customRules) {
    try {
      if (!rule.active) continue;
      if (evaluateCustomCondition(rule.condition, ctx, answers)) {
        triggered.push({
          _id: rule._id,
          question: rule.question,
          options: rule.options,
          measures: rule.measures,
          type: rule.type,
          _stage: 'branch',
          _custom: true,
        });
      }
    } catch (_) {}
  }
  
  return { triggered, context: ctx };
}

// ─── Evaluate custom condition ────────────────────────────────────────────
export function evaluateCustomCondition(condition, context, answers = {}) {
  if (!condition) return false;
  const { operator, threshold, conditionType, dimension, questionId } = condition;
  let value;
  if (conditionType === 'answer') {
    value = answers[questionId] ?? 0;
  } else {
    value = context[dimension] ?? 0;
  }
  switch (operator) {
    case '>=': return value >= threshold;
    case '>': return value > threshold;
    case '<=': return value <= threshold;
    case '<': return value < threshold;
    case '==': return value === threshold;
    default: return false;
  }
}

// ─── Detect inconsistencies ────────────────────────────────────────────────
export function detectInconsistencies(answers, context) {
  const list = [];
  const { sleepHours, maniaScore, depressionScore, irritabilityScore } = context;
  
  if (sleepHours < 5 && maniaScore > 2 && irritabilityScore >= 3) {
    list.push({ type: 'mania_pattern', message: 'Patrón de manía: sueño reducido, energía alta e irritabilidad', severity: 'high' });
  }
  if (sleepHours > 9 && depressionScore >= 2) {
    list.push({ type: 'depression_pattern', message: 'Patrón depresivo: sueño excesivo y síntomas de depresión', severity: 'high' });
  }
  if (depressionScore >= 2 && maniaScore >= 2) {
    list.push({ type: 'mixed_state', message: 'Posible estado mixto: síntomas depresivos y maníacos simultáneos', severity: 'medium' });
  }
  if (maniaScore >= 3 || depressionScore >= 3) {
    list.push({ type: 'severe_symptoms', message: 'Síntomas severos — considerar consultar al equipo de salud', severity: 'high' });
  }
  const psychosisAns = answers['psychosis_screen'] ?? -1;
  if (psychosisAns >= 2) {
    list.push({ type: 'psychosis_risk', message: 'Posibles síntomas psicóticos reportados — comunicarse con el equipo de salud de inmediato', severity: 'critical' });
  }
  return list;
}

// ─── Build dynamic flow from Firestore sections ───────────────────────────
export async function buildDynamicFlow(role, config = {}, options = {}) {
  const sections = await getCompositeSections({ includeDisabled: options.includeDisabled || false });
  const branchingRules = await getBranchingRules();
  const moduleConfig = await getModuleConfig();
  const compositeConfig = await getCompositeConfig();
  
  const finalConfig = { ...compositeConfig, moduleConfig: moduleConfig.reduce((acc, m) => ({ ...acc, [m._id]: m }), {}) };
  
  if (sections.length === 0) {
    // Fallback to hardcoded flow
    return {
      sections: DEFAULT_SECTIONS,
      branchingRules: DEFAULT_BRANCHING_RULES,
      config: finalConfig,
      usingDefaults: true,
    };
  }
  
  // Group sections by type and role
  const groupedSections = {};
  sections.forEach(section => {
    const type = section.type || 'module';
    if (!groupedSections[type]) groupedSections[type] = {};
    const roleKey = section.role === 'both' ? 'both' : section.role || 'patient';
    if (!groupedSections[type][roleKey]) groupedSections[type][roleKey] = [];
    
    const sectionQuestions = (section.questions || [])
      .filter(q => q.enabled !== false)
      .map(q => ({
        ...q,
        _stage: section._id,
        _sectionName: section.name,
      }));
    
    if (role === 'both' || section.role === 'both' || section.role === role) {
      groupedSections[type][roleKey].push(...sectionQuestions);
    }
  });
  
  return {
    sections: groupedSections,
    rawSections: sections,
    branchingRules,
    moduleConfig,
    config: finalConfig,
    usingDefaults: false,
  };
}