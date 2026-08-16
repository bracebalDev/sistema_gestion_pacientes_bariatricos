import React from 'react';
import { useApi } from '../hooks/useApi';
import { Users, Calendar, AlertTriangle, Activity } from 'lucide-react';

export default function Dashboard() {
  const { data: patients, loading: loadingPatients } = useApi('patients');
  const { data: appts, loading: loadingAppts } = useApi('appointments');
  const { data: emergencies, loading: loadingEmergencies } = useApi('emergencies');

  const isLoading = loadingPatients || loadingAppts || loadingEmergencies;

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appts.filter(a => a.date === today && a.status !== 'cancelled');
  const pendingSurgeries = appts.filter(a => (a.type === 'surgery' || a.type === 'surgery_high' || a.type === 'surgery_ambulatory') && a.status === 'scheduled').length;
  const activeEmergencies = emergencies.filter(e => e.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {activeEmergencies.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-red-500" size={24} />
            <h2 className="text-lg font-bold text-red-700">EMERGENCIAS ACTIVAS ({activeEmergencies.length})</h2>
          </div>
          <div className="space-y-2">
            {activeEmergencies.map(e => {
              const p = patients.find(pat => pat.id === e.patientId);
              return (
                <div key={e.id} className="bg-white p-3 rounded border border-red-100 flex justify-between items-center">
                  <div>
                    <strong className="text-red-600">{p ? `${p.firstName} ${p.lastName}` : 'Desconocido'}</strong>
                    <span className="text-sm text-gray-600 ml-2">— {e.description}</span>
                  </div>
                  <button className="btn btn-danger text-sm py-1 px-3">Resolver</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pacientes" value={patients.length} icon={Users} color="text-blue-500" />
        <StatCard title="Citas Hoy" value={todayAppts.length} icon={Calendar} color="text-green-500" />
        <StatCard title="Cirugías Ptes." value={pendingSurgeries} icon={Activity} color="text-purple-500" />
        <StatCard title="Emergencias" value={activeEmergencies.length} icon={AlertTriangle} color={activeEmergencies.length > 0 ? "text-red-500" : "text-orange-500"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda */}
        <div className="card">
          <div className="card-header">
            <h3>Agenda de Hoy</h3>
          </div>
          <div className="card-body p-0">
            {todayAppts.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No hay citas agendadas para hoy.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {todayAppts.map(a => {
                  const p = patients.find(pat => pat.id === a.patientId);
                  return (
                    <div key={a.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-gray-700 w-16">{a.startTime}</div>
                        <div>
                          <div className="font-semibold">{p ? `${p.firstName} ${p.lastName}` : 'Desconocido'}</div>
                          <div className="text-sm text-gray-500">{a.type === 'surgery' ? 'Cirugía' : 'Consulta'}</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium uppercase text-gray-600">
                        {a.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Priorities (Mock AI) */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3>Pacientes Prioritarios</h3>
            <span title="Análisis de IA">🧠</span>
          </div>
          <div className="card-body p-0">
            {patients.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No hay pacientes registrados.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {patients.slice(0, 4).map(p => (
                  <div key={p.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-1">
                      <strong className="text-gray-900">{p.firstName} {p.lastName}</strong>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">Alta Prioridad</span>
                    </div>
                    <div className="text-sm text-gray-600">Condición: {p.condition}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-full bg-gray-50 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
