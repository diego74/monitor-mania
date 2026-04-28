import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
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
import { deleteTestResult } from '../services/storage';
import { getAllQuestions } from '../services/questionStorage';
import { filterByDays, dedupeByDay, formatDate } from '../utils/dates';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Activity, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const getLocalDayStr = (ts) => {
  if (!ts) return '';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const QUICK_FILTERS = [
  { label: 'Hoy', days: 1 },
  { label: '7 días', days: 7 },
  { label: '14 días', days: 14 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
];

function computeStabilityMetrics(compositeRecs) {
  const byDate = {};
  const add = (date, score, type) => {
    if (!date) return;
    const day = getLocalDayStr(date);
    if (!byDate[day]) byDate[day] = { maniaScores: [], depressionScores: [], stabilityScores: [] };
    if (type === 'mania') byDate[day].maniaScores.push(score);
    if (type === 'depression') byDate[day].depressionScores.push(score);
    if (type === 'stability') byDate[day].stabilityScores.push(score);
  };
  
  compositeRecs.forEach(r => {
    const ts = r.submittedAt || r.timestamp;
    const m = r.scores?.mania ?? r.scoresBySection?.mania ?? r.severity ?? 0;
    const d = r.scores?.depression ?? r.scoresBySection?.depression ?? 0;
    add(ts, m, 'mania');
    add(ts, d, 'depression');
    add(ts, r.stability ?? (m - d), 'stability');
  });

  const days = Object.keys(byDate);
  if (!days.length) return { stabilityPct: null, dominantPattern: null };

  let stableDays = 0;
  let avgStability = 0;

  days.forEach(d => {
    const { stabilityScores } = byDate[d];
    const avgS = stabilityScores.reduce((a, b) => a + b, 0) / stabilityScores.length;
    if (Math.abs(avgS) < 1.0) stableDays++;
    avgStability += avgS;
  });

  const stabilityPct = Math.round((stableDays / days.length) * 100);
  const totalAvgStability = avgStability / days.length;

  return { 
    stabilityPct, 
    avgStability: totalAvgStability,
    label: Math.abs(totalAvgStability) < 1.0 ? 'Estable' : totalAvgStability > 0 ? 'Hacia Manía' : 'Hacia Depresión'
  };
}

function WeeklyHeatmap({ compositeRecs = [] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return getLocalDayStr(d);
  });

  const stabilityByDate = {};
  compositeRecs.forEach(r => {
    const ts = r.submittedAt || r.timestamp;
    const d = getLocalDayStr(ts);
    if (!d) return;
    const m = r.scores?.mania ?? r.scoresBySection?.mania ?? r.severity ?? 0;
    const dep = r.scores?.depression ?? r.scoresBySection?.depression ?? 0;
    const s = r.stability ?? (m - dep);
    stabilityByDate[d] = s;
  });

  const cellColor = (score) => {
    if (score == null) return 'bg-slate-100 dark:bg-navy-800';
    if (score >= 3.5) return 'bg-violet-600';
    if (score >= 2.0) return 'bg-rose-500';
    if (score >= 1.0) return 'bg-amber-400';
    if (score <= -3.5) return 'bg-indigo-800';
    if (score <= -2.0) return 'bg-blue-600';
    if (score <= -1.0) return 'bg-sky-400';
    return 'bg-emerald-400';
  };

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Estabilidad últimos 7 días</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const score = stabilityByDate[d];
          const label = d.split('-').slice(1).reverse().join('/');
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <div className={`w-full h-8 rounded-lg ${cellColor(score)} shadow-sm transition-all`} title={score != null ? `Estabilidad: ${score.toFixed(1)}` : 'Sin datos'} />
              <span className="text-[9px] text-slate-400 font-bold">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalysisReports() {
  const [results, setResults] = useState([]);
  const [view, setView] = useState('summary');
  const [quickDays, setQuickDays] = useState(7);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [expandedRow, setExpandedRow] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    Promise.all([
      import('../services/storage').then(m => m.getAllTestResults()),
      getAllQuestions()
    ]).then(([res, bank]) => {
      setResults(res);
      setQuestions(bank);
    }).catch((err) => console.error('Firestore error:', err))
      .finally(() => setLoading(false));
  }, []);

  function applyFilter(records) {
    return filterByDays(records, quickDays);
  }

  const filteredResults = applyFilter(results);
  const compositeHistory = results.filter(r => r.testType === 'composite' || r.testType === 'adaptive_pure');
  const compositeFiltered = dedupeByDay(applyFilter(compositeHistory));
  const isEmpty = filteredResults.length === 0;

  function buildBipolarChartData() {
    const sorted = Array.from(
      new Set(compositeFiltered.map(r => getLocalDayStr(r.submittedAt || r.timestamp)).filter(Boolean))
    ).sort();

    const maniaByDate = Object.fromEntries(
      compositeFiltered.map(r => [getLocalDayStr(r.submittedAt || r.timestamp), r.scores?.mania ?? r.scoresBySection?.mania ?? r.severity ?? 0])
    );
    const depressionByDate = Object.fromEntries(
      compositeFiltered.map(r => [getLocalDayStr(r.submittedAt || r.timestamp), -(r.scores?.depression ?? r.scoresBySection?.depression ?? 0)])
    );

    return {
      labels: sorted.map(d => { const [, m, day] = d.split('-'); return `${day}/${m}`; }),
      datasets: [
        {
          label: 'Manía (+)',
          data: sorted.map(d => maniaByDate[d] ?? null),
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244,63,94,0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
        },
        {
          label: 'Depresión (-)',
          data: sorted.map(d => depressionByDate[d] ?? null),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
        },
      ],
    };
  }

  function buildCompareChartData() {
    const rawFiltered = applyFilter(compositeHistory);
    const sorted = Array.from(
      new Set(rawFiltered.map(r => getLocalDayStr(r.submittedAt || r.timestamp)).filter(Boolean))
    ).sort();

    const patientData = {};
    const caregiverData = {};

    rawFiltered.forEach(r => {
      const d = getLocalDayStr(r.submittedAt || r.timestamp);
      const stability = r.stability ?? ((r.scores?.mania ?? r.severity ?? 0) - (r.scores?.depression ?? 0));
      if (r.submittedByRole === 'patient' || r.submittedByRole === 'user') {
        patientData[d] = stability;
      } else if (r.submittedByRole === 'caregiver') {
        caregiverData[d] = stability;
      }
    });

    return {
      labels: sorted.map(d => { const [, m, day] = d.split('-'); return `${day}/${m}`; }),
      datasets: [
        {
          label: 'Paciente (Punto Equilibrio)',
          data: sorted.map(d => patientData[d] ?? null),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          spanGaps: true,
        },
        {
          label: 'Cuidador (Punto Equilibrio)',
          data: sorted.map(d => caregiverData[d] ?? null),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          spanGaps: true,
        },
      ],
    };
  }

  function renderDiscrepancyList() {
    const rawFiltered = applyFilter(compositeHistory);
    const byDay = {};
    rawFiltered.forEach(r => {
      const d = getLocalDayStr(r.submittedAt || r.timestamp);
      if (!d) return;
      if (!byDay[d]) byDay[d] = { p: null, c: null };
      if (r.submittedByRole === 'patient' || r.submittedByRole === 'user') byDay[d].p = r;
      else if (r.submittedByRole === 'caregiver') byDay[d].c = r;
    });

    const daysWithBoth = Object.keys(byDay).filter(d => byDay[d].p && byDay[d].c).sort().reverse();

    if (!daysWithBoth.length) {
      return (
        <div className="text-center py-6 mt-4">
          <p className="text-sm font-bold text-slate-400">No hay días con ambas evaluaciones para comparar el detalle.</p>
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 border-t border-slate-100 dark:border-navy-800 pt-6">Detalle de Diferencias</h3>
        {daysWithBoth.map(d => {
          const { p, c } = byDay[d];
          const pMan = p.scores?.mania ?? p.severity ?? 0;
          const cMan = c.scores?.mania ?? c.severity ?? 0;
          const pDep = p.scores?.depression ?? 0;
          const cDep = c.scores?.depression ?? 0;
          const pStab = p.stability ?? (pMan - pDep);
          const cStab = c.stability ?? (cMan - cDep);

          const diffMan = Math.abs(pMan - cMan);
          const diffDep = Math.abs(pDep - cDep);
          const isWarning = diffMan >= 2 || diffDep >= 2;

          return (
            <div key={d} className={`p-4 rounded-2xl border-2 ${isWarning ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 'bg-slate-50 dark:bg-navy-900 border-slate-100 dark:border-navy-800'}`}>
               <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200/50 dark:border-navy-800/50">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formatDate(d)}</span>
                 {isWarning && <span className="text-[9px] bg-amber-500 text-white px-2 py-1 rounded-full font-black uppercase flex items-center gap-1"><Alert variant="warning" className="p-0 m-0 border-0 bg-transparent" /> ALTA DISCREPANCIA</span>}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Paciente</p>
                    <p className="text-xl font-black text-navy-700 dark:text-white leading-none mb-2">{pStab > 0 ? '+' : ''}{pStab.toFixed(1)}</p>
                    <p className="text-xs text-slate-500 font-bold">M: {pMan.toFixed(1)} | D: {pDep.toFixed(1)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Cuidador</p>
                    <p className="text-xl font-black text-navy-700 dark:text-white leading-none mb-2">{cStab > 0 ? '+' : ''}{cStab.toFixed(1)}</p>
                    <p className="text-xs text-slate-500 font-bold">M: {cMan.toFixed(1)} | D: {cDep.toFixed(1)}</p>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    );
  }

  const bipolarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: -5, max: 5,
        ticks: { stepSize: 1, font: { size: 10 }, callback: (v) => v === 0 ? 'ESTABLE' : v },
        grid: { color: (ctx) => ctx.tick.value === 0 ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)' },
      }
    }
  };

  async function handleDeleteSingle(id) {
    if (!window.confirm('¿Eliminar evaluación?')) return;
    try {
      await deleteTestResult(id);
      setResults(prev => prev.filter(r => r._id !== id));
    } catch {
      setMsg({ text: 'Error al eliminar.', type: 'error' });
    }
  }

  if (loading) return <Card><p className="text-center text-slate-400 py-6">Cargando...</p></Card>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-black text-navy-700 dark:text-white mb-4 uppercase tracking-tighter flex items-center gap-2">
        <Activity className="text-teal-500" /> Monitoreo de Estabilidad
      </h1>

      {msg.text && <Alert variant={msg.type || 'info'}>{msg.text}</Alert>}

      <Card>
        <div className="flex gap-1 mb-6 flex-wrap">
          {['summary', 'graph', 'compare', 'reports'].map((key) => (
            <button key={key} onClick={() => setView(key)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === key ? 'bg-navy-700 text-white shadow-lg shadow-navy-700/20' : 'bg-slate-100 text-slate-500'}`}>
              {key === 'summary' ? 'Resumen' : key === 'graph' ? 'Evolución' : key === 'compare' ? 'Comparar' : 'Historial'}
            </button>
          ))}
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {QUICK_FILTERS.map(({ label, days }) => (
            <button key={days} onClick={() => { setQuickDays(days); setUseCustomRange(false); }} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${!useCustomRange && quickDays === days ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-400 border-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {view === 'summary' && !isEmpty && (() => {
          const { stabilityPct, avgStability, label } = computeStabilityMetrics(compositeFiltered);
          return (
            <div className="space-y-6">
              <WeeklyHeatmap compositeRecs={compositeFiltered} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-slate-50 dark:bg-navy-900 p-4 rounded-2xl text-center border border-slate-100 dark:border-navy-800">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Índice de Estabilidad</p>
                   <p className={`text-4xl font-black ${stabilityPct > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{stabilityPct}%</p>
                   <p className="text-[10px] text-slate-400">días en rango estable</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-navy-900 p-4 rounded-2xl text-center border border-slate-100 dark:border-navy-800">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Punto de Equilibrio</p>
                   <p className={`text-4xl font-black ${Math.abs(avgStability) < 1 ? 'text-emerald-500' : avgStability > 0 ? 'text-rose-500' : 'text-blue-500'}`}>
                     {avgStability > 0 ? '+' : ''}{avgStability.toFixed(1)}
                   </p>
                   <p className="text-[10px] text-slate-400">{label}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-navy-900 p-4 rounded-2xl flex flex-col justify-center items-center border border-slate-100 dark:border-navy-800">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Estado General</p>
                   <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-3 h-6 rounded-full ${i < Math.abs(avgStability) ? (avgStability > 0 ? 'bg-rose-500' : 'bg-blue-500') : 'bg-slate-200'}`} />
                      ))}
                   </div>
                 </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                 <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-3 uppercase tracking-wider">Métricas del Período (Rango 0-5)</p>
                 {(() => {
                    const avg = (key) => {
                      const vals = compositeFiltered.map(r => r.scores?.[key] ?? r.scoresBySection?.[key]).filter(v => v != null);
                      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    };
                    const m = avg('mania');
                    const d = avg('depression');
                    return (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold"><span>MANÍA</span><span>{m.toFixed(1)} / 5</span></div>
                          <div className="w-full bg-slate-200 dark:bg-navy-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full" style={{ width: `${m/5*100}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold"><span>DEPRESIÓN</span><span>{d.toFixed(1)} / 5</span></div>
                          <div className="w-full bg-slate-200 dark:bg-navy-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${d/5*100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                 })()}
              </div>
            </div>
          );
        })()}

        {view === 'graph' && (
          <div className="h-[400px]">
             <Line data={buildBipolarChartData()} options={bipolarChartOptions} />
          </div>
        )}

        {view === 'compare' && (
          <div className="space-y-4">
            <div className="h-[400px]">
               <Line data={buildCompareChartData()} options={bipolarChartOptions} />
            </div>
            {renderDiscrepancyList()}
          </div>
        )}

        {view === 'reports' && (
          <div className="space-y-2">
            {filteredResults.map((r, i) => {
              const stab = r.stability ?? ((r.scores?.mania ?? 0) - (r.scores?.depression ?? 0));
              const isExpanded = expandedRow === r._id;
              
              return (
                <div key={r._id || i} className="border border-slate-100 dark:border-navy-800 rounded-xl overflow-hidden">
                  <div className="p-3 bg-slate-50 dark:bg-navy-900 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : r._id)}>
                    <span className="text-[10px] font-bold text-slate-400 w-16">{formatDate(r.submittedAt || r.timestamp)}</span>
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${Math.abs(stab) < 1 ? 'bg-emerald-100 text-emerald-700' : stab > 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                      {Math.abs(stab) < 1 ? 'Estable' : stab > 0 ? 'Fase Manía' : 'Fase Depre'}
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                       <div className="text-right">
                         <p className="text-[8px] font-bold text-slate-400 uppercase">Estabilidad</p>
                         <p className={`font-black text-xs ${stab > 0 ? 'text-rose-500' : stab < 0 ? 'text-blue-500' : 'text-emerald-500'}`}>{stab > 0 ? '+' : ''}{stab.toFixed(1)}</p>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteSingle(r._id); }} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                       {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 bg-white dark:bg-navy-950 border-t border-slate-100 dark:border-navy-800 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-xl">
                             <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">Desglose Clínico (0-5)</p>
                             <div className="space-y-2">
                                <div className="flex justify-between text-[10px]"><span>Manía</span><span className="font-bold">{(r.scores?.mania ?? 0).toFixed(1)}</span></div>
                                <div className="flex justify-between text-[10px]"><span>Depresión</span><span className="font-bold">{(r.scores?.depression ?? 0).toFixed(1)}</span></div>
                                <div className="flex justify-between text-[10px]"><span>Ánimo/Mixto</span><span className="font-bold">{(r.scores?.mood ?? 0).toFixed(1)}</span></div>
                             </div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-xl">
                             <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">Contexto</p>
                             <p className="text-[10px]">Total preguntas: {r.context?.totalQuestions || 'N/A'}</p>
                             <p className="text-[10px]">Rol: {r.submittedByRole}</p>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">Respuestas Detalladas</p>
                          {Object.entries(r.answers || {}).map(([qId, val]) => {
                             const q = questions.find(item => item._id === qId || item.id === qId);
                             const text = r.submittedByRole === 'caregiver' ? (q?.caregiver || q?.question) : (q?.question || q?.patient);
                             return q ? (
                               <div key={qId} className="flex justify-between text-[10px] py-1 border-b border-slate-50 dark:border-navy-900 last:border-0 gap-4">
                                 <span className="text-slate-500 flex-1">{text}</span>
                                 <span className="font-bold text-navy-700 dark:text-white shrink-0">{q.options[val]}</span>
                               </div>
                             ) : null;
                          })}
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
