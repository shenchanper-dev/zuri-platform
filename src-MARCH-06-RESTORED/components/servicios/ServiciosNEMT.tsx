'use client';

import React, { useState } from 'react';
import { useServiciosEnVivo } from '@/hooks/useServiciosEnVivo';
import { TimelineServicios } from '@/components/servicios/TimelineServicios';
import { DispatchAutomatico } from '@/components/servicios/DispatchAutomatico';
import { CalculadoraTarifas } from '@/components/servicios/CalculadoraTarifas';

export default function ServiciosNEMT() {
  const {
    servicios,
    conductores,
    stats,
    loading,
    error,
    cargarServicios,
    dispatchAutomatico
  } = useServiciosEnVivo();

  const [servicioSeleccionado, setServicioSeleccionado] = useState<number | null>(null);
  const [mostrarDispatch, setMostrarDispatch] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tipoNEMT, setTipoNEMT] = useState<'ambulatory' | 'wheelchair' | 'stretcher' | 'wav'>('wheelchair');

  const handleAsignarConductor = (servicioId: number) => {
    setServicioSeleccionado(servicioId);
    setMostrarDispatch(true);
  };

  const handleDispatchCompleto = () => {
    setMostrarDispatch(false);
    setServicioSeleccionado(null);
    cargarServicios(fecha);
  };

  const tiposNEMT = [
    { id: 'ambulatory' as const, label: 'Ambulatorio', icon: '🚶', desc: 'Paciente camina, asistencia puerta a puerta' },
    { id: 'wheelchair' as const, label: 'Silla de Ruedas', icon: '♿', desc: 'Vehículo accesible, conductor certificado' },
    { id: 'stretcher' as const, label: 'Camilla', icon: '🛏️', desc: 'Transporte en camilla/gurney' },
    { id: 'wav' as const, label: 'WAV', icon: '🚐', desc: 'Vehículo accesible para silla de ruedas' },
  ];

  return (
    <div>
      {/* NEMT Service Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {tiposNEMT.map((tipo) => (
          <button
            key={tipo.id}
            onClick={() => setTipoNEMT(tipo.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              tipoNEMT === tipo.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">{tipo.icon}</div>
            <div className={`text-sm font-semibold ${tipoNEMT === tipo.id ? 'text-blue-700' : 'text-gray-800'}`}>
              {tipo.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">{tipo.desc}</div>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Activos</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 mb-1">Pendientes</p>
          <p className="text-3xl font-bold text-gray-900">{stats.pendientes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Completados</p>
          <p className="text-3xl font-bold text-gray-900">{stats.completados}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Cancelados</p>
          <p className="text-3xl font-bold text-gray-900">{stats.cancelados}</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                cargarServicios(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => cargarServicios(fecha)}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Dispatch Modal */}
      {mostrarDispatch && servicioSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Asignar Conductor - Servicio #{servicioSeleccionado}
                </h2>
                <button onClick={() => setMostrarDispatch(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <DispatchAutomatico
                servicioId={servicioSeleccionado}
                onDispatchCompleto={handleDispatchCompleto}
                onError={(err) => { console.error('Error en dispatch:', err); alert(err); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Timeline + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading && !servicios.length ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando servicios NEMT...</p>
            </div>
          ) : (
            <TimelineServicios
              servicios={servicios}
              onAsignarConductor={handleAsignarConductor}
              onVerDetalles={(id) => console.log('Ver detalles:', id)}
            />
          )}
        </div>

        <div className="space-y-6">
          {/* Fare Calculator */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Calculadora de Tarifas</h3>
            <CalculadoraTarifas
              distanciaKm={5.2}
              tipoServicio={tipoNEMT === 'wav' ? 'wheelchair' : tipoNEMT}
            />
          </div>

          {/* Online Drivers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Conductores Online</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Activos ahora</span>
              <span className="text-2xl font-bold text-green-600">
                {conductores.filter(c => c.online).length}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                + Nuevo Servicio NEMT
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                📊 Ver Reportes
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                📥 Exportar Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
