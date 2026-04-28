import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ClipboardList, Save, ChevronRight, Loader } from 'lucide-react';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { getPatientProfile, savePatientProfile } from '../services/patientStorage';
import { useApp } from '../contexts/AppContext';

const SEXO_OPTIONS = ['Femenino', 'Masculino', 'No binario / Otro', 'Prefiero no decir'];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 transition-colors"
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 transition-colors"
    >
      <option value="">— Seleccionar —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 transition-colors resize-none"
    />
  );
}

const TABS = [
  { id: 'patient', label: 'Perfil del paciente', icon: User },
  { id: 'admin', label: 'Administración', icon: ClipboardList },
];

export default function Settings() {
  const { patientId } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('patient');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    nombre: 'Daniela',
    fechaNacimiento: '',
    sexo: 'Femenino',
    fechaDiagnostico: '',
    medicacion: '',
    cicloDuracion: '',
    cicloUltimaFecha: '',
    telefonoEmergencia: '',
    notasMedicas: '',
  });

  useEffect(() => {
    getPatientProfile(patientId)
      .then(data => {
        if (data) setForm(f => ({ ...f, ...data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  function set(field) {
    return value => setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await savePatientProfile(form, patientId);
      setMsg('Guardado correctamente.');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Error al guardar. Verificá la conexión.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy-700 dark:text-white">Configuración</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Perfil del paciente y opciones de administración</p>
      </div>

      {/* Tab bar */}
      {/* <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-navy-800 rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-white dark:bg-navy-700 text-navy-700 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div> */}

      {/* Patient profile tab */}
      {tab === 'patient' && (
        <div className="flex flex-col gap-4">
          {msg && <Alert variant={msg.startsWith('Error') ? 'error' : 'success'}>{msg}</Alert>}

          {loading ? (
            <Card>
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader size={20} className="text-teal-500 animate-spin" />
                <span className="text-sm text-slate-500">Cargando perfil...</span>
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <CardTitle>Datos personales</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre">
                    <Input value={form.nombre} onChange={set('nombre')} placeholder="Nombre del paciente" />
                  </Field>
                  <Field label="Fecha de nacimiento">
                    <Input type="date" value={form.fechaNacimiento} onChange={set('fechaNacimiento')} />
                  </Field>
                  <Field label="Sexo biológico">
                    <Select value={form.sexo} onChange={set('sexo')} options={SEXO_OPTIONS} />
                  </Field>
                  <Field label="Fecha de diagnóstico">
                    <Input type="date" value={form.fechaDiagnostico} onChange={set('fechaDiagnostico')} />
                  </Field>
                </div>
              </Card>

              <Card>
                <CardTitle>Medicación</CardTitle>
                <Field label="Medicación actual (nombre y dosis)">
                  <Textarea
                    value={form.medicacion}
                    onChange={set('medicacion')}
                    placeholder="Ej: Litio 600mg/día, Quetiapina 50mg noche..."
                    rows={3}
                  />
                </Field>
              </Card>

              <Card>
                <CardTitle>Ciclo menstrual</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Duración del ciclo (días)">
                    <Input
                      type="number"
                      value={form.cicloDuracion}
                      onChange={set('cicloDuracion')}
                      placeholder="Ej: 28"
                    />
                  </Field>
                  <Field label="Fecha del último período">
                    <Input type="date" value={form.cicloUltimaFecha} onChange={set('cicloUltimaFecha')} />
                  </Field>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Esta información ayuda a correlacionar cambios de ánimo con el ciclo hormonal.
                </p>
              </Card>

              <Card>
                <CardTitle>Contacto de emergencia y notas</CardTitle>
                <div className="flex flex-col gap-4">
                  <Field label="Teléfono de emergencia / psiquiatra">
                    <Input
                      type="tel"
                      value={form.telefonoEmergencia}
                      onChange={set('telefonoEmergencia')}
                      placeholder="Ej: +54 11 ..."
                    />
                  </Field>
                  <Field label="Notas médicas">
                    <Textarea
                      value={form.notasMedicas}
                      onChange={set('notasMedicas')}
                      placeholder="Observaciones, alergias, historia clínica relevante..."
                      rows={4}
                    />
                  </Field>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Guardando...' : 'Guardar perfil'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Admin tab */}
      {tab === 'admin' && (
        <div className="flex flex-col gap-3">
          <Card>
            <CardTitle>Administrar test adaptativo</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Preguntas, reglas de ramificación y configuración del test.
            </p>
            <button
              onClick={() => navigate('/admin/questions')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 bg-white dark:bg-navy-800 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={20} className="text-teal-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-navy-700 dark:text-white">Abrir administrador</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Preguntas · Ramificación · Configuración</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
