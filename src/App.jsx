import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authService } from './api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const RBAC_MATRIX = {
  'Fleet Manager': {
    allowedPaths: ['/dashboard', '/fleet', '/drivers', '/maintenance', '/analytics', '/settings'],
    nav: ['Dashboard', 'Fleet', 'Drivers', 'Maintenance', 'Analytics', 'Settings']
  },
  'Dispatcher': {
    allowedPaths: ['/dashboard', '/fleet', '/trips', '/settings'],
    nav: ['Dashboard', 'Fleet', 'Trips', 'Settings']
  },
  'Safety Officer': {
    allowedPaths: ['/dashboard', '/drivers', '/trips', '/settings'],
    nav: ['Dashboard', 'Drivers', 'Trips', 'Settings']
  },
  'Financial Analyst': {
    allowedPaths: ['/dashboard', '/fleet', '/fuel-expenses', '/analytics', '/settings'],
    nav: ['Dashboard', 'Fleet', 'Fuel & Expenses', 'Analytics', 'Settings']
  }
};

// Protected Route Wrapper with RBAC
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-brand-orange">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is allowed path
  const userRole = user.role;
  const permissions = RBAC_MATRIX[userRole];
  
  if (!permissions) {
    return <Navigate to="/login" replace />;
  }

  // Map route to RBAC check
  const path = location.pathname;
  const isAllowed = permissions.allowedPaths.includes(path);

  if (!isAllowed) {
    // If not allowed, redirect to dashboard or first allowed page
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const data = await authService.login(email, password, role);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/fleet" element={
            <ProtectedRoute>
              <Layout><Fleet /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/drivers" element={
            <ProtectedRoute>
              <Layout><Drivers /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/trips" element={
            <ProtectedRoute>
              <Layout><Trips /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/maintenance" element={
            <ProtectedRoute>
              <Layout><Maintenance /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/fuel-expenses" element={
            <ProtectedRoute>
              <Layout><FuelExpenses /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Layout><Analytics /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
