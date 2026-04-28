// Scoring para test compuesto con triple axis


export function calcCompositeSeverity(answers, allQuestions) {
  // Map measures to modules
  const maniaMeasures = ['mania', 'energy', 'sleep', 'irritability', 'grandiosity', 'speech', 'distractibility'];
  const depressionMeasures = ['depression', 'anhedonia', 'sadness', 'fatigue', 'hopelessness'];
  const moodMeasures = ['mood', 'anxiety', 'stress'];

  const getModuleScore = (measures) => {
    const qInModule = allQuestions.filter(q => measures.includes(q.measures));
    if (!qInModule.length) return null;
    
    let total = 0;
    let count = 0;
    qInModule.forEach(q => {
      const qId = q._id || q.id;
      const ans = answers[qId];
      if (ans !== undefined) {
        // Normalize to 0-5 scale
        const maxVal = q.options.length - 1;
        const normalized = (ans / maxVal) * 5;
        total += normalized;
        count++;
      }
    });
    
    return count > 0 ? parseFloat((total / count).toFixed(2)) : null;
  };

  const mania = getModuleScore(maniaMeasures) || 0;
  const depression = getModuleScore(depressionMeasures) || 0;
  const baseMood = getModuleScore(moodMeasures) || 0;
  
  const mixedScore = Math.min(mania, depression);
  const mood = parseFloat(Math.max(baseMood, mixedScore).toFixed(2));

  // Stability is the net score: Mania - Depression (-5 to +5)
  const stability = parseFloat((mania - depression).toFixed(2));

  return {
    byModule: { mania, mood, depression },
    stability,
    overall: parseFloat(((mania + depression + mood) / 3).toFixed(2))
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