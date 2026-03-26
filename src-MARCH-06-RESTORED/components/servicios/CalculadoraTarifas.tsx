import React, { useState, useEffect } from 'react';
import { calcularDistancia } from '@/utils/geoUtils';

interface CalculadoraTarifasProps {
    origenLat?: number;
    origenLng?: number;
    destinoLat?: number;
    destinoLng?: number;
    tipoServicio: 'ambulatory' | 'wheelchair' | 'stretcher';
    distanciaKm?: number;
    onTarifaCalculada?: (tarifa: number, desglose: any) => void;
}

interface Desglose {
    tarifa_base: number;
    tarifa_distancia: number;
    tarifa_tiempo: number;
    tarifa_uber_total: number;
    multiplicador_nemt: number;
    premium_nemt: number;
    tarifa_total: number;
    distancia_km: number;
    tiempo_estimado_min: number;
}

export function CalculadoraTarifas({
    origenLat,
    origenLng,
    destinoLat,
    destinoLng,
    tipoServicio,
    distanciaKm,
    onTarifaCalculada
}: CalculadoraTarifasProps) {
    const [desglose, setDesglose] = useState<Desglose | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const calcular = async () => {
            // Validar que tengamos datos suficientes
            if (!tipoServicio) return;
            if (!distanciaKm && (!origenLat || !origenLng || !destinoLat || !destinoLng)) return;

            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/tarifas/calcular', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        origen_lat: origenLat,
                        origen_lng: origenLng,
                        destino_lat: destinoLat,
                        destino_lng: destinoLng,
                        tipo_servicio: tipoServicio,
                        distancia_km: distanciaKm
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al calcular tarifa');
                }

                const data = await response.json();
                setDesglose(data.desglose);

                if (onTarifaCalculada) {
                    onTarifaCalculada(data.desglose.tarifa_total, data.desglose);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        calcular();
    }, [origenLat, origenLng, destinoLat, destinoLng, tipoServicio, distanciaKm, onTarifaCalculada]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">⚠️ {error}</p>
            </div>
        );
    }

    if (!desglose) {
        return null;
    }

    const tipoServicioLabel = {
        ambulatory: 'Ambulatorio',
        wheelchair: 'Silla de Ruedas',
        stretcher: 'Camilla'
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                💰 Tarifa Calculada
            </h3>

            {/* Tipo de servicio */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Tipo de Servicio</span>
                    <span className="text-sm font-bold text-blue-700">{tipoServicioLabel[tipoServicio]}</span>
                </div>
            </div>

            {/* Desglose de tarifa */}
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tarifa Base (Uber)</span>
                    <span className="font-medium">S/ {desglose.tarifa_base.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distancia ({desglose.distancia_km} km)</span>
                    <span className="font-medium">S/ {desglose.tarifa_distancia.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tiempo ({desglose.tiempo_estimado_min} min)</span>
                    <span className="font-medium">S/ {desglose.tarifa_tiempo.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">Subtotal Uber</span>
                        <span className="font-semibold">S/ {desglose.tarifa_uber_total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Premium NEMT ({desglose.multiplicador_nemt}x)</span>
                    <span className="font-medium text-blue-600">+ S/ {desglose.premium_nemt.toFixed(2)}</span>
                </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-green-600">S/ {desglose.tarifa_total.toFixed(2)}</span>
                </div>
            </div>

            {/* Info adicional */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                    ℹ️ Tarifa calculada automáticamente basada en tarifas de Uber Lima con premium NEMT.
                    El multiplicador varía según el tipo de servicio requerido.
                </p>
            </div>
        </div>
    );
}
