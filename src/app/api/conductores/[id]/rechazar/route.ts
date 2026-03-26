/**
 * API: PUT /api/conductores/[id]/rechazar
 * Reject driver registration (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { sendRejectionNotification } from '@/lib/notifications';

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const client = new Client(dbConfig);

    try {
        const id = parseInt(params.id);
        const { razon } = await request.json();

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID inválido' },
                { status: 400 }
            );
        }

        if (!razon) {
            return NextResponse.json(
                { error: 'La razón del rechazo es obligatoria' },
                { status: 400 }
            );
        }

        await client.connect();

        // Verificar que el conductor existe
        const verificarQuery = `
      SELECT id, nombres, apellidos, celular1, email, estado_registro
      FROM conductores
      WHERE id = $1
    `;

        const verificarResult = await client.query(verificarQuery, [id]);

        if (verificarResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Conductor no encontrado' },
                { status: 404 }
            );
        }

        const conductor = verificarResult.rows[0];

        // Rechazar conductor
        const updateQuery = `
      UPDATE conductores
      SET estado_registro = 'RECHAZADO',
          fecha_rechazo = NOW(),
          razon_rechazo = $2,
          estado = 'INACTIVO',
          "updatedAt" = Now()
      WHERE id = $1
      RETURNING id, nombres, apellidos, estado_registro, razon_rechazo
    `;

        const result = await client.query(updateQuery, [id, razon]);
        const rechazado = result.rows[0];

        console.log(`❌ [Driver Rejected] ${rechazado.nombres} ${rechazado.apellidos} - Razón: ${razon}`);

        // Enviar notificación por Email
        if (conductor.celular1 && conductor.email) {
            await sendRejectionNotification(
                `${conductor.nombres} ${conductor.apellidos}`,
                conductor.email,
                conductor.celular1,
                razon
            );
        }

        return NextResponse.json({
            success: true,
            mensaje: 'Conductor rechazado',
            conductor: rechazado
        });

    } catch (error: any) {
        console.error('❌ [Reject Driver] Error:', error);
        return NextResponse.json(
            { error: 'Error al rechazar conductor', detalle: error.message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
