import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext();

// Tiempo de inactividad máxima permitido: 15 minutos (en milisegundos)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

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
          const res = await fetch('http://localhost:3000/api/doctors');
          if (res.ok) {
            const docs = await res.json();
            if (docs && docs.length > 0) {
              const dbDoctor = docs.find(d => d.id === 'doc-1') || docs[0];
              initialData = { ...initialData, ...dbDoctor };
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
    // Mock validation
    if (email && password) {
      const existing = localStorage.getItem('ucibam_user');
      const parsed = existing ? JSON.parse(existing) : null;
      const userData = {
        id: 'doc-1',
        email,
        firstName: parsed?.firstName || 'Carlos',
        lastName: parsed?.lastName || 'Mendoza',
        gender: parsed?.gender || 'male', // 'male' -> Dr., 'female' -> Dra.
        specialty: parsed?.specialty || 'Cirugía Bariátrica',
        avatar: parsed?.avatar || null,
        lastModifiedNames: parsed?.lastModifiedNames || null,
        lastModifiedLastNames: parsed?.lastModifiedLastNames || null,
        lastModifiedEmail: parsed?.lastModifiedEmail || null,
        lastModifiedSpecialty: parsed?.lastModifiedSpecialty || null
      };

      setSessionExpired(false);
      setUser(userData);
      localStorage.setItem('ucibam_user', JSON.stringify(userData));
      localStorage.setItem('ucibam_last_active', Date.now().toString());

      try {
        await fetch('http://localhost:3000/api/doctors/doc-1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
      } catch (e) {
        console.warn('Could not sync login user to DB JSON:', e.message);
      }

      return true;
    }
    return false;
  };

  const updateUser = async (newUserData) => {
    const updated = { ...(user || {}), ...newUserData, id: user?.id || 'doc-1' };
    setUser(updated);
    localStorage.setItem('ucibam_user', JSON.stringify(updated));

    try {
      await fetch(`http://localhost:3000/api/doctors/${updated.id}`, {
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
