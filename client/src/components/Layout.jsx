import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Calendar, DoorOpen, LayoutDashboard, Menu, X, LogOut, UserCircle, ChevronDown, Shield } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Pacientes', path: '/patients', icon: Users },
    { name: 'Agenda', path: '/scheduling', icon: Calendar },
    { name: 'Espacios', path: '/rooms', icon: DoorOpen },
    { name: 'Perfil', path: '/profile', icon: UserCircle },
  ];

  // Prefix based on gender
  const doctorPrefix = user?.gender === 'female' ? 'Dra.' : 'Dr.';
  const displayName = user?.lastName 
    ? `${doctorPrefix} ${user.lastName}` 
    : user?.firstName 
      ? `${doctorPrefix} ${user.firstName}` 
      : `${doctorPrefix} Especialista`;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      
      {/* Mobile sidebar overlay */}
      <div 
        className={clsx(
          "fixed inset-0 z-40 bg-gray-900/50 transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#1E1E1E] text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1 rounded-md flex items-center justify-center h-9 w-9">
              <img src={logo} alt="UCIBAM" className="h-7 w-auto object-contain" />
            </div>
            <span className="font-semibold text-lg tracking-wide text-white">UCIBAM</span>
          </div>
          <button className="lg:hidden p-1 text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium",
                isActive ? "bg-[#383838] border-l-4 border-primary pl-2" : "hover:bg-[#2D2D2D] text-gray-300 hover:text-white"
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
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-[#2D2D2D] text-gray-300 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header with Doctor button on Top-Left */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 z-30 shrink-0">
          
          {/* Top-Left Section: Mobile toggle + Doctor Profile Dropdown */}
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-md"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
            
            {/* Interactive Doctor Profile Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 group"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                {/* Profile Circle with Photo or Initial */}
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-primary/20 shrink-0 shadow-sm">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'D'}</span>
                  )}
                </div>
                
                {/* Name and Prefix */}
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors leading-tight">
                      {displayName}
                    </span>
                    <ChevronDown size={14} className={clsx("text-gray-400 group-hover:text-gray-600 transition-transform duration-200", dropdownOpen && "rotate-180")} />
                  </div>
                  <span className="text-xs text-gray-500 block leading-tight">
                    {user?.specialty || 'Cirugía Bariátrica'}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cuenta Activa</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {doctorPrefix} {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'doctor@ucibam.com'}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary flex items-center gap-3 transition-colors font-medium"
                  >
                    <UserCircle size={18} className="text-primary" />
                    <span>Modificar Perfil</span>
                  </button>
                  
                  <div className="my-1 border-t border-gray-100" />
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                  >
                    <LogOut size={18} className="text-red-500" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Top-Right Area */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 bg-sky-50 text-primary border border-sky-200 rounded-full hidden sm:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              UCIBAM Sistema Clínico
            </span>
          </div>

        </header>

        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      
    </div>
  );
}
