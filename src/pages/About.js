import { Card, CardTitle } from '../components/ui/Card';

const SECTIONS = [
  {
    title: '¿Qué es el trastorno bipolar?',
    body: `El trastorno bipolar (TB) es una condición crónica del estado de ánimo caracterizada por episodios de manía o hipomanía alternados con episodios de depresión, con períodos de estabilidad entre ellos.

Afecta al 1–3% de la población mundial. Con tratamiento adecuado, la mayoría de las personas con TB pueden llevar una vida plena y funcional.`,
  },
  {
    title: 'Tipos principales',
    items: [
      { label: 'Bipolar I', desc: 'Al menos un episodio maníaco completo (puede incluir hospitalización). Los episodios depresivos son frecuentes pero no obligatorios para el diagnóstico.' },
      { label: 'Bipolar II', desc: 'Episodios hipomaníacos (manía más leve, sin pérdida completa del juicio) y episodios depresivos. Sin episodios maníacos completos.' },
      { label: 'Ciclotimia', desc: 'Fluctuaciones crónicas de humor durante 2 o más años, sin alcanzar criterios completos de episodio maníaco ni depresivo.' },
    ],
  },
  {
    title: 'Síntomas de la fase maníaca',
    items: [
      { label: 'Euforia o irritabilidad excesiva', desc: 'Estado de ánimo elevado, grandiosidad o irritación intensa.' },
      { label: 'Aumento de energía', desc: 'Actividad física y mental mucho mayor a lo habitual, con poca necesidad de dormir.' },
      { label: 'Pensamiento acelerado', desc: 'Fuga de ideas, cambios frecuentes de tema, habla rápida y presionada.' },
      { label: 'Impulsividad', desc: 'Gastos excesivos, decisiones apresuradas, comportamientos de riesgo.' },
      { label: 'Grandiosidad', desc: 'Creencia exagerada en las propias capacidades o importancia.' },
    ],
  },
  {
    title: 'Síntomas de la fase depresiva',
    items: [
      { label: 'Tristeza persistente', desc: 'Estado de ánimo deprimido la mayor parte del día, casi todos los días.' },
      { label: 'Anhedonia', desc: 'Pérdida del placer o interés en actividades que antes generaban disfrute.' },
      { label: 'Fatiga y enlentecimiento', desc: 'Agotamiento físico y mental, movimientos y pensamiento más lentos.' },
      { label: 'Dificultad para concentrarse', desc: 'Problemas para tomar decisiones, atención disminuida.' },
      { label: 'Pensamientos negativos', desc: 'Sentimientos de inutilidad, culpa excesiva, desesperanza.' },
      { label: 'Pensamientos de muerte', desc: 'En casos graves, puede haber pensamientos suicidas que requieren atención inmediata.' },
    ],
  },
  {
    title: 'Tratamiento',
    body: `El trastorno bipolar requiere tratamiento integral y continuo:

• Medicación: Los estabilizadores del ánimo (litio, valproato, lamotrigina) son la base. Los antipsicóticos atípicos se usan en episodios agudos. La medicación debe tomarse de forma continua, no solo durante los episodios.

• Psicoterapia: La terapia cognitivo-conductual, la psicoeducación y la terapia de ritmos interpersonales y sociales han demostrado eficacia como complemento a la medicación.

• Monitoreo: El registro regular de síntomas (como esta app) ayuda al paciente y al equipo médico a detectar cambios tempranamente.

• Red de apoyo: La participación de familia y cuidadores informados mejora significativamente los resultados del tratamiento.`,
  },
  {
    title: 'Mitos comunes',
    items: [
      { label: 'Mito: "Los bipolares son violentos o peligrosos"', desc: 'Falso. La gran mayoría de las personas con TB no tiene comportamientos violentos. La estigmatización dificulta que busquen ayuda.' },
      { label: 'Mito: "Si están bien es porque se curaron"', desc: 'Falso. Los períodos de estabilidad son parte del curso del trastorno. La medicación debe mantenerse incluso cuando la persona se siente bien.' },
      { label: 'Mito: "El TB es solo tener cambios de humor"', desc: 'Falso. Los episodios duran días, semanas o meses. No son simples cambios de estado de ánimo cotidianos.' },
      { label: 'Mito: "Solo los adultos tienen TB"', desc: 'Falso. El TB puede manifestarse en la adolescencia, aunque el diagnóstico infantil es complejo y requiere evaluación especializada.' },
    ],
  },
];

export default function About() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy-700 dark:text-white">Sobre el Trastorno Bipolar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Información clínica para pacientes y cuidadores</p>
      </div>

      {SECTIONS.map(({ title, body, items }) => (
        <Card key={title}>
          <CardTitle>{title}</CardTitle>
          {body && (
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{body}</div>
          )}
          {items && (
            <div className="space-y-2">
              {items.map(({ label, desc }) => (
                <div key={label} className="flex gap-3 items-start">
                  <span className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-navy-700 dark:text-white">{label}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2 pb-4">
        Esta información es educativa y no reemplaza la consulta médica profesional.
      </p>
    </div>
  );
}
