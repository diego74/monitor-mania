import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, BarChart2, Clock, Flame, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getLastCaregiverMania, getLastMood, getAllCaregiver, getAllMood, getAllComposite, getAllPatient,
  hasFilledToday, COLLECTION_NAMES,
} from '../services/storage';
import { maniaLevel } from '../data/questions';
import { daysSince, filterByDays } from '../utils/dates';
import { Card, CardTitle } from '../components/ui/Card';
import { SeverityBadge, MoodBadge } from '../components/ui/Badge';
import { SeverityGauge } from '../components/ui/SeverityGauge';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';

function computeStreak(records) {
  if (!records.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let checkDate = new Date(today);
  const dateSet = new Set(
    records.map(r => {
      const d = new Date(r.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  while (dateSet.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

function avg7d(records) {
  const filtered = filterByDays(records, 7).filter(r => r.severity != null);
  if (!filtered.length) return null;
  return filtered.reduce((a, r) => a + r.severity, 0) / filtered.length;
}

// Mini sparkline (last 7 days)
function Sparkline({ records, color = '#0891b2' }) {
  const last7 = filterByDays(records, 7).filter(r => r.severity != null);
  if (last7.length < 2) return null;
  const vals = last7.map(r => r.severity);
  const max = Math.max(...vals, 4);
  const min = 0;
  const W = 80, H = 28;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x},${y}`;
  });
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((pt, i) => {
        const [x, y] = pt.split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

export default function Dashboard() {
  const { patientName } = useApp();
  const navigate = useNavigate();

  const [lastCg, setLastCg] = useState(null);
  const [lastMood, setLastMood] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [cgRecords, setCgRecords] = useState([]);
  const [moodRecords, setMoodRecords] = useState([]);
  const [filledToday, setFilledToday] = useState({ mania: false, mood: false, composite: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLastCaregiverMania(),
      getLastMood(),
      getAllCaregiver(),
      getAllMood(),
      getAllComposite(),
      getAllPatient(),
      hasFilledToday(COLLECTION_NAMES.caregiver),
      hasFilledToday(COLLECTION_NAMES.mood),
      hasFilledToday(COLLECTION_NAMES.composite),
    ]).then(([cg, mood, cgAll, moodAll, compositeAll, ptAll, maniaDone, moodDone, compositeDone]) => {
      setLastCg(cg);
      setLastMood(mood);
      setCgRecords(cgAll);
      setMoodRecords(moodAll);
      setAllRecords([...cgAll, ...moodAll, ...compositeAll, ...ptAll]);
      setFilledToday({ mania: maniaDone, mood: moodDone, composite: compositeDone });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <p className="text-center text-slate-400 dark:text-slate-500 py-6">Cargando...</p>
      </Card>
    );
  }

  const maniaScore = lastCg?.severity;
  const maniaInfo  = maniaScore != null ? maniaLevel(maniaScore) : null;
  const daysAgoMania = lastCg ? daysSince(lastCg.timestamp) : null;
  const daysAgoMood  = lastMood ? daysSince(lastMood.timestamp) : null;

  const streak  = computeStreak(allRecords);
  const avg7dMania = avg7d(cgRecords);
  const avg7dMood  = avg7d(moodRecords);
  const noRecordAlert = daysAgoMania != null && daysAgoMood != null
    ? Math.min(daysAgoMania, daysAgoMood) > 2
    : (daysAgoMania ?? daysAgoMood ?? 3) > 2;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy-700 dark:text-white">Seguimiento de {patientName}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Resumen del estado actual</p>
      </div>

      {/* Alert: no recent activity */}
      {noRecordAlert && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Han pasado más de 2 días sin ningún registro. Recordá completar el seguimiento diario.
          </p>
        </div>
      )}

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-3 shadow-card text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={14} className="text-rose-500" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Racha</span>
          </div>
          <p className="text-2xl font-extrabold text-navy-700 dark:text-white">{streak}</p>
          <p className="text-xs text-slate-400">día{streak !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-3 shadow-card text-center">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Manía 7d</p>
          <p className="text-2xl font-extrabold text-navy-700 dark:text-white">
            {avg7dMania != null ? avg7dMania.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-slate-400">prom.</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-3 shadow-card text-center">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Ánimo 7d</p>
          <p className="text-2xl font-extrabold text-navy-700 dark:text-white">
            {avg7dMood != null ? avg7dMood.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-slate-400">prom.</p>
        </div>
      </div>

      {/* Estado hoy */}
      <Card>
        <CardTitle>Estado de hoy</CardTitle>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Test manía', done: filledToday.mania },
            { label: 'Test ánimo', done: filledToday.mood },
            { label: 'Test adaptativo', done: filledToday.composite },
          ].map(({ label, done }) => (
            <div key={label} className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${
              done
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700'
            }`}>
              {done
                ? <CheckCircle size={18} className="text-emerald-500" />
                : <Clock size={18} className="text-slate-400" />
              }
              <p className="text-xs text-center font-medium text-slate-600 dark:text-slate-300">{label}</p>
              <span className={`text-xs font-semibold ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {done ? '✓ Hecho' : 'Pendiente'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Último test manía */}
      <Card>
        <CardTitle>Último registro de manía</CardTitle>
        {lastCg ? (
          <div>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-extrabold" style={{ color: maniaInfo?.color }}>
                {maniaScore.toFixed(1)}
                <span className="text-base font-normal text-slate-400 dark:text-slate-500">/4</span>
              </span>
              <SeverityBadge score={maniaScore} />
            </div>
            <SeverityGauge score={maniaScore} />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <Clock size={12} />
                <span>{daysAgoMania === 0 ? 'Hoy' : `Hace ${daysAgoMania} día${daysAgoMania > 1 ? 's' : ''}`}</span>
              </div>
              {cgRecords.length >= 2 && (
                <Sparkline records={cgRecords} color="#0891b2" />
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">No hay tests de manía registrados.</p>
        )}
      </Card>

      {/* Último test de ánimo */}
      {lastMood && (
        <Card>
          <CardTitle>Último test de ánimo</CardTitle>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-3xl font-extrabold text-slate-700 dark:text-slate-200">
              {(lastMood.depressionScore ?? lastMood.severity ?? 0).toFixed(1)}
              <span className="text-base font-normal text-slate-400 dark:text-slate-500">/4</span>
            </span>
            <MoodBadge depressionScore={lastMood.depressionScore ?? lastMood.severity} />
          </div>
          {lastMood.crisis_flag && (
            <div className="mt-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2 font-semibold">
              Alerta: pensamientos de crisis detectados. Consultar al equipo de salud.
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={12} />
              <span>{daysAgoMood === 0 ? 'Hoy' : `Hace ${daysAgoMood} día${daysAgoMood > 1 ? 's' : ''}`}</span>
            </div>
            {moodRecords.length >= 2 && (
              <Sparkline records={moodRecords} color="#475569" />
            )}
          </div>
        </Card>
      )}

      {/* Acciones rápidas */}
      <Card>
        <CardTitle>Acciones rápidas</CardTitle>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="navy" fullWidth onClick={() => navigate('/caregiver')}>
            <ClipboardList size={16} />
            Hacer test ahora
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/analysis')}>
            <BarChart2 size={16} />
            Ver análisis
          </Button>
        </div>
      </Card>
    </div>
  );
}
