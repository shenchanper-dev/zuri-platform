import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const client = new Client(DB_CONFIG);

    try {
        const body = await request.json();
        const { accion, conductor_id, razon_rechazo } = body;
        const servicioId = parseInt(params.id);

        if (!accion || !['aceptar', 'rechazar'].includes(accion)) {
            return NextResponse.json(
                { error: 'accion debe ser: aceptar o rechazar' },
                { status: 400 }
            );
        }

        if (accion === 'aceptar' && !conductor_id) {
            return NextResponse.json(
                { error: 'conductor_id es requerido para aceptar' },
                { status: 400 }
            );
        }

        await client.connect();

        // Obtener servicio
        const servicioRes = await client.query(
            'SELECT * FROM servicios WHERE id = $1',
            [servicioId]
        );

        if (servicioRes.rows.length === 0) {
            await client.end();
            return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
        }

        const servicio = servicioRes.rows[0];

        if (accion === 'aceptar') {
            // Verificar que el servicio aún está disponible
            if (servicio.estado !== 'BUSCANDO_CONDUCTOR' && servicio.estado !== 'PENDIENTE') {
                await client.end();
                return NextResponse.json({
                    success: false,
                    error: 'El servicio ya fue asignado a otro conductor'
                }, { status: 409 });
            }

            // Obtener info del conductor
            const conductorRes = await client.query(
                'SELECT * FROM conductores WHERE id = $1',
                [conductor_id]
            );

            if (conductorRes.rows.length === 0) {
                await client.end();
                return NextResponse.json({ error: 'Conductor no encontrado' }, { status: 404 });
            }

            const conductor = conductorRes.rows[0];

            // Asignar conductor al servicio
            await client.query(`
        UPDATE servicios
        SET 
          conductor_id = $1,
          conductor_nombre = $2,
          estado = 'ASIGNADO',
          updated_at = NOW()
        WHERE id = $3
      `, [conductor_id, conductor.nombreCompleto, servicioId]);

            await client.end();

            return NextResponse.json({
                success: true,
                servicio: {
                    ...servicio,
                    conductor_id,
                    conductor_nombre: conductor.nombreCompleto,
                    estado: 'ASIGNADO'
                },
                conductor: {
                    id: conductor.id,
                    nombreCompleto: conductor.nombreCompleto,
                    foto_url: conductor.foto_url,
                    telefono: conductor.telefono,
                    vehiculo: {
                        modelo: conductor.vehiculo_modelo,
                        placa: conductor.vehiculo_placa,
                        color: conductor.vehiculo_color
                    }
                }
            });

        } else {
            // Rechazar oferta - solo registrar el rechazo
            // El sistema intentará con el siguiente conductor
            await client.query(`
        INSERT INTO ofertas_rechazadas (
          servicio_id, conductor_id, razon_rechazo, created_at
        ) VALUES ($1, $2, $3, NOW())
      `, [servicioId, conductor_id, razon_rechazo || 'No especificado']);

            await client.end();

            return NextResponse.json({
                success: true,
                message: 'Oferta rechazada. Se buscará otro conductor.'
            });
        }

    } catch (error: any) {
        try { await client.end(); } catch { }
        console.error('[Oferta Servicio Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
