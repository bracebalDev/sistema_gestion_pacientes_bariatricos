import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage and sync with backend JSON DB
    const initUser = async () => {
      const storedUser = localStorage.getItem('ucibam_user');
      let initialData = storedUser ? JSON.parse(storedUser) : null;
      
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

      if (initialData) {
        setUser(initialData);
        localStorage.setItem('ucibam_user', JSON.stringify(initialData));
      }
      setLoading(false);
    };

    initUser();
  }, []);

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
      setUser(userData);
      localStorage.setItem('ucibam_user', JSON.stringify(userData));

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
    setUser(null);
    localStorage.removeItem('ucibam_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
