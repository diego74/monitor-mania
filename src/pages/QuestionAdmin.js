import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { QuestionForm } from '../components/admin/QuestionForm';
import { ArrowLeft, Edit, Trash2, Plus, Settings, ListChecks, Layers } from 'lucide-react';
import { getAllQuestionsIncludingInactive, saveQuestion, deleteQuestion, updateExistingQuestionsSchema } from '../services/questionStorage';
import { getCompositeConfig, saveCompositeConfig } from '../services/compositeConfig';
import { getAllGroups, saveGroup, deleteGroup } from '../services/groupStorage';

const TABS = [
  { id: 'questions', label: 'Preguntas', icon: ListChecks },
  { id: 'groups',    label: 'Grupos', icon: Layers },
  // { id: 'config',    label: 'Configuración', icon: Settings },
];

export default function QuestionAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('questions');

  // State
  const [questions, setQuestions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [qs, grps, cfg] = await Promise.all([
        getAllQuestionsIncludingInactive(),
        getAllGroups(),
        getCompositeConfig().catch(() => ({})),
      ]);
      setQuestions(qs);
      setGroups(grps);
      setConfig(cfg);
    } catch (err) {
      console.error(err);
      showMsg('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);


  function showMsg(text, type) {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  }

  const filtered = questions
    .filter(q => selectedGroup === 'all' || q.objective === selectedGroup || q.section === selectedGroup)
    .sort((a, b) => {
      // Sort by isInitial first, then by order
      if (a.isInitial && !b.isInitial) return -1;
      if (!a.isInitial && b.isInitial) return 1;
      return (a.order || 0) - (b.order || 0);
    });

  async function handleSave(questionData) {
    try {
      await saveQuestion(questionData);
      showMsg('Pregunta guardada', 'success');
      setEditing(null);
      await loadAll();
    } catch {
      showMsg('Error al guardar pregunta', 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta pregunta de forma permanente?')) return;
    try {
      await deleteQuestion(id);
      showMsg('Pregunta eliminada permanentemente', 'info');
      await loadAll();
    } catch (err) {
      console.error(err);
      showMsg('Error al eliminar', 'error');
    }
  }

  async function handleSaveGroup(groupData) {
    try {
      await saveGroup(groupData);
      showMsg('Grupo guardado', 'success');
      setEditingGroup(null);
      await loadAll();
    } catch {
      showMsg('Error al guardar grupo', 'error');
    }
  }

  async function handleDeleteGroup(id) {
    if (!window.confirm('¿Eliminar este grupo? Las preguntas asociadas no se borrarán pero quedarán sin grupo.')) return;
    try {
      await deleteGroup(id);
      showMsg('Grupo eliminado', 'info');
      await loadAll();
    } catch {
      showMsg('Error al eliminar grupo', 'error');
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await saveCompositeConfig(config);
      showMsg('Configuración guardada', 'success');
    } catch {
      showMsg('Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Migration helper
  async function handleMigrateQuestions() {
    if (!window.confirm('¿Migrar preguntas legadas a Firestore? Esto puede crear duplicados si ya las migraste.')) return;
    
    setSaving(true);
    try {
      // We'll import these dynamically
      const configData = await import('../data/compositeTestConfig');
      
      const allToMigrate = [
        ...configData.stage0Questions.map(q => ({ ...q, isInitial: true })),
        ...configData.maniaModuleQuestions,
        ...configData.hypomaniaModuleQuestions,
        ...configData.depressionModuleQuestions,
        ...configData.psychosisModuleQuestions,
        ...configData.branchingQuestions,
        configData.confirmationQuestion,
        configData.confirmationFollowUpQuestion,
      ];

      const { saveQuestion } = await import('../services/questionStorage');
      
      let count = 0;
      for (const q of allToMigrate) {
        const cleanQ = {
          id: q.id,
          name: q.name || '',
          patient: q.patient || q.question || '',
          caregiver: q.caregiver || q.question || '',
          question: q.question,
          options: q.options,
          measures: q.measures || 'general',
          isInitial: !!q.isInitial,
          active: true,
          order: count,
          next: q.next || []
        };

        // Simple default triggers for demonstration
        if (q.id === 'pt9') { // Sueño
          cleanQ.next = [
            { answerIndex: 3, targetId: 'pt1' },
            { answerIndex: 4, targetId: 'pt1' }
          ];
        } else if (q.id === 'mc1') { // Ánimo
          cleanQ.next = [
            { answerIndex: 2, targetId: 'mc4' },
            { answerIndex: 3, targetId: 'mc4' },
            { answerIndex: 4, targetId: 'mc4' }
          ];
        }

        await saveQuestion(cleanQ);
        count++;
      }

      showMsg(`Se migraron ${count} preguntas correctamente.`, 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      showMsg('Error al migrar preguntas', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSchema() {
    if (!window.confirm('¿Actualizar el esquema de todas las preguntas existentes para incluir name/patient/caregiver?')) return;
    setSaving(true);
    try {
      const count = await updateExistingQuestionsSchema();
      showMsg(`Se actualizaron ${count} preguntas correctamente.`, 'success');
      await loadAll();
    } catch {
      showMsg('Error al actualizar esquema', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (

    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">Panel de Control del Test</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configurá las preguntas y la lógica del test adaptativo.
          </p>
        </div>
      </div>

      {msg.text && <Alert variant={msg.type} className="mb-4">{msg.text}</Alert>}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-700 mb-6 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setEditing(null); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === id
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center py-10 text-slate-400">Cargando datos...</p>}

      {/* ── TAB: PREGUNTAS ─────────────────────────────────────────────────── */}
      {!loading && activeTab === 'questions' && (
        <div className="space-y-4">
          {editing ? (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setEditing(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700">
                  <ArrowLeft size={18} />
                </button>
                <CardTitle>{editing._id ? 'Editar Pregunta' : 'Nueva Pregunta'}</CardTitle>
              </div>
              <QuestionForm
                question={editing}
                allQuestions={questions}
                groups={groups}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />

            </Card>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Filtrar por Grupo:</span>
                  <select 
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="flex-1 md:w-48 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <option value="all">Todos los grupos</option>
                    {groups.map(g => <option key={g._id} value={g.name}>{g.name}</option>)}
                  </select>
                </div>
                <Button variant="primary" onClick={() => setEditing({})} className="w-full md:w-auto">
                  <Plus size={16} /> Nueva Pregunta
                </Button>
              </div>

              <div className="grid gap-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-navy-900 rounded-xl border border-dashed border-slate-300 dark:border-navy-700">
                    <p className="text-slate-500 dark:text-slate-400">No hay preguntas registradas.</p>
                    <p className="text-xs text-slate-400 mt-1">Usa la herramienta de migración en "Configuración" o crea una nueva.</p>
                  </div>
                ) : (
                  filtered.map(q => (
                    <div 
                      key={q._id} 
                      className={`flex items-start gap-4 p-4 rounded-xl border bg-white dark:bg-navy-800 transition-all ${
                        q.isInitial ? 'border-teal-500/30 bg-teal-50/10' : 'border-slate-200 dark:border-navy-700'
                      }`}
                    >

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {q.isInitial && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                            Inicial
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">ID: {q.id || q._id?.slice(0,6)}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-100 font-medium">
                        {q.name && <span className="text-teal-600 dark:text-teal-400 font-bold mr-2">[{q.name}]</span>}
                        {q.question}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {q.next?.length > 0 && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Settings size={12} /> {q.next.length} disparadores de flujo
                          </span>
                        )}
                        <span className="text-xs text-slate-400">Mide: {q.measures || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setEditing(q)}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-navy-700 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(q._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-navy-700 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </>

          )}
        </div>
      )}

      {/* ── TAB: GRUPOS ───────────────────────────────────────────────────── */}
      {!loading && activeTab === 'groups' && (
        <div className="space-y-4">
          {editingGroup ? (
            <Card>
              <CardTitle>{editingGroup._id ? 'Editar Grupo' : 'Nuevo Grupo'}</CardTitle>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Grupo</label>
                  <input
                    type="text"
                    value={editingGroup.name || ''}
                    onChange={e => setEditingGroup(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2"
                    placeholder="ej: Módulo Manía"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Orden</label>
                  <input
                    type="number"
                    value={editingGroup.order || 0}
                    onChange={e => setEditingGroup(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => handleSaveGroup(editingGroup)}>Guardar Grupo</Button>
                  <Button variant="secondary" onClick={() => setEditingGroup(null)}>Cancelar</Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700">
                <div className="text-sm font-medium text-slate-500">Administra los grupos de preguntas</div>
                <Button variant="primary" onClick={() => setEditingGroup({ name: '', order: groups.length })}>
                  <Plus size={16} /> Nuevo Grupo
                </Button>
              </div>
              <div className="grid gap-2">
                {groups.map(g => (
                  <div key={g._id} className="flex items-center justify-between p-4 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
                    <div>
                      <p className="font-bold text-navy-700 dark:text-white">{g.name}</p>
                      <p className="text-xs text-slate-400">Orden: {g.order}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingGroup(g)} className="p-2 text-slate-400 hover:text-teal-600 rounded-lg">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteGroup(g._id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: CONFIGURACIÓN ────────────────────────────────────────────── */}
      {/* {!loading && activeTab === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardTitle icon={<Settings size={18} />}>Configuración General</CardTitle>
            <div className="space-y-6 mt-4">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={e => setConfig(p => ({ ...p, enabled: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-200">Habilitar Test Adaptativo</span>
                </label>
                <p className="text-xs text-slate-400 ml-7 mt-1">
                  Si está desactivado, se usará el test básico de manía.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-navy-700">
                <Button variant="primary" onClick={saveConfig} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Mantenimiento y Migración</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Usa estas herramientas para mantener la base de datos sincronizada con el nuevo formato.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleMigrateQuestions} disabled={saving}>
                {saving ? 'Migrando...' : 'Migrar Preguntas Legadas'}
              </Button>
              <Button variant="outline" onClick={handleUpdateSchema} disabled={saving}>
                {saving ? 'Actualizando...' : 'Actualizar Esquema Existente'}
              </Button>
            </div>
          </Card>
        </div>
      )} */}
    </div>
  );
}



