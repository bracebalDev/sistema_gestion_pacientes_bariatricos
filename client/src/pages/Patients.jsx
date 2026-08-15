import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus, Search, MoreVertical } from 'lucide-react';

export default function Patients() {
  const { data: patients, loading } = useApi('patients');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName} ${p.historyNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>Nuevo Paciente</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o número de historia..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase"># Historia</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Paciente</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Condición</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Sexo</th>
                <th className="p-4 font-semibold text-gray-600 text-sm uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Cargando pacientes...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No se encontraron pacientes.</td>
                </tr>
              ) : (
                filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 font-medium">{p.historyNumber}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{p.firstName} {p.lastName}</div>
                          <div className="text-sm text-gray-500">{p.birthDate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{p.condition}</td>
                    <td className="p-4 text-gray-600">{p.sex === 'M' ? 'Masc.' : 'Fem.'}</td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
