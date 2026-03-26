// src/app/api/conductores/[id]/asignar-pin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';
import bcrypt from 'bcryptjs';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = parseInt(params.id);
    let client: any = null;

    try {
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
        }

        // 1. Generar PIN aleatorio de 4 dígitos
        const pin = Math.floor(1000 + Math.random() * 9000).toString();

        // 2. Hashear el PIN
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(pin, salt);

        client = await pool.connect();

        // 3. Actualizar en BD
        const query = `
      UPDATE conductores 
      SET pin_hash = $1, "updatedAt" = NOW() 
      WHERE id = $2 
      RETURNING id, nombres, apellidos
    `;

        const result = await client.query(query, [hash, id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Conductor no encontrado' }, { status: 404 });
        }

        console.log(`🔐 [API-PIN] PIN temporal asignado a conductor ${id}`);

        // 4. Retornar el PIN en texto plano (solo esta vez)
        return NextResponse.json({
            success: true,
            pin: pin,
            message: 'PIN temporal generado con éxito'
        });

    } catch (error: any) {
        console.error('❌ [API-PIN] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al asignar PIN temporal'
        }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
