import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, ArrowLeft, Send, RotateCcw, ChevronDown, ChevronUp, Bug, Activity } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getAllQuestions } from '../services/questionStorage';
import { saveTestResult, hasFilledToday } from '../services/storage';
import { calcCompositeSeverity } from '../utils/compositeScoring';

const OPTION_SELECTED = "bg-teal-50 dark:bg-teal-900/20 border-teal-500 text-teal-700 dark:text-teal-300";
const OPTION_DEFAULT  = "bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:border-teal-300";

function useDebugMode() {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return false;
  return new URLSearchParams(hash.slice(qIdx + 1)).get('debug') === '1';
}

function getQuestionText(q) {
  return {
    patient: q.patient || q.question || '',
    caregiver: q.caregiver || ''
  };
}

function CompositeDebugPanel({ queue, currentIdx, answers, questionBank }) {
  const [collapsed, setCollapsed] = useState(true);
  const scores = calcCompositeSeverity(answers, questionBank);
  const { mania, depression } = scores.byModule;
  const stability = scores.stability;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl shadow-2xl overflow-hidden font-mono text-[10px] border border-teal-500 bg-navy-900/95 text-slate-300">
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-navy-900 text-teal-400 font-bold"
      >
        <div className="flex items-center gap-2">
          <Bug size={14} />
          <span>ESTABILIDAD: {stability > 0 ? '+' : ''}{stability.toFixed(1)}</span>
        </div>
        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {!collapsed && (
        <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
             <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg text-center">
               <p className="text-amber-400 font-bold uppercase text-[8px]">Manía</p>
               <p className="text-lg font-black text-amber-500">{mania.toFixed(1)}</p>
             </div>
             <div className="bg-blue-500/10 border border-blue-500/30 p-2 rounded-lg text-center">
               <p className="text-blue-400 font-bold uppercase text-[8px]">Depresión</p>
               <p className="text-lg font-black text-blue-500">{depression.toFixed(1)}</p>
             </div>
          </div>

          <div className="p-2 bg-slate-800/50 rounded-lg">
            <p className="text-teal-400 font-bold uppercase text-[9px] mb-1 text-center">Estabilidad (-5 a +5)</p>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden flex border border-white/5">
              <div className="flex-1 bg-blue-500/20 flex justify-end">
                 <div className="bg-blue-500 h-full" style={{ width: `${Math.min(depression/5*100, 100)}%` }} />
              </div>
              <div className="w-0.5 bg-white z-10" />
              <div className="flex-1 bg-amber-500/20">
                 <div className="bg-amber-500 h-full" style={{ width: `${Math.min(mania/5*100, 100)}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-bold mt-1">
               <span>-5</span>
               <span className={stability === 0 ? 'text-emerald-400' : ''}>0</span>
               <span>+5</span>
            </div>
          </div>

          <div>
            <p className="text-teal-500 font-bold mb-1 uppercase text-[9px]">Progreso del Test</p>
            <p>Pregunta: {currentIdx + 1} / {queue.length}</p>
            <p className="text-slate-400">Grupo: {queue[currentIdx]?.objective || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-teal-500 font-bold mb-1 uppercase text-[9px]">Respuestas Actuales</p>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {Object.entries(answers).map(([id, val]) => {
                const q = questionBank.find(item => (item._id === id || item.id === id));
                return (
                  <div key={id} className="flex justify-between gap-2 border-b border-white/5 pb-1 last:border-0">
                    <span className="text-slate-400 truncate">{q?.name || id}</span>
                    <span className="text-teal-400 shrink-0">Opt: {val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-teal-500 font-bold mb-1 uppercase text-[9px]">Triggers Siguientes</p>
            <div className="space-y-1 opacity-70">
              {queue[currentIdx]?.next?.map((n, idx) => (
                <div key={idx} className="bg-navy-800 p-1 rounded">
                  Si ans={n.answerIndex} → {n.targetId}
                </div>
              ))}
              {(!queue[currentIdx]?.next || queue[currentIdx]?.next.length === 0) && <p className="italic">Sin triggers</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompositeTest() {
  const { patientName, patientId, isCaregiver } = useApp();
  const debugMode = useDebugMode();
  
  // State
  const [questionBank, setQuestionBank] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [filledToday, setFilledToday] = useState(false);
  const [showAnyway, setShowAnyway] = useState(false);
  const [role, setRole] = useState(() => {
    if (!isCaregiver) return 'user';
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return urlParams.get('role') || null;
  }); // 'user' or 'caregiver'

  useEffect(() => {
    if (!isCaregiver) {
      setRole('user');
    } else {
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const urlRole = urlParams.get('role');
      if (urlRole) setRole(urlRole);
    }
  }, [isCaregiver]);


  // Load questions
  useEffect(() => {
    async function load() {
      try {
        const [bank, filledStatus] = await Promise.all([
          getAllQuestions(),
          hasFilledToday()
        ]);
        
        setQuestionBank(bank);
        setFilledToday(isCaregiver ? filledStatus.caregiver : filledStatus.patient);

        
        // Initial queue
        const initial = bank
          .filter(q => q.isInitial)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setQueue(initial);
      } catch (err) {
        console.error('Error loading test:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isCaregiver]);

  const handleAnswer = useCallback((qId, ansIdx) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [qId]: ansIdx };
      
      // Look for triggers in the current question
      const q = questionBank.find(item => (item._id === qId || item.id === qId));
      if (q && q.next) {
        const triggers = q.next.filter(t => t.answerIndex === ansIdx);
        if (triggers.length > 0) {
          setQueue(prevQueue => {
            const nextQueue = [...prevQueue];
            const alreadyInQueue = new Set(nextQueue.map(item => item.id || item._id));
            
            triggers.forEach(t => {
              const target = questionBank.find(item => (item.id === t.targetId || item._id === t.targetId));
              if (target && !alreadyInQueue.has(target.id || target._id)) {
                nextQueue.push(target);
              }
            });
            return nextQueue;
          });
        }
      }
      
      return newAnswers;
    });

    // Auto-advance
    setTimeout(() => {
      if (currentIdx < queue.length - 1) {
        setCurrentIdx(prev => prev + 1);
      }
    }, 400);
  }, [questionBank, currentIdx, queue.length]);

  async function handleSubmit() {
    setSaving(true);
    try {
      const scores = calcCompositeSeverity(answers, queue);
      
      const payload = {
        patientId,
        testType: 'adaptive_pure',
        submittedByRole: role,
        answers,
        scores: scores.byModule || {},
        severity: scores.overall || 0,
        stability: scores.stability || 0,
        context: {
          appVersion: '4.0-pure-dynamic',
          totalQuestions: queue.length
        }
      };
      
      await saveTestResult(payload);
      setDone(true);
    } catch (err) {
      console.error('Error saving test:', err);
      alert('Error al guardar. Verificá la conexión.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card><p className="text-center py-8">Cargando evaluación...</p></Card>;

  if (!role) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-6 gap-6">
          <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <Activity size={36} className="text-teal-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-700 dark:text-white mb-2">¿Quién realiza la evaluación?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Personalizaremos las preguntas según tu rol para mayor precisión.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
              onClick={() => setRole('user')}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 dark:border-navy-800 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-navy-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                 👤
              </div>
              <span className="font-bold text-sm text-navy-700 dark:text-white uppercase tracking-tight">Paciente</span>
            </button>
            <button 
              onClick={() => setRole('caregiver')}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 dark:border-navy-800 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-navy-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                 🤝
              </div>
              <span className="font-bold text-sm text-navy-700 dark:text-white uppercase tracking-tight">Cuidador</span>
            </button>
          </div>
        </div>
      </Card>
    );
  }
  
  if (queue.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <RotateCcw size={36} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-700 dark:text-white mb-1">No hay preguntas configuradas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Parece que el banco de preguntas está vacío o no hay preguntas iniciales configuradas.
              Asegúrate de haber migrado o creado preguntas en el panel de administración.
            </p>
          </div>
          <Button variant="primary" onClick={() => window.location.href='#/admin/questions'}>
            Ir a Configuración
          </Button>
        </div>
      </Card>
    );
  }

  if (filledToday && !showAnyway) {

    return (
      <Card>
        <div className="flex flex-col items-center text-center py-6 gap-4">
          <CheckCircle size={48} className="text-emerald-500" />
          <div>
            <h2 className="text-lg font-bold text-navy-700 dark:text-white mb-1">Ya enviaste tu evaluación hoy</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tus respuestas de hoy ya están registradas. Podés hacer otra si querés.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setShowAnyway(true)}>
            <RotateCcw size={15} />
            Hacer otra evaluación
          </Button>
        </div>
      </Card>
    );
  }

  if (done) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle size={36} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-700 dark:text-white mb-1">¡Listo, gracias!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tu evaluación adaptativa fue guardada correctamente.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const currentQuestion = queue[currentIdx];
  if (!currentQuestion) return <Card><p className="text-center py-8">Fin de la evaluación.</p></Card>;

  const progress = ((Object.keys(answers).length) / queue.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Evaluación de {patientName}
        </p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
          Pregunta {currentIdx + 1}
        </span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-1.5 overflow-hidden">
        <div 
          className="h-full bg-teal-500 transition-all duration-500" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <Card>
        {isCaregiver && currentQuestion.name && (
          <p className="text-[10px] uppercase tracking-wider font-bold text-teal-600 dark:text-teal-400 mb-1">
            {currentQuestion.name}
          </p>
        )}
        <div className="space-y-3 mb-5">
          <p className="text-base font-semibold text-navy-800 dark:text-white leading-snug">
            {role === 'caregiver' 
              ? (getQuestionText(currentQuestion).caregiver || getQuestionText(currentQuestion).patient)
              : getQuestionText(currentQuestion).patient
            }
          </p>
          {isCaregiver && role === 'user' && getQuestionText(currentQuestion).caregiver && (
            <p className="text-[10px] text-slate-400 italic mt-2 opacity-60">
              Nota: Existe una versión para cuidador de esta pregunta.
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          {currentQuestion.options.map((opt, idx) => {
            const qId = currentQuestion._id || currentQuestion.id;
            const selected = answers[qId] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(qId, idx)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                  selected ? OPTION_SELECTED : OPTION_DEFAULT
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
                }`}>
                  {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-sm font-medium">{opt}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
        >
          <ArrowLeft size={16} /> Anterior
        </Button>

        {currentIdx === queue.length - 1 && answers[currentQuestion._id || currentQuestion.id] !== undefined && (
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth 
            onClick={handleSubmit} 
            disabled={saving}
          >
            <Send size={16} /> {saving ? 'Guardando...' : 'Finalizar'}
          </Button>
        )}
      </div>

      {debugMode && (
        <CompositeDebugPanel 
          queue={queue} 
          currentIdx={currentIdx} 
          answers={answers} 
          questionBank={questionBank} 
        />
      )}
    </div>
  );
}

