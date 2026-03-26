"use client";

import React, { useState, useMemo } from 'react';
import {
    Calendar, ClipboardList, Clock, CheckCircle2, AlertCircle,
    Filter, Search, ChevronRight, Plus, RefreshCw, FileSpreadsheet,
    MoreHorizontal, Eye, Edit, Trash2, Download, Users, MapPin
} from 'lucide-react';
import { useProgramaciones, Programacion } from '@/hooks/useProgramaciones';

// ============================================================================
// CONSTANTES
// ============================================================================

const ESTADOS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    BORRADOR: { label: 'Borrador', color: 'text-gray-600', bg: 'bg-gray-100', icon: ClipboardList },
    CONFIRMADO: { label: 'Confirmado', color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle2 },
    EN_EJECUCION: { label: 'En Ejecución', color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock },
    COMPLETADO: { label: 'Completado', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
    CANCELADO: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
};

const CLIENTES_ESPECIALES = [
    { id: 1, codigo: 'SANNA', nombre: 'Clínica SANNA' },
    { id: 2, codigo: 'CI', nombre: 'Clínica Internacional' },
    { id: 3, codigo: 'JP', nombre: 'Servicios JP' },
    { id: 4, codigo: 'SM', nombre: 'Servicios SM' },
    { id: 5, codigo: 'OTRO', nombre: 'Otro' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface ProgramacionDashboardProps {
    onVerDetalle: (id: number) => void;
}

export default function ProgramacionDashboard({ onVerDetalle }: ProgramacionDashboardProps) {
    const {
        programaciones, stats, loading, error, filtros, setFiltros,
        cargarProgramaciones, actualizarEstado, eliminarProgramacion,
    } = useProgramaciones();

    const [busqueda, setBusqueda] = useState('');
    const [menuAbierto, setMenuAbierto] = useState<number | null>(null);

    // Filtrar por búsqueda local
    const programacionesFiltradas = useMemo(() => {
        if (!busqueda.trim()) return programaciones;
        const q = busqueda.toLowerCase();
        return programaciones.filter(p =>
            (p.codigo_programacion || '').toLowerCase().includes(q) ||
            (p.cliente_nombre || '').toLowerCase().includes(q) ||
            (p.cliente_especial_nombre || '').toLowerCase().includes(q)
        );
    }, [programaciones, busqueda]);

    // Eliminar con confirmación
    const handleEliminar = async (id: number, codigo: string) => {
        if (!confirm(`¿Eliminar programación ${codigo}? Esta acción no se puede deshacer.`)) return;
        await eliminarProgramacion(id);
        setMenuAbierto(null);
    };

    // Cambiar estado
    const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
        await actualizarEstado(id, nuevoEstado);
        setMenuAbierto(null);
    };

    return (
        <div className="space-y-6">
            {/* ── STATS CARDS ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { key: 'total', label: 'Total', value: stats.total, color: 'bg-indigo-500', icon: ClipboardList },
                    { key: 'borradores', label: 'Borradores', value: stats.borradores, color: 'bg-gray-500', icon: ClipboardList },
                    { key: 'confirmados', label: 'Confirmados', value: stats.confirmados, color: 'bg-blue-500', icon: CheckCircle2 },
                    { key: 'en_ejecucion', label: 'En Ejecución', value: stats.en_ejecucion, color: 'bg-amber-500', icon: Clock },
                    { key: 'completados', label: 'Completados', value: stats.completados, color: 'bg-green-500', icon: CheckCircle2 },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.key}
                            onClick={() => {
                                if (stat.key === 'total') setFiltros({});
                                else if (stat.key === 'borradores') setFiltros({ estado: 'BORRADOR' });
                                else if (stat.key === 'confirmados') setFiltros({ estado: 'CONFIRMADO' });
                                else if (stat.key === 'en_ejecucion') setFiltros({ estado: 'EN_EJECUCION' });
                                else if (stat.key === 'completados') setFiltros({ estado: 'COMPLETADO' });
                            }}
                            className={`cursor-pointer rounded-xl p-4 text-white ${stat.color} shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">{stat.label}</p>
                                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <Icon className="h-10 w-10 opacity-30" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── FILTROS Y BÚSQUEDA ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    {/* Búsqueda */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por código o cliente..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Filtro Fecha */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <input
                            type="date"
                            value={filtros.fecha || ''}
                            onChange={e => setFiltros({ ...filtros, fecha: e.target.value || undefined })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filtro Estado */}
                    <select
                        value={filtros.estado || ''}
                        onChange={e => setFiltros({ ...filtros, estado: e.target.value || undefined })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos los estados</option>
                        {Object.entries(ESTADOS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>

                    {/* Botones */}
                    <button
                        onClick={cargarProgramaciones}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>

                {/* Filtros activos */}
                {(filtros.estado || filtros.fecha) && (
                    <div className="flex items-center gap-2 mt-3">
                        <Filter className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-500">Filtros activos:</span>
                        {filtros.estado && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {ESTADOS_CONFIG[filtros.estado]?.label}
                                <button onClick={() => setFiltros({ ...filtros, estado: undefined })} className="hover:text-blue-900">✕</button>
                            </span>
                        )}
                        {filtros.fecha && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {filtros.fecha}
                                <button onClick={() => setFiltros({ ...filtros, fecha: undefined })} className="hover:text-blue-900">✕</button>
                            </span>
                        )}
                        <button onClick={() => setFiltros({})} className="text-xs text-red-500 hover:text-red-700 ml-2">
                            Limpiar todo
                        </button>
                    </div>
                )}
            </div>

            {/* ── ERROR ── */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* ── TABLA ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
                        <p className="text-gray-500">Cargando programaciones...</p>
                    </div>
                ) : programacionesFiltradas.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-lg font-medium">No hay programaciones</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {filtros.estado || filtros.fecha
                                ? 'Prueba cambiando los filtros'
                                : 'Genera una desde Gestión Excel → Programar'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Servicios</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asignados</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {programacionesFiltradas.map(prog => {
                                    const estadoCfg = ESTADOS_CONFIG[prog.estado] || ESTADOS_CONFIG.BORRADOR;
                                    const EstadoIcon = estadoCfg.icon;

                                    return (
                                        <tr
                                            key={prog.id}
                                            className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                            onClick={() => onVerDetalle(prog.id)}
                                        >
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-sm font-semibold text-indigo-600">
                                                    {prog.codigo_programacion}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {prog.fecha_programacion ? (() => {
                                                        const iso = prog.fecha_programacion.substring(0, 10);
                                                        const [y, m, d] = iso.split('-').map(Number);
                                                        return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
                                                            weekday: 'short', day: 'numeric', month: 'short'
                                                        });
                                                    })() : '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {prog.cliente_especial_nombre || prog.cliente_nombre || '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoCfg.bg} ${estadoCfg.color}`}>
                                                    <EstadoIcon className="h-3.5 w-3.5" />
                                                    {estadoCfg.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {prog.total_detalles || 0}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Users className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm font-semibold text-green-600">
                                                        {prog.detalles_asignados || 0}
                                                    </span>
                                                    <span className="text-xs text-gray-400">/ {prog.total_detalles || 0}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setMenuAbierto(menuAbierto === prog.id ? null : prog.id)}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                                                    >
                                                        <MoreHorizontal className="h-5 w-5 text-gray-400" />
                                                    </button>

                                                    {menuAbierto === prog.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                                                            <button
                                                                onClick={() => { onVerDetalle(prog.id); setMenuAbierto(null); }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Eye className="h-4 w-4" /> Ver detalle
                                                            </button>

                                                            {prog.estado === 'BORRADOR' && (
                                                                <button
                                                                    onClick={() => handleCambiarEstado(prog.id, 'CONFIRMADO')}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" /> Confirmar
                                                                </button>
                                                            )}
                                                            {prog.estado === 'CONFIRMADO' && (
                                                                <button
                                                                    onClick={() => handleCambiarEstado(prog.id, 'EN_EJECUCION')}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
                                                                >
                                                                    <Clock className="h-4 w-4" /> Iniciar Ejecución
                                                                </button>
                                                            )}
                                                            {prog.estado === 'EN_EJECUCION' && (
                                                                <button
                                                                    onClick={() => handleCambiarEstado(prog.id, 'COMPLETADO')}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" /> Completar
                                                                </button>
                                                            )}

                                                            <div className="border-t border-gray-100 my-1" />
                                                            <button
                                                                onClick={() => handleEliminar(prog.id, prog.codigo_programacion)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" /> Eliminar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
