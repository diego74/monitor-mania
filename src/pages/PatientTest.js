import React, { useState } from 'react';
import { patientQuestions, calcSeverity } from '../data/questions';
import { savePatient } from '../services/storage';

export default function PatientTest() {
  const [responses, setResponses] = useState({});
  const [saved, setSaved] = useState(false);

  const total = patientQuestions.length;
  const answered = Object.keys(responses).length;

  function answer(id, idx) {
    setResponses((prev) => ({ ...prev, [id]: idx }));
    setSaved(false);
  }

  async function handleSubmit() {
    const now = new Date();
    const { overall } = calcSeverity(responses, patientQuestions);
    const data = {
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('es-ES'),
      severity: overall,
      ...Object.fromEntries(patientQuestions.map((q) => [q.id, responses[q.id] ?? null])),
    };
    await savePatient(data);
    setSaved(true);
    setResponses({});
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Test de Intereses y Personalidad</h2>

        {saved && (
          <div className="alert alert-success">✓ Test guardado correctamente</div>
        )}

        {patientQuestions.map((q, idx) => (
          <div key={q.id} className="question">
            <p className="question-text">{idx + 1}. {q.question}</p>
            <div className="options">
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  className={`option-btn${responses[q.id] === optIdx ? ' selected' : ''}`}
                  onClick={() => answer(q.id, optIdx)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
        <p className="progress-text">{answered}/{total} respondidas</p>

        <button
          className="submit-btn"
          disabled={answered < total}
          onClick={handleSubmit}
        >
          ✓ Guardar Test
        </button>
      </div>
    </div>
  );
}
