export const caregiverQuestions = [
  { id: 'cg1', name: 'Cambio de actividad', question: '¿Cambio de actividad cada cuánto tiempo?', options: ['Estable (1+ hora)', 'Normal (30-60 min)', 'Frecuente (15-30 min)', 'Muy frecuente (5-15 min)', 'Constante (cada min)'], measures: 'distractibility' },
  { id: 'cg2', name: 'Horas de sueño', question: '¿Cuántas horas durmió anoche?', options: ['6+ horas', '5-6 horas', '4-5 horas', '3-4 horas', '< 3 horas'], measures: 'sleep' },
  { id: 'cg3', name: 'Irritabilidad observada', question: 'Nivel de irritabilidad observado', options: ['Muy calmada', 'Calmada', 'Normal', 'Irritable', 'Muy irritable'], measures: 'irritability' },
  { id: 'cg4', name: 'Conflicto/Confrontación', question: 'Nivel de conflicto/confrontación', options: ['Ninguno', 'Mínimo', 'Moderado', 'Bastante', 'Extremo'], measures: 'conflict' },
  { id: 'cg5', name: 'Velocidad del habla', question: '¿Qué tan rápido habla?', options: ['Más lento que normal', 'Normal', 'Un poco más rápido', 'Bastante más rápido', 'Muy rápido, atropellada'], measures: 'pressured_speech' },
  { id: 'cg6', name: 'Impulsos de compra/acción', question: '¿Impulsos de comprar/hacer cosas?', options: ['No hay impulsos', 'Mínimos', 'Algunos', 'Muchos', 'Constantes'], measures: 'impulsivity' },
  { id: 'cg7', name: 'Nivel de energía', question: '¿Parece aburrida o acelerada?', options: ['Muy tranquila', 'Tranquila', 'Normal', 'Acelerada', 'Muy acelerada'], measures: 'energy' },
  { id: 'cg8', name: 'Grandiosidad', question: 'Nivel de grandiosidad (sobreestima capacidades)', options: ['Humilde', 'Normal', 'Confiada', 'Exagerada', 'Delirante'], measures: 'grandiosity' },
  { id: 'cg9', name: 'Fuga de ideas', question: '¿Fuga de ideas (salta de tema constantemente)?', options: ['No', 'Raramente', 'A veces', 'Frecuentemente', 'Constantemente'], measures: 'flight_of_ideas' },
  { id: 'cg10', name: 'Capacidad de concentración', question: '¿Capaz de concentrarse en una actividad?', options: ['Muy capaz', 'Capaz', 'Normal', 'Con dificultad', 'Muy difícil'], measures: 'distractibility', reversed: true },
];

export const patientQuestions = [
  { id: 'pt1', name: 'Nuevos proyectos', question: '¿Cuántos proyectos o ideas nuevas en la última hora?', options: ['Ninguno', '1-2', '3-5', '6-10', 'Más de 10'], measures: 'flight_of_ideas' },
  { id: 'pt2', name: 'Cambio de opinión', question: '¿Con qué frecuencia cambias de opinión?', options: ['Casi nunca', 'A veces', 'Bastante', 'Muy frecuentemente', 'Constantemente'], measures: 'impulsivity' },
  { id: 'pt3', name: 'Auto-importancia', question: '¿Cuán importante es tu opinión?', options: ['Poco importante', 'Algo importante', 'Importante', 'Muy importante', 'La más importante'], measures: 'grandiosity' },
  { id: 'pt4', name: 'Velocidad del habla', question: '¿Qué tan rápido hablas?', options: ['Más lento', 'Normal', 'Un poco más rápido', 'Bastante más rápido', 'Muy rápido'], measures: 'pressured_speech' },
  { id: 'pt5', name: 'Multitarea', question: '¿Cuántas cosas intentas hacer al mismo tiempo?', options: ['Una', '2', '3', '4-5', '6 o más'], measures: 'distractibility' },
  { id: 'pt6', name: 'Compras impulsivas', question: '¿Qué tan seguido quieres comprar sin pensar?', options: ['Raramente', 'Ocasionalmente', 'Regularmente', 'Frecuentemente', 'Constantemente'], measures: 'impulsivity' },
  { id: 'pt7', name: 'Nivel de energía', question: '¿Cuánta energía tienes vs hace 1 semana?', options: ['Mucha menos', 'Menos', 'Similar', 'Más', 'Muchísima más'], measures: 'energy' },
  { id: 'pt8', name: 'Facilidad de concentración', question: '¿Qué tan fácil es concentrarte?', options: ['Muy fácil', 'Fácil', 'Normal', 'Difícil', 'Muy difícil'], measures: 'distractibility', reversed: true },
  { id: 'pt9', name: 'Horas de sueño', question: '¿Cuántas horas dormiste anoche?', options: ['6+ horas', '5-6 horas', '4-5 horas', '3-4 horas', '< 3 horas'], measures: 'sleep' },
  { id: 'pt10', name: 'Irritabilidad', question: 'Hoy, ¿qué tan fácil es que algo te moleste?', options: ['Nada me molesta', 'Poco', 'Normal', 'Me irrito con facilidad', 'Todo me irrita'], measures: 'irritability' },
  { id: 'pt11', name: 'Conflictos/Discusiones', question: '¿Cuántas veces tuviste roces o discusiones hoy?', options: ['Ninguna', '1', '2', '3-4', '5 o más'], measures: 'conflict' },
  { id: 'pt12', name: 'Atención sostenida', question: '¿Cuánto tiempo puedes sostener atención en algo?', options: ['1 hora o más', '30-60 min', '15-30 min', '5-15 min', 'Menos de 5 min'], measures: 'distractibility', reversed: true },
];

export const dimLabels = {
  distractibility: 'Concentración',
  irritability: 'Irritabilidad',
  impulsivity: 'Impulsividad',
  grandiosity: 'Grandiosidad',
  pressured_speech: 'Lenguaje Presionado',
  flight_of_ideas: 'Fuga de Ideas',
  energy: 'Energía/Aceleración',
  sleep: 'Sueño',
  conflict: 'Conflicto',
};

// score: 0 = sin síntomas, 4 = máxima severidad
// reversed: la primera opción es la mejor (score 0 → 4 normal)
//           con reversed: true, la primera opción es la peor → se invierte
// multiplier: peso relativo de la pregunta en su dimensión (default 1.0)
// answerMultipliers: amplificador por índice de respuesta (default [1,1,1,1,1])
export function calcSeverity(responses, questions) {
  const maxIdx = 4;
  const buckets = {}; // { [measures]: { sum, totalWeight } }

  questions.forEach((q) => {
    if (responses[q.id] === undefined) return;
    const raw = responses[q.id];
    const baseScore = q.reversed ? maxIdx - raw : raw;
    const answerMult = (q.answerMultipliers ?? [1, 1, 1, 1, 1])[raw] ?? 1;
    const qWeight = q.multiplier ?? 1;
    const effectiveScore = baseScore * answerMult;

    if (!buckets[q.measures]) buckets[q.measures] = { sum: 0, totalWeight: 0 };
    buckets[q.measures].sum += effectiveScore * qWeight;
    buckets[q.measures].totalWeight += qWeight;
  });

  const avg = {};
  Object.keys(buckets).forEach((k) => {
    const b = buckets[k];
    avg[k] = b.totalWeight > 0 ? b.sum / b.totalWeight : 0;
  });

  const vals = Object.values(avg);
  const overall = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  return { byDimension: avg, overall };
}

export function maniaLevel(score) {
  if (score < 1.5) return { label: 'Bajo', color: '#10b981' };
  if (score < 3) return { label: 'Moderado', color: '#f59e0b' };
  return { label: 'Elevado', color: '#ef4444' };
}
