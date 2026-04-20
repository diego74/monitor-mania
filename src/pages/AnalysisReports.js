import React, { useState, useEffect } from 'react';
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
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
import { getAllCaregiver, getAllPatient, deleteAll, exportJSON } from '../services/storage';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DIMS = ['distractibility', 'irritability', 'impulsivity', 'grandiosity', 'pressured_speech', 'flight_of_ideas', 'energy', 'sleep', 'conflict'];

export default function AnalysisReports() {
  const [caregiverHistory, setCaregiverHistory] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [view, setView] = useState('summary');
  const [filterDays, setFilterDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([getAllCaregiver(), getAllPatient()])
      .then(([cg, pt]) => {
        setCaregiverHistory(cg);
        setPatientHistory(pt);
      })
      .catch((err) => console.error('Firestore error:', err))
      .finally(() => setLoading(false));
  }, []);

  function filterByDays(records) {
    if (filterDays === 1) {
      const today = new Date().toISOString().substring(0, 10);
      return records.filter((r) => r.timestamp && r.timestamp.substring(0, 10) === today);
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filterDays);
    return records.filter((r) => new Date(r.timestamp) >= cutoff);
  }

  function dedupeByDay(records) {
    const byDay = {};
    records.forEach((r) => {
      if (!byDay[r.date] || r.timestamp > byDay[r.date].timestamp) byDay[r.date] = r;
    });
    return Object.values(byDay).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  function avgSeverity(records) {
    if (!records.length) return null;
    return records.reduce((a, r) => a + (r.severity ?? 0), 0) / records.length;
  }

  function trend(records) {
    if (records.length < 2) return null;
    const diff = (records[records.length - 1].severity ?? 0) - (records[0].severity ?? 0);
    if (Math.abs(diff) < 0.1) return { label: 'Estable', icon: '→', color: '#6b7280' };
    if (diff > 0) return { label: 'En alza', icon: '↑', color: '#ef4444' };
    return { label: 'Bajando', icon: '↓', color: '#10b981' };
  }

  // Scores promediados por dimensión sobre el período filtrado
  function avgScoresByDimension(records, questions) {
    if (!records.length) return null;
    const dimAccum = {};
    const dimCount = {};
    records.forEach((record) => {
      const responses = {};
      questions.forEach((q) => { if (record[q.id] != null) responses[q.id] = record[q.id]; });
      const { byDimension } = calcSeverity(responses, questions);
      Object.entries(byDimension).forEach(([dim, val]) => {
        dimAccum[dim] = (dimAccum[dim] ?? 0) + val;
        dimCount[dim] = (dimCount[dim] ?? 0) + 1;
      });
    });
    if (!Object.keys(dimAccum).length) return null;
    const byDimension = {};
    Object.keys(dimAccum).forEach((dim) => { byDimension[dim] = dimAccum[dim] / dimCount[dim]; });
    const vals = Object.values(byDimension);
    const overall = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { byDimension, overall };
  }

  const cgFiltered = dedupeByDay(filterByDays(caregiverHistory));
  const ptFiltered = dedupeByDay(filterByDays(patientHistory));
  const cgScores = avgScoresByDimension(cgFiltered, caregiverQuestions);
  const ptScores = avgScoresByDimension(ptFiltered, patientQuestions);
  const cgAvg = avgSeverity(cgFiltered);
  const ptAvg = avgSeverity(ptFiltered);
  const cgTrend = trend(cgFiltered);
  const ptTrend = trend(ptFiltered);

  async function handleExport() {
    await exportJSON();
    setMsg('Archivo descargado');
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleDelete() {
    await deleteAll();
    setCaregiverHistory([]);
    setPatientHistory([]);
    setConfirmDelete(false);
    setMsg('Todos los datos fueron eliminados');
    setTimeout(() => setMsg(''), 4000);
  }

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

  const isEmpty = cgFiltered.length === 0 && ptFiltered.length === 0;

  if (loading) return <div className="page"><div className="card"><p style={{color:'#666',textAlign:'center'}}>Cargando...</p></div></div>;

  return (
    <div className="page">
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <h2>📊 Análisis y Reportes</h2>

        <div className="view-toggle">
          <button className={`view-btn${view === 'summary' ? ' active' : ''}`} onClick={() => setView('summary')}>Resumen</button>
          <button className={`view-btn${view === 'radar' ? ' active' : ''}`} onClick={() => setView('radar')}>Radar</button>
          <button className={`view-btn${view === 'graph' ? ' active' : ''}`} onClick={() => setView('graph')}>Historial</button>
          <button className={`view-btn${view === 'reports' ? ' active' : ''}`} onClick={() => setView('reports')}>Reportes</button>
        </div>

        <div className="filter-row">
          {[1, 7, 14, 30, 90].map((d) => (
            <button
              key={d}
              className={`filter-btn${filterDays === d ? ' active' : ''}`}
              onClick={() => setFilterDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* RESUMEN */}
        {view === 'summary' && (
          <>
            {isEmpty && <div className="empty-state">Sin datos en este período.</div>}
            {!isEmpty && cgScores && ptScores && (
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
                      <p className="index-val" style={{ color: maniaLevel(cgScores.overall).color }}>{cgScores.overall.toFixed(1)}/4</p>
                      <p className="index-badge" style={{ background: maniaLevel(cgScores.overall).color }}>{maniaLevel(cgScores.overall).label}</p>
                    </div>
                    <div>
                      <p className="index-sub">👩 DANIELA</p>
                      <p className="index-val" style={{ color: maniaLevel(ptScores.overall).color }}>{ptScores.overall.toFixed(1)}/4</p>
                      <p className="index-badge" style={{ background: maniaLevel(ptScores.overall).color }}>{maniaLevel(ptScores.overall).label}</p>
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
          </>
        )}

        {/* RADAR */}
        {view === 'radar' && (
          <>
            {isEmpty && <div className="empty-state">Sin datos en este período.</div>}
            {!isEmpty && cgScores && ptScores && (
              <div style={{ height: 300 }}>
                <Radar
                  data={{
                    labels: DIMS.filter((d) => {
                      const cg = cgScores.byDimension[d];
                      const pt = ptScores.byDimension[d];
                      return cg != null || pt != null;
                    }).map((d) => dimLabels[d]),
                    datasets: [
                      {
                        label: '👨‍⚕️ Tú',
                        data: DIMS.filter((d) => cgScores.byDimension[d] != null || ptScores.byDimension[d] != null).map((d) => cgScores.byDimension[d] ?? 0),
                        borderColor: '#2E5C9A',
                        backgroundColor: 'rgba(46,92,154,0.2)',
                        pointBackgroundColor: '#2E5C9A',
                      },
                      {
                        label: '👩 Daniela',
                        data: DIMS.filter((d) => cgScores.byDimension[d] != null || ptScores.byDimension[d] != null).map((d) => ptScores.byDimension[d] ?? 0),
                        borderColor: '#d946ef',
                        backgroundColor: 'rgba(217,70,239,0.2)',
                        pointBackgroundColor: '#d946ef',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 4,
                        ticks: { stepSize: 1, font: { size: 9 } },
                        pointLabels: { font: { size: 9 } },
                      },
                    },
                    plugins: { legend: { labels: { font: { size: 11 } } } },
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* HISTORIAL */}
        {view === 'graph' && (
          <div style={{ height: 260 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {/* REPORTES */}
        {view === 'reports' && (
          <>
            <div style={{ marginTop: 4 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Resumen del período</p>
              <div className="stats-grid">
                <div className="stat-box">
                  <p className="stat-label">Tests (Cuidador)</p>
                  <p className="stat-val">{cgFiltered.length}</p>
                </div>
                <div className="stat-box">
                  <p className="stat-label">Tests (Daniela)</p>
                  <p className="stat-val">{ptFiltered.length}</p>
                </div>
                {cgAvg != null && (
                  <div className="stat-box">
                    <p className="stat-label">Promedio Cuidador</p>
                    <p className="stat-val" style={{ color: maniaLevel(cgAvg).color }}>{cgAvg.toFixed(2)}</p>
                    {cgTrend && <p style={{ color: cgTrend.color, fontWeight: 600, fontSize: 13 }}>{cgTrend.icon} {cgTrend.label}</p>}
                  </div>
                )}
                {ptAvg != null && (
                  <div className="stat-box">
                    <p className="stat-label">Promedio Daniela</p>
                    <p className="stat-val" style={{ color: maniaLevel(ptAvg).color }}>{ptAvg.toFixed(2)}</p>
                    {ptTrend && <p style={{ color: ptTrend.color, fontWeight: 600, fontSize: 13 }}>{ptTrend.icon} {ptTrend.label}</p>}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Historial ({cgFiltered.length + ptFiltered.length})</p>
              {cgFiltered.length === 0 && ptFiltered.length === 0 ? (
                <div className="empty-state">Sin datos en este período</div>
              ) : (
                <div className="history-list">
                  {[
                    ...cgFiltered.map((r) => ({ ...r, type: 'cg' })),
                    ...ptFiltered.map((r) => ({ ...r, type: 'pt' })),
                  ]
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((r) => {
                      const lv = maniaLevel(r.severity ?? 0);
                      return (
                        <div key={`${r.type}-${r.timestamp}`} className="history-row">
                          <span className="history-icon">{r.type === 'cg' ? '👨‍⚕️' : '👩'}</span>
                          <span className="history-date">{r.date}</span>
                          <span className="history-severity" style={{ color: lv.color }}>{(r.severity ?? 0).toFixed(2)}</span>
                          <span className="history-badge" style={{ background: lv.color }}>{lv.label}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Acciones</p>
              <button className="submit-btn" onClick={handleExport} style={{ marginBottom: 10 }}>
                ⬇️ Exportar JSON
              </button>
              {!confirmDelete ? (
                <button className="danger-btn" onClick={() => setConfirmDelete(true)}>
                  🗑️ Eliminar todos los datos
                </button>
              ) : (
                <div className="confirm-box">
                  <p>¿Seguro? Esto borra TODO el historial permanentemente.</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="danger-btn" onClick={handleDelete}>Sí, eliminar</button>
                    <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
