import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DB_CONFIG || 'postgresql://postgres@localhost:5432/zuri_db',
});

// GET - Obtener doctor por ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const doctorId = parseInt(params.id);

    if (isNaN(doctorId)) {
        return NextResponse.json(
            { error: 'ID de doctor inválido' },
            { status: 400 }
        );
    }

    try {
        // Obtener datos del doctor
        const doctorResult = await pool.query(
            `
      SELECT 
        d.*,
        e.nombre as especialidad_nombre,
        e.codigo as especialidad_codigo,
        e.tipo as especialidad_tipo
      FROM doctores d
      LEFT JOIN especialidades_medicas e ON d.especialidad_principal_id = e.id
      WHERE d.id = $1
      `,
            [doctorId]
        );

        if (doctorResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Doctor no encontrado' },
                { status: 404 }
            );
        }

        const doctor = doctorResult.rows[0];

        // Obtener subespecialidades
        const subespecialidadesResult = await pool.query(
            `
      SELECT 
        ds.*,
        e.nombre as especialidad_nombre,
        e.codigo as especialidad_codigo
      FROM doctor_subespecialidades ds
      JOIN especialidades_medicas e ON ds.especialidad_id = e.id
      WHERE ds.doctor_id = $1 AND ds.vigente = true
      `,
            [doctorId]
        );

        // Obtener clínicas asociadas
        const clinicasResult = await pool.query(
            `
      SELECT 
        dc.*,
        c.nombre as clinica_nombre,
        c.direccion as clinica_direccion,
        c.telefono as clinica_telefono
      FROM doctor_clinicas dc
      JOIN clinicas c ON dc.clinica_id = c.id
      WHERE dc.doctor_id = $1 AND dc.activo = true
      `,
            [doctorId]
        );

        // Obtener horarios
        const horariosResult = await pool.query(
            `
      SELECT 
        dh.*,
        dc.clinica_id,
        c.nombre as clinica_nombre
      FROM doctor_horarios dh
      JOIN doctor_clinicas dc ON dh.doctor_clinica_id = dc.id
      JOIN clinicas c ON dc.clinica_id = c.id
      WHERE dc.doctor_id = $1 AND dh.activo = true
      ORDER BY dh.dia_semana, dh.hora_inicio
      `,
            [doctorId]
        );

        // Obtener certificaciones
        const certificacionesResult = await pool.query(
            `SELECT * FROM doctor_certificaciones
       WHERE doctor_id = $1 AND activo = true
       ORDER BY fecha_emision DESC`,
            [doctorId]
        );

        return NextResponse.json({
            doctor,
            subespecialidades: subespecialidadesResult.rows,
            clinicas: clinicasResult.rows,
            horarios: horariosResult.rows,
            certificaciones: certificacionesResult.rows
        });

    } catch (error: any) {
        console.error('Error al obtener doctor:', error);
        return NextResponse.json(
            { error: 'Error al obtener doctor', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Actualizar doctor
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const doctorId = parseInt(params.id);

    if (isNaN(doctorId)) {
        return NextResponse.json(
            { error: 'ID de doctor inválido' },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();

        const fields = [];
        const values = [];
        let paramIndex = 1;

        // Campos actualizables
        const allowedFields = [
            'dni', 'nombres', 'apellido_paterno', 'apellido_materno',
            'fecha_nacimiento', 'genero',
            'cmp', 'rne', 'especialidad_principal_id', 'universidad', 'anos_experiencia',
            'celular', 'email_profesional', 'idiomas',
            'acepta_teleconsulta', 'duracion_consulta_min',
            'tarifa_consulta', 'tarifa_hora', 'tarifa_turno', 'moneda',
            'foto_url', 'firma_url', 'estado', 'observaciones_doctores'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                let val = body[field];

                // Campos únicos: string vacío → null para no violar UNIQUE constraints
                if (val === '' && ['dni', 'rne', 'fecha_nacimiento'].includes(field)) {
                    val = null;
                }

                // idiomas es JSONB: debe llegar como string JSON válido al driver pg
                if (field === 'idiomas') {
                    if (Array.isArray(val) || typeof val === 'object') {
                        val = JSON.stringify(val);
                    } else if (!val) {
                        val = '["Español"]';
                    }
                }

                // foto_url: si llegó como objeto File serializado ({}), ignorar
                if (field === 'foto_url' && typeof val === 'object' && val !== null) {
                    continue;
                }

                fields.push(`${field} = $${paramIndex}`);
                values.push(val);
                paramIndex++;
            }
        }

        if (fields.length === 0) {
            return NextResponse.json(
                { error: 'No hay campos para actualizar' },
                { status: 400 }
            );
        }

        values.push(doctorId);

        const result = await pool.query(
            `
      UPDATE doctores
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
      `,
            values
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Doctor no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            doctor: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error al actualizar doctor:', error);
        return NextResponse.json(
            { error: 'Error al actualizar doctor', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar doctor definitivamente de la lista
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const doctorId = parseInt(params.id);

    if (isNaN(doctorId)) {
        return NextResponse.json(
            { error: 'ID de doctor inválido' },
            { status: 400 }
        );
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que existe
        const check = await client.query('SELECT id FROM doctores WHERE id = $1', [doctorId]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 });
        }

        // Desligar relaciones antes de eliminar (evitar FK violations)
        await client.query('UPDATE doctor_clinicas SET activo = false WHERE doctor_id = $1', [doctorId]);
        await client.query('UPDATE paciente_doctor_asignaciones SET activo = false WHERE doctor_id = $1', [doctorId]);
        await client.query('UPDATE doctor_subespecialidades SET vigente = false WHERE doctor_id = $1', [doctorId]);
        await client.query('UPDATE doctor_horarios SET activo = false WHERE doctor_clinica_id IN (SELECT id FROM doctor_clinicas WHERE doctor_id = $1)', [doctorId]);
        await client.query('UPDATE doctor_certificaciones SET activo = false WHERE doctor_id = $1', [doctorId]);

        // Marcar como ELIMINADO (no aparece en listados normales)
        // Hacemos un soft-delete con estado = 'ELIMINADO' para preservar integridad
        // referencial con solicitudes_servicios históricas
        await client.query(
            `UPDATE doctores SET estado = 'ELIMINADO', updated_at = NOW() WHERE id = $1`,
            [doctorId]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            message: 'Doctor eliminado exitosamente'
        });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar doctor:', error);
        return NextResponse.json(
            { error: 'Error al eliminar doctor', details: error.message },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
