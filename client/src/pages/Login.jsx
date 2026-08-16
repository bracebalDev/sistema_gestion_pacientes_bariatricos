import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      {/* Fondos decorativos sutiles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary-dark/10 blur-3xl pointer-events-none" />

      <div className="card w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-gray-100 relative z-10">
        <div className="text-center mb-6">
          <img 
            src={logo} 
            alt="UCIBAM - Unidad de Cirugía Bariátrica y Metabólica" 
            className="h-28 mx-auto object-contain mb-2"
          />
          <h1 className="text-xl font-bold text-gray-800">Sistema de Gestión Clínica</h1>
          <p className="text-sm text-gray-500 mt-1">Ingrese sus credenciales para continuar</p>
        </div>
        
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-text font-medium text-gray-700">Correo Electrónico</label>
            <input 
              type="email" 
              className="input-field mt-1"
              placeholder="email@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" 
              className="input-field mt-1"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3 text-base font-semibold shadow hover:shadow-md transition-all rounded-lg mt-2">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
