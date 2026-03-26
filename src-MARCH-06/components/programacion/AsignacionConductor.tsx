"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Search, User, MapPin, Phone, Car, CheckCircle2,
    AlertTriangle, Clock, Shield, RefreshCw, UserPlus,
    CircleDot
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

interface ConductorDisponible {
    id: number;
    nombreCompleto: string;
    dni: string;
    celular1: string | null;
    distrito: string | null;
    vehiculo_placa: string | null;
    tipo_vehiculo: string | null;
    estado: string;
    calificacion_promedio: number;
    total_servicios: number;
    // Conflictos
    tieneConflicto?: boolean;
    conflictoDetalle?: string;
}

interface AsignacionConductorProps {
    detalleId: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    doctorNombre: string;
    ubicacion: string | null;
    onAsignar: (detalleId: number, conductorId: number, conductorNombre: string) => Promise<boolean>;
    onCerrar: () => void;
}

// ============================================================================
// ESTADOS DEL CONDUCTOR
// ============================================================================

const ESTADO_CONDUCTOR: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVO: { label: 'Activo', color: 'text-green-700', bg: 'bg-green-100' },
    INACTIVO: { label: 'Inactivo', color: 'text-gray-600', bg: 'bg-gray-100' },
    SUSPENDIDO: { label: 'Suspendido', color: 'text-red-600', bg: 'bg-red-100' },
    PENDIENTE: { label: 'Pendiente', color: 'text-amber-600', bg: 'bg-amber-100' },
    VACACIONES: { label: 'Vacaciones', color: 'text-blue-600', bg: 'bg-blue-100' },
};

// ============================================================================
// COMPONENTE
// ============================================================================

export default function AsignacionConductor({
    detalleId, fecha, horaInicio, horaFin, doctorNombre, ubicacion,
    onAsignar, onCerrar
}: AsignacionConductorProps) {

    const [conductores, setConductores] = useState<ConductorDisponible[]>([]);
    const [loading, setLoading] = useState(true);
    const [asignando, setAsignando] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

    // Nuevo conductor inline
    const [mostrarNuevo, setMostrarNuevo] = useState(false);
    const [nuevoDni, setNuevoDni] = useState('');
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [creandoConductor, setCreandoConductor] = useState(false);

    // Cargar TODOS los conductores (Clientes Especiales permite activos e inactivos)
    useEffect(() => {
        const cargar = async () => {
            setLoading(true);
            try {
                // Cargar todos (sin filtro de estado) para Clientes Especiales
                const res = await fetch('/api/conductores?limit=500');
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();

                const lista: ConductorDisponible[] = (data.conductores || data || []).map((c: any) => ({
                    id: c.id,
                    nombreCompleto: c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`.trim() || c.dni,
                    dni: c.dni,
                    celular1: c.celular1,
                    distrito: c.distrito,
                    vehiculo_placa: c.vehiculo_placa || c.placa,
                    tipo_vehiculo: c.tipo_vehiculo,
                    estado: c.estado || 'ACTIVO',
                    calificacion_promedio: parseFloat(c.calificacion_promedio) || 0,
                    total_servicios: c.total_servicios || 0,
                    tieneConflicto: false,
                }));

                // Verificar conflictos de horario
                try {
                    const conflRes = await fetch(`/api/conductores-conflictos?fecha=${fecha}&hora_inicio=${horaInicio}&hora_fin=${horaFin}`);
                    if (conflRes.ok) {
                        const conflData = await conflRes.json();
                        const idsConflicto = new Set((conflData.conflictos || []).map((c: any) => c.conductor_id));
                        lista.forEach(c => {
                            if (idsConflicto.has(c.id)) {
                                c.tieneConflicto = true;
                                const conflicto = (conflData.conflictos || []).find((x: any) => x.conductor_id === c.id);
                                c.conflictoDetalle = conflicto?.detalle || 'Conflicto de horario';
                            }
                        });
                    }
                } catch {
                    console.warn('[Asignación] API de conflictos no disponible');
                }

                // Ordenar: activos primero, luego sin conflictos, luego por calificación
                lista.sort((a, b) => {
                    // Activos primero
                    if (a.estado === 'ACTIVO' && b.estado !== 'ACTIVO') return -1;
                    if (a.estado !== 'ACTIVO' && b.estado === 'ACTIVO') return 1;
                    // Sin conflicto primero
                    if (a.tieneConflicto && !b.tieneConflicto) return 1;
                    if (!a.tieneConflicto && b.tieneConflicto) return -1;
                    return (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0);
                });

                setConductores(lista);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, [fecha, horaInicio, horaFin]);

    // Búsqueda y filtro local
    const conductoresFiltrados = useMemo(() => {
        let lista = conductores;

        // Filtro por estado
        if (filtroEstado !== 'TODOS') {
            lista = lista.filter(c => c.estado === filtroEstado);
        }

        // Búsqueda
        if (busqueda.trim()) {
            const q = busqueda.toLowerCase();
            lista = lista.filter(c =>
                c.nombreCompleto.toLowerCase().includes(q) ||
                c.dni.includes(q) ||
                (c.vehiculo_placa || '').toLowerCase().includes(q) ||
                (c.distrito || '').toLowerCase().includes(q)
            );
        }
        return lista;
    }, [conductores, busqueda, filtroEstado]);

    // Conteos por estado
    const conteos = useMemo(() => {
        const c = { TODOS: conductores.length, ACTIVO: 0, INACTIVO: 0, OTROS: 0 };
        conductores.forEach(x => {
            if (x.estado === 'ACTIVO') c.ACTIVO++;
            else if (x.estado === 'INACTIVO') c.INACTIVO++;
            else c.OTROS++;
        });
        return c;
    }, [conductores]);

    // Asignar
    const handleAsignar = async (conductor: ConductorDisponible) => {
        // Advertencia para conductores no activos
        if (conductor.estado !== 'ACTIVO') {
            if (!confirm(`⚠️ ${conductor.nombreCompleto} está en estado "${conductor.estado}".\n\n¿Desea coordinarlo y asignar de todas formas?`)) return;
        }
        if (conductor.tieneConflicto) {
            if (!confirm(`⚠️ ${conductor.nombreCompleto} tiene conflicto de horario:\n${conductor.conflictoDetalle}\n\n¿Asignar de todas formas?`)) return;
        }
        setAsignando(conductor.id);
        setError(null);
        const ok = await onAsignar(detalleId, conductor.id, conductor.nombreCompleto);
        if (ok) {
            onCerrar();
        } else {
            setAsignando(null);
        }
    };

    // Crear conductor nuevo
    const handleCrearConductor = async () => {
        if (!nuevoDni.trim() || nuevoDni.length !== 8) {
            setError('El DNI debe tener 8 dígitos');
            return;
        }
        setCreandoConductor(true);
        setError(null);
        try {
            const res = await fetch('/api/conductores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni: nuevoDni.trim(),
                    nombreCompleto: nuevoNombre.trim() || null,
                    estado: 'PENDIENTE',
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Error ${res.status}`);
            }
            const data = await res.json();
            const nuevo: ConductorDisponible = {
                id: data.conductor?.id || data.id,
                nombreCompleto: nuevoNombre.trim() || nuevoDni,
                dni: nuevoDni.trim(),
                celular1: null,
                distrito: null,
                vehiculo_placa: null,
                tipo_vehiculo: null,
                estado: 'PENDIENTE',
                calificacion_promedio: 0,
                total_servicios: 0,
            };
            // Agregar al inicio y asignar directamente
            setConductores(prev => [nuevo, ...prev]);
            setMostrarNuevo(false);
            setNuevoDni('');
            setNuevoNombre('');
            // Auto-asignar
            await handleAsignar(nuevo);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreandoConductor(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Asignar Conductor</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" /> {doctorNombre}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {horaInicio?.slice(0, 5)} - {horaFin?.slice(0, 5)}
                            </span>
                            {ubicacion && (
                                <span className="flex items-center gap-1 max-w-[200px] truncate">
                                    <MapPin className="h-3.5 w-3.5" /> {ubicacion}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-gray-100 transition">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Búsqueda + Filtros + Nuevo */}
                <div className="px-6 py-3 border-b border-gray-100 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, DNI o placa..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={() => setMostrarNuevo(!mostrarNuevo)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition whitespace-nowrap"
                        >
                            <UserPlus className="h-4 w-4" /> Nuevo
                        </button>
                    </div>

                    {/* Tabs de estado */}
                    <div className="flex items-center gap-1">
                        {[
                            { key: 'TODOS', label: 'Todos', count: conteos.TODOS },
                            { key: 'ACTIVO', label: 'Activos', count: conteos.ACTIVO },
                            { key: 'INACTIVO', label: 'Inactivos', count: conteos.INACTIVO },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFiltroEstado(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filtroEstado === tab.key
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    {/* Crear conductor nuevo inline */}
                    {mostrarNuevo && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <p className="text-sm font-medium text-green-800 mb-2">Crear y asignar conductor nuevo</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="DNI (8 dígitos)"
                                    value={nuevoDni}
                                    onChange={e => setNuevoDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    className="w-32 px-3 py-1.5 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Nombre completo (opcional)"
                                    value={nuevoNombre}
                                    onChange={e => setNuevoNombre(e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    onClick={handleCrearConductor}
                                    disabled={creandoConductor || nuevoDni.length !== 8}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {creandoConductor ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Crear y Asignar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Lista de conductores */}
                <div className="flex-1 overflow-y-auto px-6 py-3">
                    {loading ? (
                        <div className="py-8 text-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">Cargando conductores...</p>
                        </div>
                    ) : conductoresFiltrados.length === 0 ? (
                        <div className="py-8 text-center">
                            <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No se encontraron conductores</p>
                            <button
                                onClick={() => setMostrarNuevo(true)}
                                className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                                + Crear conductor nuevo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {conductoresFiltrados.map(c => {
                                const estCfg = ESTADO_CONDUCTOR[c.estado] || ESTADO_CONDUCTOR.ACTIVO;

                                return (
                                    <div
                                        key={c.id}
                                        className={`rounded-xl border p-3 transition-all hover:shadow-md ${c.tieneConflicto
                                                ? 'border-amber-200 bg-amber-50/50'
                                                : c.estado !== 'ACTIVO'
                                                    ? 'border-gray-200 bg-gray-50/50'
                                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar */}
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${c.tieneConflicto ? 'bg-amber-400' :
                                                        c.estado !== 'ACTIVO' ? 'bg-gray-400' :
                                                            'bg-indigo-500'
                                                    }`}>
                                                    {c.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900 text-sm">{c.nombreCompleto}</p>
                                                        {/* Badge de estado del conductor */}
                                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${estCfg.bg} ${estCfg.color}`}>
                                                            <CircleDot className="h-2.5 w-2.5" />
                                                            {estCfg.label}
                                                        </span>
                                                        {c.tieneConflicto && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                                                <AlertTriangle className="h-3 w-3" /> Conflicto
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                        <span>DNI: {c.dni}</span>
                                                        {c.vehiculo_placa && (
                                                            <span className="flex items-center gap-1">
                                                                <Car className="h-3 w-3" /> {c.vehiculo_placa}
                                                            </span>
                                                        )}
                                                        {c.distrito && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" /> {c.distrito}
                                                            </span>
                                                        )}
                                                        {c.calificacion_promedio > 0 && (
                                                            <span className="text-yellow-600">★ {c.calificacion_promedio.toFixed(1)}</span>
                                                        )}
                                                        <span className="text-gray-400">{c.total_servicios} servicios</span>
                                                    </div>
                                                    {c.tieneConflicto && c.conflictoDetalle && (
                                                        <p className="text-xs text-amber-600 mt-1">{c.conflictoDetalle}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleAsignar(c)}
                                                disabled={asignando === c.id}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${c.tieneConflicto
                                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        : c.estado !== 'ACTIVO'
                                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    } disabled:opacity-50`}
                                            >
                                                {asignando === c.id ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                )}
                                                Asignar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-400 text-center">
                        {conductoresFiltrados.length} conductores
                        {conductoresFiltrados.filter(c => c.tieneConflicto).length > 0 && (
                            <span className="text-amber-500 ml-2">
                                ({conductoresFiltrados.filter(c => c.tieneConflicto).length} con conflictos)
                            </span>
                        )}
                        {conductoresFiltrados.filter(c => c.estado !== 'ACTIVO').length > 0 && (
                            <span className="text-gray-500 ml-2">
                                · {conductoresFiltrados.filter(c => c.estado !== 'ACTIVO').length} no activos
                            </span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
