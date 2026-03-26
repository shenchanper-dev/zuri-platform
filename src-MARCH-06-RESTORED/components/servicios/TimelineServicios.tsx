import React from 'react';

interface Servicio {
    id: number;
    paciente_nombre: string;
    origen: string;
    destino: string;
    hora_recojo: string;
    hora_fin?: string;
    tipo_servicio: 'ambulatory' | 'wheelchair' | 'stretcher';
    estado: string;
    conductor_id?: number;
    conductor_nombre?: string;
    tarifa_calculada: number;
    distancia_km: number;
}

interface TimelineServiciosProps {
    servicios: Servicio[];
    onAsignarConductor: (servicioId: number) => void;
    onVerDetalles: (servicioId: number) => void;
}

export function TimelineServicios({ servicios, onAsignarConductor, onVerDetalles }: TimelineServiciosProps) {
    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'BUSCANDO_CONDUCTOR':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'ASIGNADO':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'EN_CURSO':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'COMPLETADO':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'CANCELADO':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getTipoServicioIcon = (tipo: string) => {
        switch (tipo) {
            case 'ambulatory':
                return '🚶';
            case 'wheelchair':
                return '♿';
            case 'stretcher':
                return '🛏️';
            default:
                return '🚗';
        }
    };

    const getEstadoLabel = (estado: string) => {
        const labels: Record<string, string> = {
            'PENDIENTE': 'Pendiente',
            'BUSCANDO_CONDUCTOR': 'Buscando Conductor',
            'ASIGNADO': 'Asignado',
            'EN_CURSO': 'En Curso',
            'COMPLETADO': 'Completado',
            'CANCELADO': 'Cancelado'
        };
        return labels[estado] || estado;
    };

    // Ordenar por hora de recojo
    const serviciosOrdenados = [...servicios].sort((a, b) => {
        return a.hora_recojo.localeCompare(b.hora_recojo);
    });

    if (servicios.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">📋 No hay servicios programados para hoy</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Timeline de Servicios ({servicios.length})
            </h3>

            {serviciosOrdenados.map((servicio) => (
                <div
                    key={servicio.id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                >
                    {/* Header con hora y estado */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">{getTipoServicioIcon(servicio.tipo_servicio)}</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-gray-900">
                                        🕐 {servicio.hora_recojo}
                                        {servicio.hora_fin && ` - ${servicio.hora_fin}`}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    👤 {servicio.paciente_nombre}
                                </p>
                            </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(servicio.estado)}`}>
                            {getEstadoLabel(servicio.estado)}
                        </span>
                    </div>

                    {/* Origen y Destino */}
                    <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">📍</span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Origen</p>
                                <p className="text-sm text-gray-600">{servicio.origen}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">🏥</span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Destino</p>
                                <p className="text-sm text-gray-600">{servicio.destino}</p>
                            </div>
                        </div>
                    </div>

                    {/* Info del conductor */}
                    {servicio.conductor_nombre ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-green-600">🚗</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-green-900">
                                        {servicio.conductor_nombre}
                                    </p>
                                    <p className="text-xs text-green-700">Conductor asignado</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-yellow-800">⏳ Sin conductor asignado</p>
                        </div>
                    )}

                    {/* Tarifa y distancia */}
                    <div className="flex items-center justify-between mb-3 text-sm">
                        <span className="text-gray-600">
                            📏 {servicio.distancia_km.toFixed(1)} km
                        </span>
                        <span className="font-bold text-green-600">
                            💰 S/ {servicio.tarifa_calculada.toFixed(2)}
                        </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onVerDetalles(servicio.id)}
                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Ver Detalles
                        </button>

                        {!servicio.conductor_id && servicio.estado === 'PENDIENTE' && (
                            <button
                                onClick={() => onAsignarConductor(servicio.id)}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Asignar Conductor
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
