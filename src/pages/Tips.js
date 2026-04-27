import { useState } from 'react';
import { TrendingUp, TrendingDown, Sun } from 'lucide-react';
import { Card } from '../components/ui/Card';

const PHASES = [
  { key: 'mania', label: 'Manía', Icon: TrendingUp, color: 'text-amber-600', activeBg: 'bg-amber-500 text-white' },
  { key: 'depression', label: 'Depresión', Icon: TrendingDown, color: 'text-teal-600', activeBg: 'bg-teal-600 text-white' },
  { key: 'stable', label: 'Estable', Icon: Sun, color: 'text-emerald-600', activeBg: 'bg-emerald-500 text-white' },
];

const TIPS = {
  mania: [
    {
      title: 'Mantener rutinas fijas',
      body: 'Los horarios regulares de sueño, comida y actividad ayudan a moderar la aceleración. Intentar acostarse y levantarse a la misma hora, incluso si hay poca necesidad de dormir.',
    },
    {
      title: 'Reducir la estimulación',
      body: 'Evitar cafeína, alcohol, pantallas brillantes por la noche y entornos muy ruidosos o socialmente intensos. El cerebro ya está sobreactivado.',
    },
    {
      title: 'Pausar antes de tomar decisiones grandes',
      body: 'En manía la impulsividad aumenta mucho. Acordar con el equipo de salud y el cuidador "pausar 48 horas" antes de tomar decisiones económicas, laborales o personales importantes.',
    },
    {
      title: 'Señales de alerta tempranas',
      body: 'Detectar señales propias: dormir menos sin sentir cansancio, hablar más rápido, proyectos nuevos constantes, euforia excesiva, irritabilidad. Registrar en el diario de síntomas.',
    },
    {
      title: 'Contactar al psiquiatra ante señales',
      body: 'No esperar a que el episodio sea severo. Un ajuste de medicación temprano puede prevenir la hospitalización. El cuidador puede contactar al médico si la persona no lo hace.',
    },
    {
      title: 'El cuidador debe cuidarse también',
      body: 'Los episodios maníacos son agotadores para la familia. Pedir ayuda a otros familiares, tener un plan de crisis acordado previamente, y consultar grupos de apoyo para familiares.',
    },
  ],
  depression: [
    {
      title: 'Activación conductual gradual',
      body: 'En depresión, esperar "ganas" antes de actuar no funciona. Acordar pequeñas actividades agradables o rutinas mínimas (ducha, salir a caminar 10 minutos) y hacerlas aunque no haya motivación.',
    },
    {
      title: 'Mantener conexión social aunque sea difícil',
      body: 'El aislamiento empeora la depresión. Un mensaje breve, una llamada corta o compartir silencio con alguien de confianza puede ayudar sin requerir mucha energía.',
    },
    {
      title: 'No tomar decisiones importantes en este momento',
      body: 'La depresión distorsiona la perspectiva hacia lo negativo. Posponer decisiones importantes (laborales, relacionales, económicas) para cuando el estado de ánimo sea más estable.',
    },
    {
      title: 'Sueño y ritmo circadiano',
      body: 'La hipersomnia (dormir demasiado) también es problemática. Intentar levantarse a hora fija aunque haya somnolencia diurna, y reducir siestas largas.',
    },
    {
      title: 'Observar señales de alarma',
      body: 'Pensamientos de no querer estar, de hacerse daño, o desesperanza intensa requieren atención inmediata. Llamar al 113 (Salud en Línea MINSA, Perú) o ir a urgencias.',
    },
    {
      title: 'Para el cuidador: presencia sin presión',
      body: 'No empujar a "animarse" o "tener actitud positiva". Ofrecer compañía sin expectativas. Preguntar directamente "¿estás teniendo pensamientos de hacerte daño?" no aumenta el riesgo — al contrario, abre el diálogo.',
    },
  ],
  stable: [
    {
      title: 'Consolidar hábitos en la estabilidad',
      body: 'Los períodos estables son el mejor momento para construir hábitos saludables: ejercicio regular, sueño consistente, alimentación equilibrada. Estos protegen contra futuros episodios.',
    },
    {
      title: 'No abandonar la medicación',
      body: 'Sentirse bien puede generar la tentación de reducir o suspender la medicación. Esto es uno de los principales factores de recaída. Cualquier cambio debe coordinarse con el psiquiatra.',
    },
    {
      title: 'Plan de crisis escrito',
      body: 'Aprovechar el período estable para escribir un plan de crisis: señales de alarma personales, contactos de emergencia, medicación de rescate acordada, quién toma decisiones si hay incapacidad temporal.',
    },
    {
      title: 'Psicoeducación y grupos de apoyo',
      body: 'Aprender sobre el trastorno bipolar reduce la estigmatización y mejora el manejo. Buscar recursos del INSM Honorio Delgado-Hideyo Noguchi en Perú, libros o terapia psicoeducativa.',
    },
    {
      title: 'Monitoreo preventivo',
      body: 'Mantener el registro de síntomas incluso en estabilidad. Los cambios sutiles en sueño, energía o humor pueden detectar pródromes (señales previas) de un episodio antes de que se instale.',
    },
    {
      title: 'Fortalecer la red de apoyo',
      body: 'Hablar con familiares y amigos de confianza sobre qué señales observar y cómo ayudar. Una red informada actúa mejor en crisis y reduce el peso sobre el cuidador principal.',
    },
  ],
};

export default function Tips() {
  const [phase, setPhase] = useState('mania');

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy-700 dark:text-white">Consejos por Fase</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Orientación práctica para cuidadores y pacientes</p>
      </div>

      {/* Selector de fase */}
      <div className="flex gap-2 mb-4">
        {PHASES.map(({ key, label, Icon, activeBg }) => (
          <button
            key={key}
            onClick={() => setPhase(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer border ${
              phase === key
                ? `${activeBg} border-transparent shadow-sm`
                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-600 hover:border-slate-300 dark:hover:border-navy-500'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tips */}
      <div className="space-y-3">
        {TIPS[phase].map(({ title, body }, i) => (
          <Card key={i}>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-navy-700 dark:text-white text-sm mb-1">{title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
