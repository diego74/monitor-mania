import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import TestPortal from './pages/TestPortal';
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

import { AppProvider, useApp } from './contexts/AppContext';
import Login from './pages/Login';

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

function AppContent() {
  const { isCaregiver, isAuthenticated } = useApp();

  return (
    <AppShell>
      <Routes>
        {/* Shared / Redirects */}
        <Route path="/" element={<Navigate to={isCaregiver ? (isAuthenticated ? "/dashboard" : "/login") : "/test/composite"} replace />} />
        
        {/* Login route */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Caregiver-only routes */}
        {isCaregiver && (
          <>
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="/admin/questions" element={isAuthenticated ? <AdminRoute /> : <Navigate to="/login" replace />} />
            <Route path="/analysis" element={isAuthenticated ? <AnalysisReports /> : <Navigate to="/login" replace />} />
            <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} />
          </>
        )}

        {/* Test routes available to both or specific contexts */}
        <Route path="/test" element={<TestPortal />} />
        <Route path="/test/composite" element={<CompositeTest />} />
        
        {/* Patient specific routes (via shareable link) */}
        <Route path="/p/:token/*" element={<PatientRoutes />} />

        {/* Shared info pages */}
        <Route path="/tips" element={<Tips />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/about" element={<About />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isCaregiver ? "/dashboard" : "/test"} replace />} />
      </Routes>
    </AppShell>
  );
}

function AppRoutes() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
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
