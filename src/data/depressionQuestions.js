export const depressionCaregiverQuestions = [
  { id: 'dep1', question: '¿Cómo describirías el estado de ánimo general de Daniela hoy?', options: ['Bien, equilibrada', 'Un poco apagada', 'Triste o melancólica', 'Muy baja', 'Sumamente deprimida'], measures: 'mood' },
  { id: 'dep2', question: '¿Cómo está su nivel de energía y motivación?', options: ['Con mucha energía', 'Energía normal', 'Un poco cansada', 'Muy poca energía', 'Sin energía, postrada'], measures: 'energy' },
  { id: 'dep3', question: '¿Cómo durmió anoche?', options: ['Bien (7-9 horas)', 'Aceptable', 'Irregular o poco', 'Muy mal o muy poco', 'Casi no durmió'], measures: 'sleep' },
  { id: 'dep4', question: '¿Cómo fue su apetito hoy?', options: ['Comió normal', 'Un poco menos de lo habitual', 'Bastante menos', 'Casi no comió', 'No comió nada'], measures: 'appetite' },
  { id: 'dep5', question: '¿Tuvo ganas de hacer actividades o salir?', options: ['Sí, con ganas', 'Poca motivación pero algo hizo', 'Le costó mucho salir de la cama', 'Prácticamente no hizo nada', 'Negativa a hacer cualquier cosa'], measures: 'withdrawal' },
  { id: 'dep6', question: '¿Cómo está su capacidad de concentrarse o pensar?', options: ['Sin problemas', 'Leve lentitud', 'Le cuesta concentrarse', 'Muy difícil pensar con claridad', 'No puede concentrarse'], measures: 'concentration' },
  { id: 'dep7', question: '¿Cómo está su velocidad de movimiento y habla?', options: ['Normal', 'Un poco más lenta', 'Notablemente más lenta', 'Muy enlentecida', 'Casi sin moverse ni hablar'], measures: 'psychomotor' },
  { id: 'dep8', question: '¿Expresa sentimientos de culpa, inutilidad o desesperanza?', options: ['No', 'Raramente', 'A veces', 'Frecuentemente', 'Constantemente'], measures: 'hopelessness' },
  { id: 'dep9', question: '¿Está más irritable o sensible de lo habitual?', options: ['No, está tranquila', 'Un poco más sensible', 'Bastante más irritable', 'Muy irritable', 'Extremadamente reactiva'], measures: 'irritability' },
  { id: 'dep10', question: '¿Cómo está su autocuidado (higiene, alimentación, medicación)?', options: ['Lo cuida bien', 'Descuido leve', 'Descuido moderado', 'Descuido importante', 'No se cuida en absoluto'], measures: 'self_care' },
];

export const depressionDimLabels = {
  mood:         'Estado de Ánimo',
  energy:       'Energía / Motivación',
  sleep:        'Sueño',
  appetite:     'Apetito',
  withdrawal:   'Actividad / Sociabilidad',
  concentration:'Concentración',
  psychomotor:  'Movimiento / Habla',
  hopelessness: 'Desesperanza / Culpa',
  irritability: 'Irritabilidad',
  self_care:    'Autocuidado',
};
