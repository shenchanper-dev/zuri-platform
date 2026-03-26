import React, { useState } from 'react';
import { MonitorDispatch } from './MonitorDispatch';

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

interface DispatchAutomaticoProps {
    servicioId: number;
    onDispatchCompleto?: (conductorId: number) => void;
    onError?: (error: string) => void;
}

export function DispatchAutomatico({
    servicioId,
    onDispatchCompleto,
    onError
}: DispatchAutomaticoProps) {
    const [modo, setModo] = useState<'seleccion' | 'automatico' | 'manual'>('seleccion');
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [estadoDispatch, setEstadoDispatch] = useState<'buscando' | 'enviando_oferta' | 'esperando_respuesta' | 'asignado' | 'error'>('buscando');
    const [conductorActual, setConductorActual] = useState<Candidato | undefined>();
    const [loading, setLoading] = useState(false);

    const iniciarDispatchAutomatico = async () => {
        setModo('automatico');
        setLoading(true);
        setEstadoDispatch('buscando');

        try {
            // 1. Buscar candidatos
            const response = await fetch('/api/servicios/dispatch-automatico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ servicio_id: servicioId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error en dispatch automático');
            }

            const data = await response.json();
            setCandidatos(data.candidatos || []);

            if (data.candidatos.length === 0) {
                setEstadoDispatch('error');
                if (onError) onError('No hay conductores disponibles');
                return;
            }

            // 2. Enviar oferta al primer candidato
            setEstadoDispatch('enviando_oferta');
            setConductorActual(data.candidatos[0]);

            // Simular envío de oferta (en producción esto sería vía WebSocket)
            setTimeout(() => {
                setEstadoDispatch('esperando_respuesta');

                // Simular respuesta después de 15 segundos (en producción vendría del WebSocket)
                setTimeout(async () => {
                    // Intentar asignar
                    try {
                        const assignResponse = await fetch(`/api/servicios/ofertas/${servicioId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                accion: 'aceptar',
                                conductor_id: data.candidatos[0].id
                            })
                        });

                        if (assignResponse.ok) {
                            setEstadoDispatch('asignado');
                            if (onDispatchCompleto) onDispatchCompleto(data.candidatos[0].id);
                        } else {
                            throw new Error('Error al asignar conductor');
                        }
                    } catch (err: any) {
                        setEstadoDispatch('error');
                        if (onError) onError(err.message);
                    }
                }, 15000);
            }, 1000);

        } catch (err: any) {
            setEstadoDispatch('error');
            if (onError) onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const asignarManual = async (conductorId: number) => {
        setLoading(true);

        try {
            const response = await fetch(`/api/servicios/ofertas/${servicioId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'aceptar',
                    conductor_id: conductorId
                })
            });

            if (!response.ok) {
                throw new Error('Error al asignar conductor');
            }

            const conductor = candidatos.find(c => c.id === conductorId);
            setConductorActual(conductor);
            setEstadoDispatch('asignado');

            if (onDispatchCompleto) onDispatchCompleto(conductorId);
        } catch (err: any) {
            if (onError) onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Vista de selección de modo
    if (modo === 'seleccion') {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🎯 Asignar Conductor
                </h3>

                <p className="text-sm text-gray-600 mb-6">
                    Selecciona cómo deseas asignar el conductor para este servicio:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Modo Automático */}
                    <button
                        onClick={iniciarDispatchAutomatico}
                        disabled={loading}
                        className="p-6 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">⚡</span>
                            <h4 className="text-lg font-bold text-blue-900">Automático</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            El sistema busca y asigna automáticamente al conductor más cercano disponible.
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li>✓ Encuentra conductor más cercano</li>
                            <li>✓ Envía oferta con 15s timeout</li>
                            <li>✓ Asigna automáticamente si acepta</li>
                        </ul>
                    </button>

                    {/* Modo Manual */}
                    <button
                        onClick={() => {
                            setModo('manual');
                            iniciarDispatchAutomatico(); // Buscar candidatos pero sin auto-asignar
                        }}
                        disabled={loading}
                        className="p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">👤</span>
                            <h4 className="text-lg font-bold text-gray-900">Manual</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Tú eliges manualmente el conductor de una lista de candidatos disponibles.
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li>✓ Ver lista de conductores cercanos</li>
                            <li>✓ Comparar distancias y ratings</li>
                            <li>✓ Seleccionar manualmente</li>
                        </ul>
                    </button>
                </div>
            </div>
        );
    }

    // Vista de dispatch automático en progreso
    if (modo === 'automatico') {
        return (
            <MonitorDispatch
                servicioId={servicioId}
                candidatos={candidatos}
                estado={estadoDispatch}
                conductorActual={conductorActual}
                tiempoRestante={15}
                onCancelar={() => setModo('seleccion')}
            />
        );
    }

    // Vista de selección manual
    if (modo === 'manual') {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        👤 Selección Manual de Conductor
                    </h3>
                    <button
                        onClick={() => setModo('seleccion')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        ← Volver
                    </button>
                </div>

                {estadoDispatch === 'buscando' && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Buscando conductores disponibles...</p>
                    </div>
                )}

                {estadoDispatch === 'asignado' && conductorActual && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-900 font-semibold">
                            ✅ Conductor asignado: {conductorActual.nombreCompleto}
                        </p>
                    </div>
                )}

                {candidatos.length > 0 && estadoDispatch !== 'asignado' && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-4">
                            {candidatos.length} conductores disponibles (ordenados por distancia):
                        </p>

                        {candidatos.map((candidato, index) => (
                            <div
                                key={candidato.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">{candidato.nombreCompleto}</p>
                                            <p className="text-sm text-gray-600">
                                                📏 {candidato.distancia_km.toFixed(1)} km |
                                                ⏱️ {candidato.tiempo_llegada_min} min |
                                                ⭐ {candidato.calificacion_promedio.toFixed(1)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                🚗 {candidato.vehiculo.color} {candidato.vehiculo.modelo} |
                                                🔖 {candidato.vehiculo.placa}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => asignarManual(candidato.id)}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        Asignar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
