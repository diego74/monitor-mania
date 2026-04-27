import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useRole } from './hooks/useRole';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import CaregiverPortal from './pages/CaregiverPortal';
import { ManiaTestPatient } from './pages/ManiaTest';
import MoodTest from './pages/MoodTest';
import CompositeTest from './pages/CompositeTest';
import QuestionAdmin from './pages/QuestionAdmin';
import AnalysisReports from './pages/AnalysisReports';
import Settings from './pages/Settings';
import Tips from './pages/Tips';
import Resources from './pages/Resources';
import About from './pages/About';
import './styles/global.css';

function RoleProvider({ children }) {
  const { role, patientId, token } = useRole();
  return (
    <AppContext.Provider value={{ role, patientId, patientName: 'Daniela', token }}>
      {children}
    </AppContext.Provider>
  );
}

function AdminRoute() {
  return <QuestionAdmin />;
}

// Patient link routes — /p/:token/mania or /p/:token/mood or /p/:token/composite
function PatientRoutes() {
  return (
    <Routes>
      <Route path="mania" element={<ManiaTestPatient />} />
      <Route path="mood" element={<MoodTest />} />
      <Route path="composite" element={<CompositeTest />} />
      <Route path="*" element={<Navigate to="composite" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  return (
    <RoleProvider>
      <AppShell>
        <Routes>
          {/* Caregiver routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/caregiver" element={<CaregiverPortal />} />
          <Route path="/test/composite" element={<CompositeTest />} />
          <Route path="/admin/questions" element={<AdminRoute />} />
          <Route path="/analysis" element={<AnalysisReports />} />
          <Route path="/settings" element={<Settings />} />

          {/* Patient shareable routes */}
          <Route path="/p/:token/*" element={<PatientRoutes />} />

          {/* Shared info pages */}
          <Route path="/tips" element={<Tips />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />

          {/* Legacy compatibility */}
          <Route path="/mood" element={<Navigate to="/p/ZGFuaWVsYQ==/composite" replace />} />
          <Route path="/patient" element={<Navigate to="/p/ZGFuaWVsYQ==/composite" replace />} />
        </Routes>
      </AppShell>
    </RoleProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </HashRouter>
  );
}
