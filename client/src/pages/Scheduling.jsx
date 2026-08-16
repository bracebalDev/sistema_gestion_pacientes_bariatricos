import React, { useState, useMemo, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, List, Calendar as CalendarIcon, Download, Search, Filter, 
  Clock, MapPin, User, FileText, CheckCircle2, AlertTriangle, X, Save, 
  Sparkles, Stethoscope, Scissors, Printer, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Activity
} from 'lucide-react';
import clsx from 'clsx';

// Initial state for new appointment form
const getInitialAppointmentState = (defaultDate = '') => ({
  historyNumber: '',
  patientId: '',
  firstName: '',
  lastName: '',
  age: '',
  gender: 'Masculino',
  consultationReason: '',
  type: 'consultation', // 'consultation' | 'surgery_high' | 'surgery_ambulatory'
  date: defaultDate || new Date().toISOString().split('T')[0],
  startTime: '08:30',
  endTime: '09:15',
  room: 'Consultorio 1 - Evaluación Bariátrica Inicial',
  status: 'scheduled', // 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes: ''
});

export default function Scheduling() {
  const { data: appointments, loading: loadingAppts, add: addAppt, update: updateAppt, remove: removeAppt } = useApi('appointments');
  const { data: patients } = useApi('patients');
  const { data: rooms } = useApi('rooms');
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'consultation' | 'surgery'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [formData, setFormData] = useState(getInitialAppointmentState(selectedDate));
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autocompleteMatch, setAutocompleteMatch] = useState(null);

  // Group rooms by category
  const highEndORs = useMemo(() => rooms.filter(r => r.type === 'operating_high'), [rooms]);
  const ambulatoryORs = useMemo(() => rooms.filter(r => r.type === 'operating_ambulatory'), [rooms]);
  const consultRooms = useMemo(() => rooms.filter(r => r.type === 'consultation'), [rooms]);

  // Compatible rooms based on the selected appointment type
  const compatibleRooms = useMemo(() => {
    if (formData.type === 'surgery_high') {
      return highEndORs.length > 0 ? highEndORs : [
        { id: 'q-1', name: 'Quirófano 1 - Cirugía Bariátrica & Metabólica Avanzada' },
        { id: 'q-2', name: 'Quirófano 2 - Laparoscopía 4K & Cirugía Robótica' },
        { id: 'q-3', name: 'Quirófano 3 - Bypass Gástrico & Revisión Compleja' },
        { id: 'q-4', name: 'Quirófano 4 - Cirugía Bariátrica Mayor & Hernioplastia' },
        { id: 'q-5', name: 'Quirófano 5 - Procedimientos Bariátricos Multiparámetro' },
        { id: 'q-6', name: 'Quirófano 6 - Cirugía Digestiva & Metabólica Mayor' }
      ];
    }
    if (formData.type === 'surgery_ambulatory') {
      return ambulatoryORs.length > 0 ? ambulatoryORs : [
        { id: 'qa-1', name: 'Quirófano Ambulatorio A - Endoscopía Bariátrica & Balón' },
        { id: 'qa-2', name: 'Quirófano Ambulatorio B - Procedimientos Menores & Curas' },
        { id: 'qa-3', name: 'Quirófano Ambulatorio C - Cirugía Ambulatoria de Corta Estancia' }
      ];
    }
    // Consultation
    return consultRooms.length > 0 ? consultRooms : [
      { id: 'c-1', name: 'Consultorio 1 - Evaluación Bariátrica Inicial' },
      { id: 'c-2', name: 'Consultorio 2 - Nutrición Clínica & Metabolismo' },
      { id: 'c-3', name: 'Consultorio 3 - Psicología Bariátrica & Conductual' },
      { id: 'c-4', name: 'Consultorio 4 - Control & Seguimiento Postoperatorio' },
      { id: 'c-5', name: 'Consultorio 5 - Medicina Interna & Riesgo Quirúrgico' },
      { id: 'c-6', name: 'Consultorio 6 - Consulta Quirúrgica Bariátrica' },
      { id: 'c-7', name: 'Consultorio 7 - Gastroenterología & Endoscopía' },
      { id: 'c-8', name: 'Consultorio 8 - Consulta de Chequeo & Revaloración' }
    ];
  }, [formData.type, highEndORs, ambulatoryORs, consultRooms]);

  // Handle appointment type change and auto-select compatible space
  const handleTypeChange = (newType) => {
    let targetRooms = [];
    if (newType === 'surgery_high') targetRooms = highEndORs;
    else if (newType === 'surgery_ambulatory') targetRooms = ambulatoryORs;
    else targetRooms = consultRooms;

    const defaultRoom = targetRooms.length > 0 ? targetRooms[0].name : '';
    setFormData(prev => ({
      ...prev,
      type: newType,
      room: defaultRoom
    }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedAppt(null);
    const initial = getInitialAppointmentState(selectedDate);
    if (consultRooms.length > 0) {
      initial.room = consultRooms[0].name;
    }
    setFormData(initial);
    setAutocompleteMatch(null);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (appt) => {
    setIsEditing(true);
    setSelectedAppt(appt);
    setFormData({
      ...getInitialAppointmentState(),
      ...appt,
      type: appt.type === 'surgery' ? 'surgery_high' : appt.type
    });
    setAutocompleteMatch(null);
    setFormError('');
    setIsModalOpen(true);
  };

  // Autocomplete when History Number changes or matches
  const handleHistoryNumberChange = (value) => {
    const clean = value.toUpperCase().trim();
    setFormData(prev => ({ ...prev, historyNumber: clean }));

    if (clean.length >= 3) {
      const match = patients.find(p => (p.historyNumber || '').toUpperCase() === clean);
      if (match) {
        setAutocompleteMatch(match);
        setFormData(prev => ({
          ...prev,
          historyNumber: clean,
          patientId: match.id,
          firstName: match.firstName || prev.firstName,
          lastName: match.lastName || prev.lastName,
          age: match.age || prev.age,
          gender: match.gender || (match.sex === 'F' ? 'Femenino' : 'Masculino'),
          consultationReason: prev.consultationReason || match.consultationReason || ''
        }));
        return;
      }
    }
    setAutocompleteMatch(null);
  };

  // Select patient directly from quick suggestions
  const handleSelectPatientSuggestion = (p) => {
    setAutocompleteMatch(p);
    setFormData(prev => ({
      ...prev,
      historyNumber: p.historyNumber,
      patientId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      age: p.age,
      gender: p.gender || (p.sex === 'F' ? 'Femenino' : 'Masculino'),
      consultationReason: prev.consultationReason || p.consultationReason || ''
    }));
  };

  // Submit appointment with strict anti-overlap validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Los Nombres y Apellidos del paciente son obligatorios.');
      return;
    }
    if (!formData.date || !formData.startTime || !formData.endTime) {
      setFormError('La fecha y el horario de inicio y fin son obligatorios.');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setFormError('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    // STRICT ANTI-OVERLAP VALIDATION: Same space + same date
    const overlapConflict = appointments.find(a => {
      // Ignore same appointment if editing
      if (isEditing && selectedAppt && a.id === selectedAppt.id) return false;
      // Must be same date and same room
      if (a.date !== formData.date || a.room !== formData.room) return false;
      // Ignore cancelled appointments
      if (a.status === 'cancelled') return false;
      
      // Interval collision: (StartA < EndB) and (EndA > StartB)
      return formData.startTime < a.endTime && formData.endTime > a.startTime;
    });

    if (overlapConflict) {
      setFormError(
        `¡Conflicto de Horario / Espacio Clínico!: El espacio "${formData.room}" ya se encuentra reservado el día ${formData.date} en el horario ${overlapConflict.startTime} - ${overlapConflict.endTime} (${overlapConflict.doctorName || 'Dr. Especialista'} • Paciente: ${overlapConflict.firstName} ${overlapConflict.lastName}). Por favor seleccione otro horario o espacio disponible.`
      );
      return;
    }

    setIsSubmitting(true);

    const doctorPrefix = user?.gender === 'female' ? 'Dra.' : 'Dr.';
    const currentDoctorName = user ? `${doctorPrefix} ${user.firstName} ${user.lastName}` : 'Dr. Carlos Mendoza';

    try {
      if (isEditing && selectedAppt) {
        await updateAppt(selectedAppt.id, {
          ...formData,
          doctorId: selectedAppt.doctorId || user?.id || 'doc-1',
          doctorName: selectedAppt.doctorName || currentDoctorName,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addAppt({
          ...formData,
          doctorId: user?.id || 'doc-1',
          doctorName: currentDoctorName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Error al guardar la cita: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete appointment
  const handleDelete = async (id, patientName) => {
    if (window.confirm(`¿Está seguro de cancelar/eliminar la cita de "${patientName}"?`)) {
      try {
        await removeAppt(id);
      } catch (err) {
        alert('Error al eliminar cita: ' + err.message);
      }
    }
  };

  // Change appointment status quick action
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateAppt(id, { status: newStatus });
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        const matchesDate = !selectedDate || a.date === selectedDate;
        const isSurgery = a.type === 'surgery' || a.type === 'surgery_high' || a.type === 'surgery_ambulatory';
        const matchesType = filterType === 'all' || 
          (filterType === 'consultation' && a.type === 'consultation') ||
          (filterType === 'surgery' && isSurgery);

        const search = searchTerm.toLowerCase().trim();
        const matchesSearch = !search || 
          `${a.firstName} ${a.lastName} ${a.historyNumber || ''} ${a.room || ''} ${a.doctorName || ''} ${a.consultationReason || ''}`.toLowerCase().includes(search);
        
        return matchesDate && matchesType && matchesSearch;
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [appointments, selectedDate, filterType, searchTerm]);

  // Appointments for the selected day (for the daily report)
  const dayAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [appointments, selectedDate]);

  // Helper to escape HTML characters and prevent XSS injections in printable documents
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Generate International Medical Report PDF in a separate tab
  const handleDownloadDailyReportPdf = () => {
    const doctorPrefix = user?.gender === 'female' ? 'Dra.' : 'Dr.';
    const doctorName = escapeHtml(user ? `${doctorPrefix} ${user.firstName} ${user.lastName}` : 'Dr. Especialista UCIBAM');
    const doctorSpecialty = escapeHtml(user?.specialty || 'Cirugía Bariátrica y Metabólica');
    
    const formattedDate = escapeHtml(new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }));

    const totalAppts = dayAppointments.length;
    const totalConsultations = dayAppointments.filter(a => a.type === 'consultation').length;
    const totalSurgeries = dayAppointments.filter(a => a.type !== 'consultation').length;

    // Create table rows for the required columns: Fecha/Hora, Nombres, Apellidos, Espacio
    const tableRows = dayAppointments.length === 0 ? `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px; color: #64748b; font-style: italic;">
          No hay consultas ni procedimientos quirúrgicos programados para esta fecha.
        </td>
      </tr>
    ` : dayAppointments.map((a, idx) => {
      const isSurgery = a.type === 'surgery_high' || a.type === 'surgery_ambulatory' || a.type === 'surgery';
      const typeLabel = a.type === 'surgery_high' ? 'Cirugía Alta Gama' : a.type === 'surgery_ambulatory' ? 'Proc. Ambulatorio' : isSurgery ? 'Cirugía' : 'Consulta';
      return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 14px; font-weight: 700; color: #0f172a; font-family: monospace; font-size: 13px;">
            ${escapeHtml(a.startTime)} - ${escapeHtml(a.endTime)}
          </td>
          <td style="padding: 12px 14px; font-weight: 600; color: #1e293b;">
            ${escapeHtml(a.firstName)}
          </td>
          <td style="padding: 12px 14px; font-weight: 600; color: #1e293b;">
            ${escapeHtml(a.lastName)}
          </td>
          <td style="padding: 12px 14px; color: #334155; font-size: 12px;">
            <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
              ${escapeHtml(a.room || 'No asignado')}
            </span>
          </td>
          <td style="padding: 12px 14px; text-align: center;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: ${isSurgery ? '#f3e8ff' : '#e0f2fe'}; color: ${isSurgery ? '#7e22ce' : '#0284c7'};">
              ${escapeHtml(typeLabel)}
            </span>
          </td>
          <td style="padding: 12px 14px; color: #475569; font-size: 12px;">
            ${escapeHtml(a.consultationReason || a.notes || '—')}
          </td>
        </tr>
      `;
    }).join('');

    const reportHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte Diario de Programación Clínica - UCIBAM (${selectedDate})</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            line-height: 1.4;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #00A3E0;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 900;
            color: #00A3E0;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .report-badge {
            text-align: right;
          }
          .badge-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          }
          .badge-date {
            font-size: 12px;
            color: #64748b;
          }
          .meta-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 12px;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .stat-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            text-align: center;
          }
          .stat-val {
            font-size: 20px;
            font-weight: 800;
            color: #00A3E0;
          }
          .stat-lbl {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 12px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            text-align: left;
            padding: 10px 14px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #cbd5e1;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .signature-box {
            text-align: center;
            width: 240px;
          }
          .sign-line {
            border-top: 1px solid #0f172a;
            margin-bottom: 6px;
          }
          .disclaimer {
            font-size: 9px;
            color: #94a3b8;
            max-width: 320px;
            line-height: 1.3;
          }
          .no-print-bar {
            background: #0f172a;
            color: #ffffff;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: -20px -20px 20px -20px;
          }
          .print-btn {
            background: #00A3E0;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            font-size: 13px;
          }
          @media print {
            .no-print-bar {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        
        <div class="no-print-bar">
          <div>
            <strong>Reporte Médico Generado</strong> • Vista previa para imprimir o guardar como PDF
          </div>
          <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
        </div>

        <div class="header">
          <div>
            <div class="brand-title">UCIBAM</div>
            <div class="brand-sub">Unidad de Cirugía Bariátrica y Metabólica</div>
          </div>
          <div class="report-badge">
            <div class="badge-title">PROGRAMACIÓN CLÍNICA DIARIA</div>
            <div class="badge-date">Fecha: ${formattedDate}</div>
          </div>
        </div>

        <div class="meta-box">
          <div>
            <strong>Especialista Tratante:</strong> ${doctorName}<br>
            <strong>Especialidad:</strong> ${doctorSpecialty}
          </div>
          <div>
            <strong>Institución:</strong> Clínica UCIBAM - Quirófanos & Consultorios<br>
            <strong>Emisión:</strong> ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div class="summary-cards">
          <div class="stat-card">
            <div class="stat-val">${totalAppts}</div>
            <div class="stat-lbl">Total Actividades</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${totalConsultations}</div>
            <div class="stat-lbl">Consultas Médicas</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #9333ea;">${totalSurgeries}</div>
            <div class="stat-lbl">Cirugías Programadas</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 14%;">Fecha / Hora</th>
              <th style="width: 18%;">Nombres</th>
              <th style="width: 18%;">Apellidos</th>
              <th style="width: 24%;">Espacio Asignado</th>
              <th style="width: 12%; text-align: center;">Tipo</th>
              <th style="width: 14%;">Motivo / Detalle</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <div class="disclaimer">
            <strong>DOCUMENTO MÉDICO CONFIDENCIAL:</strong> La información contenida en este reporte es de carácter privado y de uso exclusivo para el personal médico autorizado de UCIBAM bajo estándares internacionales de protección de datos clínicos (EHR / HIPAA).
          </div>
          <div class="signature-box">
            <div class="sign-line"></div>
            <strong style="font-size: 11px;">${doctorName}</strong><br>
            <span style="font-size: 10px; color: #64748b;">Firma y Sello del Especialista</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(reportHtml);
      printWindow.document.close();
    } else {
      alert('Por favor habilite las ventanas emergentes (pop-ups) en su navegador para abrir el reporte en PDF.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda de Consultas y Cirugías</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Programación quirúrgica en quirófanos y consultas médicas en consultorios
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Download Daily Report in PDF */}
          <button 
            onClick={handleDownloadDailyReportPdf}
            className="btn btn-secondary flex items-center gap-2 text-sm font-semibold shadow-xs hover:border-primary hover:text-primary transition-colors"
            title="Descargar reporte médico del día en PDF en una pestaña aparte"
          >
            <Download size={16} />
            <span>Descargar Reporte Diario (PDF)</span>
          </button>

          {/* New Appointment Button */}
          <button 
            onClick={handleOpenCreate}
            className="btn btn-primary flex items-center gap-2 px-4 py-2 shadow-xs"
          >
            <Plus size={18} />
            <span className="font-semibold">Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Filter and Date Selection Card */}
      <div className="card p-4 shadow-sm border border-gray-200/80 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Date Picker & Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha:</span>
            <input 
              type="date" 
              className="input-field py-1.5 px-3 text-sm w-auto font-medium"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs font-semibold text-primary hover:underline px-2 py-1 bg-sky-50 rounded"
            >
              Hoy
            </button>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setFilterType('all')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                filterType === 'all' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              Todos ({appointments.filter(a => !selectedDate || a.date === selectedDate).length})
            </button>
            <button 
              onClick={() => setFilterType('consultation')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5",
                filterType === 'consultation' ? "bg-sky-600 text-white border-sky-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              <Stethoscope size={13} /> Consultas
            </button>
            <button 
              onClick={() => setFilterType('surgery')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5",
                filterType === 'surgery' ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              <Scissors size={13} /> Cirugías & Proc.
            </button>
          </div>

          {/* Search bar in agenda */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por paciente, espacio, doctor..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Main Content: Appointments List */}
      <div className="card shadow-sm border border-gray-200/80">
        <div className="card-header bg-gray-50/70 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-primary" />
            <span className="font-bold text-gray-800 text-sm">
              Programación para {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {filteredAppointments.length} actividad(es) agendada(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha / Hora</th>
                <th className="p-4 font-semibold">Nombres</th>
                <th className="p-4 font-semibold">Apellidos</th>
                <th className="p-4 font-semibold">Espacio Asignado</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Doctor Responsable</th>
                <th className="p-4 font-semibold">Motivo / Indicación</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loadingAppts ? (
                <tr>
                  <td colSpan="9" className="p-10 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></div>
                    <p>Cargando agenda...</p>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-gray-500">
                    <CalendarIcon size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700">No hay citas ni cirugías programadas para este día</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Haga clic en "Nueva Cita" para programar una consulta o cirugía.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(a => {
                  const isHighSurgery = a.type === 'surgery_high';
                  const isAmbulatory = a.type === 'surgery_ambulatory';
                  const isSurgery = isHighSurgery || isAmbulatory || a.type === 'surgery';

                  return (
                    <tr key={a.id} className="hover:bg-sky-50/30 transition-colors group">
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5 font-mono text-xs">
                          <Clock size={13} className="text-primary" />
                          <span>{a.startTime} - {a.endTime}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{a.date}</div>
                      </td>

                      <td className="p-4 font-semibold text-gray-900">
                        {a.firstName}
                      </td>

                      <td className="p-4 font-semibold text-gray-900">
                        {a.lastName}
                        {a.historyNumber && (
                          <span className="block text-[10px] font-mono text-gray-400">
                            #{a.historyNumber}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <MapPin size={13} className="text-gray-400 shrink-0" />
                          <span className="font-medium">{a.room || 'Sin espacio asignado'}</span>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1",
                          isHighSurgery ? 'bg-purple-100 text-purple-800' :
                          isAmbulatory ? 'bg-indigo-100 text-indigo-800' :
                          isSurgery ? 'bg-purple-100 text-purple-800' :
                          'bg-sky-100 text-sky-800'
                        )}>
                          {isSurgery ? <Scissors size={12} /> : <Stethoscope size={12} />}
                          {isHighSurgery ? 'Cirugía Alta Gama' : isAmbulatory ? 'Proc. Ambulatorio' : isSurgery ? 'Cirugía' : 'Consulta'}
                        </span>
                      </td>

                      <td className="p-4 text-xs font-medium text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-primary">
                          <User size={12} />
                          <span>{a.doctorName || 'Dr. Carlos Mendoza'}</span>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-gray-600 max-w-xs truncate">
                        {a.consultationReason || <span className="text-gray-400 italic">No especificado</span>}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <select 
                          value={a.status || 'scheduled'}
                          onChange={e => handleStatusChange(a.id, e.target.value)}
                          className={clsx(
                            "text-xs font-bold py-1 px-2 rounded-md border focus:outline-none cursor-pointer",
                            a.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                            a.status === 'in_progress' ? "bg-amber-50 text-amber-700 border-amber-300" :
                            a.status === 'completed' ? "bg-blue-50 text-blue-700 border-blue-300" :
                            a.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-300" :
                            "bg-gray-50 text-gray-700 border-gray-300"
                          )}
                        >
                          <option value="scheduled">Programada</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="in_progress">En Curso</option>
                          <option value="completed">Completada</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleOpenEdit(a)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Editar Cita"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(a.id, `${a.firstName} ${a.lastName}`)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar Cita"
                          >
                            <Trash2 size={16} />
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
      {/* MODAL: REGISTRO / EDICIÓN DE CITA (CON MATCH DE ESPACIOS Y ANTI-SOLAPAMIENTO) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  {isEditing ? 'Editar Cita Médica / Cirugía' : 'Agendar Nueva Cita / Cirugía'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  UCIBAM • Gestión de Agenda, Quirófanos y Consultorios
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Banner (Overlapping and missing fields) */}
            {formError && (
              <div className="mx-6 mt-4 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r text-red-800 text-xs font-medium flex items-start gap-2 shadow-xs">
                <AlertTriangle size={18} className="shrink-0 text-red-600 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              
              {/* Sección 1: Búsqueda y Autocompletado por Historia */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" /> # Historia Clínica (Autocompletar Paciente)
                  </label>
                  <span className="text-[11px] text-gray-500">Opcional si es paciente nuevo</span>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Escriba el # de historia (ej: UB1024) para autocompletar..."
                    className="input-field bg-white font-mono uppercase font-bold text-sm tracking-wider"
                    value={formData.historyNumber}
                    onChange={e => handleHistoryNumberChange(e.target.value)}
                  />
                </div>

                {/* Match Notification */}
                {autocompleteMatch ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      ¡Paciente encontrado! Datos de <strong>{autocompleteMatch.firstName} {autocompleteMatch.lastName}</strong> autocompletados correctamente.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-gray-500">Sugerencias rápidas:</span>
                    {patients.slice(0, 3).map(p => (
                      <button 
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatientSuggestion(p)}
                        className="text-[11px] bg-white border border-sky-200 hover:border-primary text-sky-800 px-2 py-0.5 rounded-md font-medium transition-colors"
                      >
                        {p.historyNumber}: {p.firstName} {p.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección 2: Datos del Paciente (Nombres, Apellidos, Edad, Género) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text font-semibold">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input-field mt-1"
                    placeholder="Nombres del paciente"
                    value={formData.firstName}
                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="label-text font-semibold">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input-field mt-1"
                    placeholder="Apellidos del paciente"
                    value={formData.lastName}
                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="label-text font-semibold">Edad (Años)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={120}
                    className="input-field mt-1"
                    placeholder="Ej: 35"
                    value={formData.age}
                    onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>

                {/* Unificado a Género */}
                <div>
                  <label className="label-text font-semibold">Género</label>
                  <select 
                    className="input-field mt-1"
                    value={formData.gender}
                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Sección 3: Motivo de Consulta */}
              <div>
                <label className="label-text font-semibold">
                  Motivo de Consulta / Indicación Quirúrgica
                </label>
                <input 
                  type="text" 
                  className="input-field mt-1"
                  placeholder="Ej: Revisión, precirugía, control postoperatorio, Manga Gástrica... (Dejar en blanco si no se sabe)"
                  value={formData.consultationReason}
                  onChange={e => setFormData(prev => ({ ...prev, consultationReason: e.target.value }))}
                />
              </div>

              {/* Sección 4: Tipo de Cita y Espacio Adaptado (Match dinámico de espacios) */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text font-semibold text-primary">
                      Tipo de Cita <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="input-field mt-1 font-bold text-gray-900 border-primary/50"
                      value={formData.type}
                      onChange={e => handleTypeChange(e.target.value)}
                    >
                      <option value="consultation">Consulta Médica Ambulatoria (Consultorios)</option>
                      <option value="surgery_high">Cirugía de Media-Alta Dificultad (Quirófanos Alta Gama)</option>
                      <option value="surgery_ambulatory">Procedimiento Ambulatorio / Menor (Quirófanos Ambulatorios)</option>
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1">
                      * Filtra automáticamente los espacios clínicos idóneos para este procedimiento.
                    </p>
                  </div>

                  <div>
                    <label className="label-text font-semibold flex items-center justify-between">
                      <span>Espacio Idóneo Asignado <span className="text-red-500">*</span></span>
                      <span className="text-[11px] text-purple-600 font-bold">
                        {compatibleRooms.length} espacio(s) disponible(s)
                      </span>
                    </label>
                    <select 
                      className="input-field mt-1"
                      value={formData.room}
                      onChange={e => setFormData(prev => ({ ...prev, room: e.target.value }))}
                      required
                    >
                      {compatibleRooms.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label-text font-semibold">Fecha <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="input-field mt-1 font-medium"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="label-text font-semibold">Hora Inicio <span className="text-red-500">*</span></label>
                    <input 
                      type="time" 
                      className="input-field mt-1 font-mono font-medium"
                      value={formData.startTime}
                      onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="label-text font-semibold">Hora Fin <span className="text-red-500">*</span></label>
                    <input 
                      type="time" 
                      className="input-field mt-1 font-mono font-medium"
                      value={formData.endTime}
                      onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary px-5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn btn-primary flex items-center gap-2 px-6 py-2.5 shadow hover:shadow-md font-semibold disabled:opacity-50"
                >
                  <Save size={18} />
                  <span>{isSubmitting ? 'Verificando y Guardando...' : isEditing ? 'Actualizar Cita' : 'Agendar Cita'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
