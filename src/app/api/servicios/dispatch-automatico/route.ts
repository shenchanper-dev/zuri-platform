import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { ordenarPorDistancia } from '@/utils/geoUtils';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

// Timeout para que el conductor acepte (15 segundos)
const TIMEOUT_OFERTA_MS = 15000;

export async function POST(request: NextRequest) {
    const client = new Client(DB_CONFIG);

    try {
        const body = await request.json();
        const { servicio_id } = body;

        if (!servicio_id) {
            return NextResponse.json({ error: 'servicio_id es requerido' }, { status: 400 });
        }

        await client.connect();

        // 1. Obtener servicio
        const servicioRes = await client.query(
            'SELECT * FROM servicios WHERE id = $1',
            [servicio_id]
        );

        if (servicioRes.rows.length === 0) {
            await client.end();
            return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
        }

        const servicio = servicioRes.rows[0];

        // 2. Buscar conductores activos online
        const conductoresRes = await client.query(`
      SELECT 
        id, "nombreCompleto", estado, "calificacionPromedio" AS calificacion_promedio,
        ultima_latitud, ultima_longitud, ultima_actualizacion_gps,
        vehiculo_modelo, vehiculo_placa, vehiculo_color,
        foto_url, telefono, online
      FROM conductores
      WHERE estado = 'ACTIVO' 
        AND online = true
        AND ultima_latitud IS NOT NULL 
        AND ultima_longitud IS NOT NULL
        AND ultima_actualizacion_gps > NOW() - INTERVAL '30 minutes'
    `);

        if (conductoresRes.rows.length === 0) {
            await client.query(
                'UPDATE servicios SET estado = $1 WHERE id = $2',
                ['PENDIENTE_CONDUCTOR', servicio_id]
            );
            await client.end();
            return NextResponse.json({
                success: false,
                reason: 'NO_DRIVERS_AVAILABLE',
                message: 'No hay conductores activos disponibles'
            }, { status: 404 });
        }

        // 3. Ordenar por distancia al origen
        const candidatos = ordenarPorDistancia(
            conductoresRes.rows,
            servicio.origen_lat,
            servicio.origen_lng
        );

        // 4. Filtrar conductores con conflictos de horario
        const candidatosSinConflicto = [];
        for (const conductor of candidatos.slice(0, 5)) { // Top 5 más cercanos
            const conflictRes = await client.query(`
        SELECT COUNT(*) as count
        FROM servicios
        WHERE conductor_id = $1
          AND fecha_servicio = $2
          AND estado IN ('ASIGNADO', 'EN_CURSO', 'BUSCANDO_CONDUCTOR')
          AND (
            (hora_recojo <= $3 AND hora_fin >= $3) OR
            (hora_recojo <= $4 AND hora_fin >= $4) OR
            (hora_recojo >= $3 AND hora_fin <= $4)
          )
      `, [conductor.id, servicio.fecha_servicio, servicio.hora_recojo, servicio.hora_fin || servicio.hora_recojo]);

            if (parseInt(conflictRes.rows[0].count) === 0) {
                candidatosSinConflicto.push(conductor);
            }
        }

        if (candidatosSinConflicto.length === 0) {
            await client.query(
                'UPDATE servicios SET estado = $1 WHERE id = $2',
                ['PENDIENTE_CONDUCTOR', servicio_id]
            );
            await client.end();
            return NextResponse.json({
                success: false,
                reason: 'ALL_DRIVERS_BUSY',
                message: 'Todos los conductores cercanos están ocupados'
            }, { status: 409 });
        }

        // 5. Actualizar estado del servicio
        await client.query(
            'UPDATE servicios SET estado = $1, updated_at = NOW() WHERE id = $2',
            ['BUSCANDO_CONDUCTOR', servicio_id]
        );

        await client.end();

        // 6. Retornar candidatos (el frontend/WebSocket manejará el envío de ofertas)
        return NextResponse.json({
            success: true,
            servicio,
            candidatos: candidatosSinConflicto.slice(0, 3).map(c => ({
                id: c.id,
                nombreCompleto: c.nombreCompleto,
                calificacion_promedio: c.calificacion_promedio,
                distancia_km: c.distancia_km,
                tiempo_llegada_min: c.tiempo_llegada_min,
                vehiculo: {
                    modelo: c.vehiculo_modelo,
                    placa: c.vehiculo_placa,
                    color: c.vehiculo_color
                },
                foto_url: c.foto_url,
                telefono: c.telefono
            })),
            timeout_ms: TIMEOUT_OFERTA_MS
        });

    } catch (error: any) {
        try { await client.end(); } catch { }
        console.error('[Dispatch Automático Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
