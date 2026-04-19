import React, { useState } from 'react';
import { caregiverQuestions, calcSeverity } from '../data/questions';
import { saveCaregiver } from '../services/storage';

export default function CaregiverTest() {
  const [responses, setResponses] = useState({});
  const [saved, setSaved] = useState(false);

  const total = caregiverQuestions.length;
  const answered = Object.keys(responses).length;

  function answer(id, idx) {
    setResponses((prev) => ({ ...prev, [id]: idx }));
    setSaved(false);
  }

  function handleSubmit() {
    const now = new Date();
    const { overall } = calcSeverity(responses, caregiverQuestions);
    const data = {
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('es-ES'),
      severity: overall,
      ...Object.fromEntries(caregiverQuestions.map((q) => [q.id, responses[q.id] ?? null])),
    };
    saveCaregiver(data);
    setSaved(true);
    setResponses({});
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Test del Cuidador</h2>
        <div className="card-info">
          Observá a Daniela y respondé según lo que VES ahora.
        </div>

        {saved && (
          <div className="alert alert-success">✓ Test guardado correctamente</div>
        )}

        {caregiverQuestions.map((q, idx) => (
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
