import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate('/');
    } else {
      setError('Credenciales inválidas. Intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary-light">
      <div className="card w-full max-w-md p-8 bg-white shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            U
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UCIBAM</h1>
          <p className="text-gray-500 mt-2">Unidad de Cirugía Bariátrica y Metabólica</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label-text">Correo Electrónico</label>
            <input 
              type="email" 
              className="input-field"
              placeholder="doctorcirugia@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text">Contraseña</label>
            <input 
              type="password" 
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3 text-lg">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
