import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Calendar, DoorOpen, LayoutDashboard, Menu, X, LogOut, UserCircle } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-lg">U</div>
            <span className="font-semibold text-lg tracking-wide">UCIBAM</span>
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
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 z-10 shrink-0">
          <button 
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-md"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user ? `Dr. ${user.lastName || ''}` : 'Doctor'}
            </span>
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {user ? user.firstName?.charAt(0) : 'D'}
            </div>
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
