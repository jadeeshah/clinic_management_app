import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import Layout from './components/Layout';
import SetupWizard from './pages/SetupWizard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Visits from './pages/Visits';
import Billing from './pages/Billing';
import Finance from './pages/Finance';
import Doctors from './pages/Doctors';
import Settings from './pages/Settings';
import Services from './pages/Services';
import Reports from './pages/Reports';

// Loading component
const LoadingScreen: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: 2,
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="h6" color="text.secondary">
      Loading...
    </Typography>
  </Box>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main app content with routing
const AppContent: React.FC = () => {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const result = await window.electronAPI.setup.check();
      setSetupComplete(result.isComplete);
    } catch (error) {
      console.error('Setup check failed:', error);
      setSetupComplete(false);
    }
  };

  const handleSetupComplete = () => {
    setSetupComplete(true);
  };

  // Still checking setup status
  if (setupComplete === null) {
    return <LoadingScreen />;
  }

  // Need to run setup wizard
  if (!setupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="visits" element={<Visits />} />
          <Route path="billing" element={<Billing />} />
          <Route path="finance" element={<Finance />} />
          <Route path="reports" element={<Reports />} />
          <Route
            path="services"
            element={
              <ProtectedRoute adminOnly>
                <Services />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctors"
            element={
              <ProtectedRoute adminOnly>
                <Doctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute adminOnly>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <ErrorProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorProvider>
  );
};

export default App;
