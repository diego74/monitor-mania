import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  caregiverQuestions,
  patientQuestions,
  calcSeverity,
  maniaLevel,
  dimLabels,
} from '../data/questions';
import { getAllCaregiver, getAllPatient } from '../services/storage';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DIMS = ['distractibility', 'irritability', 'impulsivity', 'grandiosity', 'pressured_speech', 'flight_of_ideas', 'energy'];

export default function Analysis() {
  const [caregiverHistory, setCaregiverHistory] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [view, setView] = useState('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllCaregiver(), getAllPatient()]).then(([cg, pt]) => {
      setCaregiverHistory(cg);
      setPatientHistory(pt);
      setLoading(false);
    });
  }, []);

  const lastCG = caregiverHistory[caregiverHistory.length - 1];
  const lastPT = patientHistory[patientHistory.length - 1];

  function getResponses(record, questions) {
    const r = {};
    questions.forEach((q) => { if (record[q.id] != null) r[q.id] = record[q.id]; });
    return r;
  }

  const cgScores = lastCG ? calcSeverity(getResponses(lastCG, caregiverQuestions), caregiverQuestions) : null;
  const ptScores = lastPT ? calcSeverity(getResponses(lastPT, patientQuestions), patientQuestions) : null;

  const chartData = {
    labels: caregiverHistory.map((r) => r.date?.substring(0, 5) || ''),
    datasets: [
      {
        label: '👨‍⚕️ Tú (Cuidador)',
        data: caregiverHistory.map((r) => r.severity ?? 0),
        borderColor: '#2E5C9A',
        backgroundColor: 'rgba(46,92,154,0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: '👩 Daniela',
        data: patientHistory.map((r) => r.severity ?? 0),
        borderColor: '#d946ef',
        backgroundColor: 'rgba(217,70,239,0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { size: 11 } } } },
    scales: {
      y: { beginAtZero: true, max: 4, ticks: { font: { size: 10 } } },
      x: { ticks: { font: { size: 10 } } },
    },
  };

  const isEmpty = !lastCG && !lastPT;

  if (loading) return <div className="page"><div className="card"><p style={{color:'#666',textAlign:'center'}}>Cargando...</p></div></div>;

  return (
    <div className="page">
      <div className="card">
        <h2>📊 Análisis y Comparación</h2>

        <div className="view-toggle">
          <button className={`view-btn${view === 'summary' ? ' active' : ''}`} onClick={() => setView('summary')}>Resumen</button>
          <button className={`view-btn${view === 'graph' ? ' active' : ''}`} onClick={() => setView('graph')}>Gráfico</button>
        </div>

        {isEmpty && (
          <div className="empty-state">Completá ambos tests para ver el análisis.</div>
        )}

        {!isEmpty && view === 'summary' && cgScores && ptScores && (
          <>
            <div className="comparison-header">
              <span>Dimensión</span>
              <span>👨‍⚕️ Tú</span>
              <span>👩 Ella</span>
              <span>Δ</span>
            </div>

            {DIMS.map((dim) => {
              const cg = cgScores.byDimension[dim] ?? null;
              const pt = ptScores.byDimension[dim] ?? null;
              if (cg == null && pt == null) return null;
              const delta = Math.abs((cg ?? 0) - (pt ?? 0));
              return (
                <div key={dim} className="comparison-row">
                  <span className="dim-label">{dimLabels[dim]}</span>
                  <span className="val-cg">{cg != null ? cg.toFixed(1) : '—'}</span>
                  <span className="val-pt">{pt != null ? pt.toFixed(1) : '—'}</span>
                  <span className={delta < 0.5 ? 'val-match' : 'val-mismatch'}>
                    {delta < 0.5 ? '✓' : '⚠️'} {delta.toFixed(1)}
                  </span>
                </div>
              );
            })}

            <div className="index-box">
              <p className="index-title">ÍNDICE GENERAL</p>
              <div className="index-grid">
                <div>
                  <p className="index-sub">👨‍⚕️ TÚ</p>
                  <p className="index-val" style={{ color: maniaLevel(cgScores.overall).color }}>
                    {cgScores.overall.toFixed(1)}/4
                  </p>
                  <p className="index-badge" style={{ background: maniaLevel(cgScores.overall).color }}>
                    {maniaLevel(cgScores.overall).label}
                  </p>
                </div>
                <div>
                  <p className="index-sub">👩 DANIELA</p>
                  <p className="index-val" style={{ color: maniaLevel(ptScores.overall).color }}>
                    {ptScores.overall.toFixed(1)}/4
                  </p>
                  <p className="index-badge" style={{ background: maniaLevel(ptScores.overall).color }}>
                    {maniaLevel(ptScores.overall).label}
                  </p>
                </div>
              </div>
              {(() => {
                const diff = Math.abs(cgScores.overall - ptScores.overall);
                return (
                  <p className="index-diff">
                    <strong>Diferencia:</strong> {diff.toFixed(1)} pts &nbsp;
                    {diff > 1.5 ? '⚠️ Ella subestima su manía' : diff > 0.8 ? '⚠️ Falta de conciencia parcial' : '✓ Buena concordancia'}
                  </p>
                );
              })()}
            </div>
          </>
        )}

        {!isEmpty && view === 'graph' && (
          <div style={{ height: 260 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
