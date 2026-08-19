import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { 
  Scissors, Stethoscope, Clock, Calendar as CalendarIcon, User, 
  CheckCircle2, AlertCircle, Sparkles, Box, ShieldCheck, Activity, 
  MapPin, Eye, ChevronRight, X, Info, Plus, Edit3, Trash2, Save, 
  Layers, PlusCircle, Shield
} from 'lucide-react';
import clsx from 'clsx';

export default function Rooms() {
  const { data: rooms, loading: loadingRooms, add: addRoom, update: updateRoom, remove: removeRoom, refresh } = useApi('rooms');
  const { data: appointments } = useApi('appointments');
  const { data: doctors } = useApi('doctors');
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const [activeCategory, setActiveCategory] = useState('operating_high'); // 'operating_high' | 'operating_ambulatory' | 'consultation'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Modals
  const [selectedRoomModal, setSelectedRoomModal] = useState(null);
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [editRoomModal, setEditRoomModal] = useState(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Form states for Create Room
  const [newRoomForm, setNewRoomForm] = useState({
    name: '',
    code: '',
    type: 'operating_high',
    category: 'Quirófano Alta Gama',
    floor: 'Piso 2 - Bloque Quirúrgico Mayor',
    capacity: 'Intervenciones de Alta Complejidad',
    description: '',
    equipment: []
  });
  const [newEquipmentInput, setNewEquipmentInput] = useState('');

  // Form states for Edit Room
  const [editRoomForm, setEditRoomForm] = useState({
    name: '',
    code: '',
    type: 'operating_high',
    category: '',
    floor: '',
    capacity: '',
    description: '',
    equipment: []
  });
  const [editEquipmentInput, setEditEquipmentInput] = useState('');

  // Filter rooms by category
  const highEndORs = useMemo(() => (rooms || []).filter(r => r.type === 'operating_high'), [rooms]);
  const ambulatoryORs = useMemo(() => (rooms || []).filter(r => r.type === 'operating_ambulatory'), [rooms]);
  const consultRooms = useMemo(() => (rooms || []).filter(r => r.type === 'consultation'), [rooms]);

  // Current active list
  const currentRoomsList = useMemo(() => {
    if (activeCategory === 'operating_high') return highEndORs;
    if (activeCategory === 'operating_ambulatory') return ambulatoryORs;
    return consultRooms;
  }, [activeCategory, highEndORs, ambulatoryORs, consultRooms]);

  // Helper to get appointments for a specific room on the selected date
  const getRoomAppointmentsForDay = (roomName) => {
    return (appointments || [])
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
      return { status: 'available', label: 'Disponible', color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-900/60' };
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
          text: 'text-red-700 dark:text-red-300', 
          bg: 'bg-red-50 dark:bg-red-950/40', 
          border: 'border-red-300 dark:border-red-900/60',
          currentAppt: inProgress
        };
      }
    }

    return { 
      status: 'reserved', 
      label: `${dayAppts.length} Programada(s)`, 
      color: 'bg-amber-500', 
      text: 'text-amber-700 dark:text-amber-300', 
      bg: 'bg-amber-50 dark:bg-amber-950/40', 
      border: 'border-amber-200 dark:border-amber-900/60' 
    };
  };

  // Handlers for Creating Room
  const handleTypeChangeForCreate = (typeVal) => {
    let cat = 'Quirófano Alta Gama';
    let flr = 'Piso 2 - Bloque Quirúrgico Mayor';
    let cap = 'Intervenciones de Alta Complejidad';
    let codePrefix = 'QX-0' + ((highEndORs.length || 0) + 1);

    if (typeVal === 'operating_ambulatory') {
      cat = 'Quirófano Ambulatorio';
      flr = 'Piso 1 - Área Quirúrgica Ambulatoria';
      cap = 'Intervenciones Ambulatorias & Endoscópicas';
      codePrefix = 'QX-AMB-0' + ((ambulatoryORs.length || 0) + 1);
    } else if (typeVal === 'consultation') {
      cat = 'Consultorio Médico';
      flr = 'Piso 1 - Área de Consultas Externas';
      cap = 'Consulta Médica Especializada';
      codePrefix = 'CONS-0' + ((consultRooms.length || 0) + 1);
    }

    setNewRoomForm(prev => ({
      ...prev,
      type: typeVal,
      category: cat,
      floor: flr,
      capacity: cap,
      code: codePrefix
    }));
  };

  const handleAddEquipmentToCreate = () => {
    if (!newEquipmentInput.trim()) return;
    setNewRoomForm(prev => ({
      ...prev,
      equipment: [...prev.equipment, newEquipmentInput.trim()]
    }));
    setNewEquipmentInput('');
  };

  const handleRemoveEquipmentFromCreate = (idx) => {
    setNewRoomForm(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== idx)
    }));
  };

  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault();
    if (!newRoomForm.name || !newRoomForm.code) {
      showNotification('error', 'Por favor indique el nombre y código del espacio.');
      return;
    }

    try {
      const roomPayload = {
        name: newRoomForm.name.trim(),
        code: newRoomForm.code.trim().toUpperCase(),
        type: newRoomForm.type,
        category: newRoomForm.category,
        floor: newRoomForm.floor,
        capacity: newRoomForm.capacity,
        description: newRoomForm.description,
        status: 'available',
        equipment: newRoomForm.equipment,
        createdAt: new Date().toISOString()
      };

      await addRoom(roomPayload);
      setCreateRoomModalOpen(false);
      setActiveCategory(newRoomForm.type);
      setNewRoomForm({
        name: '',
        code: '',
        type: 'operating_high',
        category: 'Quirófano Alta Gama',
        floor: 'Piso 2 - Bloque Quirúrgico Mayor',
        capacity: 'Intervenciones de Alta Complejidad',
        description: '',
        equipment: []
      });
      showNotification('success', `Espacio "${roomPayload.name}" creado e incorporado a la infraestructura.`);
    } catch (err) {
      showNotification('error', 'Error al crear el espacio: ' + err.message);
    }
  };

  // Handlers for Editing Room
  const handleOpenEditRoom = (room, e) => {
    if (e) e.stopPropagation();
    setEditRoomModal(room);
    setEditRoomForm({
      name: room.name || '',
      code: room.code || '',
      type: room.type || 'operating_high',
      category: room.category || '',
      floor: room.floor || '',
      capacity: room.capacity || '',
      description: room.description || '',
      equipment: room.equipment ? [...room.equipment] : []
    });
  };

  const handleAddEquipmentToEdit = () => {
    if (!editEquipmentInput.trim()) return;
    setEditRoomForm(prev => ({
      ...prev,
      equipment: [...prev.equipment, editEquipmentInput.trim()]
    }));
    setEditEquipmentInput('');
  };

  const handleRemoveEquipmentFromEdit = (idx) => {
    setEditRoomForm(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== idx)
    }));
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    if (!editRoomModal) return;

    try {
      const updates = {
        name: editRoomForm.name.trim(),
        code: editRoomForm.code.trim().toUpperCase(),
        type: editRoomForm.type,
        category: editRoomForm.category,
        floor: editRoomForm.floor,
        capacity: editRoomForm.capacity,
        description: editRoomForm.description,
        equipment: editRoomForm.equipment,
        updatedAt: new Date().toISOString()
      };

      await updateRoom(editRoomModal.id, updates);
      if (selectedRoomModal && selectedRoomModal.id === editRoomModal.id) {
        setSelectedRoomModal(prev => ({ ...prev, ...updates }));
      }
      setEditRoomModal(null);
      showNotification('success', `Espacio clínico "${updates.name}" actualizado correctamente.`);
    } catch (err) {
      showNotification('error', 'Error al guardar los cambios: ' + err.message);
    }
  };

  // Handler for Deleting Room
  const handleDeleteRoom = async () => {
    if (!deleteConfirmRoom) return;
    try {
      await removeRoom(deleteConfirmRoom.id);
      if (selectedRoomModal && selectedRoomModal.id === deleteConfirmRoom.id) {
        setSelectedRoomModal(null);
      }
      setDeleteConfirmRoom(null);
      showNotification('success', `El espacio clínico fue retirado del inventario de infraestructura.`);
    } catch (err) {
      showNotification('error', 'Error al eliminar el espacio: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Espacios Clínicos y Quirúrgicos
            </h1>
            {isAdmin && (
              <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded-full font-bold uppercase">
                Gestión Admin
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Quirófanos de alta y baja complejidad, consultorios médicos y dotación de artefactos
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#151D2A] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs">
            <CalendarIcon size={16} className="text-primary" />
            <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Fecha:</span>
            <input 
              type="date" 
              className="text-xs font-bold text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-[11px] font-bold text-primary dark:text-primary-light hover:underline ml-1 px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950/50 rounded cursor-pointer"
            >
              Hoy
            </button>
          </div>

          {/* Admin "+ Agregar Espacio" Button */}
          {isAdmin && (
            <button
              onClick={() => {
                handleTypeChangeForCreate('operating_high');
                setCreateRoomModalOpen(true);
              }}
              className="btn btn-primary flex items-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl shadow-sm hover:shadow-md cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Agregar Nuevo Espacio</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={clsx(
          "p-4 rounded-xl text-sm flex items-center gap-3 shadow-xs animate-in fade-in",
          notification.type === 'success' 
            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-l-4 border-emerald-500" 
            : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-l-4 border-red-500"
        )}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Categories Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-gray-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveCategory('operating_high')}
          className={clsx(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer",
            activeCategory === 'operating_high'
              ? "bg-purple-700 text-white shadow-purple-100"
              : "bg-white dark:bg-[#151D2A] text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
          )}
        >
          <Scissors size={16} />
          <span>Quirófanos de Alta Gama ({highEndORs.length})</span>
          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold", activeCategory === 'operating_high' ? 'bg-purple-900/50 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300')}>
            Media-Alta Dificultad
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('operating_ambulatory')}
          className={clsx(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer",
            activeCategory === 'operating_ambulatory'
              ? "bg-sky-600 text-white shadow-sky-100"
              : "bg-white dark:bg-[#151D2A] text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
          )}
        >
          <Activity size={16} />
          <span>Quirófanos Ambulatorios ({ambulatoryORs.length})</span>
          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold", activeCategory === 'operating_ambulatory' ? 'bg-sky-800/50 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300')}>
            Baja-Media Dificultad
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('consultation')}
          className={clsx(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer",
            activeCategory === 'consultation'
              ? "bg-slate-900 dark:bg-slate-700 text-white shadow-slate-200"
              : "bg-white dark:bg-[#151D2A] text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
          )}
        >
          <Stethoscope size={16} />
          <span>Consultorios Médicos ({consultRooms.length})</span>
          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold", activeCategory === 'consultation' ? 'bg-slate-800 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300')}>
            Consultas & Turnos
          </span>
        </button>
      </div>

      {/* Cards Grid */}
      {loadingRooms ? (
        <div className="p-12 text-center text-gray-500 dark:text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></div>
          <p>Cargando espacios clínicos...</p>
        </div>
      ) : currentRoomsList.length === 0 ? (
        <div className="card p-12 text-center bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-slate-800 rounded-2xl">
          <Layers size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">No hay espacios en esta categoría</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {isAdmin ? 'Utilice el botón superior "+ Agregar Nuevo Espacio" para registrar consultorios o quirófanos.' : 'Consulte con administración para el registro de nuevos espacios.'}
          </p>
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
                className="card border border-gray-200/90 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group overflow-hidden bg-white dark:bg-[#151D2A]"
              >
                {/* Top Status Bar */}
                <div className={clsx("px-5 py-3 border-b flex justify-between items-center text-xs font-bold", liveStatus.bg, liveStatus.border)}>
                  <div className="flex items-center gap-2">
                    <span className={clsx("w-2.5 h-2.5 rounded-full animate-pulse", liveStatus.color)}></span>
                    <span className={liveStatus.text}>{liveStatus.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-gray-500 dark:text-slate-400">{room.code || 'QX'}</span>
                    {isAdmin && (
                      <button
                        onClick={(e) => handleOpenEditRoom(room, e)}
                        className="p-1 text-gray-400 hover:text-primary rounded transition-colors"
                        title="Editar Espacio"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  
                  {/* Name & Floor */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base leading-snug group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                        {room.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-gray-400 dark:text-slate-500 shrink-0" />
                      <span>{room.floor}</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  </div>

                  {/* Section: Today's Schedule and Doctors */}
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-primary" />
                        {isConsultorio ? 'Doctores y Turnos de Consulta:' : 'Programación para la fecha:'}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-slate-500">
                        {isConsultorio ? `${consultSchedules.length} turno(s)` : `${roomAppts.length} proc.`}
                      </span>
                    </div>

                    {/* For ORs: Display procedures */}
                    {!isConsultorio && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {roomAppts.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-slate-500 italic py-1">
                            Sin procedimientos quirúrgicos agendados para este día.
                          </p>
                        ) : (
                          roomAppts.map(a => (
                            <div key={a.id} className="p-2 bg-slate-50 dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex justify-between items-center gap-2">
                              <div>
                                <span className="font-bold text-gray-900 dark:text-slate-100 font-mono text-[11px]">
                                  {a.startTime} - {a.endTime}
                                </span>
                                <div className="text-gray-700 dark:text-slate-300 font-medium truncate max-w-[160px]">
                                  {isAdmin ? 'Procedimiento Quirúrgico' : `${a.firstName} ${a.lastName}`}
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
                          <div className="p-2 bg-slate-50 dark:bg-[#111823] rounded-lg text-xs text-gray-500 dark:text-slate-400">
                            <span className="font-medium text-gray-700 dark:text-slate-300 block">Consultas generales programadas</span>
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">{roomAppts.length} citas registradas para hoy</span>
                          </div>
                        ) : (
                          consultSchedules.map((sch, idx) => (
                            <div key={idx} className="p-2 bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/50 rounded-lg text-xs">
                              <div className="font-bold text-sky-950 dark:text-sky-300 flex items-center gap-1">
                                <User size={11} className="text-primary" />
                                <span>{sch.doctorName}</span>
                              </div>
                              <div className="text-[11px] text-gray-600 dark:text-slate-400 flex justify-between items-center mt-0.5">
                                <span>{sch.day}</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{sch.startTime} - {sch.endTime}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>

                  {/* Bottom: Click to view details and inventory */}
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-primary font-semibold">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
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
          <div className="bg-white dark:bg-[#151D2A] text-gray-800 dark:text-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            
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
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Descripción y Capacidad */}
              <div className="p-4 bg-slate-50 dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Propósito Clínico & Nivel de Complejidad</div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{selectedRoomModal.capacity}</p>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">{selectedRoomModal.description}</p>
              </div>

              {/* Procedimientos Agendados para el Día y Doctores */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock size={16} className="text-primary" /> 
                    Programación para {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {getRoomAppointmentsForDay(selectedRoomModal.name).length} procedimiento(s)
                  </span>
                </div>

                {getRoomAppointmentsForDay(selectedRoomModal.name).length === 0 ? (
                  <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Este espacio clínico se encuentra <strong>disponible</strong> sin citas solapadas para esta fecha.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getRoomAppointmentsForDay(selectedRoomModal.name).map(a => (
                      <div key={a.id} className="p-3.5 bg-white dark:bg-[#111823] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {a.startTime} - {a.endTime}
                            </span>
                            <span className="font-bold text-sm text-gray-900 dark:text-slate-100">
                              {isAdmin ? 'Procedimiento Programado' : `${a.firstName} ${a.lastName}`}
                            </span>
                            {!isAdmin && a.historyNumber && (
                              <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">#{a.historyNumber}</span>
                            )}
                          </div>
                          {!isAdmin && (
                            <div className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                              <strong>Motivo:</strong> {a.consultationReason || 'Intervención programada'}
                            </div>
                          )}
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
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    Doctores que Pasan Consulta en este Consultorio
                  </h3>
                  {getConsultorioDoctorSchedules(selectedRoomModal.name).length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                      No hay horarios fijos registrados por los doctores en su perfil para este consultorio.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getConsultorioDoctorSchedules(selectedRoomModal.name).map((sch, i) => (
                        <div key={i} className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl text-xs">
                          <div className="font-bold text-sky-900 dark:text-sky-300">{sch.doctorName}</div>
                          <div className="text-gray-600 dark:text-slate-400 text-[11px]">{sch.specialty}</div>
                          <div className="mt-2 flex justify-between items-center text-sky-800 dark:text-sky-300 font-semibold">
                            <span>Día: {sch.day}</span>
                            <span className="font-mono bg-white dark:bg-[#151D2A] text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/60">{sch.startTime} - {sch.endTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inventario de Artefactos Médicos y Equipamiento */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Box size={16} className="text-purple-600 dark:text-purple-400" />
                    Inventario de Artefactos Médicos y Equipamiento Disponible
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    {selectedRoomModal.equipment?.length || 0} dispositivos registrados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedRoomModal.equipment && selectedRoomModal.equipment.length > 0 ? (
                    selectedRoomModal.equipment.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-lg flex items-start gap-2.5 text-xs text-gray-800 dark:text-slate-200">
                        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-slate-500 italic col-span-2">
                      Sin registro de equipamiento detallado.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#111823] border-t border-gray-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditRoom(selectedRoomModal)}
                      className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    >
                      <Edit3 size={14} /> Editar Espacio
                    </button>
                    <button
                      onClick={() => setDeleteConfirmRoom(selectedRoomModal)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setSelectedRoomModal(null)}
                className="btn btn-primary px-6 cursor-pointer text-xs"
              >
                Cerrar Ficha del Espacio
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR NUEVO ESPACIO CLÍNICO / QUIRÓFANO / CONSULTORIO (ADMIN)    */}
      {/* ========================================================================= */}
      {createRoomModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151D2A] text-gray-800 dark:text-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/30 text-sky-300 rounded-lg">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Agregar Nuevo Espacio Clínico</h2>
                  <p className="text-xs text-slate-300">Ampliación de infraestructura, consultorios o quirófanos</p>
                </div>
              </div>
              <button 
                onClick={() => setCreateRoomModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* Tipo de Espacio */}
                <div>
                  <label className="label-text font-semibold text-gray-700 dark:text-slate-300 block mb-1.5">
                    Categoría del Espacio *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={clsx(
                      "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-xs",
                      newRoomForm.type === 'operating_high' 
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 font-bold text-purple-900 dark:text-purple-200 ring-1 ring-purple-500" 
                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}>
                      <input 
                        type="radio" 
                        name="newRoomType" 
                        value="operating_high" 
                        checked={newRoomForm.type === 'operating_high'} 
                        onChange={() => handleTypeChangeForCreate('operating_high')}
                        className="text-purple-600 focus:ring-0"
                      />
                      <span>Quirófano Alta Gama</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-xs",
                      newRoomForm.type === 'operating_ambulatory' 
                        ? "border-sky-600 bg-sky-50 dark:bg-sky-950/40 font-bold text-sky-900 dark:text-sky-200 ring-1 ring-sky-500" 
                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}>
                      <input 
                        type="radio" 
                        name="newRoomType" 
                        value="operating_ambulatory" 
                        checked={newRoomForm.type === 'operating_ambulatory'} 
                        onChange={() => handleTypeChangeForCreate('operating_ambulatory')}
                        className="text-sky-600 focus:ring-0"
                      />
                      <span>Quirófano Ambulatorio</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-xs",
                      newRoomForm.type === 'consultation' 
                        ? "border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 ring-1 ring-slate-700" 
                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}>
                      <input 
                        type="radio" 
                        name="newRoomType" 
                        value="consultation" 
                        checked={newRoomForm.type === 'consultation'} 
                        onChange={() => handleTypeChangeForCreate('consultation')}
                        className="text-slate-800 focus:ring-0"
                      />
                      <span>Consultorio Médico</span>
                    </label>
                  </div>
                </div>

                {/* Nombre y Código */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Nombre del Espacio *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      placeholder="Ej. Quirófano 7 - Cirugía Robótica"
                      value={newRoomForm.name}
                      onChange={e => setNewRoomForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Código de Sala *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1 font-mono uppercase" 
                      placeholder="QX-07"
                      value={newRoomForm.code}
                      onChange={e => setNewRoomForm(prev => ({ ...prev, code: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Ubicación / Piso y Capacidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Ubicación / Piso *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      value={newRoomForm.floor}
                      onChange={e => setNewRoomForm(prev => ({ ...prev, floor: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Nivel de Complejidad / Capacidad *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      value={newRoomForm.capacity}
                      onChange={e => setNewRoomForm(prev => ({ ...prev, capacity: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Descripción del Espacio & Propósito</label>
                  <textarea 
                    className="input-field mt-1 h-20 text-xs" 
                    placeholder="Detalles sobre el propósito médico del espacio, ventilación, compatibilidad de procedimientos..."
                    value={newRoomForm.description}
                    onChange={e => setNewRoomForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Dotación de Artefactos Médicos */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  <label className="label-text font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Box size={16} className="text-primary" /> Inventario de Artefactos y Equipamiento Médico
                  </label>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="input-field text-xs flex-1" 
                      placeholder="Ej. Torre de Laparoscopía 4K, Mesa Bariátrica motorizada, Ecógrafo..."
                      value={newEquipmentInput}
                      onChange={e => setNewEquipmentInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddEquipmentToCreate(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddEquipmentToCreate}
                      className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Agregar Dispositivo
                    </button>
                  </div>

                  {newRoomForm.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                      {newRoomForm.equipment.map((item, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                        >
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>{item}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveEquipmentFromCreate(idx)} 
                            className="text-gray-400 hover:text-red-500 ml-1 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#111823] border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setCreateRoomModalOpen(false)}
                  className="btn btn-secondary px-4 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary px-6 flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} /> Guardar Espacio en Infraestructura
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR ESPACIO CLÍNICO / QUIRÓFANO / CONSULTORIO (ADMIN)           */}
      {/* ========================================================================= */}
      {editRoomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151D2A] text-gray-800 dark:text-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/30 text-indigo-300 rounded-lg">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Modificar Espacio Clínico</h2>
                  <p className="text-xs text-slate-300">Actualización de datos y dotación de equipamiento</p>
                </div>
              </div>
              <button 
                onClick={() => setEditRoomModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditRoomSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* Nombre y Código */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Nombre del Espacio *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      value={editRoomForm.name}
                      onChange={e => setEditRoomForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Código de Sala *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1 font-mono uppercase" 
                      value={editRoomForm.code}
                      onChange={e => setEditRoomForm(prev => ({ ...prev, code: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Ubicación / Piso y Capacidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Ubicación / Piso *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      value={editRoomForm.floor}
                      onChange={e => setEditRoomForm(prev => ({ ...prev, floor: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Nivel de Complejidad / Capacidad *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      value={editRoomForm.capacity}
                      onChange={e => setEditRoomForm(prev => ({ ...prev, capacity: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Descripción del Espacio & Propósito</label>
                  <textarea 
                    className="input-field mt-1 h-20 text-xs" 
                    value={editRoomForm.description}
                    onChange={e => setEditRoomForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Dotación de Artefactos Médicos */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  <label className="label-text font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Box size={16} className="text-primary" /> Inventario de Artefactos y Equipamiento Médico
                  </label>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="input-field text-xs flex-1" 
                      placeholder="Agregar nuevo artefacto médico..."
                      value={editEquipmentInput}
                      onChange={e => setEditEquipmentInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddEquipmentToEdit(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddEquipmentToEdit}
                      className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Agregar
                    </button>
                  </div>

                  {editRoomForm.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                      {editRoomForm.equipment.map((item, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                        >
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>{item}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveEquipmentFromEdit(idx)} 
                            className="text-gray-400 hover:text-red-500 ml-1 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#111823] border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditRoomModal(null)}
                  className="btn btn-secondary px-4 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary px-6 flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} /> Guardar Cambios
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE ESPACIO CLÍNICO                           */}
      {/* ========================================================================= */}
      {deleteConfirmRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151D2A] text-gray-800 dark:text-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/60 rounded-xl">
                <AlertCircle size={26} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">¿Eliminar Espacio?</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
              ¿Está seguro de que desea eliminar el espacio <strong>{deleteConfirmRoom.name}</strong> ({deleteConfirmRoom.code}) del inventario de infraestructura?
            </p>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmRoom(null)}
                className="btn btn-secondary px-4 cursor-pointer text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteRoom}
                className="btn btn-danger px-5 py-2 text-sm flex items-center gap-2 cursor-pointer font-semibold shadow-xs"
              >
                <Trash2 size={16} /> Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
