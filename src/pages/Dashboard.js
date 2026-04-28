import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, AlertCircle, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  getAllTestResults, hasFilledToday
} from '../services/storage';
import { daysSince } from '../utils/dates';
import { Card, CardTitle } from '../components/ui/Card';
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
      const d = new Date(r.submittedAt || r.timestamp);
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

export default function Dashboard() {
  const { patientName, token } = useApp();
  const navigate = useNavigate();

  const [allRecords, setAllRecords] = useState([]);
  const [filledStatus, setFilledStatus] = useState({ any: false, patient: false, caregiver: false });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      getAllTestResults(),
      hasFilledToday(),
    ]).then(([testResults, status]) => {
      setAllRecords(testResults);
      setFilledStatus(status);
    }).finally(() => setLoading(false));
  }, []);

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#/p/${token}/composite`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <p className="text-center text-slate-400 dark:text-slate-500 py-6">Cargando...</p>
      </Card>
    );
  }

  const safeDate = (ts) => {
    if (typeof ts === 'string' && ts.includes('-') && !ts.includes('T')) {
      const [y, m, d] = ts.split('-');
      return new Date(y, m - 1, d);
    }
    return new Date(ts);
  };

  const streak = computeStreak(allRecords);
  const compositeRecs = allRecords.filter(r => 
    r.testType === 'composite' || 
    r.testType === 'adaptive_pure' || 
    r.stability !== undefined ||
    (r.scores?.mania !== undefined && r.scores?.depression !== undefined)
  );
  const latest = compositeRecs[0];
  
  // Stats calculations: average if multiple for the same day
  const latestDateStr = latest ? safeDate(latest.submittedAt || latest.timestamp).toDateString() : null;
  const latestRecs = compositeRecs.filter(r => safeDate(r.submittedAt || r.timestamp).toDateString() === latestDateStr);
  
  let maniaVal = 0, depressionVal = 0, moodVal = 0;
  let hasDiscrepancy = false;
  let discrepancyMsg = '';

  if (latestRecs.length > 0) {
    const sum = latestRecs.reduce((acc, r) => {
      acc.mania += (r.scores?.mania ?? r.severity ?? 0);
      acc.depression += (r.scores?.depression ?? 0);
      acc.mood += (r.scores?.mood ?? 0);
      return acc;
    }, { mania: 0, depression: 0, mood: 0 });
    
    maniaVal = sum.mania / latestRecs.length;
    depressionVal = sum.depression / latestRecs.length;
    moodVal = sum.mood / latestRecs.length;

    const patientRec = latestRecs.find(r => r.submittedByRole === 'patient' || r.submittedByRole === 'user');
    const caregiverRec = latestRecs.find(r => r.submittedByRole === 'caregiver');
    
    if (patientRec && caregiverRec) {
      const pMania = patientRec.scores?.mania ?? patientRec.severity ?? 0;
      const cMania = caregiverRec.scores?.mania ?? caregiverRec.severity ?? 0;
      const pDep = patientRec.scores?.depression ?? 0;
      const cDep = caregiverRec.scores?.depression ?? 0;
      
      if (Math.abs(pMania - cMania) >= 2 || Math.abs(pDep - cDep) >= 2) {
        hasDiscrepancy = true;
        discrepancyMsg = "Hay una diferencia significativa entre la percepción del paciente y la del cuidador.";
      }
    }
  }

  const stabilityVal = maniaVal - depressionVal;
  const daysAgo = latest ? daysSince(latest.submittedAt || latest.timestamp) : null;
  const noRecordAlert = (daysAgo ?? 3) > 2;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-2xl font-black text-navy-700 dark:text-white uppercase tracking-tighter">Panel de {patientName}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Estado Clínico en Tiempo Real</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleShare} className="rounded-xl px-3">
          {copied ? '¡Copiado!' : 'Compartir link'}
        </Button>
      </div>

      {noRecordAlert && (
        <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl">
          <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-800 dark:text-rose-200 font-bold uppercase tracking-tight">
            Alerta: No hay registros recientes. Es vital completar la evaluación hoy.
          </p>
        </div>
      )}

      {hasDiscrepancy && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200 font-bold uppercase tracking-tight">
            Atención: {discrepancyMsg}
          </p>
        </div>
      )}

      {/* MÉTRICAS CLAVE */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-3 shadow-lg border border-slate-50 dark:border-navy-700 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Racha</p>
          <p className="text-2xl font-black text-navy-700 dark:text-white">{streak}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-3 shadow-lg border border-slate-50 dark:border-navy-700 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Manía</p>
          <p className={`text-2xl font-black ${Math.abs(maniaVal) <= 2 ? 'text-rose-300' : 'text-rose-500'}`}>{maniaVal.toFixed(1)}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-3 shadow-lg border border-slate-50 dark:border-navy-700 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Depre</p>
          <p className={`text-2xl font-black ${Math.abs(depressionVal) <= 2 ? 'text-blue-300' : 'text-blue-500'}`}>{depressionVal.toFixed(1)}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-3 shadow-lg border border-slate-50 dark:border-navy-700 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Mixto</p>
          <p className={`text-2xl font-black ${Math.abs(moodVal) <= 2 ? 'text-amber-300' : 'text-amber-500'}`}>{moodVal.toFixed(1)}</p>
        </div>
      </div>

      {/* ESTABILIDAD CLÍNICA */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Estabilidad Clínica</CardTitle>
          <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-navy-900 text-[10px] font-black text-slate-500">
            RANGO -5 A +5
          </div>
        </div>

        {!latest ? (
           <div className="py-8 text-center">
             <Activity size={48} className="mx-auto text-slate-200 mb-3" />
             <p className="text-sm text-slate-400 font-bold">Aún no hay datos adaptativos.</p>
           </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Punto de Equilibrio Actual</p>
                 <div className="flex items-end gap-2">
                    <p className={`text-6xl font-black leading-none ${
                      Math.abs(stabilityVal) <= 2
                        ? (stabilityVal > 0 ? 'text-rose-300' : stabilityVal < 0 ? 'text-blue-300' : 'text-emerald-300')
                        : (stabilityVal > 0 ? 'text-rose-600' : 'text-blue-600')
                    }`}>
                       {stabilityVal > 0 ? '+' : ''}{stabilityVal.toFixed(1)}
                    </p>
                    <div className="mb-1">
                       {moodVal >= 2 ? <AlertCircle className="text-amber-500" /> : Math.abs(stabilityVal) < 1 ? <Minus className="text-emerald-500" /> : stabilityVal > 0 ? <TrendingUp className={stabilityVal > 2 ? "text-rose-600" : "text-rose-300"} /> : <TrendingDown className={stabilityVal < -2 ? "text-blue-600" : "text-blue-300"} />}
                       <p className={`text-[10px] font-black uppercase ${
                         Math.abs(stabilityVal) <= 2 ? 'text-slate-400' : 'text-slate-600'
                       }`}>
                         {moodVal >= 2 ? 'Estado Mixto' : (Math.abs(stabilityVal) < 1 ? 'Estable' : stabilityVal > 0 ? 'Manía' : 'Depresión')}
                       </p>
                    </div>
                 </div>
               </div>
               
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Última Evaluación</p>
                  <p className="text-sm font-black text-navy-700 dark:text-white">{daysAgo === 0 ? 'HOY' : `HACE ${daysAgo} DÍAS`}</p>
               </div>
            </div>

            <div className="relative">
              <div className="w-full bg-slate-100 dark:bg-navy-900 h-6 rounded-2xl overflow-hidden flex border-2 border-slate-50 dark:border-navy-700 shadow-inner">
                <div className="flex-1 bg-blue-500/10 flex justify-end">
                   <div className={`h-full transition-all duration-1000 ${Math.abs(depressionVal) <= 2 ? 'bg-blue-300' : 'bg-blue-500'}`} style={{ width: `${Math.min(depressionVal/5*100, 100)}%` }} />
                </div>
                <div className="w-1 bg-navy-700 z-10" />
                <div className="flex-1 bg-rose-500/10">
                   <div className={`h-full transition-all duration-1000 ${Math.abs(maniaVal) <= 2 ? 'bg-rose-300' : 'bg-rose-500'}`} style={{ width: `${Math.min(maniaVal/5*100, 100)}%` }} />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                <span>Depresión Profunda (-5)</span>
                <span className="text-navy-700">Equilibrio (0)</span>
                <span>Manía Psicótica (+5)</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ESTADO DE HOY */}
      <Card>
        <div className="space-y-3">
          <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
            filledStatus.patient ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filledStatus.patient ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
               👤
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-navy-700 uppercase tracking-tight">Evaluación Paciente</p>
              <p className={`text-[10px] font-bold ${filledStatus.patient ? 'text-emerald-600' : 'text-slate-500'}`}>
                {filledStatus.patient ? 'Completada' : 'Pendiente'}
              </p>
            </div>
            <Button 
              variant={filledStatus.patient ? "secondary" : "primary"} 
              size="sm" 
              onClick={() => navigate('/test/composite?role=user')}
            >
              {filledStatus.patient ? 'VOLVER A HACER' : 'HACER'}
            </Button>
          </div>

          <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
            filledStatus.caregiver ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filledStatus.caregiver ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
               🤝
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-navy-700 uppercase tracking-tight">Evaluación Cuidador</p>
              <p className={`text-[10px] font-bold ${filledStatus.caregiver ? 'text-emerald-600' : 'text-slate-500'}`}>
                {filledStatus.caregiver ? 'Completada' : 'Pendiente'}
              </p>
            </div>
            <Button 
              variant={filledStatus.caregiver ? "secondary" : "primary"} 
              size="sm" 
              onClick={() => navigate('/test/composite?role=caregiver')}
            >
              {filledStatus.caregiver ? 'VOLVER A HACER' : 'HACER'}
            </Button>
          </div>
        </div>
      </Card>

      {/* ACCIONES */}
      <div className="pb-8">
        <Button variant="secondary" fullWidth size="lg" className="rounded-3xl h-16 text-sm font-black uppercase tracking-widest shadow-xl" onClick={() => navigate('/analysis')}>
          <BarChart2 size={20} className="mr-2" />
          Ver Evolución Completa
        </Button>
      </div>
    </div>
  );
}
