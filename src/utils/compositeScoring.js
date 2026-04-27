// Scoring para test compuesto con triple axis
import { calcSeverity } from '../data/questions';
import { calcMoodSeverity } from '../utils/scoring';

export function calcCompositeSeverity(answers, allQuestions, { collectAudit = false } = {}) {
  // Separar preguntas por módulo
  const maniaQ = allQuestions.filter(q => q._origin === 'mania');
  const moodQ = allQuestions.filter(q => q._origin === 'mood');
  const depressionQ = allQuestions.filter(q => q._origin === 'depression');

  const maniaScore = maniaQ.length ? calcSeverity(answers, maniaQ).overall : null;
  const moodScore = moodQ.length ? calcMoodSeverity(answers, moodQ).overall : null;
  const depressionScore = depressionQ.length ? calcSeverity(answers, depressionQ).overall : null;

  // Weights: mania 0.4, mood 0.35, depression 0.25 (ajustable)
  const weights = { mania: 0.4, mood: 0.35, depression: 0.25 };
  const validScores = [];
  const validWeights = [];

  if (maniaScore !== null) {
    validScores.push(maniaScore);
    validWeights.push(weights.mania);
  }
  if (moodScore !== null) {
    validScores.push(moodScore);
    validWeights.push(weights.mood);
  }
  if (depressionScore !== null) {
    validScores.push(depressionScore);
    validWeights.push(weights.depression);
  }

  const totalWeight = validWeights.reduce((a, b) => a + b, 0);
  const overall = validScores.length
    ? validScores.reduce((sum, score, i) => sum + score * validWeights[i], 0) / totalWeight
    : 0;

  let multipliersApplied = null;
  if (collectAudit) {
    const maxIdx = 4;
    multipliersApplied = allQuestions
      .filter(q => answers[q.id] !== undefined)
      .map(q => {
        const raw = answers[q.id];
        const baseScore = q.reversed ? maxIdx - raw : raw;
        const answerMult = (q.answerMultipliers ?? [1, 1, 1, 1, 1])[raw] ?? 1;
        const qWeight = q.multiplier ?? 1;
        return {
          questionId:      q.id,
          multiplier:      qWeight,
          answerMultiplier: answerMult,
          rawScore:        baseScore,
          effectiveScore:  parseFloat((baseScore * answerMult).toFixed(3)),
        };
      });
  }

  return {
    byModule: { mania: maniaScore, mood: moodScore, depression: depressionScore },
    overall: parseFloat(overall.toFixed(2)),
    ...(collectAudit ? { multipliersApplied } : {}),
  };
}

// Triple axis: Mente, Cuerpo, Social
export function computeTripleAxis(byDimension) {
  // Mente: concentración + fuga de ideas + lenguaje presionado
  const mind = [
    byDimension.distractibility ?? 0,
    byDimension.flight_of_ideas ?? 0,
    byDimension.pressured_speech ?? 0,
  ].reduce((a, b) => a + b, 0) / 3;

  // Cuerpo: energía + sueño + psicomotor (si existe)
  const body = [
    byDimension.energy ?? 0,
    byDimension.sleep ?? 0,
    byDimension.psychomotor ?? 0, // de depresión
  ].filter(v => v !== undefined).reduce((a, b) => a + b, 0) / 3;

  // Social: conflicto + irritabilidad + grandiosidad
  const social = [
    byDimension.conflict ?? 0,
    byDimension.irritability ?? 0,
    byDimension.grandiosity ?? 0,
  ].reduce((a, b) => a + b, 0) / 3;

  return {
    mind: parseFloat(mind.toFixed(2)),
    body: parseFloat(body.toFixed(2)),
    social: parseFloat(social.toFixed(2)),
  };
}

// Función para mood phase label (adaptado)
export function compositePhaseLabel(scores) {
  const { mania, mood, depression } = scores.byModule;
  if (mania && mania >= 3.5) return 'mania_psychosis';
  if (mania && mania >= 2.8) return 'mania_severe';
  if (mania && mania >= 2.2) return 'mania_moderate';
  if (mania && mania >= 1.5) return 'hypomania';
  if (depression && depression >= 3) return 'depression_severe';
  if (depression && depression >= 2) return 'depression_moderate';
  if (mood && mood >= 2) return 'mixed_features';
  return 'stable';
}

// Level para composite (basado en overall)
export function compositeLevelTailwind(overall) {
  if (overall < 1.0) return { label: 'Estable', bg: 'bg-emerald-100', text: 'text-emerald-800' };
  if (overall < 2.0) return { label: 'Leve', bg: 'bg-amber-100', text: 'text-amber-800' };
  if (overall < 3.0) return { label: 'Moderado', bg: 'bg-orange-100', text: 'text-orange-800' };
  return { label: 'Severo', bg: 'bg-rose-100', text: 'text-rose-800' };
}