import { useState, useEffect } from 'react';
import { ClipboardList, Copy, Share2, Check, CheckCircle, Brain } from 'lucide-react';
import { buildPatientLink } from '../utils/tokens';
import { Card, CardTitle } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import CompositeTest from './CompositeTest';
import { hasFilledToday, COLLECTION_NAMES } from '../services/storage';
import { useApp } from '../contexts/AppContext';

function DoneBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
      <CheckCircle size={11} />
      Ya hoy
    </span>
  );
}

export default function CaregiverPortal() {
  const { patientName } = useApp();
  const [mode, setMode] = useState(null); // null | 'composite' | 'send-link'
  const [copied, setCopied] = useState(false);
  const [filledToday, setFilledToday] = useState({ composite: false, patientComposite: false });

  const compositeLink = buildPatientLink('composite');

  useEffect(() => {
    Promise.all([
      hasFilledToday(COLLECTION_NAMES.composite),
    ]).then(([composite]) => {
      setFilledToday({ composite });
    });
  }, []);

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function shareLink(url, title) {
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      copyLink(url);
    }
  }

  if (mode === 'composite') {
    return (
      <div>
        <button onClick={() => setMode(null)} className="mb-4 text-sm text-teal-600 dark:text-teal-400 font-semibold cursor-pointer hover:underline">
          ← Volver
        </button>
        <CompositeTest />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy-700 dark:text-white">Portal del Cuidador</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">¿Cómo ves a {patientName} hoy?</p>
      </div>

      {mode === null && (
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
          {/* Registrar observación */}
          <button
            onClick={() => setMode('composite')}
            className="group text-left p-5 bg-white dark:bg-navy-800 rounded-2xl border-2 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 transition-all duration-150 shadow-card hover:shadow-card-hover cursor-pointer min-h-[120px]"
          >
            <div className="flex items-start justify-between mb-3">
              <Brain size={28} className="text-teal-500" />
              {filledToday.composite && <DoneBadge />}
            </div>
            <p className="font-bold text-navy-700 dark:text-white text-base mb-1">Registrar observación</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Completar la evaluación adaptativa sobre cómo está {patientName} hoy
            </p>
            <span className="mt-3 inline-block text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1 rounded-full">
              Test adaptativo — mínimas preguntas
            </span>
          </button>

          {/* Enviar a paciente */}
          <button
            onClick={() => setMode('send-link')}
            className="group text-left p-5 bg-white dark:bg-navy-800 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-150 shadow-card hover:shadow-card-hover cursor-pointer min-h-[120px]"
          >
            <div className="flex items-start justify-between mb-3">
              <Share2 size={28} className="text-indigo-500" />
            </div>
            <p className="font-bold text-navy-700 dark:text-white text-base mb-1">Enviar test a {patientName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compartir el link para que {patientName} complete su propia evaluación
            </p>
            <span className="mt-3 inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-full">
              Auto-evaluación adaptativa
            </span>
          </button>
        </div>
      )}

      {/* Link para paciente */}
      {mode === 'send-link' && (
        <div>
          <button onClick={() => setMode(null)} className="mb-4 text-sm text-teal-600 dark:text-teal-400 font-semibold cursor-pointer hover:underline">
            ← Volver
          </button>

          {copied && <Alert variant="success">Link copiado al portapapeles.</Alert>}

          <Card>
            <CardTitle>Link para {patientName}</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {patientName} abre este link y completa la evaluación adaptativa. Solo agrega preguntas si detecta síntomas importantes.
            </p>
            <div className="bg-slate-50 dark:bg-navy-900 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono break-all mb-3">
              {compositeLink}
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={() => copyLink(compositeLink)}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar link'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => shareLink(compositeLink, `Evaluación para ${patientName}`)}>
                <Share2 size={14} />
                Compartir
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <ClipboardList size={16} className="text-teal-500" />
              <span>
                Los resultados aparecen en <strong>Análisis</strong> cuando {patientName} completa la evaluación.
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
