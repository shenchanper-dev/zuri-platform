import { NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';

// GET /api/conductores/activos
// Retorna conductores con estado ACTIVO para el dispatch en tiempo real
export async function GET() {
    const client = await pool.connect();

    try {
        const result = await client.query(`
            SELECT
                id,
                "nombreCompleto",
                estado,
                "estadoServicio",
                calificacion_promedio,
                latitud_actual        AS ultima_latitud,
                longitud_actual       AS ultima_longitud,
                modelo_vehiculo       AS vehiculo_modelo,
                "vehiculo_placa",
                color_vehiculo        AS vehiculo_color,
                foto_url,
                online,
                celular1              AS telefono
            FROM conductores
            WHERE estado = 'ACTIVO'
            ORDER BY "nombreCompleto" ASC
        `);

        return NextResponse.json({
            success: true,
            conductores: result.rows,
        });

    } catch (error: any) {
        console.error('[Conductores Activos Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
