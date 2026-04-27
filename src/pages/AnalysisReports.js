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
import { Download, Trash2, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { caregiverQuestions, patientQuestions, calcSeverity, maniaLevel, dimLabels } from '../data/questions';
import { getAllCaregiver, getAllPatient, getAllMood, getAllComposite, deleteAll, exportJSON } from '../services/storage';
import { ALL_QUESTIONS } from '../data/compositeTestConfig';
import { filterByDays, filterByDateRange, dedupeByDay, formatDate } from '../utils/dates';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { SeverityBadge, MoodBadge, TestTypeBadge, RoleBadge } from '../components/ui/Badge';
import { StatBox, StatsGrid } from '../components/ui/StatBox';
import { EmptyState } from '../components/ui/EmptyState';
import { SeverityGauge } from '../components/ui/SeverityGauge';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DIMS = ['distractibility', 'irritability', 'impulsivity', 'grandiosity', 'pressured_speech', 'flight_of_ideas', 'energy', 'sleep', 'conflict'];

const QUICK_FILTERS = [
  { label: 'Hoy', days: 1 },
  { label: '7 días', days: 7 },
  { label: '14 días', days: 14 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
];

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


function trendInfo(records) {
  if (records.length < 2) return null;
  const diff = (records[records.length - 1].severity ?? 0) - (records[0].severity ?? 0);
  if (Math.abs(diff) < 0.1) return { label: 'Estable', Icon: Minus, color: 'text-slate-500' };
  if (diff > 0) return { label: 'En alza', Icon: TrendingUp, color: 'text-rose-500' };
  return { label: 'Bajando', Icon: TrendingDown, color: 'text-emerald-500' };
}

function computeStabilityMetrics(compositeRecs) {
  const byDate = {};
  const add = (date, score, type) => {
    if (!date) return;
    const day = date.split('T')[0];
    if (!byDate[day]) byDate[day] = { maniaScores: [], depressionScores: [] };
    if (type === 'mania') byDate[day].maniaScores.push(score);
    if (type === 'depression') byDate[day].depressionScores.push(score);
  };
  compositeRecs.forEach(r => {
    add(r.timestamp, r.scoresBySection?.mania ?? r.severity ?? 0, 'mania');
    add(r.timestamp, r.scoresBySection?.depression ?? 0, 'depression');
  });

  const days = Object.keys(byDate);
  if (!days.length) return { stabilityPct: null, dominantPattern: null };

  let stable = 0, maniaCount = 0, depressionCount = 0, mixedCount = 0;
  days.forEach(d => {
    const { maniaScores, depressionScores } = byDate[d];
    const m = maniaScores.length ? Math.max(...maniaScores) : 0;
    const dep = depressionScores.length ? Math.max(...depressionScores) : 0;
    const maniaElev = m > 1.5;
    const depElev = dep > 1.5;
    if (maniaElev && depElev) mixedCount++;
    else if (maniaElev) maniaCount++;
    else if (depElev) depressionCount++;
    else stable++;
  });

  const stabilityPct = Math.round((stable / days.length) * 100);
  const counts = { mania: maniaCount, depression: depressionCount, mixed: mixedCount, stable };
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const dominantLabels = { mania: 'Maníaco', depression: 'Depresivo', mixed: 'Mixto', stable: 'Estable' };
  const dominantColors = { mania: 'text-amber-600', depression: 'text-blue-600', mixed: 'text-violet-600', stable: 'text-emerald-600' };

  return { stabilityPct, dominantPattern: dominant, dominantLabel: dominantLabels[dominant], dominantColor: dominantColors[dominant] };
}

// Weekly heatmap: last 7 days × 2 rows (mania/depression) — composite only
function WeeklyHeatmap({ compositeRecs = [] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const maniaByDate = {};
  const depressionByDate = {};
  compositeRecs.forEach(r => {
    const d = r.timestamp?.split('T')[0];
    if (!d) return;
    const m = r.scoresBySection?.mania ?? r.severity ?? 0;
    const dep = r.scoresBySection?.depression ?? 0;
    maniaByDate[d] = Math.max(maniaByDate[d] ?? 0, m);
    if (dep > 0) depressionByDate[d] = Math.max(depressionByDate[d] ?? 0, dep);
  });

  const cellColor = (score) => {
    if (score == null) return 'bg-slate-100 dark:bg-navy-800';
    if (score >= 3.5) return 'bg-violet-500';
    if (score >= 2.8) return 'bg-rose-400';
    if (score >= 2.2) return 'bg-amber-400';
    if (score >= 1.5) return 'bg-sky-300 dark:bg-sky-600';
    return 'bg-emerald-200 dark:bg-emerald-800';
  };

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Últimos 7 días</p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(7, 1fr)` }}>
        <span className="text-xs text-slate-400 text-right pr-2 self-center">Manía</span>
        {days.map(d => {
          const score = maniaByDate[d];
          const label = d.split('-').slice(1).reverse().join('/');
          return (
            <div key={d} className="flex flex-col items-center gap-0.5">
              <div className={`w-full h-7 rounded ${cellColor(score)}`} title={score != null ? `${score.toFixed(1)}/4` : 'Sin datos'} />
              <span className="text-xs text-slate-400" style={{ fontSize: '9px' }}>{label}</span>
            </div>
          );
        })}
        <span className="text-xs text-slate-400 text-right pr-2 self-center">Ánimo</span>
        {days.map(d => {
          const score = depressionByDate[d];
          return (
            <div key={d} className="w-full h-7 rounded bg-opacity-80">
              <div className={`w-full h-full rounded ${cellColor(score)}`} title={score != null ? `${score.toFixed(1)}/4` : 'Sin datos'} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2 justify-end">
        {[['bg-slate-100 dark:bg-navy-800','Sin datos'],['bg-emerald-200','Estable'],['bg-sky-300','Hipomanía'],['bg-amber-400','Mod.'],['bg-rose-400','Grave'],['bg-violet-500','Psicosis']].map(([cls,label])=>(
          <div key={label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${cls}`} />
            <span className="text-xs text-slate-400" style={{fontSize:'9px'}}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function AnalysisReports() {
  const [cgHistory, setCgHistory] = useState([]);
  const [ptHistory, setPtHistory] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  const [compositeHistory, setCompositeHistory] = useState([]);
  const [view, setView] = useState('summary');
  const [quickDays, setQuickDays] = useState(7);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    Promise.all([getAllCaregiver(), getAllPatient(), getAllMood(), getAllComposite()])
      .then(([cg, pt, mood, composite]) => {
        setCgHistory(cg.filter((r) => !r.testType || r.testType === 'mania'));
        setPtHistory(pt);
        setMoodHistory(mood);
        setCompositeHistory(composite);
      })
      .catch((err) => console.error('Firestore error:', err))
      .finally(() => setLoading(false));
  }, []);

  function applyFilter(records) {
    if (useCustomRange && (dateFrom || dateTo)) {
      return filterByDateRange(records, dateFrom, dateTo);
    }
    return filterByDays(records, quickDays);
  }

  const cgFiltered = dedupeByDay(applyFilter(cgHistory));
  const ptFiltered = dedupeByDay(applyFilter(ptHistory));
  const moodFiltered = dedupeByDay(applyFilter(moodHistory));
  const compositeFiltered = dedupeByDay(applyFilter(compositeHistory));
  const cgScores = avgScoresByDimension(cgFiltered, caregiverQuestions);
  const ptScores = avgScoresByDimension(ptFiltered, patientQuestions);
  const isEmpty = compositeFiltered.length === 0 && cgFiltered.length === 0 && ptFiltered.length === 0 && moodFiltered.length === 0;

  // Bipolar chart: mania above 0, depression below 0 — composite only
  function buildBipolarChartData() {
    const sorted = Array.from(
      new Set(compositeFiltered.map(r => r.timestamp?.split('T')[0]).filter(Boolean))
    ).sort();

    const maniaByDate = Object.fromEntries(
      compositeFiltered.map(r => [r.timestamp?.split('T')[0], r.scoresBySection?.mania ?? r.severity ?? 0])
    );
    const depressionByDate = Object.fromEntries(
      compositeFiltered.map(r => [r.timestamp?.split('T')[0], -(r.scoresBySection?.depression ?? 0)])
    );

    return {
      labels: sorted.map(d => { const [, m, day] = d.split('-'); return `${day}/${m}`; }),
      datasets: [
        {
          label: 'Manía',
          data: sorted.map(d => maniaByDate[d] ?? null),
          borderColor: '#0891b2',
          backgroundColor: 'rgba(8,145,178,0.12)',
          tension: 0.4,
          fill: false,
          spanGaps: true,
          pointRadius: 4,
        },
        {
          label: 'Depresión',
          data: sorted.map(d => depressionByDate[d] || null),
          borderColor: '#475569',
          backgroundColor: 'rgba(71,85,105,0.12)',
          tension: 0.4,
          fill: false,
          spanGaps: true,
          pointRadius: 4,
        },
        {
          label: 'Zona estable',
          data: sorted.map(() => 1),
          borderColor: 'rgba(16,185,129,0.3)',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderDash: [4, 4],
          borderWidth: 1,
          fill: '-1',
          pointRadius: 0,
          spanGaps: true,
        },
        {
          label: '_stable_bottom',
          data: sorted.map(() => -1),
          borderColor: 'transparent',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 0,
          fill: false,
          pointRadius: 0,
          spanGaps: true,
        },
      ],
    };
  }

  const bipolarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.raw;
            if (v === null) return '';
            if (v < 0) return `Depresión: ${Math.abs(v).toFixed(2)}/4`;
            return `Manía: ${v.toFixed(2)}/4`;
          },
        },
      },
    },
    scales: {
      y: {
        min: -4, max: 4,
        ticks: {
          font: { size: 10 },
          callback: (v) => v === 0 ? 'Estable' : v > 0 ? `+${v}` : v,
        },
        grid: {
          color: (ctx) => ctx.tick.value === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
          lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1,
        },
      },
      x: { ticks: { font: { size: 10 } } },
    },
  };

  async function handleExport() {
    await exportJSON();
    setMsg({ text: 'Archivo descargado correctamente.', type: 'success' });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  }

  async function handleDelete() {
    await deleteAll();
    setCgHistory([]); setPtHistory([]); setMoodHistory([]); setCompositeHistory([]);
    setConfirmDelete(false);
    setMsg({ text: 'Todos los datos fueron eliminados.', type: 'info' });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  }

  const VIEWS = [
    { key: 'summary', label: 'Resumen' },
    { key: 'radar', label: 'Radar' },
    { key: 'graph', label: 'Gráfico' },
    { key: 'reports', label: 'Reportes' },
  ];

  if (loading) {
    return (
      <Card>
        <p className="text-center text-slate-400 py-6">Cargando datos...</p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-700 dark:text-white mb-4">Análisis y Reportes</h1>

      {msg.text && <Alert variant={msg.type || 'info'}>{msg.text}</Alert>}

      <Card>
        {/* View toggle */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                view === key
                  ? 'bg-navy-700 text-white'
                  : 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtros de fecha */}
        <div className="mb-4">
          <div className="flex gap-1 flex-wrap mb-2">
            {QUICK_FILTERS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => { setQuickDays(days); setUseCustomRange(false); }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  !useCustomRange && quickDays === days
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-navy-600 hover:border-teal-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="date"
              value={dateFrom}
              max={today()}
              onChange={(e) => { setDateFrom(e.target.value); setUseCustomRange(true); }}
              className="border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">hasta</span>
            <input
              type="date"
              value={dateTo}
              max={today()}
              onChange={(e) => { setDateTo(e.target.value); setUseCustomRange(true); }}
              className="border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {useCustomRange && (
              <button
                onClick={() => { setUseCustomRange(false); setDateFrom(''); setDateTo(''); }}
                className="text-xs text-slate-400 underline cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* RESUMEN */}
        {view === 'summary' && (
          <>
            {isEmpty && <EmptyState title="Sin datos" description="No hay registros en este período." />}
            {!isEmpty && (() => {
              const { stabilityPct, dominantLabel, dominantColor } = computeStabilityMetrics(compositeFiltered);
              return (
                <div className="mb-5 space-y-4">
                  {/* Heatmap */}
                  <WeeklyHeatmap compositeRecs={compositeHistory} />

                  {/* Stability + Dominant */}
                  {(stabilityPct != null || dominantLabel) && (
                    <div className="grid grid-cols-2 gap-3">
                      {stabilityPct != null && (
                        <div className="bg-slate-50 dark:bg-navy-900 rounded-xl p-3 text-center">
                          <p className="text-xs text-slate-500 mb-1">Índice de estabilidad</p>
                          <p className={`text-2xl font-extrabold ${stabilityPct >= 70 ? 'text-emerald-600' : stabilityPct >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {stabilityPct}%
                          </p>
                          <p className="text-xs text-slate-400">días estables</p>
                        </div>
                      )}
                      {dominantLabel && (
                        <div className="bg-slate-50 dark:bg-navy-900 rounded-xl p-3 text-center">
                          <p className="text-xs text-slate-500 mb-1">Patrón dominante</p>
                          <p className={`text-lg font-extrabold ${dominantColor}`}>{dominantLabel}</p>
                          <p className="text-xs text-slate-400">en el período</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Composite-only summary: show module breakdown when no traditional tests */}
            {!isEmpty && !cgScores && !ptScores && compositeFiltered.length > 0 && (() => {
              const avgSection = (key) => {
                const vals = compositeFiltered.map(r => r.scoresBySection?.[key]).filter(v => v != null);
                return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
              };
              const mania = avgSection('mania');
              const depression = avgSection('depression');
              const mood = avgSection('mood');
              const overall = compositeFiltered.reduce((a, r) => a + (r.severity ?? 0), 0) / compositeFiltered.length;
              const barColor = (v) => v == null ? 'bg-slate-200' : v >= 3 ? 'bg-rose-400' : v >= 2 ? 'bg-amber-400' : v >= 1 ? 'bg-yellow-300' : 'bg-emerald-400';
              return (
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Resumen Adaptativo ({compositeFiltered.length} tests)</p>
                  <div className="space-y-2">
                    {[['Manía', mania, 'text-amber-600'], ['Depresión', depression, 'text-blue-600'], ['Ánimo', mood, 'text-indigo-600']].map(([label, val, color]) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className={`text-xs font-semibold w-20 ${color}`}>{label}</span>
                        <div className="flex-1 bg-slate-100 dark:bg-navy-800 rounded-full h-3 overflow-hidden">
                          <div className={`h-3 rounded-full transition-all ${barColor(val)}`} style={{ width: `${val != null ? Math.min(val / 4 * 100, 100) : 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-right">
                          {val != null ? `${val.toFixed(1)}/4` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <p className="text-xs text-slate-500 mb-1">Score general adaptativo</p>
                    <p className="text-2xl font-extrabold text-indigo-600">{overall.toFixed(2)}<span className="text-sm font-normal text-slate-400">/4</span></p>
                  </div>
                </div>
              );
            })()}

            {!isEmpty && (cgScores || ptScores) && (
              <>
                {/* Header tabla */}
                <div className="grid grid-cols-4 gap-2 px-2 mb-2">
                  <span className="text-xs font-bold text-slate-500">Dimensión</span>
                  <span className="text-xs font-bold text-teal-700 text-center">Cuidador</span>
                  <span className="text-xs font-bold text-violet-700 text-center">Paciente</span>
                  <span className="text-xs font-bold text-slate-500 text-center">Δ</span>
                </div>
                {DIMS.map((dim) => {
                  const cg = cgScores?.byDimension[dim] ?? null;
                  const pt = ptScores?.byDimension[dim] ?? null;
                  if (cg == null && pt == null) return null;
                  const delta = (cg != null && pt != null) ? Math.abs((cg ?? 0) - (pt ?? 0)) : null;
                  return (
                    <div key={dim} className="grid grid-cols-4 gap-2 px-2 py-2 bg-slate-50 dark:bg-navy-900 rounded-lg mb-1.5 items-center">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{dimLabels[dim]}</span>
                      <span className="text-center text-sm font-bold text-teal-700">{cg != null ? cg.toFixed(1) : '—'}</span>
                      <span className="text-center text-sm font-bold text-violet-700">{pt != null ? pt.toFixed(1) : '—'}</span>
                      <span className="text-center text-xs font-semibold">
                        {delta !== null ? (
                          <span className={delta < 0.5 ? 'text-emerald-600' : 'text-rose-500'}>
                            {delta < 0.5 ? '✓' : '!'} {delta.toFixed(1)}
                          </span>
                        ) : '—'}
                      </span>
                    </div>
                  );
                })}

                {/* Índice general */}
                <div className="mt-4 p-4 bg-navy-50 dark:bg-navy-900 rounded-xl border border-navy-200 dark:border-navy-700">
                  <p className="text-xs font-bold text-navy-700 dark:text-white mb-3 uppercase tracking-wide">Índice General de Manía</p>
                  <div className={`grid gap-4 ${cgScores && ptScores ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {cgScores && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Cuidador</p>
                        <p className="text-3xl font-extrabold" style={{ color: maniaLevel(cgScores.overall).color }}>
                          {cgScores.overall.toFixed(1)}<span className="text-base font-normal text-slate-400">/4</span>
                        </p>
                        <SeverityGauge score={cgScores.overall} />
                      </div>
                    )}
                    {ptScores && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Paciente</p>
                        <p className="text-3xl font-extrabold" style={{ color: maniaLevel(ptScores.overall).color }}>
                          {ptScores.overall.toFixed(1)}<span className="text-base font-normal text-slate-400">/4</span>
                        </p>
                        <SeverityGauge score={ptScores.overall} />
                      </div>
                    )}
                  </div>
                  {cgScores && ptScores && (() => {
                    const diff = Math.abs(cgScores.overall - ptScores.overall);
                    const msg = diff > 1.5 ? 'Posible falta de conciencia — el/la paciente subestima significativamente sus síntomas.'
                      : diff > 0.8 ? 'Discrepancia moderada en la percepción de los síntomas.'
                      : 'Buena concordancia entre cuidador y paciente.';
                    return (
                      <div className={`mt-3 flex gap-2 items-start text-xs ${diff > 0.8 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {diff > 0.8 && <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />}
                        <span>{msg}</span>
                      </div>
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
            {isEmpty && <EmptyState title="Sin datos" description="No hay registros en este período." />}
            {!isEmpty && (cgScores || ptScores) && (() => {
              // Active DIMS: those with at least one non-null value across any dataset
              const activeDims = DIMS.filter(d =>
                (cgScores?.byDimension[d] != null) || (ptScores?.byDimension[d] != null)
              );
              return (
                <div style={{ height: 300 }}>
                  <Radar
                    data={{
                      labels: activeDims.map((d) => dimLabels[d]),
                      datasets: [
                        ...(cgScores ? [{
                          label: 'Cuidador',
                          data: activeDims.map((d) => cgScores.byDimension[d] ?? 0),
                          borderColor: '#0891b2',
                          backgroundColor: 'rgba(8,145,178,0.2)',
                          pointBackgroundColor: '#0891b2',
                        }] : []),
                        ...(ptScores ? [{
                          label: 'Paciente',
                          data: activeDims.map((d) => ptScores.byDimension[d] ?? 0),
                          borderColor: '#7c3aed',
                          backgroundColor: 'rgba(124,58,237,0.2)',
                          pointBackgroundColor: '#7c3aed',
                        }] : []),
                      ],
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      scales: { r: { beginAtZero: true, max: 4, ticks: { stepSize: 1, font: { size: 9 } }, pointLabels: { font: { size: 9 } } } },
                      plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } },
                    }}
                  />
                </div>
              );
            })()}
            {!isEmpty && !cgScores && !ptScores && compositeFiltered.length > 0 && (() => {
              // Composite-only radar: show 3-axis mania/mood/depression
              const avgSection = (key) => {
                const vals = compositeFiltered.map(r => r.scoresBySection?.[key]).filter(v => v != null);
                return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
              };
              const labels = ['Manía', 'Ánimo', 'Depresión'];
              const data = [avgSection('mania'), avgSection('mood'), avgSection('depression')];
              return (
                <div style={{ height: 300 }}>
                  <Radar
                    data={{
                      labels,
                      datasets: [{
                        label: 'Test Adaptativo',
                        data,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.2)',
                        pointBackgroundColor: '#6366f1',
                      }],
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      scales: { r: { beginAtZero: true, max: 4, ticks: { stepSize: 1, font: { size: 9 } }, pointLabels: { font: { size: 11 } } } },
                      plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } },
                    }}
                  />
                </div>
              );
            })()}
          </>
        )}

        {/* GRÁFICO BIPOLAR */}
        {view === 'graph' && (
          <>
            <div className="mb-2">
              <p className="text-xs text-slate-500">
                Manía positiva (+0 a +4) · Depresión negativa (0 a -4) · Línea central = estado estable
              </p>
            </div>
            {isEmpty && <EmptyState title="Sin datos" description="No hay registros en este período." />}
            {!isEmpty && (
              <div style={{ height: 280 }}>
                <Line data={buildBipolarChartData()} options={bipolarChartOptions} />
              </div>
            )}
          </>
        )}

        {/* REPORTES */}
        {view === 'reports' && (
          <div>
            <p className="text-sm font-semibold text-navy-700 dark:text-white mb-3">Resumen del período</p>
            {(() => {
              const compManiaAvg = compositeFiltered.length
                ? compositeFiltered.reduce((a, r) => a + (r.scoresBySection?.mania ?? r.severity ?? 0), 0) / compositeFiltered.length
                : null;
              const compDepAvg = compositeFiltered.length
                ? compositeFiltered.reduce((a, r) => a + (r.scoresBySection?.depression ?? 0), 0) / compositeFiltered.length
                : null;
              const compTrend = trendInfo(compositeFiltered);
              return (
                <StatsGrid>
                  <StatBox label="Tests adaptativos" value={compositeFiltered.length} colorClass="text-indigo-700" />
                  {compManiaAvg != null && (
                    <StatBox label="Promedio Manía" value={compManiaAvg.toFixed(2)}
                      colorClass={compManiaAvg >= 2.8 ? 'text-rose-600' : compManiaAvg >= 1.5 ? 'text-amber-600' : 'text-emerald-600'}
                      sub={compTrend?.label}
                    />
                  )}
                  {compDepAvg != null && compDepAvg > 0 && (
                    <StatBox label="Promedio Depresión" value={compDepAvg.toFixed(2)}
                      colorClass={compDepAvg >= 2.8 ? 'text-rose-600' : compDepAvg >= 1.5 ? 'text-amber-600' : 'text-emerald-600'}
                    />
                  )}
                </StatsGrid>
              );
            })()}

            {/* Tabla historial */}
            {(() => {
              const allRecords = [
                ...compositeFiltered.map(r => ({ ...r, _role: r.submittedByRole ?? 'caregiver', _testType: 'composite', _legacy: false })),
                ...cgFiltered.map(r => ({ ...r, _role: 'caregiver', _testType: r.testType || 'mania', _legacy: true })),
                ...ptFiltered.map(r => ({ ...r, _role: 'patient', _testType: r.testType || 'mania', _legacy: true })),
                ...moodFiltered.map(r => ({ ...r, _role: 'patient', _testType: 'mood_comprehensive', _legacy: true })),
              ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

              return (
                <>
                  <p className="text-sm font-semibold text-navy-700 dark:text-white mt-4 mb-2">
                    Historial ({allRecords.length} registros)
                  </p>
                  {allRecords.length === 0 ? (
                    <EmptyState title="Sin datos" description="No hay registros en este período." />
                  ) : (
                    <div className="space-y-1.5">
                      {allRecords.map((r, i) => {
                        const rowKey = r._id ?? i;
                        const isExpanded = expandedRow === rowKey;
                        const isComposite = r._testType === 'composite';
                        const isMood = r._testType === 'mood_comprehensive';
                        const score = isMood ? r.depressionScore : (isComposite ? (r.scoresBySection?.mania ?? r.severity) : r.severity);
                        const rawAnswers = r.raw ?? {};
                        const answeredQs = Object.entries(rawAnswers).filter(([id]) => ALL_QUESTIONS[id]);

                        return (
                          <div key={rowKey} className="rounded-lg overflow-hidden border border-slate-100 dark:border-navy-700">
                            <div
                              className="flex items-center gap-2 bg-slate-50 dark:bg-navy-900 px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                              onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                            >
                              <span className="text-slate-500 dark:text-slate-400 w-16 flex-shrink-0">{formatDate(r.timestamp)}</span>
                              <TestTypeBadge testType={r._testType} />
                              <RoleBadge role={r._role} />
                              {r._legacy && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-navy-700 text-slate-500 dark:text-slate-400">legacy</span>
                              )}
                              <span className="ml-auto font-bold text-sm" style={{
                                color: isMood
                                  ? (score >= 3 ? '#dc2626' : score >= 2 ? '#d97706' : '#059669')
                                  : maniaLevel(score ?? 0).color
                              }}>
                                {score != null ? score.toFixed(2) : '—'}
                              </span>
                              {isMood ? <MoodBadge depressionScore={score} /> : <SeverityBadge score={score} />}
                              {answeredQs.length > 0 && (
                                isExpanded ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                              )}
                            </div>

                            {isExpanded && answeredQs.length > 0 && (
                              <div className="bg-white dark:bg-navy-950 border-t border-slate-100 dark:border-navy-700 px-3 py-2 space-y-1.5">
                                {isComposite && r.scoresBySection && (
                                  <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-100 dark:border-navy-700">
                                    {r.scoresBySection.mania != null && <span>Manía: <strong className="text-amber-600">{r.scoresBySection.mania.toFixed(2)}</strong></span>}
                                    {r.scoresBySection.depression != null && <span>Depresión: <strong className="text-blue-600">{r.scoresBySection.depression.toFixed(2)}</strong></span>}
                                    {r.scoresBySection.mood != null && <span>Ánimo: <strong className="text-violet-600">{r.scoresBySection.mood.toFixed(2)}</strong></span>}
                                  </div>
                                )}
                                {answeredQs.map(([qId, ansIdx]) => {
                                  const q = ALL_QUESTIONS[qId];
                                  const optText = q.options?.[ansIdx] ?? `Opción ${ansIdx}`;
                                  return (
                                    <div key={qId} className="text-xs">
                                      <span className="text-slate-500 dark:text-slate-400">{q.question}</span>
                                      <span className="ml-2 font-semibold text-navy-700 dark:text-white">{optText}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Acciones */}
            <div className="mt-6 space-y-2">
              <Button variant="secondary" size="md" fullWidth onClick={handleExport}>
                <Download size={15} />
                Exportar datos como JSON
              </Button>
              {!confirmDelete ? (
                <Button variant="danger" size="md" fullWidth onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={15} />
                  Eliminar todos los datos
                </Button>
              ) : (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
                  <p className="text-sm text-rose-800 dark:text-rose-300 font-semibold mb-3">
                    Esto borra permanentemente TODO el historial. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="danger" size="sm" onClick={handleDelete} fullWidth>Sí, eliminar</Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)} fullWidth>Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
