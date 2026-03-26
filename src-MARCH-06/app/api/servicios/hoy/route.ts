import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';

export async function GET(request: NextRequest) {
    const client = await pool.connect();

    try {
        const { searchParams } = new URL(request.url);
        const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
        const estado = searchParams.get('estado');

        // Servicios del día — columnas reales de la BD (camelCase de Prisma)
        let query = `
            SELECT
                s.id,
                s.codigo,
                s."pacienteNombre",
                s."pacienteTelefono",
                s."pacienteObservaciones",
                s."origenDireccion",
                s."origenLatitud",
                s."origenLongitud",
                s."destinoDireccion",
                s."destinoLatitud",
                s."destinoLongitud",
                s."fechaHora",
                s."fechaHoraRecojo",
                s."fechaHoraEntrega",
                s."tiempoEstimado",
                s."distanciaEstimada",
                s.estado,
                s."tipoServicio",
                s.prioridad,
                s."conductorId"      AS conductor_id,
                s.tarifa_calculada,
                s.distancia_km,
                s.notas_especiales,
                s.observaciones,
                c."nombreCompleto"   AS conductor_nombre,
                c.modelo_vehiculo    AS vehiculo_modelo,
                c."vehiculo_placa",
                c.color_vehiculo     AS vehiculo_color,
                c.foto_url           AS conductor_foto
            FROM servicios s
            LEFT JOIN conductores c ON s."conductorId" = c.id
            WHERE DATE(s."fechaHora") = $1
        `;

        const params: any[] = [fecha];

        if (estado) {
            query += ` AND s.estado::text = $2`;
            params.push(estado);
        }

        query += ` ORDER BY s."fechaHora" ASC`;

        const serviciosRes = await client.query(query, params);

        // Stats del día
        const statsRes = await client.query(`
            SELECT
                COUNT(*) FILTER (WHERE estado IN ('ASIGNADO','ACEPTADO','EN_CAMINO','EN_ORIGEN','EN_TRANSPORTE','EN_DESTINO')) AS activos,
                COUNT(*) FILTER (WHERE estado = 'PENDIENTE')   AS pendientes,
                COUNT(*) FILTER (WHERE estado = 'COMPLETADO')  AS completados,
                COUNT(*) FILTER (WHERE estado = 'CANCELADO')   AS cancelados
            FROM servicios
            WHERE DATE("fechaHora") = $1
        `, [fecha]);

        return NextResponse.json({
            success: true,
            servicios: serviciosRes.rows,
            stats: {
                activos:    parseInt(statsRes.rows[0].activos)    || 0,
                pendientes: parseInt(statsRes.rows[0].pendientes) || 0,
                completados:parseInt(statsRes.rows[0].completados)|| 0,
                cancelados: parseInt(statsRes.rows[0].cancelados) || 0,
            },
        });

    } catch (error: any) {
        console.error('[Servicios Hoy Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
