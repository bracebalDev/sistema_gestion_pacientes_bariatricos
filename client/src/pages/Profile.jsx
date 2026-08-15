import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Save } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Perfil del Médico</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-8">
            <div className="w-32 h-32 rounded-full bg-primary text-white flex items-center justify-center text-5xl font-bold shrink-0">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">Dr. {user?.firstName} {user?.lastName}</h2>
              <p className="text-gray-500 mb-4">Cirugía Bariátrica</p>
              <button className="btn btn-outline text-sm">Cambiar Fotografía</button>
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-text flex items-center gap-2"><User size={16} /> Nombres</label>
                <input type="text" className="input-field" defaultValue={user?.firstName} />
              </div>
              <div>
                <label className="label-text flex items-center gap-2"><User size={16} /> Apellidos</label>
                <input type="text" className="input-field" defaultValue={user?.lastName} />
              </div>
              <div>
                <label className="label-text flex items-center gap-2"><Mail size={16} /> Correo Electrónico</label>
                <input type="email" className="input-field bg-gray-50 cursor-not-allowed" defaultValue={user?.email} disabled />
              </div>
              <div>
                <label className="label-text flex items-center gap-2"><Shield size={16} /> Especialidad</label>
                <input type="text" className="input-field" defaultValue="Cirugía Bariátrica" />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Cambiar Contraseña</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="label-text">Contraseña Actual</label>
                  <input type="password" className="input-field" />
                </div>
                <div>
                  <label className="label-text">Nueva Contraseña</label>
                  <input type="password" className="input-field" />
                </div>
                <div>
                  <label className="label-text">Confirmar Contraseña</label>
                  <input type="password" className="input-field" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="button" className="btn btn-primary flex items-center gap-2">
                <Save size={18} /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
