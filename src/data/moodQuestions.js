// Test comprensivo de ánimo — basado en PHQ-9 + GAD-7 + indicadores bipolares
// Escala Likert 0-4. reversed:true → primera opción = sin síntoma (score 0)

export const moodQuestions = [
  // ── Depresión (PHQ-9 adaptado) ────────────────────────────────────────────
  {
    id: 'mc1',
    question: 'En las últimas 24 horas, ¿cómo describirías tu estado de ánimo general?',
    options: [
      'Bien, como siempre',
      'Un poco triste o vacía',
      'Bastante triste la mayor parte del día',
      'Muy deprimida casi todo el día',
      'Sin esperanza, completamente desesperada',
    ],
    measures: 'depression',
  },
  {
    id: 'mc2',
    question: '¿Pudiste disfrutar de las cosas que normalmente te gustan?',
    options: [
      'Sí, igual que siempre',
      'Un poco menos que lo normal',
      'Bastante menos que lo habitual',
      'Casi nada me dio placer',
      'Nada me generó ningún placer hoy',
    ],
    measures: 'depression',
  },
  {
    id: 'mc3',
    question: '¿Cómo está tu nivel de energía comparado con hace una semana?',
    options: [
      'Similar o con más energía',
      'Algo más cansada',
      'Bastante cansada',
      'Muy fatigada, me cuesta hacer cosas simples',
      'Sin energía, no puedo levantarme o moverme',
    ],
    measures: 'depression',
  },
  {
    id: 'mc4',
    question: '¿Podés pensar con claridad y tomar decisiones hoy?',
    options: [
      'Sí, con total claridad',
      'Con un poco de dificultad',
      'Me cuesta bastante concentrarme',
      'El pensamiento está muy lento o nublado',
      'No puedo tomar ninguna decisión',
    ],
    measures: 'depression',
  },
  {
    id: 'mc5',
    question: '¿Cómo te sentís respecto a vos misma hoy?',
    options: [
      'Bien conmigo misma',
      'Algo autocrítica',
      'Bastante mal, me siento inútil o culpable',
      'Muy mal, creo que soy una carga para todos',
      'Sin valor, completamente',
    ],
    measures: 'depression',
  },

  // ── Sueño ─────────────────────────────────────────────────────────────────
  {
    id: 'mc6',
    question: '¿Cuántas horas dormiste anoche?',
    options: [
      '7-9 horas (descansé bien)',
      '6-7 horas',
      'Más de 10 horas (no podía levantarme)',
      '5-6 horas',
      'Menos de 5 horas o casi no dormí',
    ],
    measures: 'sleep',
  },
  {
    id: 'mc7',
    question: '¿Cómo fue la calidad de tu sueño?',
    options: [
      'Muy buen descanso',
      'Bastante bien',
      'Regular',
      'Mal, me desperté varias veces',
      'Muy mal, apenas descansé',
    ],
    measures: 'sleep',
  },

  // ── Depresión somática ────────────────────────────────────────────────────
  {
    id: 'mc8',
    question: '¿Cómo se siente tu cuerpo cuando te movés o hablás hoy?',
    options: [
      'Normal o ágil',
      'Un poco más lento que lo habitual',
      'Bastante lento, me cuesta moverme',
      'Muy lento, las cosas simples demandan mucho esfuerzo',
      'No puedo o no quiero moverme',
    ],
    measures: 'depression',
  },
  {
    id: 'mc9',
    question: '¿Cómo estuvo tu apetito hoy?',
    options: [
      'Normal',
      'Comí un poco más o menos que lo habitual',
      'Comí bastante menos (sin hambre)',
      'Casi no comí nada',
      'Comí en exceso sin poder parar',
    ],
    measures: 'depression',
  },

  // ── Ansiedad (GAD-7 adaptado) ─────────────────────────────────────────────
  {
    id: 'mc10',
    question: '¿Cómo describirías tu nivel de nerviosismo o ansiedad hoy?',
    options: [
      'Tranquila, sin ansiedad',
      'Algo nerviosa',
      'Bastante ansiosa o inquieta',
      'Muy ansiosa, me cuesta calmarme',
      'Ansiedad extrema o ataques de pánico',
    ],
    measures: 'anxiety',
  },
  {
    id: 'mc11',
    question: '¿Con qué frecuencia tu mente fue invadida por preocupaciones que no podías detener?',
    options: [
      'Casi nunca',
      'Algunas veces',
      'Bastante seguido',
      'La mayor parte del día',
      'Constantemente, no pude pensar en otra cosa',
    ],
    measures: 'anxiety',
  },
  {
    id: 'mc12',
    question: '¿Tuviste síntomas físicos de ansiedad (palpitaciones, tensión, falta de aire, sudoración)?',
    options: [
      'Ninguno',
      'Muy leves',
      'Moderados, molestos pero manejables',
      'Intensos, me interrumpieron actividades',
      'Muy intensos o incapacitantes',
    ],
    measures: 'anxiety',
  },

  // ── Estado mixto / Disforia ───────────────────────────────────────────────
  {
    id: 'mc13',
    question: '¿Qué tan fácil fue que algo te molestara o irritara hoy?',
    options: [
      'Nada me molestó',
      'Poco, reaccioné normal',
      'Me irrité con facilidad',
      'Muy irritable, pequeñas cosas me enojaron mucho',
      'Explosiva o con rabia difícil de controlar',
    ],
    measures: 'mixed_features',
  },
  {
    id: 'mc14',
    question: '¿Experimentaste estar "acelerada" o agitada pero al mismo tiempo sintiéndote muy mal o deprimida?',
    options: [
      'No, estoy bien',
      'Apenas un poco',
      'Sí, algo de agitación con tristeza',
      'Bastante, me sentí al borde',
      'Mucho, fue muy difícil tolerar esa mezcla',
    ],
    measures: 'mixed_features',
  },

  // ── Crisis (screening) ────────────────────────────────────────────────────
  {
    id: 'mc15',
    question: '¿Tuviste pensamientos de que sería mejor no estar, de hacerte daño, o de que las cosas no tienen sentido?',
    options: [
      'No, ninguno',
      'Un pensamiento fugaz que no me preocupó',
      'Algunos pensamientos que me perturbaron',
      'Pensamientos frecuentes aunque no actué',
      'Pensamientos muy intensos o planes concretos',
    ],
    measures: 'depression',
  },

  // ── Pensamiento ───────────────────────────────────────────────────────────
  {
    id: 'mc16',
    question: '¿A qué velocidad van tus pensamientos hoy?',
    options: [
      'Normal',
      'Algo lentos o nublados',
      'Muy lentos, me cuesta hilar ideas',
      'Algo acelerados o saltando de tema',
      'Muy acelerados (no puedo pararlos)',
    ],
    measures: 'mixed_features',
  },

  // ── Actividad / Motivación ────────────────────────────────────────────────
  {
    id: 'mc17',
    question: '¿Pudiste hacer las cosas que tenías planeadas hoy?',
    options: [
      'Sí, hice todo lo planeado',
      'Hice la mayoría',
      'Hice menos de la mitad',
      'Hice muy poco, me costó mucho empezar',
      'No pude hacer nada, estuve paralizada',
    ],
    measures: 'depression',
    reversed: true,
  },
  {
    id: 'mc18',
    question: '¿Cómo fue tu deseo de hablar o estar con otras personas?',
    options: [
      'Normal o con ganas de socializar',
      'Algo más callada que lo habitual',
      'Preferí estar sola y evité conversaciones',
      'Me retiré casi completamente',
      'No quiero ver ni hablar con nadie',
    ],
    measures: 'depression',
  },
];

export const moodDimLabels = {
  depression: 'Depresión',
  anxiety: 'Ansiedad',
  sleep: 'Sueño',
  mixed_features: 'Estado Mixto',
};
