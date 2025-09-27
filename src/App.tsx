import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Common/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import TripsPage from './components/Trips/TripsPage';
import VehiclesPage from './components/Trips/VehiclesPage';
import VehicleAssignmentPage from './components/Fleet/VehicleAssignmentPage';
import DriverInterface from './components/Driver/DriverInterface';
import RealTimeTrackingPage from './components/Tracking/RealTimeTrackingPage';
import TrackingPage from './pages/TrackingPage';
import { AddDriver } from './components/Users';
import './App.css';

// Composant pour protéger les routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Composant pour rediriger les utilisateurs connectés
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Composant ELD Logs placeholder
const ELDLogsPage: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Logs ELD</h1>
      <p className="text-gray-600">
        Cette section permettra de gérer les logs du dispositif de journalisation électronique (ELD).
      </p>
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">
          🚧 Cette fonctionnalité est en cours de développement et sera bientôt disponible.
        </p>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          <Routes>
            {/* Routes publiques */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

            {/* Routes protégées */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trips" 
              element={
                <ProtectedRoute>
                  <TripsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vehicles" 
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <VehiclesPage />
                  </>
                </ProtectedRoute>
              } 
            />
            
            {/* Nouvelle route pour l'assignation véhicule-conducteur */}
            <Route 
              path="/assignments" 
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <VehicleAssignmentPage />
                  </>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/add-driver" 
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <AddDriver />
                  </>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/eld-logs" 
              element={
                <ProtectedRoute>
                  <ELDLogsPage />
                </ProtectedRoute>
              } 
            />

            {/* Interface conducteur simplifiée */}
            <Route 
              path="/driver" 
              element={
                <ProtectedRoute>
                  <DriverInterface />
                </ProtectedRoute>
              } 
            />

            {/* Page de tracking GPS avec navigation temps réel */}
            <Route 
              path="/tracking/:tripId" 
              element={
                <ProtectedRoute>
                  <TrackingPage />
                </ProtectedRoute>
              } 
            />

            {/* Page de suivi temps réel avec HOS */}
            <Route 
              path="/tracking" 
              element={
                <ProtectedRoute>
                  <RealTimeTrackingPage />
                </ProtectedRoute>
              } 
            />

            {/* Redirection par défaut */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Route 404 */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Page non trouvée</p>
                    <button 
                      onClick={() => window.history.back()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Retour
                    </button>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
