import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

export default function Rooms() {
  const { data: rooms, loading } = useApi('rooms');
  const [filter, setFilter] = useState('all');

  const filteredRooms = rooms.filter(r => filter === 'all' || r.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Espacios / Habitaciones</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>Nuevo Espacio</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterButton>
        <FilterButton active={filter === 'operating'} onClick={() => setFilter('operating')}>Quirófanos</FilterButton>
        <FilterButton active={filter === 'consultation'} onClick={() => setFilter('consultation')}>Consultorios</FilterButton>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Cargando espacios...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
          No se encontraron espacios.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
        active 
          ? "bg-primary text-white border-primary" 
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

function RoomCard({ room }) {
  const isAvailable = room.status === 'available';
  const isOccupied = room.status === 'occupied';
  
  const statusColor = isAvailable ? 'bg-green-500' : isOccupied ? 'bg-red-500' : 'bg-yellow-500';
  const statusBorder = isAvailable ? 'border-green-500' : isOccupied ? 'border-red-500' : 'border-yellow-500';
  
  return (
    <div className={`card border-l-4 ${statusBorder} hover:-translate-y-1 transition-transform duration-200`}>
      <div className="card-body">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
            <p className="text-sm text-gray-500">Piso: {room.floor} • {room.type === 'operating' ? 'Quirófano' : 'Consultorio'}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isAvailable ? 'text-green-700' : isOccupied ? 'text-red-700' : 'text-yellow-700'}`}>
              {room.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4 line-clamp-2">{room.description || 'Sin descripción'}</p>
        <div className="mt-6 flex gap-2">
          <button className="btn btn-outline text-sm flex-1">Editar</button>
          <button className="btn btn-outline text-sm flex-1">Cambiar Estado</button>
        </div>
      </div>
    </div>
  );
}
