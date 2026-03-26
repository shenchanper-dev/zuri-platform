import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DB_CONFIG || 'postgresql://postgres@localhost:5432/zuri_db',
});

// GET - Obtener paciente por ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const pacienteId = parseInt(params.id);

    if (isNaN(pacienteId)) {
        return NextResponse.json(
            { error: 'ID de paciente inválido' },
            { status: 400 }
        );
    }

    try {
        // Obtener datos del paciente
        const pacienteResult = await pool.query(
            `
      SELECT 
        p.*,
        d.nombre as distrito_nombre
      FROM pacientes p
      LEFT JOIN distritos d ON p.distrito_id = d.id
      WHERE p.id = $1
      `,
            [pacienteId]
        );

        if (pacienteResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Paciente no encontrado' },
                { status: 404 }
            );
        }

        const paciente = pacienteResult.rows[0];

        // Obtener doctores asignados
        const doctoresResult = await pool.query(
            `
      SELECT 
        pda.*,
        d.nombre_completo as doctor_nombre,
        d.cmp as doctor_cmp,
        e.nombre as especialidad_nombre
      FROM paciente_doctor_asignaciones pda
      JOIN doctores d ON pda.doctor_id = d.id
      LEFT JOIN especialidades_medicas e ON d.especialidad_principal_id = e.id
      WHERE pda.paciente_id = $1 AND pda.activo = true
      ORDER BY pda.fecha_asignacion DESC
      `,
            [pacienteId]
        );

        // Obtener servicios realizados
        const serviciosResult = await pool.query(
            `
      SELECT COUNT(*) as total_servicios
      FROM solicitudes_servicios
      WHERE paciente_id = $1
      `,
            [pacienteId]
        );

        return NextResponse.json({
            paciente,
            doctores_asignados: doctoresResult.rows,
            total_servicios: parseInt(serviciosResult.rows[0]?.total_servicios || 0)
        });

    } catch (error: any) {
        console.error('Error al obtener paciente:', error);
        return NextResponse.json(
            { error: 'Error al obtener paciente', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Actualizar paciente
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const pacienteId = parseInt(params.id);

    if (isNaN(pacienteId)) {
        return NextResponse.json(
            { error: 'ID de paciente inválido' },
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
            'tipo_documento', 'nombres', 'apellido_paterno', 'apellido_materno',
            'fecha_nacimiento', 'edad', 'genero',
            'celular', 'telefono_fijo', 'email', 'idioma_preferido',
            'direccion', 'distrito_id', 'referencia', 'coordenadas',
            'emergencia_nombre', 'emergencia_parentesco', 'emergencia_telefono', 'emergencia_telefono_2',
            'seguro_compania', 'seguro_numero_poliza', 'seguro_vigencia_hasta', 'seguro_plan', 'seguro_cobertura_nemt',
            'movilidad_tipo', 'requiere_oxigeno', 'requiere_acompanante', 'tipo_silla_ruedas', 'peso_aproximado_kg', 'altura_cm',
            'condiciones_cronicas', 'alergias', 'medicamentos_actuales', 'restricciones_dieteticas', 'observaciones_medicas',
            'dni_foto_url', 'carnet_seguro_url', 'receta_medica_url',
            'estado', 'ultima_visita_medica', 'proxima_cita_programada',
            'observaciones_pacientes'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                fields.push(`${field} = $${paramIndex}`);
                values.push(body[field]);
                paramIndex++;
            }
        }

        if (fields.length === 0) {
            return NextResponse.json(
                { error: 'No hay campos para actualizar' },
                { status: 400 }
            );
        }

        values.push(pacienteId);

        const result = await pool.query(
            `
      UPDATE pacientes
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
      `,
            values
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Paciente no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            paciente: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error al actualizar paciente:', error);
        return NextResponse.json(
            { error: 'Error al actualizar paciente', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar paciente (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const pacienteId = parseInt(params.id);

    if (isNaN(pacienteId)) {
        return NextResponse.json(
            { error: 'ID de paciente inválido' },
            { status: 400 }
        );
    }

    try {
        const result = await pool.query(
            `
      UPDATE pacientes
      SET estado = 'INACTIVO'
      WHERE id = $1
      RETURNING *
      `,
            [pacienteId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Paciente no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Paciente desactivado exitosamente'
        });

    } catch (error: any) {
        console.error('Error al eliminar paciente:', error);
        return NextResponse.json(
            { error: 'Error al eliminar paciente', details: error.message },
            { status: 500 }
        );
    }
}
