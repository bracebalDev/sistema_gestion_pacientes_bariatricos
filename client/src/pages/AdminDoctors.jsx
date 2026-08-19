import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Users, UserPlus, Search, Edit3, Trash2, Shield, Lock, Unlock, 
  CheckCircle2, AlertCircle, Clock, Calendar, Mail, Stethoscope, 
  X, Save, RefreshCw, KeyRound, Filter, UserCheck
} from 'lucide-react';
import clsx from 'clsx';

const SPECIALTIES_LIST = [
  'Cirugía Bariátrica',
  'Cirugía General & Laparoscópica',
  'Nutrición Bariátrica & Metabolismo',
  'Psicología Bariátrica & Conductual',
  'Gastroenterología & Endoscopía',
  'Medicina Interna & Riesgo Quirúrgico',
  'Anestesiología Bariátrica',
  'Endocrinología & Metabolismo'
];

const CONSULTATION_ROOMS = [
  'Consultorio 1 - Evaluación Bariátrica Inicial',
  'Consultorio 2 - Nutrición Clínica & Metabolismo',
  'Consultorio 3 - Psicología Bariátrica & Conductual',
  'Consultorio 4 - Control & Seguimiento Postoperatorio',
  'Consultorio 5 - Medicina Interna & Riesgo Quirúrgico',
  'Consultorio 6 - Consulta Quirúrgica Bariátrica',
  'Consultorio 7 - Gastroenterología & Endoscopía',
  'Consultorio 8 - Consulta de Chequeo & Revaloración'
];

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AdminDoctors() {
  const { data: doctors, loading, add: addDoctor, update: updateDoctor, remove: removeDoctor, refresh } = useApi('doctors');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalDoc, setEditModalDoc] = useState(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);
  
  // Notification states
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Form states for Create Doctor
  const [newDocForm, setNewDocForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'male',
    email: '',
    specialty: 'Cirugía Bariátrica',
    initialRoom: 'Consultorio 1 - Evaluación Bariátrica Inicial',
    initialDay: 'Lunes',
    initialStartTime: '08:00',
    initialEndTime: '13:00'
  });

  // Form states for Edit Doctor
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male',
    email: '',
    specialty: '',
    resetLocks: false,
    consultationSchedule: []
  });

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    return (doctors || []).filter(doc => {
      const matchSearch = 
        `${doc.firstName || ''} ${doc.lastName || ''} ${doc.email || ''} ${doc.specialty || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      
      const matchSpecialty = selectedSpecialty === 'all' || doc.specialty === selectedSpecialty;
      return matchSearch && matchSpecialty;
    });
  }, [doctors, searchTerm, selectedSpecialty]);

  // Open Edit Modal with prefilled doctor data
  const handleOpenEdit = (doc) => {
    setEditModalDoc(doc);
    setEditFormData({
      firstName: doc.firstName || '',
      lastName: doc.lastName || '',
      gender: doc.gender || 'male',
      email: doc.email || '',
      specialty: doc.specialty || 'Cirugía Bariátrica',
      resetLocks: false,
      consultationSchedule: doc.consultationSchedule ? JSON.parse(JSON.stringify(doc.consultationSchedule)) : []
    });
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newDocForm.firstName || !newDocForm.lastName || !newDocForm.email) {
      showNotification('error', 'Por favor complete los campos obligatorios.');
      return;
    }

    try {
      const newDoctor = {
        firstName: newDocForm.firstName.trim(),
        lastName: newDocForm.lastName.trim(),
        gender: newDocForm.gender,
        email: newDocForm.email.trim().toLowerCase(),
        specialty: newDocForm.specialty,
        role: 'doctor',
        avatar: null,
        lastModifiedNames: null,
        lastModifiedLastNames: null,
        lastModifiedEmail: null,
        lastModifiedSpecialty: null,
        consultationSchedule: [
          {
            id: 'sch-' + Date.now(),
            day: newDocForm.initialDay,
            startTime: newDocForm.initialStartTime,
            endTime: newDocForm.initialEndTime,
            room: newDocForm.initialRoom
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoctor(newDoctor);
      setCreateModalOpen(false);
      setNewDocForm({
        firstName: '',
        lastName: '',
        gender: 'male',
        email: '',
        specialty: 'Cirugía Bariátrica',
        initialRoom: 'Consultorio 1 - Evaluación Bariátrica Inicial',
        initialDay: 'Lunes',
        initialStartTime: '08:00',
        initialEndTime: '13:00'
      });
      showNotification('success', `Médico ${newDoctor.gender === 'female' ? 'Dra.' : 'Dr.'} ${newDoctor.firstName} ${newDoctor.lastName} creado exitosamente.`);
    } catch (err) {
      showNotification('error', 'Error al registrar el nuevo médico: ' + err.message);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalDoc) return;

    try {
      const updates = {
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        gender: editFormData.gender,
        email: editFormData.email.trim().toLowerCase(),
        specialty: editFormData.specialty,
        consultationSchedule: editFormData.consultationSchedule,
        updatedAt: new Date().toISOString()
      };

      // If administrator chose to reset modification lock timers
      if (editFormData.resetLocks) {
        updates.lastModifiedNames = null;
        updates.lastModifiedLastNames = null;
        updates.lastModifiedEmail = null;
        updates.lastModifiedSpecialty = null;
      }

      await updateDoctor(editModalDoc.id, updates);
      setEditModalDoc(null);
      showNotification('success', `Datos del médico actualizados correctamente por el Administrador.`);
    } catch (err) {
      showNotification('error', 'Error al actualizar los datos: ' + err.message);
    }
  };

  // Quick unlock restrictions for a doctor
  const handleQuickUnlock = async (doc) => {
    try {
      await updateDoctor(doc.id, {
        lastModifiedNames: null,
        lastModifiedLastNames: null,
        lastModifiedEmail: null,
        lastModifiedSpecialty: null,
        updatedAt: new Date().toISOString()
      });
      showNotification('success', `Se desbloquearon todos los límites de tiempo de edición para ${doc.gender === 'female' ? 'Dra.' : 'Dr.'} ${doc.firstName} ${doc.lastName}.`);
    } catch (err) {
      showNotification('error', 'No se pudieron desbloquear las restricciones: ' + err.message);
    }
  };

  // Delete doctor
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmDoc) return;
    try {
      await removeDoctor(deleteConfirmDoc.id);
      setDeleteConfirmDoc(null);
      showNotification('success', `El registro del médico fue eliminado del sistema.`);
    } catch (err) {
      showNotification('error', 'Error al eliminar el médico: ' + err.message);
    }
  };

  // Shifts handlers for edit modal
  const handleAddEditShift = () => {
    setEditFormData(prev => ({
      ...prev,
      consultationSchedule: [
        ...prev.consultationSchedule,
        {
          id: 'sch-' + Date.now(),
          day: 'Lunes',
          startTime: '08:00',
          endTime: '13:00',
          room: 'Consultorio 1 - Evaluación Bariátrica Inicial'
        }
      ]
    }));
  };

  const handleUpdateEditShift = (index, field, val) => {
    setEditFormData(prev => {
      const updated = [...prev.consultationSchedule];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, consultationSchedule: updated };
    });
  };

  const handleRemoveEditShift = (index) => {
    setEditFormData(prev => ({
      ...prev,
      consultationSchedule: prev.consultationSchedule.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                Gestión de Médicos y Usuarios
                <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded-full font-bold uppercase">
                  Modo Admin
                </span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Creación de cuentas de especialistas, edición de campos protegidos y desbloqueo de políticas
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-all py-2.5 px-4 rounded-xl cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={18} />
          <span>+ Registrar Nuevo Médico</span>
        </button>
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

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4.5 bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 block">Total Médicos Registrados</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">{doctors?.length || 0}</span>
          </div>
        </div>

        <div className="card p-4.5 bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Stethoscope size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 block">Especialidades Médicas</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {new Set((doctors || []).map(d => d.specialty).filter(Boolean)).size}
            </span>
          </div>
        </div>

        <div className="card p-4.5 bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 block">Turnos de Consulta Fijos</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {(doctors || []).reduce((acc, doc) => acc + (doc.consultationSchedule?.length || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-4 bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, correo o especialidad..."
            className="input-field pl-10 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Specialty Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 shrink-0">Especialidad:</span>
          <select
            className="input-field py-1.5 px-3 text-xs w-full md:w-60"
            value={selectedSpecialty}
            onChange={e => setSelectedSpecialty(e.target.value)}
          >
            <option value="all">Todas las especialidades ({doctors?.length || 0})</option>
            {SPECIALTIES_LIST.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          <button
            onClick={() => refresh()}
            className="p-2 text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw size={16} />
          </button>
        </div>

      </div>

      {/* Doctors Grid / Cards */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 dark:text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></div>
          <p>Cargando médicos del sistema...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="card p-12 text-center bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-slate-800 rounded-2xl">
          <Users size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">No se encontraron médicos</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Intente ajustar los términos de búsqueda o registre un nuevo médico especialista.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map(doc => {
            const docPrefix = doc.gender === 'female' ? 'Dra.' : 'Dr.';
            const hasRestrictionsLocked = Boolean(
              doc.lastModifiedNames || doc.lastModifiedLastNames || doc.lastModifiedEmail || doc.lastModifiedSpecialty
            );

            return (
              <div 
                key={doc.id}
                className="card bg-white dark:bg-[#151D2A] border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Avatar + Name + Specialty */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base overflow-hidden border-2 border-primary/20 shrink-0 shadow-xs">
                      {doc.avatar ? (
                        <img src={doc.avatar} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <span>{doc.firstName ? doc.firstName.charAt(0).toUpperCase() : 'D'}{doc.lastName ? doc.lastName.charAt(0).toUpperCase() : ''}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base truncate leading-snug">
                          {docPrefix} {doc.firstName} {doc.lastName}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-primary dark:text-primary-light truncate mt-0.5">
                        {doc.specialty || 'Cirugía Bariátrica'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{doc.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Gender & Role Badges */}
                  <div className="flex flex-wrap gap-2 mb-4 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                      <Shield size={12} className="text-primary" />
                      {doc.gender === 'female' ? 'Femenino (Dra.)' : 'Masculino (Dr.)'}
                    </span>

                    <span className={clsx(
                      "px-2.5 py-1 rounded-md font-medium flex items-center gap-1",
                      hasRestrictionsLocked
                        ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50"
                        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                    )}>
                      {hasRestrictionsLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      {hasRestrictionsLocked ? 'Con bloqueos temporales' : 'Sin bloqueos activos'}
                    </span>
                  </div>

                  {/* Consultation Schedules List */}
                  <div className="space-y-2 mb-4">
                    <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider block">
                      Turnos en Consultorios ({doc.consultationSchedule?.length || 0})
                    </span>
                    {(!doc.consultationSchedule || doc.consultationSchedule.length === 0) ? (
                      <p className="text-xs text-gray-400 dark:text-slate-500 italic py-1">
                        Sin turnos asignados actualmente.
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {doc.consultationSchedule.map((sch, i) => (
                          <div key={sch.id || i} className="p-2 bg-slate-50 dark:bg-[#111823] rounded-lg text-xs flex justify-between items-center border border-slate-200 dark:border-slate-800">
                            <span className="font-semibold text-gray-800 dark:text-slate-200">{sch.day}:</span>
                            <span className="font-mono text-gray-600 dark:text-slate-400">{sch.startTime} - {sch.endTime}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions (Admin Controls) */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="btn btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5 font-semibold hover:border-primary hover:text-primary cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Editar Ficha</span>
                  </button>

                  {hasRestrictionsLocked && (
                    <button
                      onClick={() => handleQuickUnlock(doc)}
                      className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-900/50 transition-colors cursor-pointer"
                      title="Desbloquear restricciones de tiempo"
                    >
                      <Unlock size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteConfirmDoc(doc)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
                    title="Eliminar médico"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NUEVO MÉDICO                                             */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151D2A] text-gray-800 dark:text-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/30 text-sky-300 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Registrar Nuevo Médico Especialista</h2>
                  <p className="text-xs text-slate-300">Alta de usuario médico en la plataforma UCIBAM</p>
                </div>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Nombres *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      placeholder="Ej. Roberto"
                      value={newDocForm.firstName}
                      onChange={e => setNewDocForm(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Apellidos *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      placeholder="Ej. Castillo Ramos"
                      value={newDocForm.lastName}
                      onChange={e => setNewDocForm(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Género (Dr. / Dra.) */}
                <div>
                  <label className="label-text font-semibold text-gray-700 dark:text-slate-300 block mb-1.5">
                    Género & Prefijo Médico *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={clsx(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      newDocForm.gender === 'male' 
                        ? "border-primary bg-sky-50/70 dark:bg-sky-950/40 text-gray-900 dark:text-slate-100 font-semibold ring-1 ring-primary/40" 
                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}>
                      <input 
                        type="radio" 
                        name="newGender" 
                        value="male" 
                        checked={newDocForm.gender === 'male'} 
                        onChange={() => setNewDocForm(prev => ({ ...prev, gender: 'male' }))}
                        className="text-primary focus:ring-0"
                      />
                      <span>Masculino (Dr.)</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      newDocForm.gender === 'female' 
                        ? "border-primary bg-sky-50/70 dark:bg-sky-950/40 text-gray-900 dark:text-slate-100 font-semibold ring-1 ring-primary/40" 
                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}>
                      <input 
                        type="radio" 
                        name="newGender" 
                        value="female" 
                        checked={newDocForm.gender === 'female'} 
                        onChange={() => setNewDocForm(prev => ({ ...prev, gender: 'female' }))}
                        className="text-primary focus:ring-0"
                      />
                      <span>Femenino (Dra.)</span>
                    </label>
                  </div>
                </div>

                {/* Correo y Especialidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      className="input-field mt-1" 
                      placeholder="dr.castillo@gmail.com"
                      value={newDocForm.email}
                      onChange={e => setNewDocForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Especialidad Médica *</label>
                    <select
                      className="input-field mt-1"
                      value={newDocForm.specialty}
                      onChange={e => setNewDocForm(prev => ({ ...prev, specialty: e.target.value }))}
                      required
                    >
                      {SPECIALTIES_LIST.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Turno de Consulta Inicial */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock size={16} className="text-primary" /> Turno de Consulta Inicial
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-400 block mb-1">Día de Consulta:</label>
                      <select
                        className="input-field py-1.5 px-2 text-xs"
                        value={newDocForm.initialDay}
                        onChange={e => setNewDocForm(prev => ({ ...prev, initialDay: e.target.value }))}
                      >
                        {DAYS_OF_WEEK.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-400 block mb-1">Hora Inicio:</label>
                      <input 
                        type="time" 
                        className="input-field py-1.5 px-2 text-xs font-mono"
                        value={newDocForm.initialStartTime}
                        onChange={e => setNewDocForm(prev => ({ ...prev, initialStartTime: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-400 block mb-1">Hora Fin:</label>
                      <input 
                        type="time" 
                        className="input-field py-1.5 px-2 text-xs font-mono"
                        value={newDocForm.initialEndTime}
                        onChange={e => setNewDocForm(prev => ({ ...prev, initialEndTime: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-400 block mb-1">Consultorio Asignado:</label>
                    <select
                      className="input-field py-1.5 px-2 text-xs"
                      value={newDocForm.initialRoom}
                      onChange={e => setNewDocForm(prev => ({ ...prev, initialRoom: e.target.value }))}
                    >
                      {CONSULTATION_ROOMS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#111823] border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setCreateModalOpen(false)}
                  className="btn btn-secondary px-4 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary px-6 flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} /> Registrar Médico
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR MÉDICO EN MODO ADMINISTRADOR (EDICIÓN TOTAL SIN BLOQUEOS)  */}
      {/* ========================================================================= */}
      {editModalDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151D2A] text-gray-800 dark:text-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/30 text-indigo-300 rounded-lg">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Edición de Médico (Modo Administrador)</h2>
                  <p className="text-xs text-slate-300">Modificación sin restricciones de tiempo o campos bloqueados</p>
                </div>
              </div>
              <button 
                onClick={() => setEditModalDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* Alerta de modo Admin */}
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                  <Shield size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Permiso de Administrador Activo:</strong>
                    <span>Tiene autorización total para cambiar género, nombres, correo y especialidad sin las restricciones temporales del perfil médico.</span>
                  </div>
                </div>

                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Nombres *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      value={editFormData.firstName}
                      onChange={e => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Apellidos *</label>
                    <input 
                      type="text" 
                      className="input-field mt-1" 
                      value={editFormData.lastName}
                      onChange={e => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Género (Editable por Admin) */}
                <div>
                  <label className="label-text font-semibold text-gray-700 dark:text-slate-300 block mb-1.5">
                    Género & Prefijo Médico (Editable por Admin) *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={clsx(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      editFormData.gender === 'male' 
                        ? "border-primary bg-sky-50/70 dark:bg-sky-950/40 text-gray-900 dark:text-slate-100 font-semibold ring-1 ring-primary/40" 
                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}>
                      <input 
                        type="radio" 
                        name="editGender" 
                        value="male" 
                        checked={editFormData.gender === 'male'} 
                        onChange={() => setEditFormData(prev => ({ ...prev, gender: 'male' }))}
                        className="text-primary focus:ring-0"
                      />
                      <span>Masculino (Dr.)</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      editFormData.gender === 'female' 
                        ? "border-primary bg-sky-50/70 dark:bg-sky-950/40 text-gray-900 dark:text-slate-100 font-semibold ring-1 ring-primary/40" 
                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}>
                      <input 
                        type="radio" 
                        name="editGender" 
                        value="female" 
                        checked={editFormData.gender === 'female'} 
                        onChange={() => setEditFormData(prev => ({ ...prev, gender: 'female' }))}
                        className="text-primary focus:ring-0"
                      />
                      <span>Femenino (Dra.)</span>
                    </label>
                  </div>
                </div>

                {/* Correo y Especialidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      className="input-field mt-1" 
                      value={editFormData.email}
                      onChange={e => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text font-semibold text-gray-700 dark:text-slate-300">Especialidad Médica *</label>
                    <select
                      className="input-field mt-1"
                      value={editFormData.specialty}
                      onChange={e => setEditFormData(prev => ({ ...prev, specialty: e.target.value }))}
                      required
                    >
                      {SPECIALTIES_LIST.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reset Restriction Locks Checkbox */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 rounded text-amber-600 focus:ring-0 h-4 w-4"
                      checked={editFormData.resetLocks}
                      onChange={e => setEditFormData(prev => ({ ...prev, resetLocks: e.target.checked }))}
                    />
                    <div className="text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-200 block">
                        Desbloquear y restablecer temporizadores de modificación
                      </span>
                      <span className="text-amber-700 dark:text-amber-300">
                        Permite al médico editar nuevamente sus nombres (4 meses), correo (21 días) o especialidad (6 meses) desde su propio perfil sin esperar.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Turnos de Consulta */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                      <Clock size={16} className="text-primary" /> Turnos y Consultorios Asignados
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddEditShift}
                      className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Agregar Turno</span>
                    </button>
                  </div>

                  {editFormData.consultationSchedule.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                      Sin turnos de consulta configurados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {editFormData.consultationSchedule.map((shift, idx) => (
                        <div key={shift.id || idx} className="p-3 bg-slate-50 dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                          <select
                            className="input-field py-1 px-2 text-xs w-full sm:w-28"
                            value={shift.day}
                            onChange={e => handleUpdateEditShift(idx, 'day', e.target.value)}
                          >
                            {DAYS_OF_WEEK.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            <input 
                              type="time" 
                              className="input-field py-1 px-1.5 text-xs font-mono w-24"
                              value={shift.startTime}
                              onChange={e => handleUpdateEditShift(idx, 'startTime', e.target.value)}
                              required
                            />
                            <span className="text-gray-400">-</span>
                            <input 
                              type="time" 
                              className="input-field py-1 px-1.5 text-xs font-mono w-24"
                              value={shift.endTime}
                              onChange={e => handleUpdateEditShift(idx, 'endTime', e.target.value)}
                              required
                            />
                          </div>

                          <select
                            className="input-field py-1 px-2 text-xs flex-1"
                            value={shift.room}
                            onChange={e => handleUpdateEditShift(idx, 'room', e.target.value)}
                            required
                          >
                            {CONSULTATION_ROOMS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveEditShift(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer self-end sm:self-auto"
                            title="Quitar turno"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#111823] border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditModalDoc(null)}
                  className="btn btn-secondary px-4 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary px-6 flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} /> Guardar Modificaciones
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE MÉDICO                                    */}
      {/* ========================================================================= */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151D2A] text-gray-800 dark:text-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/60 rounded-xl">
                <AlertCircle size={26} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">¿Eliminar Médico?</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
              ¿Está seguro de que desea dar de baja a <strong>{deleteConfirmDoc.gender === 'female' ? 'Dra.' : 'Dr.'} {deleteConfirmDoc.firstName} {deleteConfirmDoc.lastName}</strong> ({deleteConfirmDoc.specialty}) del sistema UCIBAM?
            </p>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmDoc(null)}
                className="btn btn-secondary px-4 cursor-pointer text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
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
