/**
 * API: POST /api/drivers/verify-email
 * Verify driver email with 6-digit code
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

export async function POST(request: NextRequest) {
    const client = new Client(dbConfig);

    try {
        const { conductorId, codigo } = await request.json();

        if (!conductorId || !codigo) {
            return NextResponse.json(
                { error: 'conductorId y codigo son requeridos' },
                { status: 400 }
            );
        }

        await client.connect();

        // Buscar conductor y verificar código
        const query = `
      SELECT id, nombres, apellidos, email, 
             codigo_verificacion_email, expiracion_codigo_email,
             email_verificado
      FROM conductores
      WHERE id = $1
    `;

        const result = await client.query(query, [conductorId]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Conductor no encontrado' },
                { status: 404 }
            );
        }

        const conductor = result.rows[0];

        // Verificar si ya está verificado
        if (conductor.email_verificado) {
            return NextResponse.json({
                success: true,
                mensaje: 'Email ya verificado anteriormente',
                estadoRegistro: 'PENDIENTE'
            });
        }

        // Verificar si el código expiró
        const ahora = new Date();
        const expiracion = new Date(conductor.expiracion_codigo_email);

        if (ahora > expiracion) {
            return NextResponse.json(
                { error: 'Código expirado. Solicita un nuevo código' },
                { status: 400 }
            );
        }

        // Verificar código
        if (conductor.codigo_verificacion_email !== codigo) {
            return NextResponse.json(
                { error: 'Código incorrecto' },
                { status: 400 }
            );
        }

        // Marcar como verificado y cambiar estado a PENDIENTE
        const updateQuery = `
      UPDATE conductores
      SET email_verificado = true,
          estado_registro = 'PENDIENTE',
          "updatedAt" = NOW()
      WHERE id = $1
      RETURNING id, nombres, apellidos, email, estado_registro
    `;

        const updateResult = await client.query(updateQuery, [conductorId]);
        const updated = updateResult.rows[0];

        console.log(`✅ [Email Verified] ${updated.nombres} ${updated.apellidos} - Estado: ${updated.estado_registro}`);

        return NextResponse.json({
            success: true,
            mensaje: 'Email verificado exitosamente',
            estadoRegistro: updated.estado_registro,
            conductor: {
                id: updated.id,
                nombres: updated.nombres,
                apellidos: updated.apellidos,
                email: updated.email
            }
        });

    } catch (error: any) {
        console.error('❌ [Email Verification] Error:', error);
        return NextResponse.json(
            { error: 'Error al verificar email', detalle: error.message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
