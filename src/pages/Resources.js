import { Phone, AlertTriangle, BookOpen, Users, ExternalLink } from 'lucide-react';
import { Card, CardTitle } from '../components/ui/Card';

export default function Resources() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy-700 dark:text-white">Recursos de Ayuda</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Contactos de crisis y recursos de apoyo en Perú</p>
      </div>

      {/* Crisis */}
      <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
          <h2 className="font-bold text-rose-800 dark:text-rose-300">En caso de crisis</h2>
        </div>
        <div className="space-y-3">
          <a
            href="tel:113"
            className="flex items-center gap-3 bg-rose-600 text-white rounded-xl px-4 min-h-[56px] font-bold"
          >
            <Phone size={20} />
            <div>
              <p className="text-lg font-extrabold">113</p>
              <p className="text-xs font-normal opacity-90">Salud en Línea MINSA — Salud mental · Gratuito 24h</p>
            </div>
          </a>
          <a
            href="tel:106"
            className="flex items-center gap-3 bg-white dark:bg-navy-800 border border-rose-200 dark:border-rose-800 rounded-xl px-4 min-h-[56px]"
          >
            <Phone size={18} className="text-rose-500" />
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-300">106 — SAMU</p>
              <p className="text-xs text-rose-600 dark:text-rose-400">Servicio de Atención Móvil de Urgencias · Gratuito 24h</p>
            </div>
          </a>
          <a
            href="tel:105"
            className="flex items-center gap-3 bg-white dark:bg-navy-800 border border-rose-200 dark:border-rose-800 rounded-xl px-4 min-h-[56px]"
          >
            <Phone size={18} className="text-rose-500" />
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-300">105 — Policía Nacional del Perú</p>
              <p className="text-xs text-rose-600 dark:text-rose-400">Emergencias de seguridad</p>
            </div>
          </a>
          <a
            href="tel:116"
            className="flex items-center gap-3 bg-white dark:bg-navy-800 border border-rose-200 dark:border-rose-800 rounded-xl px-4 min-h-[56px]"
          >
            <Phone size={18} className="text-rose-500" />
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-300">116 — Bomberos</p>
              <p className="text-xs text-rose-600 dark:text-rose-400">Cuerpo General de Bomberos Voluntarios del Perú</p>
            </div>
          </a>
        </div>
      </div>

      {/* Organizaciones */}
      <Card>
        <CardTitle>Organizaciones de apoyo en Perú</CardTitle>
        <div className="space-y-3">
          {[
            {
              name: 'INSM Honorio Delgado-Hideyo Noguchi',
              desc: 'Instituto Nacional de Salud Mental — referencia nacional en salud mental, Lima.',
              url: 'https://www.insm.gob.pe',
            },
            {
              name: 'Socios en Salud Perú',
              desc: 'Partners in Health — salud mental comunitaria en zonas vulnerables.',
              url: 'https://www.sociosensalud.org.pe',
            },
            {
              name: 'Colegio de Psicólogos del Perú (CPSP)',
              desc: 'Directorio de psicólogos habilitados y recursos profesionales.',
              url: 'https://www.cpsp.pe',
            },
            {
              name: 'Telesalud MINSA',
              desc: 'Teleconsulta médica gratuita, incluye salud mental. Disponible vía app y web.',
              url: 'https://www.gob.pe/minsa',
            },
          ].map(({ name, desc, url }) => (
            <div key={name} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-navy-700 last:border-0">
              <Users size={16} className="text-teal-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-navy-700 dark:text-white text-sm">{name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-500 flex-shrink-0 cursor-pointer">
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Medicación */}
      <Card>
        <div className="flex items-start gap-3">
          <BookOpen size={18} className="text-teal-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-navy-700 dark:text-white text-sm mb-1">Recordatorio de medicación</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tomá la medicación todos los días a la misma hora, aunque te sientas bien.
              Si olvidaste una dosis, consultá con tu psiquiatra antes de tomar doble dosis.
              <br /><br />
              <strong>No suspendas la medicación sin consultar al médico</strong>, incluso en períodos de estabilidad.
            </p>
          </div>
        </div>
      </Card>

      {/* Guardia psiquiátrica */}
      <Card>
        <CardTitle>Cuándo ir a urgencias</CardTitle>
        <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          {[
            'Pensamientos de suicidio o de hacerse daño',
            'Incapacidad de reconocer la realidad (delirios, alucinaciones)',
            'Agitación intensa que no puede manejarse en casa',
            'Episodio maníaco severo sin respuesta a medicación habitual',
            'Depresión grave con incapacidad de cuidarse (no comer, no levantarse)',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
