import React from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import CaregiverTest from './pages/CaregiverTest';
import PatientTest from './pages/PatientTest';
import Analysis from './pages/Analysis';
import Reports from './pages/Reports';
import './styles/global.css';

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <header className="app-header">
          <h1>📊 Monitor de Manía</h1>
          <p>Daniela</p>
        </header>

        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
            👨‍⚕️ Tu Test
          </NavLink>
          <NavLink to="/patient" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
            👩 Test Daniela
          </NavLink>
          <NavLink to="/analysis" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
            📈 Análisis
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
            📋 Reportes
          </NavLink>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<CaregiverTest />} />
            <Route path="/patient" element={<PatientTest />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
