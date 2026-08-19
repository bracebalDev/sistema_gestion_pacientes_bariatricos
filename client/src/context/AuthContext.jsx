import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext();

// Tiempo de inactividad máxima permitido: 15 minutos (en milisegundos)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:3000/api' : '/api');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const timerRef = useRef(null);

  // Cierre de sesión automático por inactividad
  const handleInactivityLogout = useCallback(() => {
    setUser(null);
    setSessionExpired(true);
    localStorage.removeItem('ucibam_user');
    localStorage.removeItem('ucibam_last_active');
  }, []);

  useEffect(() => {
    // Check localStorage and sync with backend JSON DB
    const initUser = async () => {
      const storedUser = localStorage.getItem('ucibam_user');
      const storedLastActive = localStorage.getItem('ucibam_last_active');
      let initialData = storedUser ? JSON.parse(storedUser) : null;

      // Verificar si la sesión previa ya superó los 15 minutos de inactividad
      if (initialData && storedLastActive) {
        const elapsed = Date.now() - parseInt(storedLastActive, 10);
        if (elapsed > INACTIVITY_TIMEOUT_MS) {
          localStorage.removeItem('ucibam_user');
          localStorage.removeItem('ucibam_last_active');
          setSessionExpired(true);
          initialData = null;
        }
      }
      
      if (initialData) {
        try {
          const endpoint = initialData.role === 'admin' ? `${API_BASE}/admins` : `${API_BASE}/doctors`;
          const res = await fetch(endpoint);
          if (res.ok) {
            const list = await res.json();
            if (list && list.length > 0) {
              const matched = list.find(item => item.id === initialData.id || item.email === initialData.email);
              if (matched) {
                initialData = { ...initialData, ...matched };
              }
            }
          }
        } catch (err) {
          console.warn('API backend not reachable, using cached user:', err.message);
        }

        setUser(initialData);
        localStorage.setItem('ucibam_user', JSON.stringify(initialData));
        localStorage.setItem('ucibam_last_active', Date.now().toString());
      }

      setLoading(false);
    };

    initUser();
  }, []);

  // Monitor de inactividad del mouse, teclado y acciones del usuario (15 minutos)
  useEffect(() => {
    if (!user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Inicializar timestamp y timer
    localStorage.setItem('ucibam_last_active', Date.now().toString());
    
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT_MS);
    };

    resetTimer();

    // Controlador de eventos de actividad con throttle (máximo 1 vez por segundo)
    let lastActivityTracked = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityTracked > 1000) {
        lastActivityTracked = now;
        localStorage.setItem('ucibam_last_active', now.toString());
        resetTimer();
      }
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'click',
      'keydown',
      'scroll',
      'touchstart',
      'wheel'
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, handleInactivityLogout]);

  const login = async (email, password) => {
    if (!email || !password) return null;
    const cleanEmail = email.trim().toLowerCase();

    // Check if logging in as Admin
    if (cleanEmail === 'admin@ucibam.com' || cleanEmail.startsWith('admin')) {
      let adminData = {
        id: 'admin-1',
        email: cleanEmail,
        firstName: 'Administrador',
        lastName: 'General',
        gender: 'male',
        role: 'admin',
        specialty: 'Dirección & Gestión Hospitalaria',
        avatar: null
      };

      try {
        const res = await fetch(`${API_BASE}/admins`);
        if (res.ok) {
          const adminsList = await res.json();
          const found = (adminsList || []).find(a => a.email.toLowerCase() === cleanEmail);
          if (found) {
            adminData = { ...adminData, ...found, role: 'admin' };
          }
        }
      } catch (e) {
        console.warn('Syncing admin user from DB:', e.message);
      }

      setSessionExpired(false);
      setUser(adminData);
      localStorage.setItem('ucibam_user', JSON.stringify(adminData));
      localStorage.setItem('ucibam_last_active', Date.now().toString());
      return adminData;
    }

    // Otherwise, Doctor Login
    let doctorData = {
      id: 'doc-1',
      email: cleanEmail,
      firstName: 'Carlos',
      lastName: 'Mendoza',
      gender: 'male',
      role: 'doctor',
      specialty: 'Cirugía Bariátrica',
      avatar: null,
      lastModifiedNames: null,
      lastModifiedLastNames: null,
      lastModifiedEmail: null,
      lastModifiedSpecialty: null
    };

    try {
      const res = await fetch(`${API_BASE}/doctors`);
      if (res.ok) {
        const docs = await res.json();
        if (docs && docs.length > 0) {
          const foundDoc = docs.find(d => d.email && d.email.toLowerCase() === cleanEmail) || docs[0];
          doctorData = { ...doctorData, ...foundDoc, role: 'doctor' };
        }
      }
    } catch (e) {
      console.warn('Could not sync login doctor to DB JSON:', e.message);
    }

    setSessionExpired(false);
    setUser(doctorData);
    localStorage.setItem('ucibam_user', JSON.stringify(doctorData));
    localStorage.setItem('ucibam_last_active', Date.now().toString());

    return doctorData;
  };

  const updateUser = async (newUserData) => {
    const updated = { ...(user || {}), ...newUserData };
    setUser(updated);
    localStorage.setItem('ucibam_user', JSON.stringify(updated));

    try {
      const endpoint = updated.role === 'admin' 
        ? `${API_BASE}/admins/${updated.id}` 
        : `${API_BASE}/doctors/${updated.id}`;
      
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Could not sync user to DB JSON:', err.message);
    }

    return updated;
  };

  const logout = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setUser(null);
    setSessionExpired(false);
    localStorage.removeItem('ucibam_user');
    localStorage.removeItem('ucibam_last_active');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser, 
      loading, 
      sessionExpired, 
      setSessionExpired,
      inactivityTimeoutMinutes: 15
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
