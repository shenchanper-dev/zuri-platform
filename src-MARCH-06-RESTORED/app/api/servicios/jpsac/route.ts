import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';

export async function GET(request: NextRequest) {
    const client = await pool.connect();

    try {
        const { searchParams } = new URL(request.url);
        const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
        const estado = searchParams.get('estado');
        const tipoServicio = searchParams.get('tipo_servicio');

        let query = `
            SELECT
                ss.id,
                ss.fecha,
                ss.hora_inicio,
                ss.hora_fin,
                ss.turno,
                ss.doctor_nombre,
                ss.paciente_nombre,
                ss.paciente_dni,
                ss.paciente_telefono,
                ss.cliente_nombre,
                ss.tipo_servicio,
                ss.area,
                ss.descripcion,
                ss.ubicacion,
                ss.distrito,
                ss.direccion_recojo,
                ss.distrito_recojo,
                ss.direccion_destino,
                ss.distrito_destino,
                ss.conductor_id,
                ss.conductor_nombre,
                ss.placa,
                ss.procedencia,
                ss.estado,
                ss.observaciones,
                ss.paciente_movilidad,
                ss.requiere_oxigeno,
                c."nombreCompleto"      AS conductor_nombre_completo,
                c.celular1              AS conductor_telefono,
                c.modelo_vehiculo       AS conductor_vehiculo,
                c."vehiculo_placa"      AS conductor_placa,
                c.foto_url              AS conductor_foto
            FROM solicitudes_servicios ss
            LEFT JOIN conductores c ON ss.conductor_id = c.id
            WHERE ss.fecha = $1
        `;

        const params: any[] = [fecha];
        let paramIdx = 2;

        if (estado) {
            query += ` AND ss.estado = $${paramIdx}`;
            params.push(estado);
            paramIdx++;
        }

        if (tipoServicio) {
            query += ` AND ss.tipo_servicio = $${paramIdx}`;
            params.push(tipoServicio);
            paramIdx++;
        }

        query += ` ORDER BY ss.hora_inicio ASC NULLS LAST`;

        const serviciosRes = await client.query(query, params);

        const statsRes = await client.query(`
            SELECT
                COUNT(*)                                                       AS total,
                COUNT(*) FILTER (WHERE estado IN ('asignado','en_curso','en_camino'))  AS activos,
                COUNT(*) FILTER (WHERE estado IS NULL OR estado = '' OR estado = 'pendiente') AS pendientes,
                COUNT(*) FILTER (WHERE estado = 'completado')                  AS completados,
                COUNT(*) FILTER (WHERE estado = 'cancelado')                   AS cancelados
            FROM solicitudes_servicios
            WHERE fecha = $1
        `, [fecha]);

        const tiposRes = await client.query(`
            SELECT DISTINCT tipo_servicio, COUNT(*) as cantidad
            FROM solicitudes_servicios
            WHERE fecha = $1 AND tipo_servicio IS NOT NULL AND tipo_servicio != ''
            GROUP BY tipo_servicio
            ORDER BY cantidad DESC
        `, [fecha]);

        return NextResponse.json({
            success: true,
            servicios: serviciosRes.rows,
            stats: {
                total:       parseInt(statsRes.rows[0].total) || 0,
                activos:     parseInt(statsRes.rows[0].activos) || 0,
                pendientes:  parseInt(statsRes.rows[0].pendientes) || 0,
                completados: parseInt(statsRes.rows[0].completados) || 0,
                cancelados:  parseInt(statsRes.rows[0].cancelados) || 0,
            },
            tiposServicio: tiposRes.rows,
        });

    } catch (error: any) {
        console.error('[Servicios JPSAC Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
