import React from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import CaregiverTest from './pages/CaregiverTest';
import PatientTest from './pages/PatientTest';
import AnalysisReports from './pages/AnalysisReports';
import './styles/global.css';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/mood" element={
          <div className="app-shell">
            <main className="app-main">
              <PatientTest />
            </main>
          </div>
        } />
        <Route path="*" element={
          <div className="app-shell">
            <header className="app-header">
              <h1>📊 Monitor de Manía</h1>
              <p>Daniela</p>
            </header>
            <nav className="app-nav">
              <NavLink to="/caregiver" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
                👨‍⚕️ Tu Test
              </NavLink>
              <NavLink to="/patient" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
                👩 Test Daniela
              </NavLink>
              <NavLink to="/analysis" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
                📈 Análisis
              </NavLink>
            </nav>
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Navigate to="/caregiver" replace />} />
                <Route path="/caregiver" element={<CaregiverTest />} />
                <Route path="/patient" element={<PatientTest />} />
                <Route path="/analysis" element={<AnalysisReports />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </HashRouter>
  );
}
