import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, AlertTriangle, Shield, Stethoscope, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import logo from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const loggedUser = await login(email, password);
    if (loggedUser) {
      if (loggedUser.role === 'admin') {
        navigate('/doctors');
      } else {
        navigate('/');
      }
    } else {
      setError('Credenciales inválidas. Ingrese un correo y contraseña válidos.');
    }
  };

  const handleQuickFill = (targetEmail, targetPass) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0B0F17] p-4 relative overflow-hidden transition-colors duration-200">
      {/* Top right theme switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Fondos decorativos sutiles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary-dark/10 blur-3xl pointer-events-none" />

      <div className="card w-full max-w-md p-8 bg-white dark:bg-[#151D2A] shadow-xl rounded-2xl border border-gray-100 dark:border-slate-800 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-block p-2 rounded-xl bg-white shadow-xs mb-3">
            <img 
              src={logo} 
              alt="UCIBAM - Unidad de Cirugía Bariátrica y Metabólica" 
              className="h-20 mx-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">Sistema de Gestión Clínica</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Ingrese sus credenciales de acceso</p>
        </div>

        {sessionExpired && (
          <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/50 border-l-4 border-amber-500 rounded-r-md text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-2.5 shadow-xs">
            <Clock size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <strong className="block font-bold">Sesión cerrada por inactividad</strong>
              <span>Su sesión se cerró automáticamente tras 15 minutos sin movimiento del mouse o acciones en el sistema.</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/50 border-l-4 border-red-500 rounded-r-md text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-2">
            <AlertTriangle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text font-medium text-gray-700 dark:text-slate-300">Correo Electrónico</label>
            <input 
              type="email" 
              className="input-field mt-1"
              placeholder="correo@ucibam.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text font-medium text-gray-700 dark:text-slate-300">Contraseña</label>
            <input 
              type="password" 
              className="input-field mt-1"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3 text-base font-semibold shadow hover:shadow-md transition-all rounded-lg mt-2 cursor-pointer">
            Iniciar Sesión
          </button>
        </form>

        {/* Acceso rápido para pruebas QA y Demostración */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 text-center">
            Accesos de Demostración & QA
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('doctorcirugia@gmail.com', 'doctor123')}
              className="p-2.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800/60 rounded-xl text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-300">
                <span className="flex items-center gap-1"><Stethoscope size={13} /> Rol Médico</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 truncate block mt-0.5">Dr. Carlos Mendoza</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('admin@ucibam.com', 'admin123')}
              className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-300">
                <span className="flex items-center gap-1"><Shield size={13} /> Rol Admin</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 truncate block mt-0.5">Administrador General</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
