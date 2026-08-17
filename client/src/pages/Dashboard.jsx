import React from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Users, Calendar, AlertTriangle, Activity, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { data: patients, loading: loadingPatients } = useApi('patients');
  const { data: appts, loading: loadingAppts } = useApi('appointments');
  const { data: emergencies, loading: loadingEmergencies } = useApi('emergencies');

  const isLoading = loadingPatients || loadingAppts || loadingEmergencies;

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Cargando dashboard...</div>;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appts.filter(a => a.date === today && a.status !== 'cancelled');
  const pendingSurgeries = appts.filter(a => (a.type === 'surgery' || a.type === 'surgery_high' || a.type === 'surgery_ambulatory') && a.status === 'scheduled').length;
  const activeEmergencies = emergencies.filter(e => e.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Resumen clínico general y accesos rápidos a módulos
          </p>
        </div>
      </div>

      {activeEmergencies.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-red-500 dark:text-red-400" size={24} />
            <h2 className="text-lg font-bold text-red-700 dark:text-red-300">EMERGENCIAS ACTIVAS ({activeEmergencies.length})</h2>
          </div>
          <div className="space-y-2">
            {activeEmergencies.map(e => {
              const p = patients.find(pat => pat.id === e.patientId);
              return (
                <div key={e.id} className="bg-white dark:bg-[#1A2332] p-3 rounded-lg border border-red-100 dark:border-red-900/40 flex justify-between items-center">
                  <div>
                    <strong className="text-red-600 dark:text-red-400">{p ? `${p.firstName} ${p.lastName}` : 'Desconocido'}</strong>
                    <span className="text-sm text-gray-600 dark:text-slate-300 ml-2">— {e.description}</span>
                  </div>
                  <button className="btn btn-danger text-sm py-1 px-3 cursor-pointer">Resolver</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Cards with Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Pacientes" 
          value={patients.length} 
          icon={Users} 
          color="text-sky-500" 
          to="/patients"
          hint="Ver listado de pacientes"
        />
        <StatCard 
          title="Citas Hoy" 
          value={todayAppts.length} 
          icon={Calendar} 
          color="text-emerald-500" 
          to="/scheduling"
          hint="Ver agenda y cirugías"
        />
        <StatCard 
          title="Cirugías Ptes." 
          value={pendingSurgeries} 
          icon={Activity} 
          color="text-purple-500" 
          to="/scheduling"
          hint="Ver programación quirúrgica"
        />
        <StatCard 
          title="Emergencias" 
          value={activeEmergencies.length} 
          icon={AlertTriangle} 
          color={activeEmergencies.length > 0 ? "text-red-500" : "text-amber-500"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda */}
        <div className="card shadow-sm border border-gray-200/80 dark:border-slate-800">
          <div className="card-header flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">Agenda de Hoy</h3>
            <Link 
              to="/scheduling" 
              className="text-xs font-semibold text-primary dark:text-primary-light hover:underline flex items-center gap-1"
            >
              Ver agenda completa <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card-body p-0">
            {todayAppts.length === 0 ? (
              <p className="p-6 text-center text-gray-500 dark:text-slate-400">No hay citas agendadas para hoy.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {todayAppts.map(a => {
                  const p = patients.find(pat => pat.id === a.patientId);
                  return (
                    <Link 
                      key={a.id} 
                      to="/scheduling" 
                      className="p-4 flex items-center justify-between hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition-colors block"
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-gray-700 dark:text-slate-300 w-16 font-mono text-xs">{a.startTime}</div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-slate-100">{p ? `${p.firstName} ${p.lastName}` : (a.firstName ? `${a.firstName} ${a.lastName}` : 'Desconocido')}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{a.type === 'surgery' || a.type === 'surgery_high' || a.type === 'surgery_ambulatory' ? 'Cirugía' : 'Consulta'} • {a.room || 'Sin espacio'}</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-xs font-medium uppercase text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        {a.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Priorities (Mock AI) */}
        <div className="card shadow-sm border border-gray-200/80 dark:border-slate-800">
          <div className="card-header flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">Pacientes Prioritarios</h3>
              <span title="Análisis de IA" className="text-base">🧠</span>
            </div>
            <Link 
              to="/patients" 
              className="text-xs font-semibold text-primary dark:text-primary-light hover:underline flex items-center gap-1"
            >
              Ver pacientes <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card-body p-0">
            {patients.length === 0 ? (
              <p className="p-6 text-center text-gray-500 dark:text-slate-400">No hay pacientes registrados.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {patients.slice(0, 4).map(p => (
                  <Link 
                    key={p.id} 
                    to="/patients"
                    className="p-4 hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition-colors block"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <strong className="text-gray-900 dark:text-slate-100">{p.firstName} {p.lastName}</strong>
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded text-xs font-bold border border-amber-200 dark:border-amber-900/50">Alta Prioridad</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-300">Condición: {p.condition}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, to, hint }) {
  const content = (
    <div className={`card p-5 flex items-center justify-between border border-gray-200/80 dark:border-slate-800 transition-all duration-200 ${to ? 'hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 hover:-translate-y-0.5 cursor-pointer group' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">{title}</h3>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
      {to && (
        <div className="text-gray-400 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-primary-light group-hover:translate-x-1 transition-all flex items-center" title={hint}>
          <ChevronRight size={20} />
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none" title={hint}>
        {content}
      </Link>
    );
  }

  return content;
}
