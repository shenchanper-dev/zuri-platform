/**
 * API: PUT /api/conductores/[id]/aprobar
 * Approve driver registration (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { sendApprovalNotification } from '@/lib/notifications';

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

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID inválido' },
                { status: 400 }
            );
        }

        await client.connect();

        // Verificar que el conductor existe y está PENDIENTE
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

        if (conductor.estado_registro === 'APROBADO') {
            return NextResponse.json({
                success: true,
                mensaje: 'Conductor ya está aprobado'
            });
        }

        // Aprobar conductor
        const updateQuery = `
      UPDATE conductores
      SET estado_registro = 'APROBADO',
          fecha_aprobacion = NOW(),
          estado = 'ACTIVO',
          "updatedAt" = NOW()
      WHERE id = $1
      RETURNING id, nombres, apellidos, estado_registro
    `;

        const result = await client.query(updateQuery, [id]);
        const aprobado = result.rows[0];

        console.log(`✅ [Driver Approved] ${aprobado.nombres} ${aprobado.apellidos} (ID: ${aprobado.id})`);

        // Enviar notificación por Email
        if (conductor.celular1 && conductor.email) {
            await sendApprovalNotification(
                `${conductor.nombres} ${conductor.apellidos}`,
                conductor.email,
                conductor.celular1
            );
        }

        return NextResponse.json({
            success: true,
            mensaje: 'Conductor aprobado exitosamente',
            conductor: aprobado
        });

    } catch (error: any) {
        console.error('❌ [Approve Driver] Error:', error);
        return NextResponse.json(
            { error: 'Error al aprobar conductor', detalle: error.message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
