import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DatasetsPage from './pages/DatasetsPage';
import DataSourcesPage from './pages/DataSourcesPage';
import DataPreviewPage from './pages/DataPreviewPage';
import ReportBuilderPage from './pages/ReportBuilderPage';
import DashboardsListPage from './pages/DashboardsListPage';
import DashboardViewPage from './pages/DashboardViewPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected App Workspace Pages */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/data-sources" element={<DataSourcesPage />} />
        <Route path="/preview/:id" element={<DataPreviewPage />} />
        <Route path="/report-builder" element={<ReportBuilderPage />} />
        <Route path="/dashboards" element={<DashboardsListPage />} />
        <Route path="/dashboards/:id" element={<DashboardViewPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
