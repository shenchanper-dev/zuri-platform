import React, { useState, useEffect } from 'react';

interface Candidato {
    id: number;
    nombreCompleto: string;
    calificacion_promedio: number;
    distancia_km: number;
    tiempo_llegada_min: number;
    vehiculo: {
        modelo: string;
        placa: string;
        color: string;
    };
    foto_url?: string;
}

interface MonitorDispatchProps {
    servicioId: number;
    candidatos: Candidato[];
    estado: 'buscando' | 'enviando_oferta' | 'esperando_respuesta' | 'asignado' | 'error';
    conductorActual?: Candidato;
    tiempoRestante?: number;
    onCancelar?: () => void;
}

export function MonitorDispatch({
    servicioId,
    candidatos,
    estado,
    conductorActual,
    tiempoRestante = 15,
    onCancelar
}: MonitorDispatchProps) {
    const [segundos, setSegundos] = useState(tiempoRestante);

    useEffect(() => {
        if (estado === 'esperando_respuesta' && segundos > 0) {
            const interval = setInterval(() => {
                setSegundos(prev => Math.max(0, prev - 1));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [estado, segundos]);

    const getEstadoInfo = () => {
        switch (estado) {
            case 'buscando':
                return {
                    icon: '🔍',
                    title: 'Buscando conductores...',
                    color: 'bg-blue-50 border-blue-200',
                    textColor: 'text-blue-900'
                };
            case 'enviando_oferta':
                return {
                    icon: '📡',
                    title: 'Enviando oferta...',
                    color: 'bg-purple-50 border-purple-200',
                    textColor: 'text-purple-900'
                };
            case 'esperando_respuesta':
                return {
                    icon: '⏱️',
                    title: 'Esperando respuesta del conductor',
                    color: 'bg-yellow-50 border-yellow-200',
                    textColor: 'text-yellow-900'
                };
            case 'asignado':
                return {
                    icon: '✅',
                    title: 'Conductor asignado exitosamente',
                    color: 'bg-green-50 border-green-200',
                    textColor: 'text-green-900'
                };
            case 'error':
                return {
                    icon: '⚠️',
                    title: 'Error en el dispatch',
                    color: 'bg-red-50 border-red-200',
                    textColor: 'text-red-900'
                };
            default:
                return {
                    icon: '🔄',
                    title: 'Procesando...',
                    color: 'bg-gray-50 border-gray-200',
                    textColor: 'text-gray-900'
                };
        }
    };

    const estadoInfo = getEstadoInfo();

    return (
        <div className={`rounded-lg border-2 p-6 ${estadoInfo.color}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{estadoInfo.icon}</span>
                    <div>
                        <h3 className={`text-lg font-bold ${estadoInfo.textColor}`}>
                            {estadoInfo.title}
                        </h3>
                        <p className="text-sm text-gray-600">Servicio #{servicioId}</p>
                    </div>
                </div>

                {onCancelar && estado !== 'asignado' && (
                    <button
                        onClick={onCancelar}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
            </div>

            {/* Countdown para esperando_respuesta */}
            {estado === 'esperando_respuesta' && conductorActual && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Oferta enviada a: {conductorActual.nombreCompleto}
                        </span>
                        <span className="text-2xl font-bold text-yellow-600">
                            {segundos}s
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(segundos / 15) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Conductor asignado */}
            {estado === 'asignado' && conductorActual && (
                <div className="bg-white rounded-lg p-4 border border-green-300">
                    <div className="flex items-center gap-4">
                        {conductorActual.foto_url && (
                            <img
                                src={conductorActual.foto_url}
                                alt={conductorActual.nombreCompleto}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        )}
                        <div className="flex-1">
                            <p className="font-bold text-gray-900">{conductorActual.nombreCompleto}</p>
                            <p className="text-sm text-gray-600">
                                ⭐ {conductorActual.calificacion_promedio.toFixed(1)} |
                                📏 {conductorActual.distancia_km.toFixed(1)} km |
                                ⏱️ {conductorActual.tiempo_llegada_min} min
                            </p>
                            <p className="text-sm text-gray-600">
                                🚗 {conductorActual.vehiculo.color} {conductorActual.vehiculo.modelo} |
                                🔖 {conductorActual.vehiculo.placa}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de candidatos */}
            {(estado === 'buscando' || estado === 'enviando_oferta') && candidatos.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                        ✅ {candidatos.length} conductores disponibles encontrados
                    </p>

                    <div className="space-y-2">
                        {candidatos.slice(0, 3).map((candidato, index) => (
                            <div
                                key={candidato.id}
                                className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-3"
                            >
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                </div>

                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {candidato.nombreCompleto}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        📏 {candidato.distancia_km.toFixed(1)} km |
                                        ⏱️ {candidato.tiempo_llegada_min} min |
                                        ⭐ {candidato.calificacion_promedio.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sin candidatos */}
            {estado === 'buscando' && candidatos.length === 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        No se encontraron conductores disponibles en este momento
                    </p>
                </div>
            )}
        </div>
    );
}
