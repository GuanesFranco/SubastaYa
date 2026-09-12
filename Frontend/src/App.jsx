import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ToastProvider from './components/ToastProvider';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import CrearSubasta from './pages/CrearSubasta';
import Billetera from './pages/Billetera';
import SalaSubasta from './pages/SalaSubasta';
import MisActividades from './pages/MisActividades';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } />
        <Route path="/" element={<Home />} />
        <Route path="/publicar" element={
          <ProtectedRoute>
            <CrearSubasta />
          </ProtectedRoute>
        } />
        <Route path="/billetera" element={
          <ProtectedRoute>
            <Billetera />
          </ProtectedRoute>
        } />
        <Route path="/subasta/:id" element={
          <ProtectedRoute>
            <SalaSubasta />
          </ProtectedRoute>
        } />
        <Route path="/mis-actividades" element={
          <ProtectedRoute>
            <MisActividades />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
