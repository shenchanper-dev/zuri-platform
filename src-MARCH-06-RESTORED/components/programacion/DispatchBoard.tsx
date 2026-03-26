"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Download, RefreshCw, Search, User, Clock, MapPin,
    CheckCircle2, AlertCircle, ChevronDown, FileSpreadsheet,
    Stethoscope, Car, Pencil, Plus
} from 'lucide-react';
import DispatchEditPanel from './DispatchEditPanel';

// ============================================================================
// TIPOS
// ============================================================================

export interface DetalleDespacho {
    id: number;
    programacion_id: number;
    fecha: string;
    cliente_nombre: string | null;
    cliente_especial_id: number | null;
    tipo_servicio_id?: number | null;
    tipo_servicio_nombre?: string;
    area_servicio_id?: number | null;
    area_nombre?: string;
    turno: string | null;
    doctor_id?: number | null;
    doctor_nombre: string;
    paciente_id: number | null;
    conductor_id: number | null;
    conductor_nombre: string | null;
    conductor_nombre_bd?: string;
    hora_inicio: string;
    hora_fin: string;
    ubicacion: string | null;
    direccion_completa?: string | null;
    distrito_id?: number | null;
    distrito_nombre?: string | null;
    especialidad_id?: number | null;
    especialidad_nombre?: string | null;
    calificacion_id?: number | null;
    estado: string;
    observaciones: string | null;
    calificacion_desc?: string;
    orden: number | null;
}

// ============================================================================
// ESTADO DE DESPACHO (matching legacy Excel codes)
// ============================================================================

const ESTADOS_DESPACHO: Record<string, { label: string; color: string; bg: string; border: string }> = {
    PROGRAMADO: { label: 'Programado', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' },
    ASIGNADO: { label: 'Asignado', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
    EN_CURSO: { label: 'En Curso', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
    COMPLETADO: { label: 'Completado', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' },
    D: { label: 'D – Devuelto', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300' },
    NM: { label: 'NM – No Marcó', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
    G: { label: 'G – Viene de Guardia', color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300' },
    OSM: { label: 'OSM – Otro sacó material', color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-300' },
    C: { label: 'C – Cancelado cliente', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
    CED: { label: 'CED – Cancelado domicilio', color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-300' },
    DT: { label: 'DT – Doble Turno', color: 'text-teal-700', bg: 'bg-teal-100', border: 'border-teal-300' },
};

const TURNO_STYLE: Record<string, string> = {
    M: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    T: 'bg-orange-100 text-orange-700 border-orange-300',
    N: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    'M-T': 'bg-amber-100 text-amber-700 border-amber-300',
};

// Safe date formatter: handles both "2026-02-16" and "2026-02-16T00:00:00.000Z"
function formatFechaSegura(raw: string | null | undefined): string {
    if (!raw) return '—';
    try {
        // Extract just YYYY-MM-DD from any format
        const iso = raw.substring(0, 10);
        const [y, m, d] = iso.split('-').map(Number);
        const dt = new Date(y, m - 1, d); // local-only, no timezone shift
        return dt.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch { return raw; }
}

// Infer client name: from cliente_nombre, or from ubicacion prefix
function inferCliente(det: DetalleDespacho): string {
    if (det.cliente_nombre) return det.cliente_nombre;
    const ubi = (det.ubicacion || '').toLowerCase();
    if (ubi.includes('sanna')) return 'SANNA';
    if (ubi.startsWith('c.i.') || ubi.includes('internacional')) return 'C.I.';
    if (ubi.includes('jp') || ubi.includes('hospital jp')) return 'JP';
    if (ubi.includes('sm')) return 'SM';
    return 'Otro';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface DispatchBoardProps {
    programacionId: number;
    fecha: string;
    codigoProgramacion: string;
}

export default function DispatchBoard({ programacionId, fecha, codigoProgramacion }: DispatchBoardProps) {
    const [detalles, setDetalles] = useState<DetalleDespacho[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroCliente, setFiltroCliente] = useState('TODOS');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetalleDespacho | null>(null);
    const [exportando, setExportando] = useState(false);
    const [creandoRegistro, setCreandoRegistro] = useState(false);
    const [estadoDropdownId, setEstadoDropdownId] = useState<number | null>(null);

    // ── Cargar detalles usando el API correcto: /api/programaciones/[id] ──
    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/programaciones/${programacionId}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();
            setDetalles(data.detalles || []);
        } catch (e) {
            console.error('Error cargando detalles de despacho:', e);
            setDetalles([]);
        } finally {
            setLoading(false);
        }
    }, [programacionId]);

    useEffect(() => { cargar(); }, [cargar]);

    // ── Filtrado ─────────────────────────────────────────────────────────────
    const clientesUnicos = useMemo(() => {
        const set = new Set(detalles.map(d => inferCliente(d)));
        return Array.from(set).sort();
    }, [detalles]);

    const detallesFiltrados = useMemo(() => {
        return detalles.filter(d => {
            const clienteInferred = inferCliente(d);
            const matchClient = filtroCliente === 'TODOS' || clienteInferred === filtroCliente;
            const matchEstado = filtroEstado === 'TODOS' || d.estado === filtroEstado;
            const q = busqueda.toLowerCase();
            const matchSearch = !q ||
                d.doctor_nombre?.toLowerCase().includes(q) ||
                (d.conductor_nombre_bd || d.conductor_nombre || '').toLowerCase().includes(q) ||
                (d.ubicacion || '').toLowerCase().includes(q);
            return matchClient && matchEstado && matchSearch;
        });
    }, [detalles, filtroCliente, filtroEstado, busqueda]);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const totalServicios = detalles.length;
    const asignados = detalles.filter(d => d.conductor_id).length;
    const pendientes = totalServicios - asignados;
    const pct = totalServicios > 0 ? Math.round((asignados / totalServicios) * 100) : 0;

    // ── Exportar XLSX ─────────────────────────────────────────────────────────
    const handleExportar = async () => {
        if (detalles.length === 0) {
            alert('No hay servicios para exportar');
            return;
        }
        setExportando(true);
        try {
            const res = await fetch('/api/programaciones/exportar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ programacionId })
            });
            if (!res.ok) throw new Error('Error al exportar');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            // Build filename like "16-02-2026 - Lunes.xlsx"
            const [y, m, d] = fecha.substring(0, 10).split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            const fechaStr = `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
            const dia = dt.toLocaleDateString('es-PE', { weekday: 'long' });
            a.href = url;
            a.download = `${fechaStr} - ${dia.charAt(0).toUpperCase() + dia.slice(1)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Error exportando', e);
            alert('Error al generar el archivo Excel. Intenta nuevamente.');
        } finally {
            setExportando(false);
        }
    };

    // ── Callback de edición exitosa ────────────────────────────────────────────
    const handleEditGuardado = (detalleId: number, campos: Record<string, any>) => {
        setDetalles(prev => prev.map(d =>
            d.id === detalleId ? { ...d, ...campos } : d
        ));
        setDetalleSeleccionado(null);
        // Recargar para obtener datos frescos con JOINs
        setTimeout(() => cargar(), 300);
    };

    // ── Cambiar estado de un detalle ──────────────────────────────────────────
    const handleCambiarEstado = async (detalleId: number, nuevoEstado: string) => {
        setEstadoDropdownId(null);
        try {
            // Usamos PUT para actualizar campos del detalle
            await fetch(`/api/programacion-detalles/${detalleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            setDetalles(prev => prev.map(d =>
                d.id === detalleId ? { ...d, estado: nuevoEstado } : d
            ));
        } catch (e) {
            console.error('Error actualizando estado', e);
        }
    };

    // ── Crear nuevo registro vacío ──────────────────────────────────────────
    const handleCrearRegistro = async () => {
        setCreandoRegistro(true);
        try {
            const res = await fetch('/api/programacion-detalles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ programacion_id: programacionId })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al crear registro');
            }
            const data = await res.json();
            // Refresh the list and open the edit panel for the new record
            await cargar();
            // Open edit panel with the new record
            const nuevoDetalle: DetalleDespacho = {
                id: data.detalle.id,
                programacion_id: programacionId,
                fecha: data.detalle.fecha,
                cliente_nombre: null,
                cliente_especial_id: null,
                turno: null,
                doctor_id: null,
                doctor_nombre: '',
                paciente_id: null,
                conductor_id: null,
                conductor_nombre: null,
                hora_inicio: data.detalle.hora_inicio || '08:00',
                hora_fin: data.detalle.hora_fin || '09:00',
                ubicacion: null,
                estado: 'PROGRAMADO',
                observaciones: null,
                orden: data.detalle.orden,
            };
            setDetalleSeleccionado(nuevoDetalle);
        } catch (e: any) {
            console.error('Error creando registro:', e);
            alert(e.message || 'Error al crear el registro');
        } finally {
            setCreandoRegistro(false);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        if (!estadoDropdownId) return;
        const handler = () => setEstadoDropdownId(null);
        document.addEventListener('click', handler, { once: true });
        return () => document.removeEventListener('click', handler);
    }, [estadoDropdownId]);

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full gap-4">

            {/* ── HEADER BAR ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Dispatch Board</p>
                        <p className="text-base font-bold text-gray-900">
                            {codigoProgramacion} — {formatFechaSegura(fecha)}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{totalServicios}</p>
                        <p className="text-xs text-gray-400">Total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{asignados}</p>
                        <p className="text-xs text-gray-400">Asignados</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-amber-500">{pendientes}</p>
                        <p className="text-xs text-gray-400">Pendientes</p>
                    </div>
                    <div className="w-28 hidden md:block">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progreso</span><span>{pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button onClick={cargar} disabled={loading}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition" title="Recargar">
                        <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handleCrearRegistro} disabled={creandoRegistro}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                        {creandoRegistro
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <Plus className="h-4 w-4" />}
                        Crear Registro
                    </button>
                    <button onClick={handleExportar} disabled={exportando || detalles.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                        {exportando
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <Download className="h-4 w-4" />}
                        Exportar XLSX
                    </button>
                </div>
            </div>

            {/* ── FILTROS ── */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar médico, conductor, dirección…"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="TODOS">Todos los clientes</option>
                    {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="TODOS">Todos los estados</option>
                    {Object.entries(ESTADOS_DESPACHO).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
            </div>

            {/* ── TABLA ── */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mr-3" />
                        <span className="text-gray-500">Cargando servicios…</span>
                    </div>
                ) : detallesFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <AlertCircle className="h-10 w-10 mb-2" />
                        <p className="font-medium">Sin servicios para mostrar</p>
                        <p className="text-sm">
                            {detalles.length > 0
                                ? 'Ajusta los filtros de búsqueda'
                                : 'Esta programación no tiene detalles. Importa servicios desde Gestión Excel.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Turno</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Médico</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Horario</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">Conductor</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detallesFiltrados.map((det, idx) => {
                                    const estadoCfg = ESTADOS_DESPACHO[det.estado] || ESTADOS_DESPACHO.PROGRAMADO;
                                    const turnoKey = det.turno || '';
                                    const turnoStyle = TURNO_STYLE[turnoKey] || 'bg-gray-100 text-gray-600 border-gray-300';
                                    const conductorNombre = det.conductor_nombre_bd || det.conductor_nombre;
                                    const clienteInferred = inferCliente(det);

                                    return (
                                        <tr key={det.id}
                                            className={`hover:bg-sky-100 transition-colors cursor-pointer ${det.conductor_id ? 'bg-white' : 'bg-amber-50/20'}`}>

                                            <td className="px-3 py-3 text-gray-400 font-mono text-xs">{det.orden ?? idx + 1}</td>

                                            <td className="px-3 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${turnoStyle}`}>
                                                    {det.turno || '—'}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3">
                                                <p className="font-semibold text-gray-900 text-xs">{clienteInferred}</p>
                                                {det.tipo_servicio_nombre && (
                                                    <p className="text-gray-400 text-xs">{det.tipo_servicio_nombre}</p>
                                                )}
                                            </td>

                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Stethoscope className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                    <span className="font-medium text-gray-900 truncate max-w-[160px]" title={det.doctor_nombre}>
                                                        {det.doctor_nombre}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-gray-700">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="font-mono text-xs">
                                                        {det.hora_inicio?.toString().slice(0, 5)} — {det.hora_fin?.toString().slice(0, 5)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-3 py-3 max-w-[180px]">
                                                <div className="flex items-start gap-1">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                                                    <span className="text-gray-600 text-xs truncate" title={det.ubicacion || ''}>
                                                        {det.ubicacion || '—'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-3 py-3">
                                                {conductorNombre ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                            <User className="h-3.5 w-3.5 text-green-600" />
                                                        </div>
                                                        <span className="text-gray-900 text-xs font-medium truncate max-w-[130px]" title={conductorNombre}>
                                                            {conductorNombre}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-amber-500 text-xs italic">Sin asignar</span>
                                                )}
                                            </td>

                                            {/* Estado dropdown */}
                                            <td className="px-3 py-3">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEstadoDropdownId(estadoDropdownId === det.id ? null : det.id);
                                                        }}
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${estadoCfg.bg} ${estadoCfg.color} ${estadoCfg.border}`}
                                                    >
                                                        {estadoCfg.label.length > 14 ? estadoCfg.label.substring(0, 14) + '…' : estadoCfg.label}
                                                        <ChevronDown className="h-3 w-3" />
                                                    </button>
                                                    {estadoDropdownId === det.id && (
                                                        <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-30 max-h-60 overflow-y-auto"
                                                            onClick={e => e.stopPropagation()}>
                                                            {Object.entries(ESTADOS_DESPACHO).map(([k, v]) => (
                                                                <button key={k}
                                                                    onClick={() => handleCambiarEstado(det.id, k)}
                                                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${k === det.estado ? 'font-bold bg-indigo-50' : ''
                                                                        } ${v.color}`}>
                                                                    <span className={`w-2 h-2 rounded-full ${v.bg} border ${v.border}`} />
                                                                    {v.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-3 py-3 text-center">
                                                <button onClick={() => setDetalleSeleccionado(det)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
                                                    <Pencil className="h-3 w-3" />
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── PANEL DE EDICIÓN ── */}
            {detalleSeleccionado && (
                <DispatchEditPanel
                    detalle={detalleSeleccionado}
                    onGuardar={handleEditGuardado}
                    onCerrar={() => setDetalleSeleccionado(null)}
                />
            )}
        </div>
    );
}
