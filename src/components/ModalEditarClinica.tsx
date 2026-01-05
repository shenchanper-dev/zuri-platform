"use client";

import { useState, useEffect } from 'react';

interface ModalEditarClinicaProps {
  clinica: any;
  onClose: () => void;
  onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
}

export default function ModalEditarClinica({ clinica, onClose, onSave }: ModalEditarClinicaProps) {
  const [editando, setEditando] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clinica) {
      setEditando({
        id: clinica.id,
        nombre: clinica.nombre || '',
        tipo: clinica.tipo || 'CLINICA_PRIVADA',
        direccion: clinica.direccion || '',
        latitud: clinica.latitud || 0,
        longitud: clinica.longitud || 0,
        telefono: clinica.telefono || '',
        email: clinica.email || '',
        estado: clinica.estado || 'ACTIVA',
        seguros_aceptados: clinica.seguros_aceptados || '',
        atiende_24_horas: clinica.atiende_24_horas || false,
        tiene_emergencia: clinica.tiene_emergencia || false,
        tiene_uci: clinica.tiene_uci || false
      });
    } else {
      // Nueva clínica
      setEditando({
        nombre: '',
        tipo: 'CLINICA_PRIVADA',
        direccion: '',
        latitud: 0,
        longitud: 0,
        telefono: '',
        email: '',
        estado: 'ACTIVA',
        seguros_aceptados: '',
        atiende_24_horas: false,
        tiene_emergencia: false,
        tiene_uci: false
      });
    }
  }, [clinica]);

  const handleGuardar = async () => {
    if (!editando.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }
    if (!editando.direccion.trim()) {
      alert('La dirección es requerida');
      return;
    }

    setLoading(true);
    const result = await onSave(editando);
    
    if (result.success) {
      onClose();
    } else {
      alert(`Error: ${result.error}`);
    }
    setLoading(false);
  };

  if (!editando) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {clinica ? `Editar Clínica - ${clinica.nombre}` : 'Nueva Clínica'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Información básica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input 
              type="text" 
              value={editando.nombre} 
              onChange={e => setEditando({...editando, nombre: e.target.value})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Nombre de la clínica"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              value={editando.tipo} 
              onChange={e => setEditando({...editando, tipo: e.target.value})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CLINICA_PRIVADA">Clínica Privada</option>
              <option value="HOSPITAL_PUBLICO">Hospital Público</option>
              <option value="CENTRO_SALUD">Centro de Salud</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
            <input 
              type="text" 
              value={editando.direccion} 
              onChange={e => setEditando({...editando, direccion: e.target.value})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitud *</label>
            <input 
              type="number" 
              step="any"
              value={editando.latitud} 
              onChange={e => setEditando({...editando, latitud: parseFloat(e.target.value) || 0})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="-12.0464"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitud *</label>
            <input 
              type="number" 
              step="any"
              value={editando.longitud} 
              onChange={e => setEditando({...editando, longitud: parseFloat(e.target.value) || 0})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="-77.0428"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input 
              type="tel" 
              value={editando.telefono} 
              onChange={e => setEditando({...editando, telefono: e.target.value})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="01-234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={editando.email} 
              onChange={e => setEditando({...editando, email: e.target.value})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="contacto@clinica.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select 
              value={editando.estado} 
              onChange={e => setEditando({...editando, estado: e.target.value})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ACTIVA">Activa</option>
              <option value="INACTIVA">Inactiva</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seguros Aceptados</label>
            <input 
              type="text" 
              value={editando.seguros_aceptados} 
              onChange={e => setEditando({...editando, seguros_aceptados: e.target.value})} 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="SIS, EsSalud, Particular"
            />
          </div>

          {/* Servicios disponibles */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Disponibles</label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center space-x-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={editando.atiende_24_horas} 
                  onChange={e => setEditando({...editando, atiende_24_horas: e.target.checked})} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Atención 24H</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={editando.tiene_emergencia} 
                  onChange={e => setEditando({...editando, tiene_emergencia: e.target.checked})} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Emergencias</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={editando.tiene_uci} 
                  onChange={e => setEditando({...editando, tiene_uci: e.target.checked})} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>UCI</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            onClick={handleGuardar} 
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
