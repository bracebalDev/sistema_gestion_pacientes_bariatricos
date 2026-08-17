import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Save, Camera, Trash2, CheckCircle2, Lock, Clock, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [firstName, setFirstName] = useState(user?.firstName || 'Carlos');
  const [lastName, setLastName] = useState(user?.lastName || 'Mendoza');
  const [email, setEmail] = useState(user?.email || 'doctorcirugia@gmail.com');
  const [specialty, setSpecialty] = useState(user?.specialty || 'Cirugía Bariátrica');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [consultationSchedule, setConsultationSchedule] = useState(
    user?.consultationSchedule || [
      { id: 'sch-1', day: 'Lunes', startTime: '08:00', endTime: '13:00', room: 'Consultorio 1 - Evaluación Bariátrica Inicial' },
      { id: 'sch-2', day: 'Miércoles', startTime: '08:00', endTime: '13:00', room: 'Consultorio 1 - Evaluación Bariátrica Inicial' },
      { id: 'sch-3', day: 'Viernes', startTime: '08:00', endTime: '12:00', room: 'Consultorio 4 - Control & Seguimiento Postoperatorio' }
    ]
  );
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to calculate lock status and remaining days
  const calculateRestriction = (lastModifiedStr, requiredDays, periodName) => {
    if (!lastModifiedStr) {
      return { isLocked: false, remainingDays: 0, periodName };
    }
    const lastDate = new Date(lastModifiedStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    const remaining = requiredDays - diffDays;
    
    return {
      isLocked: remaining > 0,
      remainingDays: remaining > 0 ? remaining : 0,
      periodName
    };
  };

  // Status for each restricted field
  const namesStatus = calculateRestriction(user?.lastModifiedNames, 120, '4 meses');
  const lastNamesStatus = calculateRestriction(user?.lastModifiedLastNames, 120, '4 meses');
  const emailStatus = calculateRestriction(user?.lastModifiedEmail, 21, '21 días');
  const specialtyStatus = calculateRestriction(user?.lastModifiedSpecialty, 180, '6 meses');

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Password validation if entered
    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword !== confirmPassword) {
        setErrorMessage('La nueva contraseña y la confirmación no coinciden.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    setIsSaving(true);

    const nowIso = new Date().toISOString();
    const updates = {
      avatar
    };

    // Update names only if allowed and changed
    if (!namesStatus.isLocked && firstName !== user?.firstName) {
      updates.firstName = firstName;
      updates.lastModifiedNames = nowIso;
    } else {
      updates.firstName = user?.firstName || firstName;
    }

    // Update last names only if allowed and changed
    if (!lastNamesStatus.isLocked && lastName !== user?.lastName) {
      updates.lastName = lastName;
      updates.lastModifiedLastNames = nowIso;
    } else {
      updates.lastName = user?.lastName || lastName;
    }

    // Update email only if allowed and changed
    if (!emailStatus.isLocked && email !== user?.email) {
      updates.email = email;
      updates.lastModifiedEmail = nowIso;
    } else {
      updates.email = user?.email || email;
    }

    // Update specialty only if allowed and changed
    if (!specialtyStatus.isLocked && specialty !== user?.specialty) {
      updates.specialty = specialty;
      updates.lastModifiedSpecialty = nowIso;
    } else {
      updates.specialty = user?.specialty || specialty;
    }

    // Consultation schedule
    updates.consultationSchedule = consultationSchedule;

    try {
      await updateUser(updates);
      setSavedSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err) {
      setErrorMessage('Error al guardar los datos en el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddScheduleShift = () => {
    const newShift = {
      id: 'sch-' + Date.now(),
      day: 'Martes',
      startTime: '08:00',
      endTime: '13:00',
      room: 'Consultorio 1 - Evaluación Bariátrica Inicial'
    };
    setConsultationSchedule(prev => [...prev, newShift]);
  };

  const handleUpdateScheduleShift = (index, field, value) => {
    setConsultationSchedule(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveScheduleShift = (index) => {
    setConsultationSchedule(prev => prev.filter((_, i) => i !== index));
  };

  const availableConsultationRooms = [
    'Consultorio 1 - Evaluación Bariátrica Inicial',
    'Consultorio 2 - Nutrición Clínica & Metabolismo',
    'Consultorio 3 - Psicología Bariátrica & Conductual',
    'Consultorio 4 - Control & Seguimiento Postoperatorio',
    'Consultorio 5 - Medicina Interna & Riesgo Quirúrgico',
    'Consultorio 6 - Consulta Quirúrgica Bariátrica',
    'Consultorio 7 - Gastroenterología & Endoscopía',
    'Consultorio 8 - Consulta de Chequeo & Revaloración'
  ];

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const doctorPrefix = user?.gender === 'female' ? 'Dra.' : 'Dr.';

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Perfil del Médico</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Información profesional y configuración de cuenta</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-emerald-500 rounded-r-lg text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">¡Cambios guardados con éxito en la base de datos JSON!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 border-l-4 border-red-500 rounded-r-lg text-red-800 dark:text-red-300 text-sm flex items-center gap-3 shadow-sm animate-in fade-in">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="card shadow-sm border border-gray-200/80 dark:border-slate-800">
        <div className="card-body p-6 sm:p-8">
          
          {/* Header del Perfil / Círculo de Foto interactivo */}
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-8 pb-8 border-b border-gray-100 dark:border-slate-800">
            <div className="flex flex-col items-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 rounded-full bg-primary text-white flex items-center justify-center text-4xl font-bold overflow-hidden shadow-md border-4 border-white dark:border-slate-800 cursor-pointer group transition-transform hover:scale-105"
                title="Pulsar para cambiar fotografía"
              >
                {avatar ? (
                  <img src={avatar} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span>{firstName ? firstName.charAt(0).toUpperCase() : 'D'}{lastName ? lastName.charAt(0).toUpperCase() : ''}</span>
                )}
                
                {/* Overlay interactivo al pasar el mouse */}
                <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center">
                  <Camera size={24} className="mb-1" />
                  <span className="text-[11px] font-semibold leading-tight">Pulsar para cambiar</span>
                </div>
              </div>

              {avatar && (
                <button 
                  type="button" 
                  onClick={handleRemovePhoto} 
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 size={13} /> Quitar foto
                </button>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />

            <div className="flex-1 text-center sm:text-left pt-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {doctorPrefix} {firstName} {lastName}
                </h2>
              </div>
              <p className="text-primary dark:text-primary-light font-medium text-sm mt-0.5">{specialty}</p>
              <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">Clínica UCIBAM • Unidad Bariátrica</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                * Para cambiar su foto, haga clic directamente sobre el círculo.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sección Género (Solo lectura) */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-text flex items-center gap-2 font-semibold">
                    <Shield size={16} className="text-primary" /> Género
                  </label>
                  <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                    <Lock size={12} /> Definido al crear la cuenta
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    user?.gender === 'male' || !user?.gender
                      ? 'border-primary bg-sky-50/70 dark:bg-sky-950/40 text-gray-900 dark:text-slate-100 font-medium ring-1 ring-primary/30' 
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/40 text-gray-400 dark:text-slate-500 opacity-60'
                  } cursor-not-allowed`}>
                    <input 
                      type="radio" 
                      name="gender" 
                      value="male" 
                      checked={user?.gender === 'male' || !user?.gender} 
                      disabled
                      className="text-primary focus:ring-0 h-4 w-4 cursor-not-allowed"
                    />
                    <div>
                      <span className="block text-sm font-semibold">Masculino (Dr.)</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    user?.gender === 'female' 
                      ? 'border-primary bg-sky-50/70 dark:bg-sky-950/40 text-gray-900 dark:text-slate-100 font-medium ring-1 ring-primary/30' 
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/40 text-gray-400 dark:text-slate-500 opacity-60'
                  } cursor-not-allowed`}>
                    <input 
                      type="radio" 
                      name="gender" 
                      value="female" 
                      checked={user?.gender === 'female'} 
                      disabled
                      className="text-primary focus:ring-0 h-4 w-4 cursor-not-allowed"
                    />
                    <div>
                      <span className="block text-sm font-semibold">Femenino (Dra.)</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                  <Lock size={11} /> El género se selecciona al momento de crear la cuenta y no puede modificarse en esta sección.
                </p>
              </div>

              {/* Nombres (Modificable 1 vez cada 4 meses) */}
              <div>
                <label className="label-text flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <User size={16} /> Nombres
                  </span>
                  {namesStatus.isLocked ? (
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock size={11} /> Disponible en {namesStatus.remainingDays}d
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Clock size={11} /> 1 vez cada 4 meses
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  className={`input-field mt-1 ${namesStatus.isLocked ? 'bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 cursor-not-allowed' : ''}`}
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  disabled={namesStatus.isLocked}
                  required
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  {namesStatus.isLocked 
                    ? `Bloqueado por política de seguridad (cambio permitido cada 4 meses).` 
                    : `Disponible para modificar (cambio permitido una vez cada 4 meses).`}
                </p>
              </div>

              {/* Apellidos (Modificable 1 vez cada 4 meses) */}
              <div>
                <label className="label-text flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <User size={16} /> Apellidos
                  </span>
                  {lastNamesStatus.isLocked ? (
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock size={11} /> Disponible en {lastNamesStatus.remainingDays}d
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Clock size={11} /> 1 vez cada 4 meses
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  className={`input-field mt-1 ${lastNamesStatus.isLocked ? 'bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 cursor-not-allowed' : ''}`}
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  disabled={lastNamesStatus.isLocked}
                  required
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  {lastNamesStatus.isLocked 
                    ? `Bloqueado por política de seguridad (cambio permitido cada 4 meses).` 
                    : `Disponible para modificar (cambio permitido una vez cada 4 meses).`}
                </p>
              </div>

              {/* Correo Electrónico (Modificable 1 vez cada 21 días) */}
              <div>
                <label className="label-text flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <Mail size={16} /> Correo Electrónico
                  </span>
                  {emailStatus.isLocked ? (
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock size={11} /> Disponible en {emailStatus.remainingDays}d
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Clock size={11} /> 1 vez cada 21 días
                    </span>
                  )}
                </label>
                <input 
                  type="email" 
                  className={`input-field mt-1 ${emailStatus.isLocked ? 'bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 cursor-not-allowed' : ''}`}
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  disabled={emailStatus.isLocked}
                  required
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  {emailStatus.isLocked 
                    ? `Bloqueado: disponible para cambio en ${emailStatus.remainingDays} días.` 
                    : `Modificable una vez cada 21 días.`}
                </p>
              </div>

              {/* Especialidad (Modificable 1 vez cada 6 meses) */}
              <div>
                <label className="label-text flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <Shield size={16} /> Especialidad Médica
                  </span>
                  {specialtyStatus.isLocked ? (
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock size={11} /> Disponible en {specialtyStatus.remainingDays}d
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Clock size={11} /> 1 vez cada 6 meses
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  className={`input-field mt-1 ${specialtyStatus.isLocked ? 'bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 cursor-not-allowed' : ''}`}
                  value={specialty} 
                  onChange={e => setSpecialty(e.target.value)} 
                  disabled={specialtyStatus.isLocked}
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  {specialtyStatus.isLocked 
                    ? `Bloqueado por política de seguridad (cambio permitido cada 6 meses).` 
                    : `Modificable una vez cada 6 meses.`}
                </p>
              </div>
            </div>

            {/* Días y Horarios de Consulta en Consultorios (Estándar de Clínica) */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock size={18} className="text-primary" /> Días y Horarios de Consulta en Consultorio
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Registre los días y turnos en que pasa consulta en la clínica para visibilidad en el módulo de Espacios y para los pacientes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddScheduleShift}
                  className="btn btn-secondary text-xs flex items-center gap-1.5 self-start sm:self-auto py-1.5 px-3 font-semibold hover:border-primary hover:text-primary cursor-pointer"
                >
                  <span>+ Agregar Turno</span>
                </button>
              </div>

              {consultationSchedule.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-[#111823] border border-gray-200 dark:border-slate-800 rounded-xl text-center text-xs text-gray-500 dark:text-slate-400">
                  No ha registrado horarios fijos de consulta. Haga clic en "+ Agregar Turno" para configurar sus días.
                </div>
              ) : (
                <div className="space-y-3">
                  {consultationSchedule.map((shift, idx) => (
                    <div key={shift.id || idx} className="p-3.5 bg-slate-50 dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
                      <div className="w-full md:w-32">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 block mb-1">Día:</label>
                        <select
                          className="input-field py-1 px-2 text-xs font-semibold"
                          value={shift.day}
                          onChange={e => handleUpdateScheduleShift(idx, 'day', e.target.value)}
                        >
                          {daysOfWeek.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-28">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 block mb-1">Inicio:</label>
                        <input
                          type="time"
                          className="input-field py-1 px-2 text-xs font-mono"
                          value={shift.startTime}
                          onChange={e => handleUpdateScheduleShift(idx, 'startTime', e.target.value)}
                          required
                        />
                      </div>

                      <div className="w-full md:w-28">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 block mb-1">Fin:</label>
                        <input
                          type="time"
                          className="input-field py-1 px-2 text-xs font-mono"
                          value={shift.endTime}
                          onChange={e => handleUpdateScheduleShift(idx, 'endTime', e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 block mb-1">Consultorio Asignado:</label>
                        <select
                          className="input-field py-1 px-2 text-xs"
                          value={shift.room}
                          onChange={e => handleUpdateScheduleShift(idx, 'room', e.target.value)}
                          required
                        >
                          {availableConsultationRooms.map(cName => (
                            <option key={cName} value={cName}>{cName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleShift(idx)}
                          className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors mt-auto cursor-pointer"
                          title="Eliminar turno de consulta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contraseña (Modificable) */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Cambiar Contraseña</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Deje estos campos en blanco si no desea modificar su contraseña actual.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="label-text font-medium">Contraseña Actual</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="input-field mt-1" 
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-text font-medium">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="input-field mt-1" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-text font-medium">Confirmar Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="input-field mt-1" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={isSaving}
                className="btn btn-primary flex items-center gap-2 px-6 py-2.5 shadow hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save size={18} /> {isSaving ? 'Guardando en JSON...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
