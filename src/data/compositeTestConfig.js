import { calcSeverity, caregiverQuestions } from './questions';
import { calcMoodSeverity } from '../utils/scoring';
import { moodQuestions } from './moodQuestions';
import { depressionCaregiverQuestions } from './depressionQuestions';

// ─── Measures → _origin mapping ───────────────────────────────────────────────
export const MEASURES_TO_ORIGIN = {
  impulsivity:    'mania',
  energy:         'mania',
  irritability:   'mania',
  psychosis:      'mania',
  grandiosity:    'mania',
  social_drive:   'mania',
  mixed_features: 'mood',
  anxiety:        'mood',
  depression:     'mood',
  stress:         'mood',
  // crisis, general, mood → null (no scoring)
};

// ─── Deterministic shuffle ─────────────────────────────────────────────────
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function shuffleArray(array, seed) {
  const rand = (s) => { const x = Math.sin(s++) * 10000; return x - Math.floor(x); };
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand(seed) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
    seed++;
  }
  return arr;
}

// ─── Stage 0: Gateway (always shown, 4 questions) ─────────────────────────
export const stage0Questions = [
  {
    id: 'pt9',
    question: '¿Cuántas horas dormiste anoche?',
    options: ['6+ horas', '5-6 horas', '4-5 horas', '3-4 horas', '< 3 horas'],
    measures: 'sleep',
    _origin: 'mania',
    _stage: 'gateway',
    // Señal fuerte de manía: dormir < 3h amplifica el score considerablemente
    multiplier: 1.5,
    answerMultipliers: [1, 1, 1.1, 1.3, 1.6],
  },
  {
    id: 'mc1',
    question: '¿Cómo describirías tu estado de ánimo general hoy?',
    options: ['Bien, equilibrada', 'Un poco triste', 'Bastante triste', 'Muy deprimida', 'Sin esperanza'],
    measures: 'depression',
    _origin: 'mood',
    _stage: 'gateway',
    multiplier: 1.2,
    answerMultipliers: [1, 1, 1.1, 1.3, 1.5],
  },
  {
    id: 'pt7',
    question: '¿Qué tan energética te sentís comparado con ayer?',
    options: ['Mucha menos energía', 'Menos', 'Igual', 'Más', 'Muchísima más energía'],
    measures: 'energy',
    _origin: 'mania',
    _stage: 'gateway',
    multiplier: 1.2,
    answerMultipliers: [1, 1, 1, 1.1, 1.4],
  },
  {
    id: 'pt10',
    question: '¿Qué tan fácil es que algo te irrite hoy?',
    options: ['Nada me irrita', 'Poco', 'Normal', 'Me irrito con facilidad', 'Todo me irrita'],
    measures: 'irritability',
    _origin: 'mania',
    _stage: 'gateway',
    multiplier: 1.3,
    answerMultipliers: [1, 1, 1, 1.2, 1.5],
  },
];

// ─── Stage 1A: Mania module (if maniaScore >= 2.2) ─────────────────────────
export const maniaModuleQuestions = [
  {
    id: 'pt1',
    question: '¿Cuántas ideas nuevas o proyectos tuviste hoy?',
    options: ['Ninguno', '1-2', '3-5', '6-10', 'Más de 10'],
    measures: 'flight_of_ideas',
    _origin: 'mania',
    _stage: 'mania',
  },
  {
    id: 'pt4',
    question: '¿Qué tan rápido hablás comparado con lo normal?',
    options: ['Más lento', 'Normal', 'Un poco más rápido', 'Bastante más rápido', 'Muy rápido'],
    measures: 'pressured_speech',
    _origin: 'mania',
    _stage: 'mania',
  },
  {
    id: 'mc16',
    question: '¿A qué velocidad van tus pensamientos hoy?',
    options: ['Normal', 'Un poco lentos', 'Muy lentos', 'Un poco acelerados', 'Muy acelerados'],
    measures: 'mixed_features',
    _origin: 'mood',
    _stage: 'mania',
  },
];

// ─── Stage 1A': Hypomania module (if 1.5 <= maniaScore < 2.2) ─────────────
export const hypomaniaModuleQuestions = [
  {
    id: 'hypo1',
    question: '¿Te sentís más optimista o con más confianza de lo habitual?',
    options: ['No, igual que siempre', 'Un poco más', 'Bastante más', 'Mucho más', 'Extremadamente más'],
    measures: 'grandiosity',
    _origin: 'mania',
    _stage: 'hypomania',
  },
  {
    id: 'hypo2',
    question: '¿Estás más sociable o con ganas de conectar con gente que de costumbre?',
    options: ['Para nada', 'Un poco más de lo normal', 'Bastante más', 'Mucho más', 'Extremadamente sociable'],
    measures: 'social_drive',
    _origin: 'mania',
    _stage: 'hypomania',
  },
  {
    id: 'hypo3',
    question: '¿Sentís que necesitás dormir menos pero igual tenés energía durante el día?',
    options: ['No, necesito mi horario normal', 'Un poco menos y me siento bien', 'Definitivamente duermo menos sin cansarme', 'Mucho menos sueño y llena de energía', 'Casi no dormí pero me siento activa'],
    measures: 'sleep',
    _origin: 'mania',
    _stage: 'hypomania',
  },
];

// ─── Stage 1B: Depression module (if depressionScore > 1.5) ───────────────
export const depressionModuleQuestions = [
  {
    id: 'mc4',
    question: '¿Podés concentrarte y tomar decisiones hoy?',
    options: ['Sí, con claridad', 'Con algo de dificultad', 'Me cuesta bastante', 'Muy difícil', 'No puedo decidir'],
    measures: 'depression',
    _origin: 'mood',
    _stage: 'depression',
  },
  {
    id: 'mc17',
    question: '¿Pudiste hacer las cosas que planeaste hoy?',
    options: ['Sí, todo', 'La mayoría', 'La mitad', 'Muy poco', 'Nada'],
    measures: 'depression',
    _origin: 'mood',
    _stage: 'depression',
  },
  {
    id: 'mc10',
    question: '¿Qué tan nerviosa o ansiosa te sentís?',
    options: ['Tranquila', 'Algo nerviosa', 'Bastante ansiosa', 'Muy ansiosa', 'Ansiedad extrema'],
    measures: 'anxiety',
    _origin: 'mood',
    _stage: 'depression',
  },
  {
    id: 'stress1',
    question: '¿Qué tan estresada te sentís hoy?',
    options: ['Nada estresada', 'Un poco estresada', 'Bastante estresada', 'Muy estresada', 'Estrés extremo'],
    measures: 'stress',
    _origin: 'mood',
    _stage: 'depression',
  },
];

// ─── Psychosis module (triggered by psychosis_screen branching) ───────────
export const psychosisModuleQuestions = [
  {
    id: 'psych1',
    question: '¿Sentís que tenés una misión especial o poderes que otros no comprenden?',
    options: ['No', 'Un pensamiento pasajero', 'Varias veces hoy', 'Creo que sí con convicción', 'Estoy completamente segura'],
    measures: 'psychosis',
    _origin: 'mania',
    _stage: 'psychosis',
  },
  {
    id: 'psych2',
    question: '¿Escuchaste voces o viste cosas que otros a tu alrededor no perciben?',
    options: ['No', 'No estoy segura', 'Una vez hoy', 'Varias veces', 'Con frecuencia'],
    measures: 'psychosis',
    _origin: 'mania',
    _stage: 'psychosis',
  },
];

// ─── Confirmatory (stable result, shown when nothing is elevated) ──────────
export const confirmationQuestion = {
  id: 'confirm_stable',
  question: '¿Hay algo más que quieras registrar sobre cómo te sentís hoy?',
  options: ['No, todo bien', 'Me siento un poco diferente', 'Tengo algo de inquietud', 'Sí, no estoy tan bien', 'Estoy bastante mal'],
  measures: 'general',
  _origin: 'mood',
  _stage: 'confirmation',
};

// ─── Confirmation follow-up (shown if confirm_stable >= 2) ────────────────
export const confirmationFollowUpQuestion = {
  id: 'confirm_followup',
  question: '¿Cuánto está afectando ese malestar tu día a día?',
  options: [
    'Casi nada, puedo seguir mi rutina',
    'Un poco, noto algo diferente',
    'Bastante, me cuesta mantener el ritmo',
    'Mucho, el día se hace difícil',
    'Totalmente, no puedo funcionar bien',
  ],
  measures: 'general',
  _origin: 'mood',
  _stage: 'confirmation',
};

export const confirmationFollowUpQuestionCaregiver = {
  id: 'confirm_followup',
  question: '¿Cuánto está afectando ese malestar el día de Daniela?',
  options: [
    'Casi nada, puede seguir su rutina',
    'Un poco, noto algo diferente en ella',
    'Bastante, le cuesta mantener el ritmo',
    'Mucho, el día se le hace difícil',
    'Totalmente, no puede funcionar bien',
  ],
  measures: 'general',
  _origin: 'mood',
  _stage: 'confirmation',
};

// ─── Branching questions (crisis / validation / contextual) ──────────────
export const branchingQuestions = [
  {
    id: 'mixed_state',
    question: '¿Sentís que estás agitada y triste al mismo tiempo?',
    options: ['No', 'Un poco', 'Bastante', 'Mucho', 'Extremadamente'],
    measures: 'mixed_features',
    type: 'mixed',
    _stage: 'branch',
    condition: (ctx) => ctx.depressionScore >= 3 && ctx.maniaScore >= 3,
  },
  {
    id: 'val_energy',
    question: 'A pesar de dormir poco, ¿te sentís con mucha energía?',
    options: ['No', 'Un poco', 'Bastante', 'Sí, mucha', 'Extremadamente'],
    measures: 'energy',
    type: 'validation',
    _stage: 'branch',
    condition: (ctx) => ctx.sleepHours < 4,
  },
  {
    id: 'impulsivity',
    question: '¿Hiciste compras o gastos impulsivos últimamente?',
    options: ['No', 'Una cosa pequeña', 'Algunas', 'Muchas', 'Excesivamente'],
    measures: 'impulsivity',
    type: 'risk',
    _stage: 'branch',
    condition: (ctx) => ctx.maniaScore >= 3,
  },
  {
    id: 'psychosis_screen',
    question: '¿Tuviste pensamientos o percepciones que otros no comparten, o sentiste que todo tiene un significado especial para vos?',
    options: ['No', 'Una o dos veces', 'Varias veces', 'Con frecuencia', 'Constantemente'],
    measures: 'psychosis',
    type: 'crisis',
    _stage: 'branch',
    triggersModule: 'psychosis',
    condition: (ctx) => ctx.maniaScore >= 3.0,
  },
  {
    id: 'suicidal_risk',
    question: '¿Tuviste pensamientos de que sería mejor no vivir?',
    options: ['No', 'Pensamientos leves', 'Pensamientos recurrentes', 'Con planes', 'Acciones tomadas'],
    measures: 'crisis',
    type: 'crisis',
    _stage: 'branch',
    condition: (ctx) => ctx.depressionScore >= 3,
  },
  {
    id: 'birthday_month',
    question: '¿Cómo te sentís en relación a tu cumpleaños este mes?',
    options: ['Bien, lo disfruto', 'Indiferente', 'Un poco melancólica', 'Ansiosa', 'Muy afectada'],
    measures: 'mood',
    type: 'mixed',
    _stage: 'branch',
    conditionLabel: 'Mes de cumpleaños (del perfil del paciente)',
    condition: (ctx) => ctx.nearBirthday === true,
  },
  {
    id: 'cycle_premenstrual',
    question: '¿Cómo estás notando tu cuerpo y emociones en estos días del ciclo?',
    options: ['Normal', 'Algo más sensible', 'Bastante irritable', 'Muy intensa emocionalmente', 'Muy difícil'],
    measures: 'irritability',
    type: 'validation',
    _stage: 'branch',
    conditionLabel: 'Fase premenstrual (últimos 7 días del ciclo configurado)',
    condition: (ctx) => ctx.cyclePhase === 'premenstrual',
  },
];

// ─── Module map (for triggersModule resolution) ───────────────────────────
export const MODULE_MAP = {
  psychosis: {
    patient:   psychosisModuleQuestions,
    caregiver: null, // resolved below after caregiver versions are defined
  },
  hypomania: {
    patient:   hypomaniaModuleQuestions,
    caregiver: null, // resolved below
  },
};

// ─── Compute context from answers ─────────────────────────────────────────
// dateCtx: optional { nearBirthday: bool, cyclePhase: 'premenstrual'|'luteal'|null }
// config: optional { confirmationMultiplier: number }
export function computeContext(answers, questions, dateCtx = {}, config = {}) {
  const maniaQ = questions.filter(q => q._origin === 'mania' && !q.isDistractor);
  const moodQ  = questions.filter(q => q._origin === 'mood'  && !q.isDistractor);

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

  // Also treat high mood score as depression signal
  if (depressionScore === 0 && moodScore > 0) depressionScore = moodScore;

  // Derive depressionScore from mc1 answer directly if available
  const mc1 = answers['mc1'];
  if (mc1 != null && mc1 > depressionScore) depressionScore = mc1;

  // ── Multiplicador de confirmación mejorado ──────────────────────────────────
  const confirmFollowup = answers['confirm_followup'];
  const multConfig = config.multiplierConfig ?? {};
  if (confirmFollowup !== undefined && multConfig.enabled) {
    const table = multConfig.confirmationMultipliersByAnswer ?? [0, 0.1, 0.25, 0.4, 0.6];
    const boost = table[confirmFollowup] ?? 0;
    if (boost > 0) {
      maniaScore      = Math.min(4, maniaScore      + maniaScore      * boost);
      depressionScore = Math.min(4, depressionScore + depressionScore * boost);
      moodScore       = Math.min(4, moodScore       + moodScore       * boost);
    }
  } else if (config.confirmationMultiplier && confirmFollowup !== undefined) {
    // Fallback al scalar legacy
    const mult = config.confirmationMultiplier * (confirmFollowup / 4);
    depressionScore = Math.max(depressionScore, depressionScore * (1 + mult));
  }

  // ── Puente estrés → manía ───────────────────────────────────────────────────
  if (multConfig.enabled && (multConfig.stressManiaBoost ?? 0) > 0) {
    const threshold = multConfig.stressManiaThreshold ?? 2.0;
    if (stressScore > threshold) {
      const bridge = (stressScore - threshold) * multConfig.stressManiaBoost;
      maniaScore = Math.min(4, maniaScore + bridge);
    }
  }

  // Sleep hours from pt9 numeric answer
  const sleepAns = answers['pt9'] ?? 0;
  const sleepMap = [7, 5.5, 4.5, 3.5, 2];
  const sleepHours = sleepMap[sleepAns] ?? 7;

  // Individual dimension scores
  let irritabilityScore = answers['pt10'] ?? 0;

  return {
    maniaScore, depressionScore, moodScore, stressScore, sleepHours, irritabilityScore,
    nearBirthday: dateCtx.nearBirthday ?? false,
    cyclePhase: dateCtx.cyclePhase ?? null,
  };
}

// ─── Compute which stage to inject next ───────────────────────────────────
export function computeNextStage(answers, baseQuestions, overrides = {}, dateCtx = {}, config = {}) {
  const ctx = computeContext(answers, baseQuestions, dateCtx, config);
  const maniaThreshold = config.maniaThreshold ?? 1.5;
  const depressElevated = ctx.depressionScore > (config.depressionThreshold ?? 1.5);

  // Hypomania vs full mania split at 2.2 (matches maniaLevelTailwind thresholds)
  const hypomaniaThreshold = config.hypomaniaThreshold ?? 2.2;
  const maniaHigh  = ctx.maniaScore >= hypomaniaThreshold;
  const maniaHypo  = ctx.maniaScore >= maniaThreshold && ctx.maniaScore < hypomaniaThreshold;

  const maniaQ     = overrides.maniaQ     ?? maniaModuleQuestions;
  const hypomaniaQ = overrides.hypomaniaQ ?? hypomaniaModuleQuestions;
  const depressQ   = overrides.depressQ   ?? depressionModuleQuestions;
  const confirmQ   = overrides.confirmQ   ?? confirmationQuestion;

  if (!maniaHigh && !maniaHypo && !depressElevated) {
    return { stageName: 'confirmation', questions: [confirmQ], context: ctx };
  }

  const next = [];
  if (maniaHigh)       next.push(...maniaQ);
  else if (maniaHypo)  next.push(...hypomaniaQ);
  if (depressElevated) next.push(...depressQ);

  const seen = new Set();
  const unique = next.filter(q => { if (seen.has(q.id)) return false; seen.add(q.id); return true; });

  return { stageName: 'modules', questions: unique, context: ctx };
}

// ─── Evaluate branching rules (with optional config filtering + condition overrides) ─
export function evaluateBranchingRules(answers, questions, activeRuleIds = null, customRules = [], hardcodedRules = branchingQuestions, dateCtx = {}, conditionOverrides = {}) {
  const ctx = computeContext(answers, questions, dateCtx);

  const hardcodedFiltered = activeRuleIds
    ? hardcodedRules.filter(q => activeRuleIds.includes(q.id))
    : hardcodedRules;

  const triggered = [];
  for (const q of hardcodedFiltered) {
    try {
      const override = conditionOverrides[q.id];
      let fires;
      if (override?.conditionOverride) {
        fires = evaluateCustomCondition(override.conditionOverride.condition, ctx, answers);
      } else {
        fires = q.condition(ctx);
      }
      if (fires) triggered.push(q);
    } catch (_) {}
  }

  // Evaluate custom Firestore rules
  for (const rule of customRules) {
    try {
      if (!rule.active) continue;
      if (evaluateCustomCondition(rule.condition, ctx, answers)) {
        triggered.push({
          id: rule._id,
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

// ─── Evaluate a Firestore custom condition ────────────────────────────────
export function evaluateCustomCondition(condition, context, answers = {}) {
  if (!condition) return false;
  const { operator, threshold } = condition;
  let value;
  if (condition.conditionType === 'answer') {
    value = answers[condition.questionId] ?? 0;
  } else {
    value = context[condition.dimension] ?? 0;
  }
  switch (operator) {
    case '>=': return value >= threshold;
    case '>':  return value > threshold;
    case '<=': return value <= threshold;
    case '<':  return value < threshold;
    case '==': return value === threshold;
    default:   return false;
  }
}

// ─── Detect inconsistency patterns ────────────────────────────────────────
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
    list.push({ type: 'severe_symptoms', message: 'Síntomas severos — considerá consultar al equipo de salud', severity: 'high' });
  }
  const psychosisAns = answers['psychosis_screen'] ?? -1;
  if (psychosisAns >= 2) {
    list.push({ type: 'psychosis_risk', message: 'Posibles síntomas psicóticos reportados — comunicarse con el equipo de salud de inmediato', severity: 'critical' });
  }
  return list;
}

// ─── Caregiver-framed question sets ──────────────────────────────────────
export const stage0QuestionsCaregiver = [
  {
    id: 'pt9',
    question: '¿Cuántas horas durmió Daniela anoche?',
    options: ['6+ horas', '5-6 horas', '4-5 horas', '3-4 horas', '< 3 horas'],
    measures: 'sleep',
    _origin: 'mania',
    _stage: 'gateway',
  },
  {
    id: 'mc1',
    question: '¿Cómo describirías su estado de ánimo general hoy?',
    options: ['Bien, equilibrada', 'Un poco triste', 'Bastante triste', 'Muy deprimida', 'Sin esperanza'],
    measures: 'depression',
    _origin: 'mood',
    _stage: 'gateway',
  },
  {
    id: 'pt7',
    question: '¿Qué tan activa o enérgica la ves hoy?',
    options: ['Con muy poca energía', 'Menos activa de lo normal', 'Normal', 'Más activa de lo normal', 'Muy acelerada o desbordada'],
    measures: 'energy',
    _origin: 'mania',
    _stage: 'gateway',
  },
  {
    id: 'pt10',
    question: '¿Qué tan irritable o sensible la notás hoy?',
    options: ['Muy tranquila', 'Poco irritable', 'Normal', 'Bastante irritable', 'Muy irritable'],
    measures: 'irritability',
    _origin: 'mania',
    _stage: 'gateway',
  },
];

export const maniaModuleQuestionsCaregiver = [
  {
    id: 'pt1',
    question: '¿Cuántas ideas nuevas o proyectos mencionó hoy?',
    options: ['Ninguno', '1-2', '3-5', '6-10', 'Más de 10'],
    measures: 'flight_of_ideas',
    _origin: 'mania',
    _stage: 'mania',
  },
  {
    id: 'pt4',
    question: '¿Habla más rápido de lo normal?',
    options: ['Más lento', 'Normal', 'Un poco más rápido', 'Bastante más rápido', 'Muy rápido'],
    measures: 'pressured_speech',
    _origin: 'mania',
    _stage: 'mania',
  },
  {
    id: 'mc16',
    question: '¿Cómo la notás en cuanto a velocidad de pensamiento o distracción?',
    options: ['Normal', 'Un poco lenta', 'Muy lenta', 'Un poco acelerada', 'Muy acelerada'],
    measures: 'mixed_features',
    _origin: 'mood',
    _stage: 'mania',
  },
];

export const hypomaniaModuleQuestionsCaregiver = [
  {
    id: 'hypo1',
    question: '¿La notás más optimista o segura de sí misma de lo habitual?',
    options: ['No, igual que siempre', 'Un poco más', 'Bastante más', 'Mucho más', 'Extremadamente más'],
    measures: 'grandiosity',
    _origin: 'mania',
    _stage: 'hypomania',
  },
  {
    id: 'hypo2',
    question: '¿La ves más sociable o con más ganas de relacionarse que de costumbre?',
    options: ['Para nada', 'Un poco más de lo normal', 'Bastante más', 'Mucho más', 'Extremadamente sociable'],
    measures: 'social_drive',
    _origin: 'mania',
    _stage: 'hypomania',
  },
  {
    id: 'hypo3',
    question: '¿Parece que duerme menos pero igual tiene energía durante el día?',
    options: ['No, duerme su horario normal', 'Un poco menos y se ve bien', 'Definitivamente duerme menos sin cansarse', 'Mucho menos sueño y llena de energía', 'Casi no durmió pero se ve activa'],
    measures: 'sleep',
    _origin: 'mania',
    _stage: 'hypomania',
  },
];

export const depressionModuleQuestionsCaregiver = [
  {
    id: 'mc4',
    question: '¿La notás concentrada y capaz de tomar decisiones?',
    options: ['Sí, con claridad', 'Con algo de dificultad', 'Le cuesta bastante', 'Muy difícil', 'No puede decidir'],
    measures: 'depression',
    _origin: 'mood',
    _stage: 'depression',
  },
  {
    id: 'mc17',
    question: '¿Pudo hacer las cosas que tenía planeadas?',
    options: ['Sí, todo', 'La mayoría', 'La mitad', 'Muy poco', 'Nada'],
    measures: 'depression',
    _origin: 'mood',
    _stage: 'depression',
  },
  {
    id: 'mc10',
    question: '¿Qué tan nerviosa o ansiosa la notás?',
    options: ['Tranquila', 'Algo nerviosa', 'Bastante ansiosa', 'Muy ansiosa', 'Ansiedad extrema'],
    measures: 'anxiety',
    _origin: 'mood',
    _stage: 'depression',
  },
  {
    id: 'stress1',
    question: '¿Qué tan estresada la notás hoy?',
    options: ['Nada estresada', 'Un poco estresada', 'Bastante estresada', 'Muy estresada', 'Estrés extremo'],
    measures: 'stress',
    _origin: 'mood',
    _stage: 'depression',
  },
];

export const psychosisModuleQuestionsCaregiver = [
  {
    id: 'psych1',
    question: '¿Expresó tener una misión especial o poderes que otros no comprenden?',
    options: ['No', 'Un comentario pasajero', 'Varias veces hoy', 'Lo afirma con convicción', 'Está completamente convencida'],
    measures: 'psychosis',
    _origin: 'mania',
    _stage: 'psychosis',
  },
  {
    id: 'psych2',
    question: '¿Mencionó escuchar voces o ver cosas que vos no podés percibir?',
    options: ['No', 'No está segura', 'Una vez hoy', 'Varias veces', 'Con frecuencia'],
    measures: 'psychosis',
    _origin: 'mania',
    _stage: 'psychosis',
  },
];

export const confirmationQuestionCaregiver = {
  id: 'confirm_stable',
  question: '¿Hay algo más que quieras registrar sobre cómo la ves hoy?',
  options: ['No, todo bien', 'La veo un poco diferente', 'Tiene algo de inquietud', 'No la veo tan bien', 'La veo bastante mal'],
  measures: 'general',
  _origin: 'mood',
  _stage: 'confirmation',
};

export const branchingQuestionsCaregiver = [
  {
    id: 'mixed_state',
    question: '¿La notás agitada y triste al mismo tiempo?',
    options: ['No', 'Un poco', 'Bastante', 'Mucho', 'Extremadamente'],
    measures: 'mixed_features',
    type: 'mixed',
    _stage: 'branch',
    condition: (ctx) => ctx.depressionScore >= 3 && ctx.maniaScore >= 3,
  },
  {
    id: 'val_energy',
    question: 'A pesar de dormir poco, ¿la ves con mucha energía?',
    options: ['No', 'Un poco', 'Bastante', 'Sí, mucha', 'Extremadamente'],
    measures: 'energy',
    type: 'validation',
    _stage: 'branch',
    condition: (ctx) => ctx.sleepHours < 4,
  },
  {
    id: 'impulsivity',
    question: '¿Hizo compras o gastos impulsivos últimamente?',
    options: ['No', 'Una cosa pequeña', 'Algunas', 'Muchas', 'Excesivamente'],
    measures: 'impulsivity',
    type: 'risk',
    _stage: 'branch',
    condition: (ctx) => ctx.maniaScore >= 3,
  },
  {
    id: 'psychosis_screen',
    question: '¿Notaste que habla de cosas que no tienen sentido para el resto, o cree cosas que parecen fuera de la realidad?',
    options: ['No', 'Una o dos veces', 'Varias veces', 'Con frecuencia', 'Constantemente'],
    measures: 'psychosis',
    type: 'crisis',
    _stage: 'branch',
    triggersModule: 'psychosis',
    condition: (ctx) => ctx.maniaScore >= 3.0,
  },
  {
    id: 'suicidal_risk',
    question: '¿Expresó pensamientos de que sería mejor no vivir?',
    options: ['No', 'Comentarios leves', 'Comentarios recurrentes', 'Con planes', 'Acciones tomadas'],
    measures: 'crisis',
    type: 'crisis',
    _stage: 'branch',
    condition: (ctx) => ctx.depressionScore >= 3,
  },
];

// Resolve caregiver module map references
MODULE_MAP.psychosis.caregiver = psychosisModuleQuestionsCaregiver;
MODULE_MAP.hypomania.caregiver = hypomaniaModuleQuestionsCaregiver;

// ─── All questions (for answer display in history) ────────────────────────
export const ALL_QUESTIONS = [
  ...stage0Questions,
  ...maniaModuleQuestions,
  ...hypomaniaModuleQuestions,
  ...depressionModuleQuestions,
  ...psychosisModuleQuestions,
  ...branchingQuestions,
  ...stage0QuestionsCaregiver,
  ...maniaModuleQuestionsCaregiver,
  ...hypomaniaModuleQuestionsCaregiver,
  ...depressionModuleQuestionsCaregiver,
  ...psychosisModuleQuestionsCaregiver,
  ...branchingQuestionsCaregiver,
  confirmationQuestion,
  confirmationFollowUpQuestion,
  confirmationQuestionCaregiver,
  confirmationFollowUpQuestionCaregiver,
].reduce((map, q) => { map[q.id] = map[q.id] ?? q; return map; }, {});

// ─── Caregiver full questions (unchanged) ────────────────────────────────
const distractorQuestions = [
  {
    id: 'dist_weather',
    question: '¿Cómo describirías el clima de hoy?',
    options: ['Soleado', 'Nublado', 'Lluvioso', 'Ventoso', 'No lo sé'],
    measures: 'distractor',
    isDistractor: true,
    _origin: 'distractor',
    _stage: 'distractor',
  },
];

export function getCaregiverCompositeQuestions(dateString, patientId = 'default') {
  const base = [
    ...caregiverQuestions.map(q => ({ ...q, _origin: 'mania', _stage: 'caregiver' })),
    ...moodQuestions.map(q => ({ ...q, _origin: 'mood', _stage: 'caregiver' })),
    ...depressionCaregiverQuestions.map(q => ({ ...q, _origin: 'depression', _stage: 'caregiver' })),
  ];

  const inserted = [];
  let di = 0;
  for (let i = 0; i < base.length; i++) {
    inserted.push(base[i]);
    if ((i + 1) % 6 === 0 && di < distractorQuestions.length) {
      inserted.push(distractorQuestions[di++]);
    }
  }

  const seed = hashCode(dateString + '_' + patientId);
  return shuffleArray(inserted, seed);
}
