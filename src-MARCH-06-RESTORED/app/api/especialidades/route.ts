import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DB_CONFIG || 'postgresql://postgres@localhost:5432/zuri_db',
});

// GET - Listar especialidades médicas
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const activo = searchParams.get('activo');

    try {
        let query = `
      SELECT * FROM especialidades_medicas
      WHERE 1=1
    `;

        const params: any[] = [];
        let paramIndex = 1;

        if (tipo) {
            query += ` AND tipo = $${paramIndex}`;
            params.push(tipo);
            paramIndex++;
        }

        if (activo !== null && activo !== undefined) {
            query += ` AND activo = $${paramIndex}`;
            params.push(activo === 'true');
            paramIndex++;
        }

        query += ` ORDER BY orden ASC, nombre ASC`;

        const result = await pool.query(query, params);

        return NextResponse.json({
            especialidades: result.rows,
            total: result.rows.length
        });

    } catch (error: any) {
        console.error('Error al listar especialidades:', error);
        return NextResponse.json(
            { error: 'Error al listar especialidades', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Crear nueva especialidad
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { codigo, nombre, descripcion, tipo, orden } = body;

        if (!nombre) {
            return NextResponse.json(
                { error: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `
      INSERT INTO especialidades_medicas (codigo, nombre, descripcion, tipo, orden)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
            [codigo, nombre, descripcion, tipo || 'CLINICA', orden || 0]
        );

        return NextResponse.json({
            success: true,
            especialidad: result.rows[0]
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear especialidad:', error);

        if (error.code === '23505') {
            return NextResponse.json(
                { error: 'El código o nombre ya existe' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Error al crear especialidad', details: error.message },
            { status: 500 }
        );
    }
}
