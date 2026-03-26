'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, RefreshCw, Search, Users, Target, CheckCircle2 } from 'lucide-react';
import { useConductores } from '@/hooks/useConductores';
import RealTimeDriverMap from '@/components/conductores/RealTimeDriverMap';
import ZuriAssistantPanel from '@/components/servicios/ZuriAssistantPanel';
import { haversineDistanceMeters } from '@/lib/geo';

type ServicioRow = any;

type DriverFilters = {
  search?: string;
  soloDisponibles?: boolean;
  equipamiento?: string;
  servicio?: string;
};

function formatDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function ServiciosDashboard() {
  const [fecha, setFecha] = useState<string>(() => formatDateInput(new Date()));
  const [estado, setEstado] = useState<string>('PENDIENTE');
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [errorServicios, setErrorServicios] = useState<string | null>(null);
  const [servicios, setServicios] = useState<ServicioRow[]>([]);
  const [selectedServicioId, setSelectedServicioId] = useState<number | null>(null);
  const [selectedConductorId, setSelectedConductorId] = useState<number | null>(null);
  const [operador, setOperador] = useState<string>('Admin');
  const [driverFilters, setDriverFilters] = useState<DriverFilters>({ soloDisponibles: true });
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number>(5);
  const [nearbyMode, setNearbyMode] = useState<boolean>(true);
  const [assigning, setAssigning] = useState(false);

  const { conductores, loading: loadingConductores, error: errorConductores, obtenerConductores } = useConductores();

  const loadServicios = useCallback(async () => {
    setLoadingServicios(true);
    setErrorServicios(null);
    try {
      const params = new URLSearchParams({ fecha });
      if (estado) params.set('estado', estado);
      const res = await fetch(`/api/servicios?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setServicios(Array.isArray(data.servicios) ? data.servicios : []);
    } catch (e: any) {
      setErrorServicios(e?.message || 'Error al cargar servicios');
    } finally {
      setLoadingServicios(false);
    }
  }, [estado, fecha]);

  useEffect(() => {
    loadServicios();
  }, [loadServicios]);

  useEffect(() => {
    obtenerConductores({ page: 1, limit: 1000 }).catch(() => {});
  }, [obtenerConductores]);

  const selectedServicio = useMemo(() => {
    return servicios.find((s) => s.id === selectedServicioId) || null;
  }, [selectedServicioId, servicios]);

  const selectedServicioLabel = useMemo(() => {
    if (!selectedServicio) return '';
    return `${selectedServicio.codigo || `#${selectedServicio.id}`} • ${selectedServicio.pacienteNombre || 'Paciente'} • ${selectedServicio.origenDireccion || ''}`;
  }, [selectedServicio]);

  const hasOrigen = useMemo(() => {
    if (!selectedServicio) return false;
    const lat = Number(selectedServicio.origenLatitud);
    const lng = Number(selectedServicio.origenLongitud);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
  }, [selectedServicio]);

  const conductoresFiltrados = useMemo(() => {
    const term = (driverFilters.search || '').trim().toLowerCase();
    const now = Date.now();
    return conductores.filter((c: any) => {
      if (term) {
        const hay = [
          c.nombreCompleto,
          c.nombres,
          c.apellidos,
          c.dni,
          c.placa,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }

      if (driverFilters.soloDisponibles) {
        if (c.estado !== 'ACTIVO') return false;
        if (c.estadoServicio && c.estadoServicio !== 'DISPONIBLE') return false;
      }

      if (driverFilters.equipamiento) {
        if (!Array.isArray(c.equipamiento) || !c.equipamiento.includes(driverFilters.equipamiento)) return false;
      }

      if (driverFilters.servicio) {
        if (!Array.isArray(c.servicios) || !c.servicios.includes(driverFilters.servicio)) return false;
      }

      const lat = c.ubicacionActualLatitud;
      const lng = c.ubicacionActualLongitud;
      if (nearbyMode && hasOrigen) {
        if (!lat || !lng) return false;
        const distM = haversineDistanceMeters(
          Number(selectedServicio.origenLatitud),
          Number(selectedServicio.origenLongitud),
          Number(lat),
          Number(lng)
        );
        if (distM > nearbyRadiusKm * 1000) return false;
      }

      const ultima = c.ultimaActualizacionGPS ? new Date(c.ultimaActualizacionGPS).getTime() : null;
      if (driverFilters.soloDisponibles && ultima && now - ultima > 10 * 60 * 1000) return false;

      return true;
    });
  }, [conductores, driverFilters, hasOrigen, nearbyMode, nearbyRadiusKm, selectedServicio]);

  const conductoresOrdenados = useMemo(() => {
    if (!selectedServicio || !hasOrigen) return conductoresFiltrados;
    const oLat = Number(selectedServicio.origenLatitud);
    const oLng = Number(selectedServicio.origenLongitud);
    return [...conductoresFiltrados].sort((a: any, b: any) => {
      const da = haversineDistanceMeters(oLat, oLng, Number(a.ubicacionActualLatitud), Number(a.ubicacionActualLongitud));
      const db = haversineDistanceMeters(oLat, oLng, Number(b.ubicacionActualLatitud), Number(b.ubicacionActualLongitud));
      return da - db;
    });
  }, [conductoresFiltrados, hasOrigen, selectedServicio]);

  const topCercanos = useMemo(() => conductoresOrdenados.slice(0, 8), [conductoresOrdenados]);

  const assign = useCallback(async (servicioId: number, conductorId: number) => {
    setAssigning(true);
    try {
      const res = await fetch('/api/servicios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicioId, conductorId, operador }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      await loadServicios();
      await obtenerConductores({ page: 1, limit: 1000 });
    } finally {
      setAssigning(false);
    }
  }, [loadServicios, obtenerConductores, operador]);

  const onFindDriver = useCallback((query: string) => {
    const q = query.trim().toLowerCase();
    const found = conductores.find((c: any) => (c.nombreCompleto || '').toLowerCase().includes(q) || (c.dni || '').includes(q));
    if (found?.id) {
      setSelectedConductorId(found.id);
      setDriverFilters((prev) => ({ ...prev, search: found.nombreCompleto || found.dni }));
    }
  }, [conductores]);

  const onAssignDriver = useCallback((query: string) => {
    const q = query.trim().toLowerCase();
    const found = conductoresOrdenados.find((c: any) => (c.nombreCompleto || '').toLowerCase().includes(q) || (c.dni || '').includes(q));
    if (found?.id) {
      setSelectedConductorId(found.id);
      if (selectedServicioId) {
        assign(selectedServicioId, found.id).catch(() => {});
      }
    }
  }, [assign, conductoresOrdenados, selectedServicioId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestión de Servicios</h1>
          <div className="text-sm text-slate-500">Asignación manual + tiempo real + asistente Zuri</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 flex items-center gap-2"
            onClick={() => {
              loadServicios();
              obtenerConductores({ page: 1, limit: 1000 }).catch(() => {});
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loadingServicios ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ASIGNADO">ASIGNADO</option>
                <option value="ACEPTADO">ACEPTADO</option>
                <option value="EN_CAMINO">EN_CAMINO</option>
                <option value="COMPLETADO">COMPLETADO</option>
              </select>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-500">Operador</span>
                <input
                  value={operador}
                  onChange={(e) => setOperador(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm w-40"
                />
              </div>
            </div>

            {(errorServicios || errorConductores) && (
              <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                {errorServicios || errorConductores}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Servicios ({servicios.length})
                  </div>
                  {loadingServicios && <div className="text-xs text-slate-500">Cargando...</div>}
                </div>
                <div className="max-h-[420px] overflow-auto">
                  {servicios.map((s: any) => {
                    const active = s.id === selectedServicioId;
                    return (
                      <button
                        key={s.id}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-slate-50 ${active ? 'bg-blue-50' : 'bg-white'}`}
                        onClick={() => setSelectedServicioId(s.id)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold text-slate-900">{s.codigo || `#${s.id}`}</div>
                          <div className="text-xs px-2 py-1 rounded-full border bg-white">{s.estado}</div>
                        </div>
                        <div className="text-sm text-slate-700 mt-1">{s.pacienteNombre || 'Paciente'}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {s.origenDireccion || '—'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Candidatos ({conductoresOrdenados.length})
                  </div>
                  {loadingConductores && <div className="text-xs text-slate-500">Cargando...</div>}
                </div>
                <div className="p-3 border-b bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                      value={driverFilters.search || ''}
                      onChange={(e) => setDriverFilters((p) => ({ ...p, search: e.target.value }))}
                      placeholder="Buscar conductor por nombre/DNI/placa"
                      className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs text-slate-600 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!driverFilters.soloDisponibles}
                        onChange={(e) => setDriverFilters((p) => ({ ...p, soloDisponibles: e.target.checked }))}
                      />
                      Solo disponibles
                    </label>
                    <label className="text-xs text-slate-600 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={nearbyMode}
                        onChange={(e) => setNearbyMode(e.target.checked)}
                        disabled={!hasOrigen}
                      />
                      Cercanos al origen
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={nearbyRadiusKm}
                      onChange={(e) => setNearbyRadiusKm(Math.max(1, Math.min(50, parseInt(e.target.value || '5', 10))))}
                      className="border rounded-lg px-2 py-1 text-xs w-20"
                      disabled={!nearbyMode || !hasOrigen}
                    />
                    <span className="text-xs text-slate-500">km</span>
                    <select
                      className="border rounded-lg px-2 py-1 text-xs"
                      value={driverFilters.equipamiento || ''}
                      onChange={(e) => setDriverFilters((p) => ({ ...p, equipamiento: e.target.value || undefined }))}
                    >
                      <option value="">Equipamiento</option>
                      <option value="OXIGENO">OXIGENO</option>
                      <option value="RAMPA">RAMPA</option>
                      <option value="SILLA_RUEDAS">SILLA_RUEDAS</option>
                      <option value="CAMILLA">CAMILLA</option>
                      <option value="BOTIQUIN">BOTIQUIN</option>
                      <option value="EXTINTOR">EXTINTOR</option>
                    </select>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-auto">
                  {conductoresOrdenados.map((c: any) => {
                    const active = c.id === selectedConductorId;
                    const canAssign = !!selectedServicioId && !assigning;
                    const dist = hasOrigen
                      ? haversineDistanceMeters(
                          Number(selectedServicio?.origenLatitud),
                          Number(selectedServicio?.origenLongitud),
                          Number(c.ubicacionActualLatitud),
                          Number(c.ubicacionActualLongitud)
                        )
                      : null;
                    return (
                      <div
                        key={c.id}
                        className={`px-4 py-3 border-b ${active ? 'bg-emerald-50' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            className="text-left"
                            onClick={() => setSelectedConductorId(c.id)}
                          >
                            <div className="font-bold text-slate-900">{c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`.trim()}</div>
                            <div className="text-xs text-slate-500">{c.dni} • {c.placa}</div>
                            {dist !== null && Number.isFinite(dist) && (
                              <div className="text-xs text-slate-600 mt-1">{(dist / 1000).toFixed(2)} km del origen</div>
                            )}
                          </button>
                          <button
                            className={`px-3 py-2 rounded-lg text-sm font-bold ${canAssign ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                            onClick={() => {
                              if (!selectedServicioId) return;
                              assign(selectedServicioId, c.id).catch((e) => setErrorServicios(e?.message || 'Error al asignar'));
                            }}
                            disabled={!canAssign}
                          >
                            Asignar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedServicio && (
              <div className="mt-4 border rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-slate-900">Servicio seleccionado</div>
                  <div className="text-xs text-slate-500">{selectedServicioLabel}</div>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Origen</div>
                    <div className="font-semibold text-slate-800">{selectedServicio.origenDireccion || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Destino</div>
                    <div className="font-semibold text-slate-800">{selectedServicio.destinoDireccion || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
              <div className="font-bold text-slate-800">Mapa en tiempo real</div>
              <div className="text-xs text-slate-500">{selectedConductorId ? `Conductor #${selectedConductorId} seleccionado` : '—'}</div>
            </div>
            <div className="p-3">
              <RealTimeDriverMap
                conductoresBase={conductores}
                selectedConductorId={selectedConductorId || undefined}
                onConductorClick={(c: any) => setSelectedConductorId(c.id)}
                altura="520px"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ZuriAssistantPanel
            context={{
              selectedServicioId,
              selectedServicioLabel,
              selectedServicioHasOrigen: hasOrigen,
              onApplyDriverFilter: (filters) => setDriverFilters((p) => ({ ...p, ...filters })),
              onRequestNearestDrivers: (radiusKm) => {
                setNearbyMode(true);
                if (radiusKm && Number.isFinite(radiusKm)) setNearbyRadiusKm(Math.max(1, Math.min(50, radiusKm)));
              },
              onFindDriver,
              onAssignDriver,
            }}
          />

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800">Top cercanos</div>
              <div className="text-xs text-slate-500">{hasOrigen ? `${nearbyRadiusKm} km` : 'Selecciona un servicio con origen'}</div>
            </div>
            <div className="mt-3 space-y-2">
              {topCercanos.map((c: any, idx: number) => {
                const dist = hasOrigen
                  ? haversineDistanceMeters(
                      Number(selectedServicio?.origenLatitud),
                      Number(selectedServicio?.origenLongitud),
                      Number(c.ubicacionActualLatitud),
                      Number(c.ubicacionActualLongitud)
                    )
                  : null;
                return (
                  <button
                    key={c.id}
                    className="w-full text-left border rounded-lg p-3 hover:bg-slate-50"
                    onClick={() => setSelectedConductorId(c.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900">{idx + 1}. {c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`.trim()}</div>
                      {selectedConductorId === c.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="text-xs text-slate-500">{c.dni} • {c.placa}</div>
                    {dist !== null && Number.isFinite(dist) && (
                      <div className="text-xs text-slate-700 mt-1">{(dist / 1000).toFixed(2)} km</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

