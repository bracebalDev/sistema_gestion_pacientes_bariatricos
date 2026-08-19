import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Calendar, DoorOpen, LayoutDashboard, Menu, X, LogOut, UserCircle, ChevronDown, Shield, KeyRound, Lock } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import logo from '../assets/logo.png';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav Items conditionally tailored for Administrator vs Doctor
  const navItems = isAdmin 
    ? [
        { name: 'Médicos y Usuarios', path: '/doctors', icon: Users },
        { name: 'Espacios & Quirófanos', path: '/rooms', icon: DoorOpen },
        { name: 'Mi Perfil Admin', path: '/profile', icon: UserCircle },
      ]
    : [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Pacientes', path: '/patients', icon: Users },
        { name: 'Agenda', path: '/scheduling', icon: Calendar },
        { name: 'Espacios', path: '/rooms', icon: DoorOpen },
        { name: 'Perfil', path: '/profile', icon: UserCircle },
      ];

  // Prefix & Display Name based on role and gender
  const doctorPrefix = user?.gender === 'female' ? 'Dra.' : 'Dr.';
  const displayName = isAdmin
    ? (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Administrador General')
    : user?.lastName 
      ? `${doctorPrefix} ${user.lastName}` 
      : user?.firstName 
        ? `${doctorPrefix} ${user.firstName}` 
        : `${doctorPrefix} Especialista`;

  const displaySubtitle = isAdmin 
    ? (user?.specialty || 'Gestión y Dirección Hospitalaria')
    : (user?.specialty || 'Cirugía Bariátrica');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-[#0B0F17] transition-colors duration-200">
      
      {/* Mobile sidebar overlay */}
      <div 
        className={clsx(
          "fixed inset-0 z-40 bg-gray-900/60 transition-opacity lg:hidden backdrop-blur-xs",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#1E1E1E] text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-white/5",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1 rounded-md flex items-center justify-center h-9 w-9 shadow-xs">
              <img src={logo} alt="UCIBAM" className="h-7 w-auto object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-wide text-white leading-tight">UCIBAM</span>
              {isAdmin && (
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Shield size={10} /> Panel Admin
                </span>
              )}
            </div>
          </div>
          <button className="lg:hidden p-1 text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Role banner in sidebar */}
        {isAdmin && (
          <div className="mx-3 mt-3 px-3 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs flex items-center gap-2">
            <KeyRound size={14} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block leading-tight">Modo Administrador</span>
              <span className="text-[10px] text-indigo-200/70">Gestión de usuarios y espacios</span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm",
                isActive ? "bg-[#383838] border-l-4 border-primary pl-2 text-white" : "hover:bg-[#2D2D2D] text-gray-300 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-[#2D2D2D] text-gray-300 hover:text-white transition-colors cursor-pointer text-sm"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-[#151D2A] border-b border-gray-200 dark:border-slate-800/80 z-30 shrink-0 transition-colors duration-200">
          
          {/* Top-Left Section: Mobile toggle + Profile Dropdown */}
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded-md cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
            
            {/* Interactive User Profile Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 group cursor-pointer"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                {/* Profile Circle with Photo or Initial */}
                <div className={clsx(
                  "w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm overflow-hidden border-2 shrink-0 shadow-sm",
                  isAdmin ? "bg-indigo-700 border-indigo-400" : "bg-primary border-primary/20"
                )}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span>{isAdmin ? 'A' : (user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'D')}</span>
                  )}
                </div>
                
                {/* Name and Prefix */}
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">
                      {displayName}
                    </span>
                    <ChevronDown size={14} className={clsx("text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-transform duration-200", dropdownOpen && "rotate-180")} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-slate-400 block leading-tight">
                    {displaySubtitle}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#1A2332] rounded-xl shadow-xl border border-gray-100 dark:border-slate-700/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700/80">
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                      {isAdmin ? 'Sesión de Administrador' : 'Cuenta Médica Activa'}
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {isAdmin ? displayName : `${doctorPrefix} ${user?.firstName} ${user?.lastName}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email || 'admin@ucibam.com'}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary-light flex items-center gap-3 transition-colors font-medium cursor-pointer"
                  >
                    <UserCircle size={18} className="text-primary dark:text-primary-light" />
                    <span>Modificar Perfil</span>
                  </button>
                  
                  <div className="my-1 border-t border-gray-100 dark:border-slate-700/80" />
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-3 transition-colors font-medium cursor-pointer"
                  >
                    <LogOut size={18} className="text-red-500" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Top-Right Area: Theme Toggle + Role Pill */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-lg shadow-2xs">
                <Shield size={13} /> MODO ADMIN
              </span>
            )}
            <ThemeToggle />
          </div>

        </header>

        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-[#0B0F17] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      
    </div>
  );
}
