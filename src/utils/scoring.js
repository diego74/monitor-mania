// Re-exports from questions.js for backward compat + new mood scoring
export { calcSeverity, maniaLevel, dimLabels } from '../data/questions.js';

export function maniaLevelTailwind(score) {
  if (score < 1.5) return { label: 'Estable',        bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' };
  if (score < 2.2) return { label: 'Hipomanía',      bg: 'bg-sky-100',     text: 'text-sky-800',     dot: 'bg-sky-500' };
  if (score < 2.8) return { label: 'Manía moderada', bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500' };
  if (score < 3.5) return { label: 'Manía grave',    bg: 'bg-rose-100',    text: 'text-rose-800',    dot: 'bg-rose-500' };
  return           { label: 'Alerta psicosis',        bg: 'bg-violet-100',  text: 'text-violet-800',  dot: 'bg-violet-500' };
}

export function calcMoodSeverity(responses, questions) {
  const maxIdx = 4;
  const buckets = {
    depression:     { sum: 0, totalWeight: 0 },
    anxiety:        { sum: 0, totalWeight: 0 },
    sleep:          { sum: 0, totalWeight: 0 },
    mixed_features: { sum: 0, totalWeight: 0 },
    stress:         { sum: 0, totalWeight: 0 },
  };

  questions.forEach((q) => {
    if (responses[q.id] === undefined) return;
    const raw = responses[q.id];
    const baseScore = q.reversed ? maxIdx - raw : raw;
    const answerMult = (q.answerMultipliers ?? [1, 1, 1, 1, 1])[raw] ?? 1;
    const qWeight = q.multiplier ?? 1;
    const b = buckets[q.measures];
    if (!b) return;
    b.sum += baseScore * answerMult * qWeight;
    b.totalWeight += qWeight;
  });

  const avg = (b) => b.totalWeight > 0 ? b.sum / b.totalWeight : 0;

  const depressionScore    = avg(buckets.depression);
  const anxietyScore       = avg(buckets.anxiety);
  const sleepScore         = avg(buckets.sleep);
  const mixedFeaturesScore = avg(buckets.mixed_features);
  const stressScore        = avg(buckets.stress);

  const overall =
    depressionScore * 0.4 +
    anxietyScore    * 0.25 +
    mixedFeaturesScore * 0.2 +
    sleepScore      * 0.15;

  // MC15 es la pregunta de pensamientos oscuros/crisis
  const mc15Raw = responses['mc15'];
  const mc15Score = mc15Raw !== undefined
    ? (questions.find(q => q.id === 'mc15')?.reversed ? maxIdx - mc15Raw : mc15Raw)
    : 0;
  const crisis_flag = mc15Score >= 3;

  return { depressionScore, anxietyScore, sleepScore, mixedFeaturesScore, stressScore, overall, crisis_flag };
}

export function moodPhaseLabel(scores) {
  const { depressionScore, anxietyScore, mixedFeaturesScore } = scores;
  if (depressionScore >= 3 || mixedFeaturesScore >= 3) return 'crisis';
  if (depressionScore >= 2) return 'depresion_moderada';
  if (depressionScore >= 1) return 'depresion_leve';
  if (anxietyScore >= 2) return 'ansiedad';
  if (mixedFeaturesScore >= 2) return 'mixto';
  return 'estable';
}

export function moodLevelTailwind(depressionScore) {
  if (depressionScore < 1.0) return { label: 'Estable', bg: 'bg-emerald-100', text: 'text-emerald-800' };
  if (depressionScore < 2.0) return { label: 'Leve', bg: 'bg-amber-100', text: 'text-amber-800' };
  if (depressionScore < 3.0) return { label: 'Moderado', bg: 'bg-orange-100', text: 'text-orange-800' };
  return { label: 'Severo', bg: 'bg-rose-100', text: 'text-rose-800' };
}
