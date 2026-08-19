import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Scheduling from './pages/Scheduling';
import Rooms from './pages/Rooms';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AdminDoctors from './pages/AdminDoctors';

// Authentication Guard
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Doctor-Only Route Guard (Blocks Admin from clinical views: Dashboard, Patients, Scheduling)
const DoctorRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/doctors" replace />;
  }
  return children;
};

// Admin-Only Route Guard (Blocks Doctor from administrative doctor management)
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Dynamic index resolver based on role
const RootIndex = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/doctors" replace />;
  }
  return <Dashboard />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RootIndex />} />
        
        {/* Clinical Views (Restricted from Admin role) */}
        <Route path="patients" element={<DoctorRoute><Patients /></DoctorRoute>} />
        <Route path="scheduling" element={<DoctorRoute><Scheduling /></DoctorRoute>} />

        {/* Administrative Views (Restricted to Admin role) */}
        <Route path="doctors" element={<AdminRoute><AdminDoctors /></AdminRoute>} />

        {/* Shared Management & Profile Views */}
        <Route path="rooms" element={<Rooms />} />
        <Route path="profile" element={<Profile />} />

        {/* Fallback */}
        <Route path="*" element={<RootIndex />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
