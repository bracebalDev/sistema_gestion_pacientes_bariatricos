import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus, List, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';

export default function Scheduling() {
  const { data: appointments, loading } = useApi('appointments');
  const [view, setView] = useState('list');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Agenda de Consultas y Cirugías</h1>
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-md shadow-sm border border-gray-200 flex">
            <button 
              className={clsx("px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2", view === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
              onClick={() => setView('list')}
            >
              <List size={16} /> Lista
            </button>
            <button 
              className={clsx("px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2", view === 'calendar' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
              onClick={() => setView('calendar')}
            >
              <CalendarIcon size={16} /> Calendario
            </button>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      <div className="card">
        {view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Fecha/Hora</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Paciente</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Tipo</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">Cargando agenda...</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">No hay citas registradas.</td></tr>
                ) : (
                  appointments.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{a.date}</div>
                        <div className="text-sm text-gray-500">{a.startTime} - {a.endTime}</div>
                      </td>
                      <td className="p-4 font-medium text-gray-700">Paciente ID: {a.patientId}</td>
                      <td className="p-4">
                        <span className={clsx("px-2 py-1 rounded text-xs font-bold", a.type === 'surgery' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                          {a.type === 'surgery' ? 'Cirugía' : 'Consulta'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium uppercase text-gray-600">{a.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">Vista de Calendario en construcción...</div>
        )}
      </div>
    </div>
  );
}
