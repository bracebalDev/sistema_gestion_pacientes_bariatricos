import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { 
  Scissors, Stethoscope, Clock, Calendar as CalendarIcon, User, 
  CheckCircle2, AlertCircle, Sparkles, Box, ShieldCheck, Activity, 
  MapPin, Eye, ChevronRight, X, Info
} from 'lucide-react';
import clsx from 'clsx';

export default function Rooms() {
  const { data: rooms, loading: loadingRooms } = useApi('rooms');
  const { data: appointments } = useApi('appointments');
  const { data: doctors } = useApi('doctors');
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState('operating_high'); // 'operating_high' | 'operating_ambulatory' | 'consultation'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoomModal, setSelectedRoomModal] = useState(null);

  // Filter rooms by category
  const highEndORs = useMemo(() => rooms.filter(r => r.type === 'operating_high'), [rooms]);
  const ambulatoryORs = useMemo(() => rooms.filter(r => r.type === 'operating_ambulatory'), [rooms]);
  const consultRooms = useMemo(() => rooms.filter(r => r.type === 'consultation'), [rooms]);

  // Current active list
  const currentRoomsList = useMemo(() => {
    if (activeCategory === 'operating_high') return highEndORs;
    if (activeCategory === 'operating_ambulatory') return ambulatoryORs;
    return consultRooms;
  }, [activeCategory, highEndORs, ambulatoryORs, consultRooms]);

  // Helper to get appointments for a specific room on the selected date
  const getRoomAppointmentsForDay = (roomName) => {
    return appointments
      .filter(a => a.date === selectedDate && a.room === roomName)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  // Helper to get doctor consultation schedule for a consultorio
  const getConsultorioDoctorSchedules = (roomName) => {
    const schedules = [];
    (doctors || []).forEach(doc => {
      const docPrefix = doc.gender === 'female' ? 'Dra.' : 'Dr.';
      const docFullName = `${docPrefix} ${doc.firstName} ${doc.lastName}`;
      (doc.consultationSchedule || []).forEach(sch => {
        if (sch.room === roomName) {
          schedules.push({
            doctorName: docFullName,
            specialty: doc.specialty,
            day: sch.day,
            startTime: sch.startTime,
            endTime: sch.endTime
          });
        }
      });
    });
    return schedules;
  };

  // Helper to determine real-time room occupancy status
  const getRoomLiveStatus = (roomName, type) => {
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;
    const nowTime = new Date().toTimeString().substring(0, 5); // 'HH:mm'

    const dayAppts = getRoomAppointmentsForDay(roomName);

    if (dayAppts.length === 0) {
      return { status: 'available', label: 'Disponible', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }

    if (isToday) {
      const inProgress = dayAppts.find(a => {
        const isCurrent = (a.startTime <= nowTime && a.endTime >= nowTime) || a.status === 'in_progress';
        return isCurrent && a.status !== 'completed' && a.status !== 'cancelled';
      });

      if (inProgress) {
        return { 
          status: 'in_use', 
          label: 'En Intervención / Consulta', 
          color: 'bg-red-500', 
          text: 'text-red-700', 
          bg: 'bg-red-50', 
          border: 'border-red-300',
          currentAppt: inProgress
        };
      }
    }

    return { 
      status: 'reserved', 
      label: `${dayAppts.length} Programada(s)`, 
      color: 'bg-amber-500', 
      text: 'text-amber-700', 
      bg: 'bg-amber-50', 
      border: 'border-amber-200' 
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espacios Clínicos y Quirúrgicos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quirófanos de alta y baja complejidad, consultorios médicos y dotación de artefactos
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
          <CalendarIcon size={16} className="text-primary" />
          <span className="text-xs font-semibold text-gray-600">Fecha de Programación:</span>
          <input 
            type="date" 
            className="text-xs font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-[11px] font-bold text-primary hover:underline ml-1 px-1.5 py-0.5 bg-sky-50 rounded"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveCategory('operating_high')}
          className={clsx(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs",
            activeCategory === 'operating_high'
              ? "bg-purple-700 text-white shadow-purple-100"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          <Scissors size={16} />
          <span>Quirófanos de Alta Gama (6)</span>
          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold", activeCategory === 'operating_high' ? 'bg-purple-900/50 text-white' : 'bg-gray-100 text-gray-600')}>
            Media-Alta Dificultad
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('operating_ambulatory')}
          className={clsx(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs",
            activeCategory === 'operating_ambulatory'
              ? "bg-sky-600 text-white shadow-sky-100"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          <Activity size={16} />
          <span>Quirófanos Ambulatorios (3)</span>
          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold", activeCategory === 'operating_ambulatory' ? 'bg-sky-800/50 text-white' : 'bg-gray-100 text-gray-600')}>
            Baja-Media Dificultad
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('consultation')}
          className={clsx(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs",
            activeCategory === 'consultation'
              ? "bg-slate-900 text-white shadow-slate-200"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          <Stethoscope size={16} />
          <span>Consultorios Médicos (8)</span>
          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold", activeCategory === 'consultation' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600')}>
            Consultas & Turnos
          </span>
        </button>
      </div>

      {/* Cards Grid */}
      {loadingRooms ? (
        <div className="p-12 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></div>
          <p>Cargando espacios clínicos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentRoomsList.map(room => {
            const roomAppts = getRoomAppointmentsForDay(room.name);
            const liveStatus = getRoomLiveStatus(room.name, room.type);
            const isConsultorio = room.type === 'consultation';
            const consultSchedules = isConsultorio ? getConsultorioDoctorSchedules(room.name) : [];

            return (
              <div 
                key={room.id}
                onClick={() => setSelectedRoomModal(room)}
                className="card border border-gray-200/90 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group overflow-hidden bg-white"
              >
                {/* Top Status Bar */}
                <div className={clsx("px-5 py-3 border-b flex justify-between items-center text-xs font-bold", liveStatus.bg, liveStatus.border)}>
                  <div className="flex items-center gap-2">
                    <span className={clsx("w-2.5 h-2.5 rounded-full animate-pulse", liveStatus.color)}></span>
                    <span className={liveStatus.text}>{liveStatus.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-500">{room.code || 'QX'}</span>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  
                  {/* Name & Floor */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-primary transition-colors">
                        {room.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span>{room.floor}</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  </div>

                  {/* Section: Today's Schedule and Doctors */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-primary" />
                        {isConsultorio ? 'Doctores y Turnos de Consulta:' : 'Programación para la fecha:'}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {isConsultorio ? `${consultSchedules.length} turno(s)` : `${roomAppts.length} proc.`}
                      </span>
                    </div>

                    {/* For ORs: Display current and scheduled procedures */}
                    {!isConsultorio && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {roomAppts.length === 0 ? (
                          <p className="text-xs text-gray-400 italic py-1">
                            Sin procedimientos quirúrgicos agendados para este día.
                          </p>
                        ) : (
                          roomAppts.map(a => (
                            <div key={a.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center gap-2">
                              <div>
                                <span className="font-bold text-gray-900 font-mono text-[11px]">
                                  {a.startTime} - {a.endTime}
                                </span>
                                <div className="text-gray-700 font-medium truncate max-w-[160px]">
                                  {a.firstName} {a.lastName}
                                </div>
                                <div className="text-[10px] text-primary flex items-center gap-1">
                                  <User size={10} /> {a.doctorName || 'Dr. Especialista UCIBAM'}
                                </div>
                              </div>
                              <span className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0",
                                a.status === 'in_progress' ? 'bg-red-100 text-red-700 font-black animate-pulse' :
                                a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-sky-100 text-sky-700'
                              )}>
                                {a.status === 'in_progress' ? 'En Curso' : a.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* For Consultorios: Display doctor passing consultation and hours */}
                    {isConsultorio && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {consultSchedules.length === 0 ? (
                          <div className="p-2 bg-slate-50 rounded-lg text-xs text-gray-500">
                            <span className="font-medium text-gray-700 block">Consultas generales programadas</span>
                            <span className="text-[11px] text-gray-400">{roomAppts.length} citas registradas para hoy</span>
                          </div>
                        ) : (
                          consultSchedules.map((sch, idx) => (
                            <div key={idx} className="p-2 bg-sky-50/60 border border-sky-100 rounded-lg text-xs">
                              <div className="font-bold text-sky-950 flex items-center gap-1">
                                <User size={11} className="text-primary" />
                                <span>{sch.doctorName}</span>
                              </div>
                              <div className="text-[11px] text-gray-600 flex justify-between items-center mt-0.5">
                                <span>{sch.day}</span>
                                <span className="font-mono font-semibold text-slate-800">{sch.startTime} - {sch.endTime}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>

                  {/* Bottom: Click to view details and inventory */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-primary font-semibold">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Box size={13} /> {room.equipment?.length || 0} Artefactos Médicos
                    </span>
                    <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Ver detalle e inventario <ChevronRight size={14} />
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETALLE DEL ESPACIO CLÍNICO, INVENTARIO Y HORARIOS MÉDICOS         */}
      {/* ========================================================================= */}
      {selectedRoomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-primary/30 text-sky-300 px-2 py-0.5 rounded font-bold">
                    {selectedRoomModal.code || 'QX'}
                  </span>
                  <h2 className="text-lg font-bold">{selectedRoomModal.name}</h2>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <MapPin size={12} /> {selectedRoomModal.floor} • {selectedRoomModal.category}
                </p>
              </div>
              <button 
                onClick={() => setSelectedRoomModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Descripción y Capacidad */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Propósito Clínico & Nivel de Complejidad</div>
                <p className="text-sm font-semibold text-gray-800">{selectedRoomModal.capacity}</p>
                <p className="text-xs text-gray-600 mt-1">{selectedRoomModal.description}</p>
              </div>

              {/* Procedimientos Agendados para el Día y Doctores */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Clock size={16} className="text-primary" /> 
                    Programación para {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {getRoomAppointmentsForDay(selectedRoomModal.name).length} procedimiento(s)
                  </span>
                </div>

                {getRoomAppointmentsForDay(selectedRoomModal.name).length === 0 ? (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>Este espacio clínico se encuentra <strong>disponible</strong> sin citas solapadas para esta fecha.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getRoomAppointmentsForDay(selectedRoomModal.name).map(a => (
                      <div key={a.id} className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border">
                              {a.startTime} - {a.endTime}
                            </span>
                            <span className="font-bold text-sm text-gray-900">
                              {a.firstName} {a.lastName}
                            </span>
                            {a.historyNumber && (
                              <span className="text-xs text-gray-400 font-mono">#{a.historyNumber}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <strong>Motivo:</strong> {a.consultationReason || 'Intervención programada'}
                          </div>
                          <div className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
                            <User size={12} /> Doctor Encargado: {a.doctorName || 'Dr. Carlos Mendoza'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                            a.status === 'in_progress' ? 'bg-red-100 text-red-700 animate-pulse' :
                            a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-sky-100 text-sky-700'
                          )}>
                            {a.status === 'in_progress' ? 'En Intervención' : a.status === 'confirmed' ? 'Confirmado' : 'Programado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctores Asignados a Consultas (Si es Consultorio) */}
              {selectedRoomModal.type === 'consultation' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    Doctores que Pasan Consulta en este Consultorio
                  </h3>
                  {getConsultorioDoctorSchedules(selectedRoomModal.name).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                      No hay horarios fijos registrados por los doctores en su perfil para este consultorio.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getConsultorioDoctorSchedules(selectedRoomModal.name).map((sch, i) => (
                        <div key={i} className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs">
                          <div className="font-bold text-sky-900">{sch.doctorName}</div>
                          <div className="text-gray-600 text-[11px]">{sch.specialty}</div>
                          <div className="mt-2 flex justify-between items-center text-sky-800 font-semibold">
                            <span>Día: {sch.day}</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-sky-200">{sch.startTime} - {sch.endTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inventario de Artefactos Médicos y Equipamiento */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Box size={16} className="text-purple-600" />
                    Inventario de Artefactos Médicos y Equipamiento Disponible
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    {selectedRoomModal.equipment?.length || 0} dispositivos registrados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedRoomModal.equipment && selectedRoomModal.equipment.length > 0 ? (
                    selectedRoomModal.equipment.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-gray-800">
                        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic col-span-2">
                      Sin registro de equipamiento detallado.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setSelectedRoomModal(null)}
                className="btn btn-primary px-6"
              >
                Cerrar Ficha del Espacio
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
