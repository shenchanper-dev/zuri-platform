import { NextRequest, NextResponse } from 'next/server';
import { calcularDesgloseTarifa } from '@/utils/tarifasNEMT';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { origen_lat, origen_lng, destino_lat, destino_lng, tipo_servicio, distancia_km, tiempo_min } = body;

        // Validar parámetros requeridos
        if (!tipo_servicio || !['ambulatory', 'wheelchair', 'stretcher'].includes(tipo_servicio)) {
            return NextResponse.json(
                { error: 'tipo_servicio inválido. Debe ser: ambulatory, wheelchair o stretcher' },
                { status: 400 }
            );
        }

        // Si no se provee distancia, calcularla desde coordenadas
        let distancia = distancia_km;
        if (!distancia && origen_lat && origen_lng && destino_lat && destino_lng) {
            // Importar función de cálculo de distancia
            const { calcularDistancia } = await import('@/utils/geoUtils');
            distancia = calcularDistancia(origen_lat, origen_lng, destino_lat, destino_lng);
        }

        if (!distancia || distancia <= 0) {
            return NextResponse.json(
                { error: 'Debe proveer distancia_km o coordenadas válidas (origen_lat, origen_lng, destino_lat, destino_lng)' },
                { status: 400 }
            );
        }

        // Calcular desglose de tarifa
        const desglose = calcularDesgloseTarifa(distancia, tiempo_min || null, tipo_servicio);

        return NextResponse.json({
            success: true,
            desglose
        });

    } catch (error: any) {
        console.error('[Calcular Tarifa Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
