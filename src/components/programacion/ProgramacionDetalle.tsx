"use client";

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Calendar, Clock, User, MapPin, CheckCircle2,
    AlertCircle, UserPlus, FileText, ChevronDown, ChevronUp,
    Download, Users, ClipboardList, Stethoscope, RefreshCw
} from 'lucide-react';
import { ProgramacionDetalle as DetalleTipo, Programacion } from '@/hooks/useProgramaciones';

// ============================================================================
// ESTADOS
// ============================================================================

const ESTADOS_DETALLE: Record<string, { label: string; color: string; bg: string }> = {
    PROGRAMADO: { label: 'Programado', color: 'text-gray-600', bg: 'bg-gray-100' },
    ASIGNADO: { label: 'Asignado', color: 'text-blue-600', bg: 'bg-blue-100' },
    EN_CURSO: { label: 'En Curso', color: 'text-amber-600', bg: 'bg-amber-100' },
    COMPLETADO: { label: 'Completado', color: 'text-green-600', bg: 'bg-green-100' },
    CANCELADO: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-100' },
    NO_DISPONIBLE: { label: 'No Disponible', color: 'text-red-600', bg: 'bg-red-100' },
};

const ESTADOS_PROG: Record<string, { label: string; color: string; bg: string }> = {
    BORRADOR: { label: 'Borrador', color: 'text-gray-700', bg: 'bg-gray-100' },
    CONFIRMADO: { label: 'Confirmado', color: 'text-blue-700', bg: 'bg-blue-100' },
    EN_EJECUCION: { label: 'En Ejecución', color: 'text-amber-700', bg: 'bg-amber-100' },
    COMPLETADO: { label: 'Completado', color: 'text-green-700', bg: 'bg-green-100' },
    CANCELADO: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100' },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface ProgramacionDetalleProps {
    programacion: Programacion;
    detalles: DetalleTipo[];
    loading: boolean;
    onVolver: () => void;
    onAsignarConductor: (detalleId: number) => void;
    onActualizarEstado: (id: number, estado: string) => Promise<boolean>;
    onRecargar: () => void;
}

export default function ProgramacionDetalleView({
    programacion, detalles, loading, onVolver,
    onAsignarConductor, onActualizarEstado, onRecargar
}: ProgramacionDetalleProps) {

    const [expandido, setExpandido] = useState<number | null>(null);
    const estProg = ESTADOS_PROG[programacion.estado] || ESTADOS_PROG.BORRADOR;

    // Estadísticas del detalle
    const totalDetalles = detalles.length;
    const asignados = detalles.filter(d => d.conductor_id).length;
    const completados = detalles.filter(d => d.estado === 'COMPLETADO').length;
    const sinAsignar = totalDetalles - asignados;
    const progreso = totalDetalles > 0 ? Math.round((completados / totalDetalles) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* ── HEADER ── */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onVolver}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {programacion.codigo_programacion}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${estProg.bg} ${estProg.color}`}>
                                {estProg.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {programacion.fecha_programacion
                                    ? (() => {
                                        const iso = programacion.fecha_programacion.substring(0, 10);
                                        const [y, m, d] = iso.split('-').map(Number);
                                        return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
                                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                        });
                                    })()
                                    : '-'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {programacion.cliente_especial_nombre || programacion.cliente_nombre || 'Sin cliente'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onRecargar}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Botones de flujo de estado */}
                    {programacion.estado === 'BORRADOR' && (
                        <button
                            onClick={() => onActualizarEstado(programacion.id, 'CONFIRMADO')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                        >
                            <CheckCircle2 className="h-4 w-4" /> Confirmar
                        </button>
                    )}
                    {programacion.estado === 'CONFIRMADO' && (
                        <button
                            onClick={() => onActualizarEstado(programacion.id, 'EN_EJECUCION')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                        >
                            <Clock className="h-4 w-4" /> Iniciar Ejecución
                        </button>
                    )}
                    {programacion.estado === 'EN_EJECUCION' && (
                        <button
                            onClick={() => onActualizarEstado(programacion.id, 'COMPLETADO')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                        >
                            <CheckCircle2 className="h-4 w-4" /> Completar
                        </button>
                    )}
                </div>
            </div>

            {/* ── MINI STATS ── */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-gray-500 uppercase font-medium">Total Servicios</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalDetalles}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-gray-500 uppercase font-medium">Asignados</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{asignados}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-gray-500 uppercase font-medium">Sin Asignar</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{sinAsignar}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-gray-500 uppercase font-medium">Progreso</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold text-green-600">{progreso}%</p>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${progreso}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABLA DE DETALLES ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Detalle de Servicios
                    </h3>
                    <span className="text-xs text-gray-400">{totalDetalles} servicios</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Cargando detalles...</p>
                    </div>
                ) : detalles.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No hay detalles en esta programación</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">#</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Conductor</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Horario</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Turno</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detalles.map((det, idx) => {
                                    const estDet = ESTADOS_DETALLE[det.estado] || ESTADOS_DETALLE.PROGRAMADO;
                                    const isExpanded = expandido === det.id;

                                    return (
                                        <React.Fragment key={det.id}>
                                            <tr
                                                className={`hover:bg-blue-50/30 transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`}
                                                onClick={() => setExpandido(isExpanded ? null : det.id)}
                                            >
                                                <td className="py-3 px-4 text-sm text-gray-400 font-mono">{det.orden || idx + 1}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Stethoscope className="h-4 w-4 text-indigo-400 shrink-0" />
                                                        <span className="text-sm font-medium text-gray-900">{det.doctor_nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {det.conductor_id ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                                                <User className="h-3.5 w-3.5 text-green-600" />
                                                            </div>
                                                            <span className="text-sm text-gray-900">
                                                                {det.conductor_nombre_bd || det.conductor_nombre}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-amber-500 italic">Sin asignar</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1 text-sm text-gray-700">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        {det.hora_inicio?.slice(0, 5)} - {det.hora_fin?.slice(0, 5)}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${det.turno?.includes('M') ? 'bg-yellow-100 text-yellow-700' :
                                                        det.turno?.includes('T') ? 'bg-orange-100 text-orange-700' :
                                                            det.turno?.includes('N') ? 'bg-indigo-100 text-indigo-700' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {det.turno || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600 max-w-[200px] truncate" title={det.ubicacion || det.direccion_completa || ''}>
                                                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                        {det.ubicacion || det.direccion_completa || '-'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estDet.bg} ${estDet.color}`}>
                                                        {estDet.label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                                                    {!det.conductor_id && (
                                                        <button
                                                            onClick={() => onAsignarConductor(det.id)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                                                        >
                                                            <UserPlus className="h-3.5 w-3.5" /> Asignar
                                                        </button>
                                                    )}
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-gray-400 inline ml-2" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-gray-400 inline ml-2" />
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Fila expandida con info adicional */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} className="bg-gray-50/50 px-8 py-4">
                                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-gray-400 text-xs uppercase font-medium mb-1">Dirección Completa</p>
                                                                <p className="text-gray-700">{det.direccion_completa || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-400 text-xs uppercase font-medium mb-1">Calificación</p>
                                                                <p className="text-gray-700">
                                                                    {det.calificacion_desc ? (
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: det.calificacion_color || '#gray' }} />
                                                                            {det.calificacion_desc}
                                                                        </span>
                                                                    ) : '-'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-400 text-xs uppercase font-medium mb-1">Motivo No Disponibilidad</p>
                                                                <p className="text-gray-700">{det.motivo_desc || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-400 text-xs uppercase font-medium mb-1">Observaciones</p>
                                                                <p className="text-gray-700">{det.observaciones || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-400 text-xs uppercase font-medium mb-1">Incidencias</p>
                                                                <p className="text-gray-700">{det.incidencias || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-400 text-xs uppercase font-medium mb-1">Área de Servicio</p>
                                                                <p className="text-gray-700">{det.area_nombre || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── NOTAS ── */}
            {programacion.notas && (
                <div className="bg-white rounded-xl border p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Notas
                    </h3>
                    <p className="text-sm text-gray-600">{programacion.notas}</p>
                </div>
            )}
        </div>
    );
}
