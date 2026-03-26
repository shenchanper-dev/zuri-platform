'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SolicitudPreview {
    id: number;
    confirmado: boolean;
    fecha_servicio: string;
    hora_servicio: string;
    direccion_recojo: string;
    direccion_destino: string;
    observaciones: string;
    doctor_match: {
        encontrado: boolean;
        doctor_id?: number;
        nombre: string;
        cmp?: string;
        confianza: number;
    };
    conductor_match: {
        encontrado: boolean;
        conductor_id?: number;
        nombre: string;
        confianza: number;
    };
    validaciones: {
        fecha_valida: boolean;
        hora_valida: boolean;
        ubicacion_completa: boolean;
        doctor_asignado: boolean;
        conductor_asignado: boolean;
        warnings: string[];
    };
}

interface PreviewStats {
    total: number;
    confirmados: number;
    sin_confirmar: number;
    con_warnings: number;
    doctores_nuevos: number;
    conductores_sin_asignar: number;
    ubicaciones_incompletas: number;
}

interface ExcelPreviewProps {
    importacionId: number;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export default function ExcelPreviewComponent({ importacionId, onConfirm, onCancel }: ExcelPreviewProps) {
    const router = useRouter();
    const [solicitudes, setSolicitudes] = useState<SolicitudPreview[]>([]);
    const [stats, setStats] = useState<PreviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<SolicitudPreview>>({});
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [importacionEstado, setImportacionEstado] = useState<string>('');

    // Cargar preview
    useEffect(() => {
        fetchPreview();
    }, [importacionId]);

    const fetchPreview = async () => {
        try {
            const res = await fetch(`/api/importaciones/${importacionId}/preview`);
            if (!res.ok) throw new Error('Error al cargar preview');

            const data = await res.json();
            setSolicitudes(data.solicitudes);
            setStats(data.stats);

            // Determinar si es read-only basado en el estado
            const estado = data.importacion?.estado;
            setImportacionEstado(estado);
            if (estado && (estado === 'CONFIRMADO' || estado === 'COMPLETADO' || estado === 'CANCELADO')) {
                setIsReadOnly(true);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar preview');
        } finally {
            setLoading(false);
        }
    };

    // Editar solicitud
    const handleEdit = (solicitud: SolicitudPreview) => {
        if (isReadOnly) return;
        setEditingId(solicitud.id);
        setEditForm({
            fecha_servicio: solicitud.fecha_servicio,
            hora_servicio: solicitud.hora_servicio,
            direccion_recojo: solicitud.direccion_recojo,
            direccion_destino: solicitud.direccion_destino,
            observaciones: solicitud.observaciones
        });
    };

    const handleSaveEdit = async (id: number) => {
        try {
            const res = await fetch(`/api/solicitudes-servicios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) throw new Error('Error al guardar');

            // Actualizar lista local
            setSolicitudes(prev => prev.map(s =>
                s.id === id ? { ...s, ...editForm } : s
            ));

            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar cambios');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    // Confirmar importación
    const handleConfirm = async () => {
        if (isReadOnly) return;
        if (!confirm(`¿Confirmar ${stats?.sin_confirmar} servicios?`)) return;

        setProcessing(true);
        try {
            const res = await fetch(`/api/importaciones/${importacionId}/preview`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'confirmar',
                    revisado_por: 'admin' // TODO: obtener del usuario actual
                })
            });

            if (!res.ok) throw new Error('Error al confirmar');

            alert('Importación confirmada exitosamente');
            onConfirm?.();
            router.push('/dashboard/gestion-excel');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al confirmar importación');
        } finally {
            setProcessing(false);
        }
    };

    // Cancelar importación
    const handleCancelImport = async () => {
        if (isReadOnly) return;
        if (!confirm('¿Cancelar esta importación? Se eliminarán todos los servicios pendientes.')) return;

        setProcessing(true);
        try {
            const res = await fetch(`/api/importaciones/${importacionId}/preview`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'cancelar',
                    revisado_por: 'admin'
                })
            });

            if (!res.ok) throw new Error('Error al cancelar');

            alert('Importación cancelada');
            onCancel?.();
            router.push('/dashboard/gestion-excel');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cancelar importación');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando preview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isReadOnly ? `Detalle de Importación` : 'Preview de Importación'}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        {importacionEstado && (
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${importacionEstado === 'CONFIRMADO' || importacionEstado === 'COMPLETADO'
                                    ? 'bg-green-100 text-green-800'
                                    : importacionEstado === 'CANCELADO'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                {importacionEstado}
                            </span>
                        )}
                        <p className="text-gray-600">
                            {isReadOnly
                                ? 'Consulta los datos y estadísticas de esta importación.'
                                : 'Revisa y edita los servicios antes de confirmar.'}
                        </p>
                    </div>
                </div>
                {isReadOnly && (
                    <button
                        onClick={() => router.push('/dashboard/gestion-excel')}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <span>←</span> Volver a Lista
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                    {/* Mostrar cards relevantes según el estado */}
                    {!isReadOnly && (
                        <>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <p className="text-sm text-gray-600">Sin Confirmar</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.sin_confirmar}</p>
                            </div>
                        </>
                    )}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-600">Con Warnings</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.con_warnings}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-600">Doctores Nuevos</p>
                        <p className="text-2xl font-bold text-green-600">{stats.doctores_nuevos}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-600">Sin Conductor</p>
                        <p className="text-2xl font-bold text-red-600">{stats.conductores_sin_asignar}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-600">Ubicación Incompleta</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.ubicaciones_incompletas}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-600">Confirmados</p>
                        <p className="text-2xl font-bold text-gray-600">{stats.confirmados}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons (Solo si no es ReadOnly) */}
            {!isReadOnly && (
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={handleConfirm}
                        disabled={processing || !stats || stats.sin_confirmar === 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        {processing ? 'Procesando...' : `✓ Confirmar ${stats?.sin_confirmar || 0} Servicios`}
                    </button>
                    <button
                        onClick={handleCancelImport}
                        disabled={processing}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        ✕ Cancelar Importación
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicaciones</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warnings</th>
                                {!isReadOnly && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {solicitudes.map((solicitud, idx) => (
                                <tr key={solicitud.id} className={solicitud.validaciones.warnings.length > 0 ? 'bg-yellow-50' : ''}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>

                                    {/* Fecha */}
                                    <td className="px-4 py-3 text-sm">
                                        {editingId === solicitud.id ? (
                                            <input
                                                type="date"
                                                value={editForm.fecha_servicio || ''}
                                                onChange={(e) => setEditForm({ ...editForm, fecha_servicio: e.target.value })}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            <span className={solicitud.validaciones.fecha_valida ? 'text-gray-900' : 'text-red-600'}>
                                                {solicitud.fecha_servicio || 'N/A'}
                                            </span>
                                        )}
                                    </td>

                                    {/* Hora */}
                                    <td className="px-4 py-3 text-sm">
                                        {editingId === solicitud.id ? (
                                            <input
                                                type="time"
                                                value={editForm.hora_servicio || ''}
                                                onChange={(e) => setEditForm({ ...editForm, hora_servicio: e.target.value })}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            <span className={solicitud.validaciones.hora_valida ? 'text-gray-900' : 'text-red-600'}>
                                                {solicitud.hora_servicio || 'N/A'}
                                            </span>
                                        )}
                                    </td>

                                    {/* Doctor */}
                                    <td className="px-4 py-3 text-sm">
                                        <div>
                                            <div className={solicitud.doctor_match.encontrado ? 'text-green-600' : 'text-orange-600'}>
                                                {solicitud.doctor_match.nombre}
                                            </div>
                                            {solicitud.doctor_match.cmp && (
                                                <div className="text-xs text-gray-500">CMP: {solicitud.doctor_match.cmp}</div>
                                            )}
                                            <div className="text-xs text-gray-400">
                                                Confianza: {solicitud.doctor_match.confianza}%
                                            </div>
                                        </div>
                                    </td>

                                    {/* Conductor */}
                                    <td className="px-4 py-3 text-sm">
                                        <div className={solicitud.conductor_match.encontrado ? 'text-green-600' : 'text-red-600'}>
                                            {solicitud.conductor_match.nombre}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Confianza: {solicitud.conductor_match.confianza}%
                                        </div>
                                    </td>

                                    {/* Ubicaciones */}
                                    <td className="px-4 py-3 text-sm max-w-xs">
                                        {editingId === solicitud.id ? (
                                            <div className="space-y-1">
                                                <input
                                                    type="text"
                                                    placeholder="Dirección recojo"
                                                    value={editForm.direccion_recojo || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, direccion_recojo: e.target.value })}
                                                    className="border rounded px-2 py-1 w-full text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Dirección destino"
                                                    value={editForm.direccion_destino || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, direccion_destino: e.target.value })}
                                                    className="border rounded px-2 py-1 w-full text-xs"
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="text-xs">
                                                    <span className="font-medium">Recojo:</span> {solicitud.direccion_recojo || 'N/A'}
                                                </div>
                                                <div className="text-xs">
                                                    <span className="font-medium">Destino:</span> {solicitud.direccion_destino || 'N/A'}
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    {/* Warnings */}
                                    <td className="px-4 py-3 text-sm">
                                        {solicitud.validaciones.warnings.length > 0 ? (
                                            <div className="space-y-1">
                                                {solicitud.validaciones.warnings.map((warning, i) => (
                                                    <div key={i} className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                                                        {warning}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-green-600 text-xs">✓ OK</span>
                                        )}
                                    </td>

                                    {/* Acciones (Solo si no es ReadOnly) */}
                                    {!isReadOnly && (
                                        <td className="px-4 py-3 text-sm">
                                            {editingId === solicitud.id ? (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleSaveEdit(solicitud.id)}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(solicitud)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                                >
                                                    Editar
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {solicitudes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No hay servicios para mostrar
                </div>
            )}
        </div>
    );
}
