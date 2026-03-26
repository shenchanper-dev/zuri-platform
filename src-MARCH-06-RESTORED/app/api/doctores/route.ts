import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DB_CONFIG || 'postgresql://postgres@localhost:5432/zuri_db',
});

// GET - Listar todos los doctores
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const especialidad_id = searchParams.get('especialidad_id');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        let query = `
      SELECT 
        d.*,
        e.nombre as especialidad_nombre,
        e.codigo as especialidad_codigo,
        COUNT(DISTINCT dc.clinica_id) as numero_clinicas,
        COUNT(DISTINCT pd.paciente_id) as numero_pacientes
      FROM doctores d
      LEFT JOIN especialidades_medicas e ON d.especialidad_principal_id = e.id
      LEFT JOIN doctor_clinicas dc ON d.id = dc.doctor_id AND dc.activo = true
      LEFT JOIN paciente_doctor_asignaciones pd ON d.id = pd.doctor_id AND pd.activo = true
      WHERE 1=1
    `;

        const params: any[] = [];
        let paramIndex = 1;

        if (estado) {
            // Si se pide explícitamente un estado (ej: ?estado=INACTIVO), lo filtra
            query += ` AND d.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        } else {
            // Por defecto, excluir doctores eliminados
            query += ` AND d.estado NOT IN ('INACTIVO', 'ELIMINADO')`;
        }

        if (especialidad_id) {
            query += ` AND d.especialidad_principal_id = $${paramIndex}`;
            params.push(parseInt(especialidad_id));
            paramIndex++;
        }

        if (search) {
            query += ` AND (
        d.nombre_completo ILIKE $${paramIndex} OR
        d.cmp ILIKE $${paramIndex} OR
        d.dni ILIKE $${paramIndex} OR
        e.nombre ILIKE $${paramIndex}
      )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += `
      GROUP BY d.id, e.id
      ORDER BY d.nombre_completo ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total para paginación (mismo filtro que el query principal)
        const countQuery = estado
            ? `SELECT COUNT(*) as total FROM doctores WHERE estado = $1`
            : `SELECT COUNT(*) as total FROM doctores WHERE estado NOT IN ('INACTIVO', 'ELIMINADO')`;
        const countResult = await pool.query(countQuery, estado ? [estado] : []);
        const total = parseInt(countResult.rows[0].total);

        return NextResponse.json({
            doctores: result.rows,
            pagination: {
                total,
                limit,
                offset,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Error al listar doctores:', error);
        return NextResponse.json(
            { error: 'Error al listar doctores', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Crear nuevo doctor
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            dni, nombres, apellido_paterno, apellido_materno,
            cmp, rne, especialidad_principal_id, universidad, anos_experiencia,
            celular, email_profesional, idiomas,
            acepta_teleconsulta, duracion_consulta_min,
            tarifa_consulta, tarifa_hora, tarifa_turno, moneda,
            foto_url, firma_url, observaciones_doctores
        } = body;

        // Validaciones básicas
        if (!nombres || !apellido_paterno || !cmp) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: nombres, apellido_paterno, cmp' },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `
      INSERT INTO doctores (
        dni, nombres, apellido_paterno, apellido_materno,
        cmp, rne, especialidad_principal_id, universidad, anos_experiencia,
        celular, email_profesional, idiomas,
        acepta_teleconsulta, duracion_consulta_min,
        tarifa_consulta, tarifa_hora, tarifa_turno, moneda,
        foto_url, firma_url, observaciones_doctores,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, 'api'
      )
      RETURNING *
      `,
            [
                dni || null, nombres, apellido_paterno, apellido_materno || null,
                cmp, rne || null, especialidad_principal_id || null, universidad || null, anos_experiencia || null,
                celular || null, email_profesional || null,
                (Array.isArray(idiomas) || typeof idiomas === 'object' ? JSON.stringify(idiomas) : idiomas) || '["Español"]',
                acepta_teleconsulta || false, duracion_consulta_min || 30,
                tarifa_consulta || null, tarifa_hora || null, tarifa_turno || null, moneda || 'PEN',
                (typeof foto_url === 'string' ? foto_url : null), firma_url || null, observaciones_doctores || null
            ]
        );

        return NextResponse.json({
            success: true,
            doctor: result.rows[0]
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear doctor:', error);

        if (error.code === '23505') { // Unique constraint violation
            return NextResponse.json(
                { error: 'El CMP o DNI ya existe en el sistema' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Error al crear doctor', details: error.message },
            { status: 500 }
        );
    }
}
