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
  Star,
  Lock,
  Key,
  ShieldAlert
} from 'lucide-react';

import { useConductores } from '@/hooks/useConductores';
import type { Conductor } from '@/domain/entities/Conductor.entity';
import ConductorModalNEMT from '@/components/modals/ConductorModalNEMT';
import ExportacionConductores, { conductorToExport } from '@/components/conductores/ExportacionConductores';
import dynamic from 'next/dynamic';

// Importación dinámica del mapa para evitar SSR issues con Leaflet
const RealTimeDriverMap = dynamic(
  () => import('@/components/conductores/RealTimeDriverMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Cargando mapa GPS...</p>
        </div>
      </div>
    )
  }
);

type ViewMode = 'tarjetas' | 'lista' | 'mapa';

export default function ConductoresPage() {
  const {
    conductores,
    loading,
    error,
    estadisticas,
    pagination,
    obtenerConductores,
    obtenerEstadisticas,
    eliminarConductor,
    cambiarPagina,
    cambiarLimite,
    asignarPin,
  } = useConductores();

  // Estados locales
  const [viewMode, setViewMode] = useState<ViewMode>('tarjetas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [selectedDistrito, setSelectedDistrito] = useState('todos');
  const [showExport, setShowExport] = useState(false);

  // Efecto para cargar conductores cuando cambian los filtros (Server-side filtering)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      obtenerConductores({
        page: 1, // Reiniciar a página 1 al cambiar filtros
        search: searchTerm.trim() || undefined,
        estado: selectedEstado !== 'todos' ? selectedEstado : undefined,
        distrito: selectedDistrito !== 'todos' ? selectedDistrito : undefined,
      });
    }, 500); // Debounce de 500ms para búsqueda

    return () => clearTimeout(timer);
  }, [searchTerm, selectedEstado, selectedDistrito]);

  // Los conductores presentados son directamente los que vienen del servidor
  const conductoresPresentados = conductores;

  // ✅ CORREGIDO: Cargar todos los distritos desde la API (50 distritos: Lima + Callao)
  const [distritosLista, setDistritosLista] = React.useState<{ id: number, nombre: string }[]>([]);

  React.useEffect(() => {
    fetch('/api/distritos?activo=true')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.distritos)) {
          setDistritosLista(data.distritos);
        }
      })
      .catch(err => console.error('Error loading districts:', err));
  }, []);

  // Distritos únicos para estadísticas (cuántos tienen conductores)
  const distritosUnicos = useMemo(() => {
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

  const handleAsignarPin = async (conductor: Conductor) => {
    if (!window.confirm(`¿Estás seguro de generar un PIN temporal para ${conductor.nombreCompleto}?`)) return;

    const result = await asignarPin(conductor.id);
    if (result.success && result.data) {
      alert(`🔑 PIN GENERADO EXITOSAMENTE\n\nConductor: ${conductor.nombreCompleto}\nNUEVO PIN: ${result.data.pin}\n\nPor favor, comunique este PIN al conductor. Solo se muestra esta vez.`);
    } else {
      alert('Error: ' + result.error);
    }
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

  const datosExportacion = conductoresPresentados.map(conductorToExport);

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
            {/* ✅ CORREGIDO: foto_conductor → foto */}
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
          {conductor.foto ? (
            <img
              src={conductor.foto}
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
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${conductor.estado === 'ACTIVO'
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
          {conductor.celular1 || 'Sin teléfono'}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <span className="w-4 h-4 mr-2">🚗</span>
          {conductor.marcaVehiculo || conductor.modeloVehiculo
            ? `${conductor.marcaVehiculo || ''} ${conductor.modeloVehiculo || ''}`.trim()
            : 'Sin vehículo'}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <span className="w-4 h-4 mr-2">🏷️</span>
          {conductor.placa || 'Sin placa'}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Distrito: {conductor.distrito_nombre || 'N/A'}</span>
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
            {conductor.foto ? (
              <img
                src={conductor.foto}
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
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${conductor.estado === 'ACTIVO'
          ? 'bg-green-100 text-green-800'
          : conductor.estado === 'SUSPENDIDO'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
          }`}>
          {conductor.estado}
        </span>
      </td>

      <td className="px-4 py-3 text-sm">{conductor.celular1 || 'Sin teléfono'}</td>

      <td className="px-4 py-3 text-sm">
        {conductor.marcaVehiculo || conductor.modeloVehiculo
          ? `${conductor.marcaVehiculo || ''} ${conductor.modeloVehiculo || ''}`.trim()
          : 'Sin vehículo'}
      </td>

      <td className="px-4 py-3 text-sm">
        {conductor.placa || 'Sin placa'}
      </td>

      <td className="px-4 py-3 text-sm">{conductor.distrito_nombre || 'N/A'}</td>

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
      {/* Header Responsive */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users size={32} className="text-blue-600" />
            <span>Gestión de Conductores</span>
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Sistema integral con información de distritos, fotos de perfil y seguimiento avanzado</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setShowExport(true)}
            disabled={conductoresPresentados.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            onClick={() => {
              obtenerConductores();
              obtenerEstadisticas();
            }}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            onClick={handleNewConductor}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={18} />
            <span className="whitespace-nowrap">Nuevo Conductor</span>
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

      {/* Controles de filtros y vista Responsive */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, teléfono, placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtros y modos de vista */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            {/* Filtro por estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
              className="w-full sm:w-auto border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los distritos</option>
              {distritosLista.map(distrito => (
                <option key={distrito.id} value={distrito.nombre}>{distrito.nombre}</option>
              ))}
            </select>

            <span className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline">
              {pagination.total > 0
                ? `${((pagination.page - 1) * pagination.limit) + 1} a ${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total} conductores`
                : '0 conductores'}
            </span>
          </div>

          {/* Modos de vista - Siempre visible y accesible */}
          <div className="flex justify-center md:justify-end">
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto justify-center md:justify-start">
              <button
                onClick={() => setViewMode('tarjetas')}
                className={`flex-1 md:flex-none px-4 py-2 rounded text-sm font-medium flex items-center justify-center space-x-2 transition-all ${viewMode === 'tarjetas' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                title="Vista de tarjetas"
              >
                <Grid size={18} />
                <span className="md:hidden">Tarjetas</span>
              </button>
              <button
                onClick={() => setViewMode('lista')}
                className={`flex-1 md:flex-none px-4 py-2 rounded text-sm font-medium flex items-center justify-center space-x-2 transition-all ${viewMode === 'lista' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                title="Vista de lista"
              >
                <List size={18} />
                <span className="md:hidden">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('mapa')}
                className={`flex-1 md:flex-none px-4 py-2 rounded text-sm font-medium flex items-center justify-center space-x-2 transition-all ${viewMode === 'mapa' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                title="Vista de mapa"
              >
                <Map size={18} />
                <span className="md:hidden">Mapa</span>
              </button>
            </div>
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
              {conductoresPresentados.map((conductor) => (
                <ConductorCard key={conductor.id} conductor={conductor} />
              ))}
              {conductoresPresentados.length === 0 && (
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
                  {conductoresPresentados.map((conductor) => (
                    <ConductorListItem key={conductor.id} conductor={conductor} />
                  ))}
                  {conductoresPresentados.length === 0 && (
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

          {/* Vista de mapa en tiempo real */}
          {viewMode === 'mapa' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg h-[calc(100vh-250px)] min-h-[400px]">
              <RealTimeDriverMap
                conductoresBase={conductoresPresentados}
                onConductorClick={(conductor) => {
                  const found = conductoresPresentados.find(c => c.id === conductor.id);
                  if (found) handleEditConductor(found);
                }}
                selectedConductorId={selectedConductor?.id}
                altura="100%"
                mostrarControles={true}
                mostrarEstadisticas={true}
                mostrarLeyenda={true}
              />
            </div>
          )}
        </>
      )}

      {/* ========== PAGINACIÓN ========== */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200">
          {/* Info */}
          <p className="text-sm text-gray-600">
            Página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong>
            {' '}·{' '}
            <strong>{pagination.total}</strong> conductores en total
          </p>

          {/* Controles */}
          <div className="flex items-center gap-1">
            {/* Primera */}
            <button
              onClick={() => cambiarPagina(1)}
              disabled={pagination.page === 1}
              className="px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              «
            </button>

            {/* Anterior */}
            <button
              onClick={() => cambiarPagina(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              ‹ Anterior
            </button>

            {/* Números de página */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 2)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`e${idx}`} className="px-2 py-1.5 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => cambiarPagina(p as number)}
                    className={`px-3 py-1.5 text-xs rounded border font-medium transition-colors ${p === pagination.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {p}
                  </button>
                )
              )
            }

            {/* Siguiente */}
            <button
              onClick={() => cambiarPagina(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Siguiente ›
            </button>

            {/* Última */}
            <button
              onClick={() => cambiarPagina(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              »
            </button>
          </div>

          {/* Selector por página */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Por página:</span>
            {[20, 50, 100].map(n => (
              <button
                key={n}
                onClick={() => cambiarLimite(n)}
                className={`px-2 py-1 text-xs rounded border font-medium transition-colors ${pagination.limit === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal Modular Refactorizado */}
      <ConductorModalNEMT
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        conductor={selectedConductor || undefined}
        onSuccess={() => {
          obtenerConductores();
          obtenerEstadisticas();
        }}
      />

      {/* Modal Exportar Conductores (como Doctores) */}
      {showExport && (
        <ExportacionConductores
          datos={datosExportacion}
          total={pagination.total}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}