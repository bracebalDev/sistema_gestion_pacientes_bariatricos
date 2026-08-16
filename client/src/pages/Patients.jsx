import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Plus, Search, Edit, Trash2, Eye, X, Save, AlertCircle, CheckCircle2, 
  Lock, Calendar, User, HeartPulse, Activity, ShieldAlert, FileText, Phone, MapPin, Sparkles, Scale
} from 'lucide-react';
import clsx from 'clsx';

// Initial state for patient form
const getInitialFormState = () => ({
  historyNumber: '',
  firstName: '',
  lastName: '',
  age: '',
  gender: 'Masculino',
  condition: 'Estable',
  bloodType: 'O+',
  phone: '',
  address: '',
  weight: '',
  height: '',
  bmi: '',
  consultationReason: '',
  allergies: '',
  chronicDiseases: '',
  stds: 'Negativo / No refiere',
  surgicalHistory: '',
  currentMedications: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  createdAt: ''
});

// Alphanumeric validator: 6 chars, uppercase letters and numbers, at least 2 numbers & 1 letter
const validateHistoryNumber = (num) => {
  if (!num || num.length !== 6) return false;
  const clean = num.toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(clean)) return false;
  const digits = (clean.match(/\d/g) || []).length;
  const letters = (clean.match(/[A-Z]/g) || []).length;
  return digits >= 2 && letters >= 1;
};

// Auto-generator for 6-char compliant code (e.g. UB2045)
const generateHistoryNumber = (existingPatients = []) => {
  const prefix = 'UB';
  const digits = '0123456789';
  let code = '';
  let tries = 0;
  
  while (tries < 1000) {
    tries++;
    let randomDigits = '';
    for (let i = 0; i < 4; i++) {
      randomDigits += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    code = `${prefix}${randomDigits}`;
    const exists = existingPatients.some(p => (p.historyNumber || '').toUpperCase() === code);
    if (!exists && validateHistoryNumber(code)) {
      return code;
    }
  }
  return 'UB' + Math.floor(1000 + Math.random() * 9000);
};

// Calculate BMI & Classification
const calculateBmi = (weightKg, heightCm) => {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm) / 100;
  if (!w || !h || h <= 0) return { bmi: '', category: '' };
  const bmiVal = (w / (h * h)).toFixed(1);
  let category = '';
  if (bmiVal < 18.5) category = 'Bajo Peso';
  else if (bmiVal < 25) category = 'Normopeso';
  else if (bmiVal < 30) category = 'Sobrepeso';
  else if (bmiVal < 35) category = 'Obesidad Grado I';
  else if (bmiVal < 40) category = 'Obesidad Grado II';
  else category = 'Obesidad Mórbida (Grado III)';
  return { bmi: bmiVal, category };
};

export default function Patients() {
  const { data: patients, loading, add, update, remove } = useApi('patients');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Form State & Feedback
  const [formData, setFormData] = useState(getInitialFormState());
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'clinical' | 'history' | 'emergency'

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedPatient(null);
    const newCode = generateHistoryNumber(patients);
    setFormData({
      ...getInitialFormState(),
      historyNumber: newCode,
      createdAt: new Date().toISOString()
    });
    setFormError('');
    setActiveTab('general');
    setIsModalOpen(true);
  };

  // Open Edit Modal (Enforcing immutable fields)
  const handleOpenEdit = (patient) => {
    setIsEditing(true);
    setSelectedPatient(patient);
    setFormData({
      ...getInitialFormState(),
      ...patient
    });
    setFormError('');
    setActiveTab('general');
    setIsModalOpen(true);
  };

  // Open View Details Modal
  const handleOpenView = (patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  // Delete patient with confirmation
  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Está seguro de eliminar el registro del paciente "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await remove(id);
      } catch (err) {
        alert('Error al eliminar paciente: ' + err.message);
      }
    }
  };

  // Handle Form Change with BMI calculation
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'weight' || field === 'height') {
        const { bmi } = calculateBmi(
          field === 'weight' ? value : prev.weight,
          field === 'height' ? value : prev.height
        );
        updated.bmi = bmi;
      }
      return updated;
    });
  };

  // Submit Handler with Validations
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanHistoryNumber = (formData.historyNumber || '').toUpperCase().trim();

    // 1. Validate History Number Format (6 alphanumeric chars, >= 2 digits, uppercase)
    if (!validateHistoryNumber(cleanHistoryNumber)) {
      setFormError('El Número de Historia debe tener exactamente 6 caracteres alfanuméricos en mayúsculas (mínimo 2 números y letras, ej: UB2045).');
      return;
    }

    // 2. Validate Uniqueness on Create (or if historyNumber was modified)
    if (!isEditing) {
      const exists = patients.some(
        p => (p.historyNumber || '').toUpperCase() === cleanHistoryNumber
      );
      if (exists) {
        setFormError(`El Número de Historia "${cleanHistoryNumber}" ya se encuentra registrado para otro paciente. Por favor ingrese un código único.`);
        return;
      }
    }

    // 3. Required Fields Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Nombres y Apellidos son campos obligatorios.');
      return;
    }
    if (!formData.age || isNaN(formData.age) || Number(formData.age) <= 0) {
      setFormError('Por favor ingrese una edad válida.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && selectedPatient) {
        // Enforce immutability: historyNumber, firstName, lastName, createdAt CANNOT be changed
        const updatePayload = {
          ...formData,
          historyNumber: selectedPatient.historyNumber,
          firstName: selectedPatient.firstName,
          lastName: selectedPatient.lastName,
          createdAt: selectedPatient.createdAt || formData.createdAt,
          updatedAt: new Date().toISOString()
        };
        await update(selectedPatient.id, updatePayload);
      } else {
        // Create new patient record with automatic current timestamp
        const newPayload = {
          ...formData,
          historyNumber: cleanHistoryNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await add(newPayload);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Error al guardar en el servidor: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and Sort: Ascending by registration date + priority ranking by historyNumber and name matches
  const sortedAndFilteredPatients = useMemo(() => {
    // 1. Base sort: Ascending by registration date (from oldest to newest)
    const baseList = [...patients].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    if (!searchTerm.trim()) {
      return baseList;
    }

    const term = searchTerm.toLowerCase().trim();

    return baseList
      .filter(p => {
        const hNum = (p.historyNumber || '').toLowerCase();
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        const condition = (p.condition || '').toLowerCase();
        return hNum.includes(term) || fullName.includes(term) || condition.includes(term);
      })
      .sort((a, b) => {
        const aNum = (a.historyNumber || '').toLowerCase();
        const bNum = (b.historyNumber || '').toLowerCase();
        
        // Priority Score for History Number closest matches
        const aScore = aNum === term ? 100 : aNum.startsWith(term) ? 80 : aNum.includes(term) ? 50 : 0;
        const bScore = bNum === term ? 100 : bNum.startsWith(term) ? 80 : bNum.includes(term) ? 50 : 0;

        if (aScore !== bScore) {
          return bScore - aScore; // Highest matching score first
        }
        
        // Tie-breaker: Ascending registration date (oldest to newest)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });
  }, [patients, searchTerm]);

  // Format readable date
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Condition Badge Color Helper
  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'Estable':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Preoperatorio':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Postoperatorio':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'En Observación':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Crítico':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Alta Médica':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const bmiInfo = calculateBmi(formData.weight, formData.height);

  return (
    <div className="space-y-6">
      
      {/* Header and New Patient Button */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directorio de Pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestión de Historias Clínicas Electrónicas (Estándar Internacional EHR)
          </p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="btn btn-primary flex items-center gap-2 px-4 py-2.5 shadow-sm hover:shadow"
        >
          <Plus size={18} />
          <span className="font-semibold">Nuevo Paciente</span>
        </button>
      </div>

      {/* Main Card with Search Bar & Table */}
      <div className="card shadow-sm border border-gray-200/80">
        
        {/* Search Header */}
        <div className="card-header flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por # de historia o nombre (orden ascendente)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2 self-end sm:self-auto">
            <span>Total: <strong>{sortedAndFilteredPatients.length}</strong> pacientes</span>
            <span className="text-gray-300">|</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
              Orden: Más antiguos a más recientes
            </span>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold"># Historia</th>
                <th className="p-4 font-semibold">Paciente</th>
                <th className="p-4 font-semibold">Edad / Género</th>
                <th className="p-4 font-semibold">Condición</th>
                <th className="p-4 font-semibold">Tipo Sangre</th>
                <th className="p-4 font-semibold">Fecha Registro</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></div>
                    <p>Cargando pacientes...</p>
                  </td>
                </tr>
              ) : sortedAndFilteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500">
                    <User size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700">No se encontraron pacientes registrados</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchTerm ? 'Pruebe con otro término de búsqueda o número de historia.' : 'Haga clic en "Nuevo Paciente" para comenzar.'}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredPatients.map(p => {
                  const displayGender = p.gender === 'male' || p.gender === 'Masculino' || p.sex === 'M' 
                    ? 'Masc.' 
                    : p.gender === 'female' || p.gender === 'Femenino' || p.sex === 'F' 
                      ? 'Fem.' 
                      : (p.gender || p.sex || 'Otro');
                  return (
                    <tr key={p.id} className="hover:bg-sky-50/30 transition-colors group">
                      <td className="p-4">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200">
                          {p.historyNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 leading-snug">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {p.phone || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">
                        <span>{p.age} años</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="font-medium">{displayGender}</span>
                      </td>
                    <td className="p-4">
                      <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-semibold border", getConditionBadge(p.condition))}>
                        {p.condition}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        {p.bloodType || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenView(p)}
                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-sky-50 rounded-md transition-colors"
                          title="Ver Historia Completa"
                        >
                          <Eye size={17} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Editar Historia Clínica"
                        >
                          <Edit size={17} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id, `${p.firstName} ${p.lastName}`)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar Paciente"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRO / EDICIÓN DE HISTORIA CLÍNICA (ESTÁNDAR INTERNACIONAL EHR) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <HeartPulse className="text-primary-light" size={22} />
                  <h2 className="text-lg font-bold">
                    {isEditing ? 'Editar Historia Clínica Digital' : 'Nueva Historia Clínica Digital'}
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Estándar Internacional de Registro Clínico • Unidad Bariátrica UCIBAM
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Inmutability Alert Banner in Edit Mode */}
            {isEditing && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center gap-2">
                <Lock size={14} className="text-amber-700 shrink-0" />
                <span>
                  <strong>Modo Seguro:</strong> Por normatividad médica internacional, el <strong>Número de Historia</strong>, <strong>Nombres</strong>, <strong>Apellidos</strong> y <strong>Fecha de Registro</strong> son inmutables y no pueden modificarse.
                </span>
              </div>
            )}

            {/* Error Message */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="px-6 border-b border-gray-200 flex gap-2 bg-gray-50/70 pt-2 overflow-x-auto">
              <button 
                type="button"
                onClick={() => setActiveTab('general')}
                className={clsx(
                  "px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  activeTab === 'general' ? "border-primary text-primary bg-white shadow-xs" : "border-transparent text-gray-500 hover:text-gray-800"
                )}
              >
                <User size={14} /> I. Datos Demográficos
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('clinical')}
                className={clsx(
                  "px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  activeTab === 'clinical' ? "border-primary text-primary bg-white shadow-xs" : "border-transparent text-gray-500 hover:text-gray-800"
                )}
              >
                <Activity size={14} /> II. Parámetros Clínicos & IMC
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('history')}
                className={clsx(
                  "px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  activeTab === 'history' ? "border-primary text-primary bg-white shadow-xs" : "border-transparent text-gray-500 hover:text-gray-800"
                )}
              >
                <ShieldAlert size={14} /> III. Antecedentes & Motivo
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('emergency')}
                className={clsx(
                  "px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  activeTab === 'emergency' ? "border-primary text-primary bg-white shadow-xs" : "border-transparent text-gray-500 hover:text-gray-800"
                )}
              >
                <Phone size={14} /> IV. Contacto de Emergencia
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: DATOS DEMOGRÁFICOS */}
              {activeTab === 'general' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Número de Historia Clínica (Alfanumérico 6 caracteres) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="label-text font-semibold flex items-center gap-1.5">
                          # Historia Clínica <span className="text-red-500">*</span>
                        </label>
                        {!isEditing && (
                          <button 
                            type="button" 
                            onClick={() => handleInputChange('historyNumber', generateHistoryNumber(patients))}
                            className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                            title="Generar código automático"
                          >
                            <Sparkles size={11} /> Auto-generar
                          </button>
                        )}
                      </div>
                      <div className="relative mt-1">
                        <input 
                          type="text" 
                          maxLength={6}
                          placeholder="Ej: UB2045"
                          className={clsx(
                            "input-field font-mono font-bold tracking-wider uppercase",
                            isEditing && "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                          )}
                          value={formData.historyNumber}
                          onChange={e => handleInputChange('historyNumber', e.target.value.toUpperCase())}
                          disabled={isEditing}
                          required
                        />
                        {isEditing && <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        6 caracteres alfanuméricos (mínimo 2 números y letras).
                      </span>
                    </div>

                    {/* Fecha de Registro (Automática) */}
                    <div>
                      <label className="label-text font-semibold flex items-center gap-1.5">
                        <Calendar size={14} /> Fecha de Registro
                      </label>
                      <input 
                        type="text" 
                        className="input-field mt-1 bg-gray-100 text-gray-600 cursor-not-allowed text-xs font-medium"
                        value={formatDateTime(formData.createdAt || new Date().toISOString())}
                        disabled
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Asignada automáticamente al momento del registro.
                      </span>
                    </div>

                    {/* Género */}
                    <div>
                      <label className="label-text font-semibold">
                        Género <span className="text-red-500">*</span>
                      </label>
                      <select 
                        className="input-field mt-1"
                        value={formData.gender || (formData.sex === 'F' ? 'Femenino' : 'Masculino')}
                        onChange={e => {
                          handleInputChange('gender', e.target.value);
                          handleInputChange('sex', e.target.value === 'Femenino' ? 'F' : 'M');
                        }}
                        required
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    {/* Nombres (Inmutable en edición) */}
                    <div>
                      <label className="label-text font-semibold flex items-center justify-between">
                        <span>Nombres <span className="text-red-500">*</span></span>
                        {isEditing && <span className="text-[10px] text-amber-600 flex items-center gap-1"><Lock size={10} /> Inmutable</span>}
                      </label>
                      <input 
                        type="text" 
                        className={clsx("input-field mt-1", isEditing && "bg-gray-100 text-gray-500 cursor-not-allowed")}
                        placeholder="Nombres completos"
                        value={formData.firstName}
                        onChange={e => handleInputChange('firstName', e.target.value)}
                        disabled={isEditing}
                        required
                      />
                    </div>

                    {/* Apellidos (Inmutable en edición) */}
                    <div>
                      <label className="label-text font-semibold flex items-center justify-between">
                        <span>Apellidos <span className="text-red-500">*</span></span>
                        {isEditing && <span className="text-[10px] text-amber-600 flex items-center gap-1"><Lock size={10} /> Inmutable</span>}
                      </label>
                      <input 
                        type="text" 
                        className={clsx("input-field mt-1", isEditing && "bg-gray-100 text-gray-500 cursor-not-allowed")}
                        placeholder="Apellidos completos"
                        value={formData.lastName}
                        onChange={e => handleInputChange('lastName', e.target.value)}
                        disabled={isEditing}
                        required
                      />
                    </div>

                    {/* Edad */}
                    <div>
                      <label className="label-text font-semibold">
                        Edad (Años) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        max={120}
                        className="input-field mt-1"
                        placeholder="Ej: 38"
                        value={formData.age}
                        onChange={e => handleInputChange('age', e.target.value)}
                        required
                      />
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="label-text font-semibold flex items-center gap-1.5">
                        <Phone size={14} /> Teléfono de Contacto
                      </label>
                      <input 
                        type="tel" 
                        className="input-field mt-1"
                        placeholder="+58 414 1234567"
                        value={formData.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                      />
                    </div>

                    {/* Dirección (2 columnas) */}
                    <div className="md:col-span-2">
                      <label className="label-text font-semibold flex items-center gap-1.5">
                        <MapPin size={14} /> Dirección de Residencia
                      </label>
                      <input 
                        type="text" 
                        className="input-field mt-1"
                        placeholder="Ciudad, municipio, sector, calle y punto de referencia"
                        value={formData.address}
                        onChange={e => handleInputChange('address', e.target.value)}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: PARÁMETROS CLÍNICOS & IMC */}
              {activeTab === 'clinical' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Condición Clínica */}
                    <div>
                      <label className="label-text font-semibold">Condición Clínica del Paciente</label>
                      <select 
                        className="input-field mt-1"
                        value={formData.condition}
                        onChange={e => handleInputChange('condition', e.target.value)}
                      >
                        <option value="Estable">Estable</option>
                        <option value="Preoperatorio">Preoperatorio</option>
                        <option value="Postoperatorio">Postoperatorio</option>
                        <option value="En Observación">En Observación</option>
                        <option value="Crítico">Crítico</option>
                        <option value="Alta Médica">Alta Médica</option>
                      </select>
                    </div>

                    {/* Tipo de Sangre */}
                    <div>
                      <label className="label-text font-semibold">Grupo y Factor Sanguíneo</label>
                      <select 
                        className="input-field mt-1 font-bold text-red-700"
                        value={formData.bloodType}
                        onChange={e => handleInputChange('bloodType', e.target.value)}
                      >
                        <option value="O+">O Positivo (O+)</option>
                        <option value="O-">O Negativo (O-)</option>
                        <option value="A+">A Positivo (A+)</option>
                        <option value="A-">A Negativo (A-)</option>
                        <option value="B+">B Positivo (B+)</option>
                        <option value="B-">B Negativo (B-)</option>
                        <option value="AB+">AB Positivo (AB+)</option>
                        <option value="AB-">AB Negativo (AB-)</option>
                        <option value="Desconocido">Desconocido / Pendiente</option>
                      </select>
                    </div>

                    {/* IMC Calculado (Tarjeta de Información) */}
                    <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg flex flex-col justify-center">
                      <span className="text-[11px] font-semibold text-sky-800 flex items-center gap-1">
                        <Scale size={13} /> IMC Calculado (OMS)
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-sky-950">
                          {bmiInfo.bmi || '--'}
                        </span>
                        <span className="text-xs font-bold text-primary">
                          {bmiInfo.category || 'Ingrese peso y altura'}
                        </span>
                      </div>
                    </div>

                    {/* Peso */}
                    <div>
                      <label className="label-text font-semibold">Peso Corporal (kg)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="input-field mt-1"
                        placeholder="Ej: 95.5"
                        value={formData.weight}
                        onChange={e => handleInputChange('weight', e.target.value)}
                      />
                    </div>

                    {/* Altura */}
                    <div>
                      <label className="label-text font-semibold">Estatura (cm)</label>
                      <input 
                        type="number" 
                        step="1"
                        className="input-field mt-1"
                        placeholder="Ej: 168"
                        value={formData.height}
                        onChange={e => handleInputChange('height', e.target.value)}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: ANTECEDENTES Y MOTIVO DE CONSULTA */}
              {activeTab === 'history' && (
                <div className="space-y-5 animate-in fade-in">
                  
                  {/* Motivo de Consulta */}
                  <div>
                    <label className="label-text font-semibold">
                      Motivo de Consulta y Resumen de Caso
                    </label>
                    <textarea 
                      rows={3}
                      className="input-field mt-1"
                      placeholder="Describa el motivo principal de la consulta médica, sintomatología y evolución..."
                      value={formData.consultationReason}
                      onChange={e => handleInputChange('consultationReason', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Alergias */}
                    <div>
                      <label className="label-text font-semibold text-red-700 flex items-center gap-1.5">
                        <ShieldAlert size={15} /> Alergias Conocidas (Fármacos / Alimentos)
                      </label>
                      <input 
                        type="text" 
                        className="input-field mt-1 border-red-200 focus:border-red-500"
                        placeholder="Ej: Penicilina, AINEs, Mariscos (o 'Ninguna')"
                        value={formData.allergies}
                        onChange={e => handleInputChange('allergies', e.target.value)}
                      />
                    </div>

                    {/* ETS / ITS */}
                    <div>
                      <label className="label-text font-semibold">
                        Antecedentes de ETS / ITS
                      </label>
                      <input 
                        type="text" 
                        className="input-field mt-1"
                        placeholder="Ej: Negativo / No refiere, VPH, etc."
                        value={formData.stds}
                        onChange={e => handleInputChange('stds', e.target.value)}
                      />
                    </div>

                    {/* Enfermedades Crónicas */}
                    <div>
                      <label className="label-text font-semibold">
                        Enfermedades Crónicas / Comorbilidades
                      </label>
                      <textarea 
                        rows={2}
                        className="input-field mt-1"
                        placeholder="Ej: Hipertensión Arterial, Diabetes Mellitus 2, Dislipidemia..."
                        value={formData.chronicDiseases}
                        onChange={e => handleInputChange('chronicDiseases', e.target.value)}
                      />
                    </div>

                    {/* Antecedentes Quirúrgicos */}
                    <div>
                      <label className="label-text font-semibold">
                        Antecedentes Quirúrgicos Previos
                      </label>
                      <textarea 
                        rows={2}
                        className="input-field mt-1"
                        placeholder="Ej: Colecistectomía (2020), Cesárea (2018)..."
                        value={formData.surgicalHistory}
                        onChange={e => handleInputChange('surgicalHistory', e.target.value)}
                      />
                    </div>

                    {/* Medicamentos Actuales */}
                    <div className="md:col-span-2">
                      <label className="label-text font-semibold">
                        Medicamentos Habituales y Posología
                      </label>
                      <input 
                        type="text" 
                        className="input-field mt-1"
                        placeholder="Ej: Losartán 50mg VO c/24h, Metformina 850mg VO c/12h..."
                        value={formData.currentMedications}
                        onChange={e => handleInputChange('currentMedications', e.target.value)}
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: CONTACTO DE EMERGENCIA */}
              {activeTab === 'emergency' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Phone size={16} className="text-primary" /> Persona de Contacto en Caso de Emergencia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label-text">Nombre Completo</label>
                        <input 
                          type="text" 
                          className="input-field mt-1"
                          placeholder="Nombre del familiar o tutor"
                          value={formData.emergencyContactName}
                          onChange={e => handleInputChange('emergencyContactName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-text">Parentesco / Relación</label>
                        <input 
                          type="text" 
                          className="input-field mt-1"
                          placeholder="Ej: Cónyuge, Madre, Hijo(a)"
                          value={formData.emergencyContactRelation}
                          onChange={e => handleInputChange('emergencyContactRelation', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-text">Teléfono de Emergencia</label>
                        <input 
                          type="tel" 
                          className="input-field mt-1"
                          placeholder="+58 412 0000000"
                          value={formData.emergencyContactPhone}
                          onChange={e => handleInputChange('emergencyContactPhone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary px-5"
                >
                  Cancelar
                </button>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn btn-primary flex items-center gap-2 px-6 py-2.5 shadow hover:shadow-md transition-all font-semibold disabled:opacity-50"
                  >
                    <Save size={18} />
                    <span>{isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Historia' : 'Guardar Historia'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER HISTORIA CLÍNICA COMPLETA */}
      {/* ========================================================================= */}
      {isViewModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-primary text-white text-xs px-2.5 py-0.5 rounded">
                    {selectedPatient.historyNumber}
                  </span>
                  <h2 className="text-lg font-bold">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Historia Clínica Electrónica • Registrado el {formatDateTime(selectedPatient.createdAt)}
                </p>
              </div>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              
              {/* Demográficos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-gray-500 block">Edad:</span>
                  <strong className="text-gray-900">{selectedPatient.age} años</strong>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Género:</span>
                  <strong className="text-gray-900">
                    {selectedPatient.gender === 'female' || selectedPatient.gender === 'Femenino' || selectedPatient.sex === 'F' 
                      ? 'Femenino' 
                      : selectedPatient.gender === 'male' || selectedPatient.gender === 'Masculino' || selectedPatient.sex === 'M'
                        ? 'Masculino' 
                        : (selectedPatient.gender || selectedPatient.sex || 'Otro')}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Tipo Sangre:</span>
                  <strong className="text-red-700">{selectedPatient.bloodType || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Condición:</span>
                  <span className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold border", getConditionBadge(selectedPatient.condition))}>
                    {selectedPatient.condition}
                  </span>
                </div>
              </div>

              {/* Antropometría / IMC */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl">
                <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Scale size={14} /> Antropometría Bariátrica
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block">Peso:</span>
                    <strong className="text-gray-800">{selectedPatient.weight ? `${selectedPatient.weight} kg` : 'No registrado'}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Estatura:</span>
                    <strong className="text-gray-800">{selectedPatient.height ? `${selectedPatient.height} cm` : 'No registrada'}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">IMC:</span>
                    <strong className="text-primary">{selectedPatient.bmi ? `${selectedPatient.bmi} kg/m²` : 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Motivo & Alergias */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Motivo de Consulta</h4>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {selectedPatient.consultationReason || 'Sin motivo detallado registrado.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ShieldAlert size={13} /> Alergias
                    </h4>
                    <p className="text-gray-800 bg-red-50/50 p-3 rounded-lg border border-red-200">
                      {selectedPatient.allergies || 'Ninguna conocida'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ETS / ITS</h4>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {selectedPatient.stds || 'Negativo / No refiere'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Enfermedades Crónicas</h4>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {selectedPatient.chronicDiseases || 'Ninguna registrada'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Antecedentes Quirúrgicos</h4>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {selectedPatient.surgicalHistory || 'Ninguno registrado'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Medicamentos Actuales</h4>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {selectedPatient.currentMedications || 'Ninguno'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contacto de Emergencia</h4>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {selectedPatient.emergencyContactName ? (
                      <span>
                        <strong>{selectedPatient.emergencyContactName}</strong> ({selectedPatient.emergencyContactRelation || 'Familiar'}) — Tel: {selectedPatient.emergencyContactPhone || 'Sin teléfono'}
                      </span>
                    ) : (
                      'No registrado'
                    )}
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEdit(selectedPatient);
                }}
                className="btn btn-secondary flex items-center gap-1.5 text-xs"
              >
                <Edit size={14} /> Editar Historia
              </button>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-primary px-5 text-xs"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
