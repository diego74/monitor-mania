import { useState } from 'react';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from '../ui/ProgressBar';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Send } from 'lucide-react';

export function TestForm({ questions, onSubmit, introText, submitLabel = 'Guardar Test', onResponseChange }) {
  const [responses, setResponses] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const answered = Object.keys(responses).length;
  const total = questions.length;
  const allAnswered = answered === total;

  function handleSelect(questionId, idx) {
    const next = { ...responses, [questionId]: idx };
    setResponses(next);
    setSaved(false);
    if (onResponseChange) onResponseChange(next);
  }

  async function handleSubmit() {
    if (!allAnswered) {
      setError('Respondé todas las preguntas antes de guardar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(responses);
      setSaved(true);
      setResponses({});
    } catch (e) {
      setError('Error al guardar. Verificá tu conexión.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {introText && (
        <div className="text-sm text-slate-600 bg-teal-50 border-l-4 border-teal-500 px-3 py-2 rounded-r-lg mb-3">
          {introText}
        </div>
      )}

      <ProgressBar value={answered} max={total} label="Preguntas respondidas" />

      {saved && (
        <Alert variant="success">Test guardado correctamente.</Alert>
      )}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          questionNumber={i + 1}
          totalQuestions={total}
          selectedIndex={responses[q.id]}
          onSelect={(idx) => handleSelect(q.id, idx)}
        />
      ))}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleSubmit}
        disabled={!allAnswered || saving}
        className="mt-2"
      >
        <Send size={16} />
        {saving ? 'Guardando...' : submitLabel}
      </Button>
    </div>
  );
}
