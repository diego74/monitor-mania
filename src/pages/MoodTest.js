import { useState, useEffect } from 'react';
import { Phone, CheckCircle, RotateCcw } from 'lucide-react';
import { moodQuestions } from '../data/moodQuestions';
import { calcMoodSeverity } from '../utils/scoring';
import { saveMood, hasFilledToday, COLLECTION_NAMES } from '../services/storage';
import { Card, CardTitle, CardInfo } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TestForm } from '../components/test/TestForm';

export default function MoodTest() {
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [filledToday, setFilledToday] = useState(false);
  const [showAnyway, setShowAnyway] = useState(false);

  useEffect(() => {
    hasFilledToday(COLLECTION_NAMES.mood).then(setFilledToday);
  }, []);

  async function handleSubmit(responses) {
    const scores = calcMoodSeverity(responses, moodQuestions);
    const now = new Date();
    await saveMood({
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('es-AR'),
      ...scores,
      ...responses,
    });
    if (scores.crisis_flag) setCrisisDetected(true);
  }

  if (filledToday && !showAnyway) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-6 gap-4">
          <CheckCircle size={40} className="text-emerald-500" />
          <div>
            <h2 className="text-base font-bold text-navy-700 dark:text-white mb-1">Ya enviaste este test hoy</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tus respuestas de hoy ya están registradas.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowAnyway(true)}>
            <RotateCcw size={14} />
            Registrar de todas formas
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {crisisDetected && (
        <div className="mb-4 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-400 dark:border-rose-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-300 mb-1">Detectamos pensamientos difíciles</p>
              <p className="text-sm text-rose-700 dark:text-rose-400 mb-2">
                Si estás en crisis o tenés pensamientos de hacerte daño, podés llamar ahora:
              </p>
              <a
                href="tel:135"
                className="inline-block bg-rose-600 text-white font-bold text-lg px-4 py-2 rounded-lg"
              >
                135 — Centro de Asistencia al Suicida
              </a>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">Gratuito, 24 horas, Argentina</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardTitle>Test de Estado de Ánimo</CardTitle>
        <CardInfo>
          Respondé con honestidad cómo te sentís <strong>hoy</strong>.
          No hay respuestas correctas o incorrectas.
        </CardInfo>
        <TestForm
          questions={moodQuestions}
          onSubmit={handleSubmit}
          submitLabel="Enviar Test"
        />
      </Card>
    </div>
  );
}
