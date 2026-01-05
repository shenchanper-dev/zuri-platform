import React, { useState, useEffect, useCallback } from 'react';
import useConductores from '@/hooks/useConductores';
import ConductorForm from './ConductorForm'; // Importamos el formulario que creamos
import { Conductor } from '@/domain/entities/Conductor.entity';

// Reutilizamos el SafeConductorCard pero le añadimos el prop onEdit
const SafeConductorCard = ({ 
  conductor, 
  onEdit 
}: { 
  conductor: Conductor; 
  onEdit: (c: Conductor) => void 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800 truncate w-40">
          {conductor.nombreCompleto || `${conductor.nombres} ${conductor.apellidos}`}
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
          conductor.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {conductor.estado}
        </span>
      </div>
      
      <div className="text-sm text-gray-500 space-y-1 mb-4">
        <p>🆔 {conductor.dni}</p>
        <p>🚗 {conductor.placaVehiculo || 'Sin Placa'}</p>
      </div>

      <button 
        onClick={() => onEdit(conductor)}
        className="w-full py-2 bg-gray-50 text-blue-600 text-sm font-semibold rounded hover:bg-blue-50 transition-colors border border-blue-100"
      >
        Editar Datos
      </button>
    </div>
  );
};

export default function ConductoresList() {
  // 1. Hook de datos
  const { 
    conductores, loading, error, pagination, 
    obtenerConductores, buscarEnServidor 
  } = useConductores();

  // 2. Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);

  // 3. Handlers del Modal
  const handleCreate = () => {
    setSelectedConductor(null); // Limpiamos para que el form sepa que es NUEVO
    setIsModalOpen(true);
  };

  const handleEdit = (conductor: Conductor) => {
    setSelectedConductor(conductor); // Pasamos el conductor para que el form se PRE-CARGUE
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    // Esta función se ejecuta desde el Form cuando la API responde OK
    console.log("✨ Operación exitosa, refrescando lista...");
    obtenerConductores(); // Refresca la tabla automáticamente
  };

  return (
    <div className="p-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Conductores</h1>
          <p className="text-gray-500 text-sm">Gestiona la flota y sus documentos</p>
        </div>

        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nuevo Conductor
        </button>
      </div>

      {/* --- GRID DE CARDS --- */}
      {loading && conductores.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {conductores.map((c) => (
            <SafeConductorCard 
              key={c.id} 
              conductor={c} 
              onEdit={handleEdit} 
            />
          ))}
        </div>
      )}

      {/* --- MODAL DEL FORMULARIO --- */}
      {isModalOpen && (
        <ConductorForm 
          conductorEditar={selectedConductor}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}