import { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardTitle, CardInfo } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TestForm } from '../components/test/TestForm';
import { caregiverQuestions, patientQuestions, calcSeverity } from '../data/questions';
import { saveCaregiver, savePatient, hasFilledToday, COLLECTION_NAMES } from '../services/storage';
import { useApp } from '../contexts/AppContext';

function useDebugMode() {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return false;
  return new URLSearchParams(hash.slice(qIdx + 1)).get('debug') === '1';
}

function ManiaDebugPanel({ responses, questions }) {
  const [collapsed, setCollapsed] = useState(false);
  const { overall } = calcSeverity(responses, questions);
  const answered = Object.keys(responses).length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-xl shadow-2xl overflow-hidden font-mono text-xs border border-teal-500">
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-navy-900 text-teal-400 font-bold"
      >
        <span>DEBUG</span>
        {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {!collapsed && (
        <div className="bg-navy-900/95 text-slate-300 p-3 space-y-2 max-h-80 overflow-y-auto">
          <div>maniaScore: <span className="text-amber-300">{typeof overall === 'number' ? overall.toFixed(2) : '—'}</span></div>
          <div>respondidas: <span className="text-teal-300">{answered}/{questions.length}</span></div>
          <div className="border-t border-navy-700 pt-2 space-y-0.5">
            {questions.map(q => (
              <div key={q.id} className={responses[q.id] !== undefined ? 'text-slate-200' : 'text-slate-600'}>
                {q.id}: {responses[q.id] !== undefined ? responses[q.id] : '—'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildPayload(responses, questions) {
  const { overall } = calcSeverity(responses, questions);
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    date: now.toLocaleDateString('es-AR'),
    severity: parseFloat(overall.toFixed(2)),
    ...responses,
  };
}

function FilledTodayBanner({ onContinue }) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center py-6 gap-4">
        <CheckCircle size={40} className="text-emerald-500" />
        <div>
          <h2 className="text-base font-bold text-navy-700 dark:text-white mb-1">Ya registraste este test hoy</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Podés hacer otro registro si lo necesitás.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onContinue}>
          <RotateCcw size={14} />
          Registrar de todas formas
        </Button>
      </div>
    </Card>
  );
}

export function ManiaTestCaregiver() {
  const { patientName } = useApp();
  const [filledToday, setFilledToday] = useState(false);
  const [showAnyway, setShowAnyway] = useState(false);
  const [debugResponses, setDebugResponses] = useState({});
  const debugMode = useDebugMode();

  useEffect(() => {
    hasFilledToday(COLLECTION_NAMES.caregiver).then(setFilledToday);
  }, []);

  async function handleSubmit(responses) {
    const payload = buildPayload(responses, caregiverQuestions);
    await saveCaregiver(payload);
  }

  if (filledToday && !showAnyway) {
    return <FilledTodayBanner onContinue={() => setShowAnyway(true)} />;
  }

  return (
    <div>
      {debugMode && <ManiaDebugPanel responses={debugResponses} questions={caregiverQuestions} />}
      <Card>
        <CardTitle>Observación de Manía — Cuidador</CardTitle>
        <CardInfo>
          Respondé según lo que observaste en <strong>{patientName}</strong> hoy.
          Sé honesto/a para obtener un registro preciso.
        </CardInfo>
        <TestForm
          questions={caregiverQuestions}
          onSubmit={handleSubmit}
          submitLabel="Guardar Observación"
          onResponseChange={debugMode ? setDebugResponses : undefined}
        />
      </Card>
    </div>
  );
}

export function ManiaTestPatient() {
  const [filledToday, setFilledToday] = useState(false);
  const [showAnyway, setShowAnyway] = useState(false);
  const [debugResponses, setDebugResponses] = useState({});
  const debugMode = useDebugMode();

  useEffect(() => {
    hasFilledToday(COLLECTION_NAMES.patient).then(setFilledToday);
  }, []);

  async function handleSubmit(responses) {
    const payload = buildPayload(responses, patientQuestions);
    await savePatient(payload);
  }

  if (filledToday && !showAnyway) {
    return <FilledTodayBanner onContinue={() => setShowAnyway(true)} />;
  }

  return (
    <div>
      {debugMode && <ManiaDebugPanel responses={debugResponses} questions={patientQuestions} />}
      <Card>
        <CardTitle>Auto-evaluación de Manía</CardTitle>
        <CardInfo>
          Respondé con honestidad sobre cómo te sentís <strong>hoy</strong>.
          No hay respuestas correctas o incorrectas.
        </CardInfo>
        <TestForm
          questions={patientQuestions}
          onSubmit={handleSubmit}
          submitLabel="Guardar Auto-evaluación"
          onResponseChange={debugMode ? setDebugResponses : undefined}
        />
      </Card>
    </div>
  );
}
