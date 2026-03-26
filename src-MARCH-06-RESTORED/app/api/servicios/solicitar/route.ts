import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { calcularTarifaNEMT } from '@/utils/tarifasNEMT';
import { calcularDistancia } from '@/utils/geoUtils';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function POST(request: NextRequest) {
    const client = new Client(DB_CONFIG);

    try {
        const body = await request.json();
        const {
            paciente_id,
            paciente_nombre,
            origen,
            origen_lat,
            origen_lng,
            destino,
            destino_lat,
            destino_lng,
            fecha_servicio,
            hora_recojo,
            tipo_servicio,
            notas_especiales,
            modo_dispatch
        } = body;

        // Validar campos requeridos
        if (!paciente_id || !origen || !destino || !fecha_servicio || !hora_recojo || !tipo_servicio) {
            return NextResponse.json(
                { error: 'Campos requeridos: paciente_id, origen, destino, fecha_servicio, hora_recojo, tipo_servicio' },
                { status: 400 }
            );
        }

        if (!['ambulatory', 'wheelchair', 'stretcher'].includes(tipo_servicio)) {
            return NextResponse.json(
                { error: 'tipo_servicio debe ser: ambulatory, wheelchair o stretcher' },
                { status: 400 }
            );
        }

        await client.connect();

        // Calcular distancia y tarifa
        const distancia_km = calcularDistancia(origen_lat, origen_lng, destino_lat, destino_lng);
        const tarifa_calculada = calcularTarifaNEMT(distancia_km, null, tipo_servicio);

        // Crear servicio
        const servicioRes = await client.query(`
      INSERT INTO servicios (
        paciente_id,
        paciente_nombre,
        origen,
        origen_lat,
        origen_lng,
        destino,
        destino_lat,
        destino_lng,
        fecha_servicio,
        hora_recojo,
        tipo_servicio,
        distancia_km,
        tarifa_calculada,
        estado,
        notas_especiales,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *
    `, [
            paciente_id,
            paciente_nombre,
            origen,
            origen_lat,
            origen_lng,
            destino,
            destino_lat,
            destino_lng,
            fecha_servicio,
            hora_recojo,
            tipo_servicio,
            distancia_km,
            tarifa_calculada,
            modo_dispatch === 'automatico' ? 'BUSCANDO_CONDUCTOR' : 'PENDIENTE',
            notas_especiales || null
        ]);

        const servicio = servicioRes.rows[0];

        await client.end();

        return NextResponse.json({
            success: true,
            servicio_id: servicio.id,
            servicio,
            tarifa_calculada,
            distancia_km,
            estado: servicio.estado
        }, { status: 201 });

    } catch (error: any) {
        try { await client.end(); } catch { }
        console.error('[Solicitar Servicio Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
