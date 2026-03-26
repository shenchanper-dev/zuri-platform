'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useServiciosJPSAC, type ServicioJPSAC } from '@/hooks/useServiciosJPSAC';
import ExportacionServicios from '@/components/servicios/ExportacionServicios';

const MapaFlotaJPSAC = dynamic(() => import('@/components/servicios/MapaFlotaJPSAC'), { ssr: false });

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  asignado: 'bg-blue-100 text-blue-800',
  en_curso: 'bg-green-100 text-green-800',
  en_camino: 'bg-cyan-100 text-cyan-800',
  completado: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-red-100 text-red-800',
};

export default function ServiciosJPSAC() {
  const { servicios, stats, tiposServicio, loading, error, cargarServicios } = useServiciosJPSAC();
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [verMapa, setVerMapa] = useState(true);
  const [mostrarExport, setMostrarExport] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const serviciosFiltrados = useMemo(() => {
    if (!busqueda) return servicios;
    const q = busqueda.toLowerCase();
    return servicios.filter(s =>
      (s.paciente_nombre || '').toLowerCase().includes(q) ||
      (s.doctor_nombre || '').toLowerCase().includes(q) ||
      (s.conductor_nombre || '').toLowerCase().includes(q) ||
      (s.tipo_servicio || '').toLowerCase().includes(q) ||
      (s.distrito || '').toLowerCase().includes(q)
    );
  }, [servicios, busqueda]);

  const handleFechaChange = (f: string) => {
    setFecha(f);
    cargarServicios(f, filtroTipo || undefined);
  };

  const handleTipoChange = (tipo: string) => {
    setFiltroTipo(tipo);
    cargarServicios(fecha, tipo || undefined);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500">Activos</p>
          <p className="text-2xl font-bold text-green-700">{stats.activos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pendientes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
          <p className="text-xs text-gray-500">Completados</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.completados}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-500">Cancelados</p>
          <p className="text-2xl font-bold text-red-700">{stats.cancelados}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => handleFechaChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Servicio</label>
            <select
              value={filtroTipo}
              onChange={(e) => handleTipoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos</option>
              {tiposServicio.map(t => (
                <option key={t.tipo_servicio} value={t.tipo_servicio}>{t.tipo_servicio} ({t.cantidad})</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Paciente, doctor, conductor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => cargarServicios(fecha, filtroTipo || undefined)}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            🔄 Actualizar
          </button>

          <button
            onClick={() => setVerMapa(!verMapa)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${verMapa ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-gray-50 text-gray-600 border-gray-300'}`}
          >
            🗺️ Mapa
          </button>

          <button
            onClick={() => setMostrarExport(true)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium border border-gray-300"
          >
            📥 Exportar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Map */}
      {verMapa && (
        <div className="mb-6">
          <MapaFlotaJPSAC altura="380px" onRefresh={() => cargarServicios(fecha, filtroTipo || undefined)} />
        </div>
      )}

      {/* Service List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">
            Servicios del día ({serviciosFiltrados.length})
          </h3>
          {tiposServicio.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {tiposServicio.slice(0, 6).map(t => (
                <span key={t.tipo_servicio} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {t.tipo_servicio}: {t.cantidad}
                </span>
              ))}
            </div>
          )}
        </div>

        {loading && !servicios.length ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Cargando servicios...</p>
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-500">📋 No hay servicios programados para esta fecha</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Hora</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Paciente</th>
                  <th className="px-4 py-3 text-left">Doctor</th>
                  <th className="px-4 py-3 text-left">Distrito</th>
                  <th className="px-4 py-3 text-left">Conductor</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serviciosFiltrados.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {s.hora_inicio ? s.hora_inicio.slice(0, 5) : '--:--'}
                      {s.hora_fin ? ` - ${s.hora_fin.slice(0, 5)}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">
                        {s.tipo_servicio || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.paciente_nombre || '—'}</div>
                      {s.paciente_telefono && <div className="text-xs text-gray-500">{s.paciente_telefono}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.doctor_nombre}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.distrito || s.distrito_recojo || '—'}</td>
                    <td className="px-4 py-3">
                      {s.conductor_nombre_completo || s.conductor_nombre ? (
                        <div>
                          <div className="text-gray-900 text-xs">{s.conductor_nombre_completo || s.conductor_nombre}</div>
                          {(s.conductor_placa || s.placa) && (
                            <div className="text-xs text-gray-500">{s.conductor_placa || s.placa}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[s.estado || 'pendiente'] || 'bg-gray-100 text-gray-600'}`}>
                        {s.estado || 'pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export modal */}
      {mostrarExport && (
        <ExportacionServicios datos={serviciosFiltrados} fecha={fecha} onClose={() => setMostrarExport(false)} />
      )}
    </div>
  );
}
