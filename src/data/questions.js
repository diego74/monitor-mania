export const caregiverQuestions = [
  { id: 'cg1', question: '¿Cambio de actividad cada cuánto tiempo?', options: ['Estable (1+ hora)', 'Normal (30-60 min)', 'Frecuente (15-30 min)', 'Muy frecuente (5-15 min)', 'Constante (cada min)'], measures: 'distractibility' },
  { id: 'cg2', question: '¿Cuántas horas durmió anoche?', options: ['6+ horas', '5-6 horas', '4-5 horas', '3-4 horas', '< 3 horas'], measures: 'sleep' },
  { id: 'cg3', question: 'Nivel de irritabilidad observado', options: ['Muy calmada', 'Calmada', 'Normal', 'Irritable', 'Muy irritable'], measures: 'irritability' },
  { id: 'cg4', question: 'Nivel de conflicto/confrontación', options: ['Ninguno', 'Mínimo', 'Moderado', 'Bastante', 'Extremo'], measures: 'conflict' },
  { id: 'cg5', question: '¿Qué tan rápido habla?', options: ['Más lento que normal', 'Normal', 'Un poco más rápido', 'Bastante más rápido', 'Muy rápido, atropellada'], measures: 'pressured_speech' },
  { id: 'cg6', question: '¿Impulsos de comprar/hacer cosas?', options: ['No hay impulsos', 'Mínimos', 'Algunos', 'Muchos', 'Constantes'], measures: 'impulsivity' },
  { id: 'cg7', question: '¿Parece aburrida o acelerada?', options: ['Muy tranquila', 'Tranquila', 'Normal', 'Acelerada', 'Muy acelerada'], measures: 'energy' },
  { id: 'cg8', question: 'Nivel de grandiosidad (sobreestima capacidades)', options: ['Humilde', 'Normal', 'Confiada', 'Exagerada', 'Delirante'], measures: 'grandiosity' },
  { id: 'cg9', question: '¿Fuga de ideas (salta de tema constantemente)?', options: ['No', 'Raramente', 'A veces', 'Frecuentemente', 'Constantemente'], measures: 'flight_of_ideas' },
  { id: 'cg10', question: '¿Capaz de concentrarse en una actividad?', options: ['Muy capaz', 'Capaz', 'Normal', 'Con dificultad', 'Muy difícil'], measures: 'distractibility', reversed: true },
];

export const patientQuestions = [
  { id: 'pt1', question: '¿Cuántos proyectos o ideas nuevas en la última hora?', options: ['Ninguno', '1-2', '3-5', '6-10', 'Más de 10'], measures: 'flight_of_ideas' },
  { id: 'pt2', question: '¿Con qué frecuencia cambias de opinión?', options: ['Casi nunca', 'A veces', 'Bastante', 'Muy frecuentemente', 'Constantemente'], measures: 'impulsivity' },
  { id: 'pt3', question: '¿Cuán importante es tu opinión?', options: ['Poco importante', 'Algo importante', 'Importante', 'Muy importante', 'La más importante'], measures: 'grandiosity' },
  { id: 'pt4', question: '¿Qué tan rápido hablas?', options: ['Más lento', 'Normal', 'Un poco más rápido', 'Bastante más rápido', 'Muy rápido'], measures: 'pressured_speech' },
  { id: 'pt5', question: '¿Cuántas cosas intentas hacer al mismo tiempo?', options: ['Una', '2', '3', '4-5', '6 o más'], measures: 'distractibility' },
  { id: 'pt6', question: '¿Qué tan seguido quieres comprar sin pensar?', options: ['Raramente', 'Ocasionalmente', 'Regularmente', 'Frecuentemente', 'Constantemente'], measures: 'impulsivity' },
  { id: 'pt7', question: '¿Cuánta energía tienes vs hace 1 semana?', options: ['Mucha menos', 'Menos', 'Similar', 'Más', 'Muchísima más'], measures: 'energy' },
  { id: 'pt8', question: '¿Qué tan fácil es concentrarte?', options: ['Muy fácil', 'Fácil', 'Normal', 'Difícil', 'Muy difícil'], measures: 'distractibility', reversed: true },
  { id: 'pt9', question: '¿Cuántas horas dormiste anoche?', options: ['6+ horas', '5-6 horas', '4-5 horas', '3-4 horas', '< 3 horas'], measures: 'sleep' },
  { id: 'pt10', question: 'Hoy, ¿qué tan fácil es que algo te moleste?', options: ['Nada me molesta', 'Poco', 'Normal', 'Me irrito con facilidad', 'Todo me irrita'], measures: 'irritability' },
  { id: 'pt11', question: '¿Cuántas veces tuviste roces o discusiones hoy?', options: ['Ninguna', '1', '2', '3-4', '5 o más'], measures: 'conflict' },
  { id: 'pt12', question: '¿Cuánto tiempo puedes sostener atención en algo?', options: ['1 hora o más', '30-60 min', '15-30 min', '5-15 min', 'Menos de 5 min'], measures: 'distractibility', reversed: true },
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
export function calcSeverity(responses, questions) {
  const maxIdx = 4;
  const scores = {};
  questions.forEach((q) => {
    if (responses[q.id] !== undefined) {
      const raw = responses[q.id];
      const score = q.reversed ? maxIdx - raw : raw;
      if (!scores[q.measures]) scores[q.measures] = [];
      scores[q.measures].push(score);
    }
  });
  const avg = {};
  Object.keys(scores).forEach((k) => {
    avg[k] = scores[k].reduce((a, b) => a + b, 0) / scores[k].length;
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
