import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

// POST: Crear un nuevo registro de programacion_detalles vacío
export async function POST(request: NextRequest) {
    const client = new Client(DB_CONFIG);
    try {
        const body = await request.json();
        const { programacion_id } = body;

        if (!programacion_id) {
            return NextResponse.json(
                { error: 'programacion_id es requerido' },
                { status: 400 }
            );
        }

        await client.connect();

        // Verificar que la programación existe
        const progRes = await client.query(
            'SELECT id, fecha_programacion FROM programaciones WHERE id = $1',
            [programacion_id]
        );

        if (progRes.rows.length === 0) {
            await client.end();
            return NextResponse.json(
                { error: 'Programación no encontrada' },
                { status: 404 }
            );
        }

        const fechaProg = progRes.rows[0].fecha_programacion;

        // Obtener el siguiente número de orden
        const ordenRes = await client.query(
            'SELECT COALESCE(MAX(orden), 0) + 1 as siguiente FROM programacion_detalles WHERE programacion_id = $1',
            [programacion_id]
        );
        const siguienteOrden = ordenRes.rows[0].siguiente;

        // Crear registro vacío con valores por defecto
        const insertRes = await client.query(`
            INSERT INTO programacion_detalles (
                programacion_id, fecha, doctor_nombre, hora_inicio, hora_fin,
                estado, orden, created_at, updated_at
            ) VALUES (
                $1, $2, '', '08:00', '09:00',
                'PROGRAMADO', $3, NOW(), NOW()
            )
            RETURNING *
        `, [programacion_id, fechaProg, siguienteOrden]);

        await client.end();

        return NextResponse.json({
            success: true,
            detalle: insertRes.rows[0]
        });
    } catch (error: any) {
        try { await client.end(); } catch { }
        console.error('[POST programacion-detalles Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
