/**
 * ZURI NEMT Platform - GPS History API
 * 
 * API para consultar historial de ubicaciones de conductores.
 * Usado para dibujar rutas históricas en el mapa.
 * 
 * GET /api/conductores/gps-history?conductorId=123&fechaInicio=...&fechaFin=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Configuración de base de datos (igual que otras APIs de conductores)
const dbConfig = {
    connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
};

export async function GET(request: NextRequest) {
    const client = new Client(dbConfig);

    try {
        const searchParams = request.nextUrl.searchParams;
        const conductorId = searchParams.get('conductorId');
        const fechaInicio = searchParams.get('fechaInicio');
        const fechaFin = searchParams.get('fechaFin');
        const limite = parseInt(searchParams.get('limite') || '500');

        // Validaciones
        if (!conductorId) {
            return NextResponse.json(
                { error: 'conductorId es requerido' },
                { status: 400 }
            );
        }

        await client.connect();

        // Verificar que el conductor existe
        const conductorCheck = await client.query(
            'SELECT id, "nombreCompleto" FROM conductores WHERE id = $1',
            [parseInt(conductorId)]
        );

        if (conductorCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'Conductor no encontrado' },
                { status: 404 }
            );
        }

        const conductor = conductorCheck.rows[0];

        // Verificar si existe la tabla de historial
        const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gps_historial'
      )
    `);

        const historialDisponible = tableCheck.rows[0].exists;

        if (!historialDisponible) {
            // Si no hay tabla de historial, retornar ubicación actual como único punto
            const ubicacionActual = await client.query(`
        SELECT 
          id,
          "ubicacionActualLatitud" as latitud,
          "ubicacionActualLongitud" as longitud,
          "ultimaActualizacionGPS" as timestamp,
          "velocidadActual" as velocidad,
          "rumboActual" as rumbo,
          "nivelBateria" as nivel_bateria
        FROM conductores
        WHERE id = $1
          AND "ubicacionActualLatitud" IS NOT NULL
          AND "ubicacionActualLongitud" IS NOT NULL
      `, [parseInt(conductorId)]);

            const ubicaciones = ubicacionActual.rows.length > 0 ? [{
                latitud: parseFloat(ubicacionActual.rows[0].latitud),
                longitud: parseFloat(ubicacionActual.rows[0].longitud),
                timestamp: ubicacionActual.rows[0].timestamp || new Date().toISOString(),
                velocidad: ubicacionActual.rows[0].velocidad ? parseFloat(ubicacionActual.rows[0].velocidad) : null,
                rumbo: ubicacionActual.rows[0].rumbo,
                nivelBateria: ubicacionActual.rows[0].nivel_bateria,
            }] : [];

            return NextResponse.json({
                success: true,
                conductor: {
                    id: conductor.id,
                    nombreCompleto: conductor.nombreCompleto,
                },
                historial: ubicaciones,
                total: ubicaciones.length,
                mensaje: 'Tabla de historial no disponible. Mostrando ubicación actual.',
                geoJSON: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: ubicaciones.map(u => [u.longitud, u.latitud]),
                    },
                    properties: {
                        conductorId: conductor.id,
                        nombreCompleto: conductor.nombreCompleto,
                    },
                },
            });
        }

        // Construir query para historial
        let query = `
      SELECT 
        id,
        latitud,
        longitud,
        timestamp,
        velocidad,
        rumbo,
        nivel_bateria,
        precision
      FROM gps_historial
      WHERE conductor_id = $1
    `;

        const params: any[] = [parseInt(conductorId)];
        let paramCount = 2;

        // Filtro por fecha inicio
        if (fechaInicio) {
            query += ` AND timestamp >= $${paramCount}`;
            params.push(new Date(fechaInicio).toISOString());
            paramCount++;
        }

        // Filtro por fecha fin
        if (fechaFin) {
            query += ` AND timestamp <= $${paramCount}`;
            params.push(new Date(fechaFin).toISOString());
            paramCount++;
        }

        // Ordenar y limitar
        query += ` ORDER BY timestamp ASC LIMIT $${paramCount}`;
        params.push(Math.min(limite, 2000)); // Máximo 2000 puntos

        const result = await client.query(query, params);

        // Formatear ubicaciones
        const ubicaciones = result.rows.map(row => ({
            latitud: parseFloat(row.latitud),
            longitud: parseFloat(row.longitud),
            timestamp: row.timestamp,
            velocidad: row.velocidad ? parseFloat(row.velocidad) : null,
            rumbo: row.rumbo,
            nivelBateria: row.nivel_bateria,
            precision: row.precision,
        }));

        // Calcular estadísticas de la ruta
        let distanciaTotal = 0;
        let velocidadMaxima = 0;
        let velocidadPromedio = 0;
        let velocidadesValidas: number[] = [];

        for (let i = 1; i < ubicaciones.length; i++) {
            // Calcular distancia con fórmula Haversine
            const dist = calcularDistancia(
                ubicaciones[i - 1].latitud,
                ubicaciones[i - 1].longitud,
                ubicaciones[i].latitud,
                ubicaciones[i].longitud
            );
            distanciaTotal += dist;

            if (ubicaciones[i].velocidad !== null) {
                velocidadesValidas.push(ubicaciones[i].velocidad!);
                if (ubicaciones[i].velocidad! > velocidadMaxima) {
                    velocidadMaxima = ubicaciones[i].velocidad!;
                }
            }
        }

        if (velocidadesValidas.length > 0) {
            velocidadPromedio = velocidadesValidas.reduce((a, b) => a + b, 0) / velocidadesValidas.length;
        }

        // Calcular duración
        const duracionMinutos = ubicaciones.length >= 2
            ? Math.round((new Date(ubicaciones[ubicaciones.length - 1].timestamp).getTime() -
                new Date(ubicaciones[0].timestamp).getTime()) / 60000)
            : 0;

        return NextResponse.json({
            success: true,
            conductor: {
                id: conductor.id,
                nombreCompleto: conductor.nombreCompleto,
            },
            historial: ubicaciones,
            total: ubicaciones.length,
            estadisticas: {
                distanciaKm: Math.round(distanciaTotal * 100) / 100,
                duracionMinutos,
                velocidadMaxima: Math.round(velocidadMaxima),
                velocidadPromedio: Math.round(velocidadPromedio),
                puntoInicio: ubicaciones[0] || null,
                puntoFin: ubicaciones[ubicaciones.length - 1] || null,
            },
            geoJSON: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: ubicaciones.map(u => [u.longitud, u.latitud]),
                },
                properties: {
                    conductorId: conductor.id,
                    nombreCompleto: conductor.nombreCompleto,
                    distanciaKm: Math.round(distanciaTotal * 100) / 100,
                    duracionMinutos,
                },
            },
        });

    } catch (error: any) {
        console.error('Error en GET /api/conductores/gps-history:', error);
        return NextResponse.json(
            { error: 'Error al obtener historial GPS', detalle: error.message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

// Función para calcular distancia entre dos puntos (Haversine)
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}
