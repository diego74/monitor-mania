import React, { useState, useEffect } from 'react';
import { maniaLevel } from '../data/questions';
import { getReport, deleteAll, exportJSON } from '../services/storage';

export default function Reports() {
  const [caregiver, setCaregiver] = useState([]);
  const [patient, setPatient] = useState([]);
  const [filterDays, setFilterDays] = useState(30);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const { caregiver: cg, patient: pt } = getReport();
    setCaregiver(cg);
    setPatient(pt);
  }

  function filterByDays(records) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filterDays);
    return records.filter((r) => new Date(r.timestamp) >= cutoff);
  }

  const cgFiltered = filterByDays(caregiver);
  const ptFiltered = filterByDays(patient);

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

  function handleExport() {
    exportJSON();
    setMsg('Archivo descargado');
    setTimeout(() => setMsg(''), 3000);
  }

  function handleDelete() {
    deleteAll();
    setCaregiver([]);
    setPatient([]);
    setConfirmDelete(false);
    setMsg('Todos los datos fueron eliminados');
    setTimeout(() => setMsg(''), 4000);
  }

  const cgAvg = avgSeverity(cgFiltered);
  const ptAvg = avgSeverity(ptFiltered);
  const cgTrend = trend(cgFiltered);
  const ptTrend = trend(ptFiltered);

  return (
    <div className="page">
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <h2>📋 Reportes</h2>
        <div className="filter-row">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              className={`filter-btn${filterDays === d ? ' active' : ''}`}
              onClick={() => setFilterDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Resumen del período</h2>
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

      <div className="card">
        <h2>Historial ({cgFiltered.length + ptFiltered.length})</h2>
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

      <div className="card">
        <h2>Acciones</h2>
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
    </div>
  );
}
