"use client";

import React, { useState, useEffect } from 'react';
import { useProgramaciones } from '@/hooks/useProgramaciones';
import ProgramacionDashboard from '@/components/programacion/ProgramacionDashboard';
import ProgramacionDetalleView from '@/components/programacion/ProgramacionDetalle';
import AsignacionConductor from '@/components/programacion/AsignacionConductor';
import DispatchBoard from '@/components/programacion/DispatchBoard';
import { LayoutGrid, List } from 'lucide-react';

// ============================================================================
// PÁGINA ORQUESTADORA: /dashboard/programacion
//   Tab 1: Dispatch Board → DispatchBoard (despacho diario)
//   Tab 2: Programaciones → ProgramacionDashboard → Detalle
// ============================================================================

type Vista = 'dispatch' | 'lista';

// Safe date formatter (handles "2026-02-16", "2026-02-16T00:00:00.000Z", etc.)
function formatFechaSegura(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const iso = raw.substring(0, 10);
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch { return raw || '—'; }
}

export default function ProgramacionPage() {
  const [vistaActiva, setVistaActiva] = useState<Vista>('dispatch');
  const [programacionSeleccionadaId, setProgramacionSeleccionadaId] = useState<number | null>(null);

  const {
    programaciones, loading: loadingLista,
    programacionActiva, detalles, loadingDetalle,
    cargarDetalle, cerrarDetalle, actualizarEstado, asignarConductor,
  } = useProgramaciones();

  // Auto-select first programación when loaded
  useEffect(() => {
    if (programaciones.length > 0 && programacionSeleccionadaId === null) {
      setProgramacionSeleccionadaId(programaciones[0].id);
    }
  }, [programaciones, programacionSeleccionadaId]);

  const programacionActual = programaciones.find(p => p.id === programacionSeleccionadaId) || programaciones[0];

  // Estado para modal de asignación (vista Lista)
  const [detalleParaAsignar, setDetalleParaAsignar] = useState<number | null>(null);
  const detalleSeleccionado = detalles.find(d => d.id === detalleParaAsignar);

  const handleAsignarConductor = async (
    detalleId: number, conductorId: number, conductorNombre: string
  ): Promise<boolean> => {
    const ok = await asignarConductor(detalleId, conductorId, conductorNombre);
    if (ok) setDetalleParaAsignar(null);
    return ok;
  };

  return (
    <div className="p-6 flex flex-col space-y-4" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* ── Header + Tabs ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Programación</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Despacho de servicios y asignación de conductores
          </p>
        </div>
        <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
          <button
            onClick={() => setVistaActiva('dispatch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${vistaActiva === 'dispatch'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}>
            <LayoutGrid className="h-4 w-4" />
            Dispatch Board
          </button>
          <button
            onClick={() => setVistaActiva('lista')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${vistaActiva === 'lista'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}>
            <List className="h-4 w-4" />
            Programaciones
          </button>
        </div>
      </div>

      {/* ── DISPATCH BOARD ── */}
      {vistaActiva === 'dispatch' && (
        <>
          {loadingLista ? (
            <div className="flex items-center justify-center flex-1 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3" />
              Cargando programaciones…
            </div>
          ) : programaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
              <LayoutGrid className="h-12 w-12 mb-3" />
              <h3 className="font-semibold text-lg text-gray-600">Sin programaciones activas</h3>
              <p className="text-sm mt-1">
                Importa un archivo Excel desde{' '}
                <a href="/dashboard/gestion-excel" className="text-indigo-600 underline">Gestión Excel</a>{' '}
                para crear una programación.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Selector de programación */}
              {programaciones.length > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-500 font-medium">Programación:</span>
                  <select
                    value={programacionActual?.id || ''}
                    onChange={e => setProgramacionSeleccionadaId(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium">
                    {programaciones.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.codigo_programacion} — {formatFechaSegura(p.fecha_programacion)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {programacionActual && (
                <DispatchBoard
                  key={programacionActual.id}
                  programacionId={programacionActual.id}
                  fecha={programacionActual.fecha_programacion}
                  codigoProgramacion={programacionActual.codigo_programacion}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ── LISTA DE PROGRAMACIONES ── */}
      {vistaActiva === 'lista' && (
        <div className="flex-1 flex flex-col min-h-0">
          {programacionActiva ? (
            <ProgramacionDetalleView
              programacion={programacionActiva}
              detalles={detalles}
              loading={loadingDetalle}
              onVolver={cerrarDetalle}
              onAsignarConductor={(id) => setDetalleParaAsignar(id)}
              onActualizarEstado={actualizarEstado}
              onRecargar={() => cargarDetalle(programacionActiva.id)}
            />
          ) : (
            <ProgramacionDashboard onVerDetalle={(id) => cargarDetalle(id)} />
          )}
        </div>
      )}

      {/* Modal de asignación (vista Lista) */}
      {vistaActiva === 'lista' && detalleParaAsignar && detalleSeleccionado && (
        <AsignacionConductor
          detalleId={detalleParaAsignar}
          fecha={detalleSeleccionado.fecha}
          horaInicio={detalleSeleccionado.hora_inicio}
          horaFin={detalleSeleccionado.hora_fin}
          doctorNombre={detalleSeleccionado.doctor_nombre}
          ubicacion={detalleSeleccionado.ubicacion}
          onAsignar={handleAsignarConductor}
          onCerrar={() => setDetalleParaAsignar(null)}
        />
      )}
    </div>
  );
}
