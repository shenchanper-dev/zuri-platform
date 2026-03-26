"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    X, User, Car, Search, CheckCircle2, RefreshCw,
    AlertCircle, Clock, MapPin, Stethoscope, UserPlus, Phone
} from 'lucide-react';
import { DetalleDespacho } from './DispatchBoard';

// ============================================================================
// TIPOS
// ============================================================================

interface Conductor {
    id: number;
    nombreCompleto: string;
    placa?: string;
    estado?: string;
    zona?: string;
}

interface DispatchAssignPanelProps {
    detalle: DetalleDespacho;
    onAsignar: (detalleId: number, conductorId: number, conductorNombre: string) => void;
    onCerrar: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export default function DispatchAssignPanel({ detalle, onAsignar, onCerrar }: DispatchAssignPanelProps) {
    const [conductores, setConductores] = useState<Conductor[]>([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [conductorSeleccionado, setConductorSeleccionado] = useState<Conductor | null>(null);
    const [observaciones, setObservaciones] = useState(detalle.observaciones || '');
    const [error, setError] = useState<string | null>(null);

    // ── Cargar conductores disponibles ──────────────────────────────────────
    const cargarConductores = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/conductores?estado=ACTIVO&limit=200');
            const data = await res.json();
            // Soporte para distintos formatos de respuesta
            const lista: Conductor[] = data.conductores || data.data || data || [];
            setConductores(lista);
        } catch {
            setError('No se pudieron cargar los conductores');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { cargarConductores(); }, [cargarConductores]);

    // Pre-seleccionar conductor actual si ya está asignado
    useEffect(() => {
        if (detalle.conductor_id) {
            const actual = conductores.find(c => c.id === detalle.conductor_id);
            if (actual) setConductorSeleccionado(actual);
        }
    }, [conductores, detalle.conductor_id]);

    // ── Filtrado de conductores por búsqueda ─────────────────────────────────
    const conductoresFiltrados = busqueda.trim()
        ? conductores.filter(c =>
            (c.nombreCompleto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.placa || '').toLowerCase().includes(busqueda.toLowerCase())
        )
        : conductores;

    // ── Confirmar asignación ─────────────────────────────────────────────────
    const handleConfirmar = async () => {
        if (!conductorSeleccionado) return;
        setGuardando(true);
        setError(null);
        try {
            const res = await fetch(`/api/programacion-detalles/${detalle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conductor_id: conductorSeleccionado.id,
                    conductor_nombre: conductorSeleccionado.nombreCompleto,
                    observaciones,
                    estado: 'ASIGNADO',
                })
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || `Error ${res.status}`);
            }
            onAsignar(detalle.id, conductorSeleccionado.id, conductorSeleccionado.nombreCompleto);
        } catch (e: any) {
            setError(e.message || 'Error al guardar la asignación');
        } finally {
            setGuardando(false);
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                onClick={onCerrar}
            />

            {/* Panel lateral */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 bg-indigo-600 text-white">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-indigo-200 uppercase tracking-wider font-medium">Asignar Conductor</p>
                            <h3 className="font-bold text-lg truncate">{detalle.doctor_nombre}</h3>
                        </div>
                        <button
                            onClick={onCerrar}
                            className="p-1.5 rounded-lg hover:bg-indigo-700 transition shrink-0"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Info del servicio */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-indigo-100">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-indigo-300" />
                            <span>{detalle.hora_inicio?.slice(0, 5)} – {detalle.hora_fin?.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold bg-indigo-500 px-1.5 py-0.5 rounded">
                                {detalle.turno || '—'}
                            </span>
                            <span>{detalle.cliente_nombre}</span>
                        </div>
                        {(detalle.ubicacion || detalle.direccion_completa) && (
                            <div className="flex items-start gap-1.5 col-span-2">
                                <MapPin className="h-3.5 w-3.5 text-indigo-300 mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{detalle.ubicacion || detalle.direccion_completa}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conductor actual (si existe) */}
                {detalle.conductor_id && (
                    <div className="px-5 py-3 bg-green-50 border-b border-green-200">
                        <p className="text-xs text-green-600 font-medium mb-1">Conductor actual</p>
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-green-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-green-700" />
                            </div>
                            <span className="text-sm font-semibold text-green-800">
                                {detalle.conductor_nombre_bd || detalle.conductor_nombre}
                            </span>
                        </div>
                    </div>
                )}

                {/* Buscador */}
                <div className="px-5 py-3 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre o placa…"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Lista de conductores */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
                    {loading ? (
                        <div className="flex justify-center items-center h-24">
                            <RefreshCw className="h-5 w-5 animate-spin text-indigo-400 mr-2" />
                            <span className="text-gray-500 text-sm">Cargando conductores…</span>
                        </div>
                    ) : conductoresFiltrados.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <User className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">No hay conductores disponibles</p>
                        </div>
                    ) : (
                        conductoresFiltrados.map(conductor => {
                            const isSelected = conductorSeleccionado?.id === conductor.id;
                            return (
                                <button
                                    key={conductor.id}
                                    onClick={() => setConductorSeleccionado(isSelected ? null : conductor)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition ${isSelected
                                            ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300'
                                            : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
                                        }`}
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600' : 'bg-gray-100'
                                        }`}>
                                        <User className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                                            {conductor.nombreCompleto}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {conductor.placa && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Car className="h-3 w-3" /> {conductor.placa}
                                                </span>
                                            )}
                                            {conductor.zona && (
                                                <span className="text-xs text-gray-400">| {conductor.zona}</span>
                                            )}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Observaciones */}
                <div className="px-5 py-3 border-t border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                        Observaciones
                    </label>
                    <textarea
                        value={observaciones}
                        onChange={e => setObservaciones(e.target.value)}
                        placeholder="Añade observaciones para este servicio…"
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Footer acciones */}
                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
                    <button
                        onClick={onCerrar}
                        className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmar}
                        disabled={!conductorSeleccionado || guardando}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {guardando
                            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando…</>
                            : <><CheckCircle2 className="h-4 w-4" /> Confirmar Asignación</>
                        }
                    </button>
                </div>
            </div>
        </>
    );
}
