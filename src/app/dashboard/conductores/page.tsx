'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  MapPin, 
  Plus, 
  Download, 
  RefreshCw,
  Search,
  Filter,
  Grid,
  List,
  Map,
  Edit,
  Trash2,
  Star
} from 'lucide-react';

import { useConductores } from '@/hooks/useConductores';
import type { Conductor } from '@/domain/entities/Conductor.entity';
import ConductorModalNEMT from '@/components/modals/ConductorModalNEMT';

type ViewMode = 'tarjetas' | 'lista' | 'mapa';

export default function ConductoresPage() {
  const {
    conductores,
    loading,
    error,
    estadisticas, // ✅ CORREGIDO: stats → estadisticas
    obtenerConductores,
    eliminarConductor,
    filtrarConductoresLocal // ✅ CORREGIDO: filtrarConductores → filtrarConductoresLocal
  } = useConductores();

  // Estados locales
  const [viewMode, setViewMode] = useState<ViewMode>('tarjetas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [selectedDistrito, setSelectedDistrito] = useState('todos');

  // Filtros aplicados
  const conductoresFiltrados = useMemo(() => {
    return filtrarConductoresLocal({ // ✅ CORREGIDO
      estado: selectedEstado !== 'todos' ? selectedEstado : undefined,
      distrito: selectedDistrito !== 'todos' ? selectedDistrito : undefined,
      busqueda: searchTerm.trim() || undefined
    });
  }, [filtrarConductoresLocal, selectedEstado, selectedDistrito, searchTerm]);

  // Distritos únicos para el filtro
  const distritosUnicos = useMemo(() => {
    // ✅ CORREGIDO: Array.from en lugar de spread operator
    const distritos = Array.from(new Set(conductores.map(c => c.distrito_nombre))).filter(Boolean).sort();
    return distritos;
  }, [conductores]);

  // Handlers
  const handleEditConductor = (conductor: Conductor) => {
    setSelectedConductor(conductor);
    setIsModalOpen(true);
  };

  const handleNewConductor = () => {
    setSelectedConductor(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConductor(null);
  };

  const handleDeleteConductor = async (conductor: Conductor) => {
    // ✅ CORREGIDO: nombres_apellidos → nombre_completo, sintaxis confirm
    if (window.confirm(`¿Estás seguro de eliminar al conductor ${conductor.nombreCompleto}?`)) {
      const result = await eliminarConductor(conductor.id);
      if (result.success) {
        // Refresh automático se maneja en el hook
      }
    }
  };

  const handleExportData = () => {
    // TODO: Implementar exportación
    console.log('Exportando datos...');
  };

  // Componente de estadísticas
  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      <div className="bg-blue-500 text-white p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Users size={24} />
          <div>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
            <div className="text-sm opacity-90">Total</div>
          </div>
        </div>
      </div>

      <div className="bg-green-500 text-white p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <UserCheck size={24} />
          <div>
            <div className="text-2xl font-bold">{estadisticas.activos}</div>
            <div className="text-sm opacity-90">Activos</div>
          </div>
        </div>
      </div>

      <div className="bg-purple-500 text-white p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
            📸
          </div>
          <div>
            {/* ✅ CORREGIDO: foto_conductor → foto_url */}
            <div className="text-2xl font-bold">{conductores.filter(c => c.foto).length}</div>
            <div className="text-sm opacity-90">Con Foto</div>
          </div>
        </div>
      </div>

      <div className="bg-orange-500 text-white p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Clock size={24} />
          <div>
            {/* ✅ CORREGIDO: usar estadisticas */}
            <div className="text-2xl font-bold">{(estadisticas.calificacion_promedio || 0).toFixed(1)}</div>
            <div className="text-sm opacity-90">Calificación</div>
          </div>
        </div>
      </div>

      <div className="bg-teal-500 text-white p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <MapPin size={24} />
          <div>
            <div className="text-2xl font-bold">{distritosUnicos.length}</div>
            <div className="text-sm opacity-90">Distritos</div>
          </div>
        </div>
      </div>

      <div className="bg-red-500 text-white p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <UserX size={24} />
          <div>
            <div className="text-2xl font-bold">{estadisticas.inactivos}</div>
            <div className="text-sm opacity-90">Inactivos</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente de tarjeta de conductor
  const ConductorCard = ({ conductor }: { conductor: Conductor }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header de la tarjeta */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          {/* ✅ CORREGIDO: foto_conductor → foto_url, nombres_apellidos → nombre_completo */}
          {conductor.fotoUrl ? (
            <img 
              src={conductor.fotoUrl} 
              alt={conductor.nombreCompleto}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-lg font-semibold text-blue-600">
              {conductor.nombreCompleto?.split(" ").map(n => n[0]).slice(0, 2).join("") || "SC"}
            </span>
          )}
        </div>
        
        <div className="flex-1">
          {/* ✅ CORREGIDO: nombres_apellidos → nombre_completo */}
          <h3 className="font-semibold text-gray-900">{conductor.nombreCompleto}</h3>
          <p className="text-sm text-gray-600">DNI: {conductor.dni}</p>
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => handleEditConductor(conductor)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDeleteConductor(conductor)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Estado */}
      <div className="mb-3">
        {/* ✅ CORREGIDO: estado → estado_texto */}
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          conductor.estado === 'ACTIVO' 
            ? 'bg-green-100 text-green-800'
            : conductor.estado === 'SUSPENDIDO'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {conductor.estado}
        </span>
      </div>

      {/* Información del conductor y vehículo */}
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-4 h-4 mr-2">📱</span>
          {conductor.telefono}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-4 h-4 mr-2">🚗</span>
          {/* ✅ CORREGIDO: marca_vehiculo → marca_auto, modelo_vehiculo → modelo */}
          {conductor.marcaAuto} {conductor.modeloAuto}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-4 h-4 mr-2">🏷️</span>
          {/* ✅ CORREGIDO: placa_vehiculo → placa */}
          {conductor.placaVehiculo}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          {/* ✅ NOTA: capacidad_pasajeros no existe en Conductor interface */}
          <span>Distrito: {conductor.distrito_nombre}</span>
          <div className="flex items-center">
            <Star size={14} className="text-yellow-400" />
            <span className="ml-1">{(conductor.calificacionPromedio || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente de fila de lista
  const ConductorListItem = ({ conductor }: { conductor: Conductor }) => (
    <tr className="hover:bg-gray-50 border-b">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            {/* ✅ CORREGIDO: foto_conductor → foto_url, nombres_apellidos → nombre_completo */}
            {conductor.fotoUrl ? (
              <img 
                src={conductor.fotoUrl} 
                alt={conductor.nombreCompleto}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-xs font-semibold text-blue-600">
                {conductor.nombreCompleto?.split(" ").map(n => n[0]).slice(0, 2).join("") || "SC"}
              </span>
            )}
          </div>
          <div>
            {/* ✅ CORREGIDO: nombres_apellidos → nombre_completo */}
            <div className="font-medium">{conductor.nombreCompleto}</div>
            <div className="text-sm text-gray-600">DNI: {conductor.dni}</div>
          </div>
        </div>
      </td>
      
      <td className="px-4 py-3">
        {/* ✅ CORREGIDO: estado → estado_texto */}
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          conductor.estado === 'ACTIVO' 
            ? 'bg-green-100 text-green-800'
            : conductor.estado === 'SUSPENDIDO'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {conductor.estado}
        </span>
      </td>
      
      <td className="px-4 py-3 text-sm">{conductor.telefono}</td>
      
      <td className="px-4 py-3 text-sm">
        {/* ✅ CORREGIDO: marca_vehiculo → marca_auto, modelo_vehiculo → modelo */}
        {conductor.marcaAuto} {conductor.modeloAuto}
      </td>
      
      <td className="px-4 py-3 text-sm">
        {/* ✅ CORREGIDO: placa_vehiculo → placa */}
        {conductor.placaVehiculo}
      </td>
      
      <td className="px-4 py-3 text-sm">{conductor.distrito_nombre}</td>
      
      <td className="px-4 py-3">
        <div className="flex items-center">
          <Star size={14} className="text-yellow-400" />
          <span className="ml-1 text-sm">{(conductor.calificacionPromedio || 0).toFixed(1)}</span>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex space-x-1">
          <button
            onClick={() => handleEditConductor(conductor)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDeleteConductor(conductor)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users size={32} className="text-blue-600" />
            <span>Gestión de Conductores</span>
          </h1>
          <p className="text-gray-600 mt-1">Sistema integral con información de distritos, fotos de perfil y seguimiento avanzado</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => obtenerConductores()}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleNewConductor}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            <span>Nuevo Conductor</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      <StatsCards />

      {/* Controles de filtros y vista */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        {/* Búsqueda */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, teléfono, placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filtros y modos de vista */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Filtro por estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
              <option value="SUSPENDIDO">Suspendidos</option>
            </select>

            {/* Filtro por distrito */}
            <select
              value={selectedDistrito}
              onChange={(e) => setSelectedDistrito(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los distritos</option>
              {distritosUnicos.map(distrito => (
                <option key={distrito} value={distrito}>{distrito}</option>
              ))}
            </select>

            <span className="text-sm text-gray-600">
              {conductoresFiltrados.length} de {conductores.length} conductores
            </span>
          </div>

          {/* Modos de vista */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('tarjetas')}
              className={`p-2 rounded ${viewMode === 'tarjetas' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
              title="Vista de tarjetas"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={`p-2 rounded ${viewMode === 'lista' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
              title="Vista de lista"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('mapa')}
              className={`p-2 rounded ${viewMode === 'mapa' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
              title="Vista de mapa"
            >
              <Map size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            Cargando conductores...
          </div>
        </div>
      ) : (
        <>
          {/* Vista de tarjetas */}
          {viewMode === 'tarjetas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conductoresFiltrados.map((conductor) => (
                <ConductorCard key={conductor.id} conductor={conductor} />
              ))}
              {conductoresFiltrados.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-600">
                  No se encontraron conductores que coincidan con los filtros.
                </div>
              )}
            </div>
          )}

          {/* Vista de lista */}
          {viewMode === 'lista' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Conductor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Teléfono</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vehículo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Placa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Distrito</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Calificación</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {conductoresFiltrados.map((conductor) => (
                    <ConductorListItem key={conductor.id} conductor={conductor} />
                  ))}
                  {conductoresFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-600">
                        No se encontraron conductores que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Vista de mapa */}
          {viewMode === 'mapa' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <MapPin size={48} className="mx-auto mb-2" />
                  <p>Mapa de conductores en desarrollo</p>
                  <p className="text-sm">Integración con MapaConductoresNEMT.tsx pendiente</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <ConductorModalNEMT
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        conductor={selectedConductor || undefined}
        onSuccess={() => {
          obtenerConductores();
        }}
      />
    </div>
  );
}