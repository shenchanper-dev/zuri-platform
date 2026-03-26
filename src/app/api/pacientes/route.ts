import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DB_CONFIG || 'postgresql://postgres@localhost:5432/zuri_db',
});

// GET - Listar todos los pacientes
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const movilidad_tipo = searchParams.get('movilidad_tipo');
    const distrito_id = searchParams.get('distrito_id');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        let query = `
      SELECT 
        p.*,
        d.nombre as distrito_nombre
      FROM pacientes p
      LEFT JOIN distritos d ON p.distrito_id = d.id
      WHERE 1=1
    `;

        const params: any[] = [];
        let paramIndex = 1;

        if (estado) {
            query += ` AND p.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }

        if (movilidad_tipo) {
            query += ` AND p.movilidad_tipo = $${paramIndex}`;
            params.push(movilidad_tipo);
            paramIndex++;
        }

        if (distrito_id) {
            query += ` AND p.distrito_id = $${paramIndex}`;
            params.push(parseInt(distrito_id));
            paramIndex++;
        }

        if (search) {
            query += ` AND (
        p.nombre_completo ILIKE $${paramIndex} OR
        p.dni ILIKE $${paramIndex} OR
        p.celular ILIKE $${paramIndex}
      )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += `
      ORDER BY p.nombre_completo ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total
        const countQuery = `SELECT COUNT(*) as total FROM pacientes WHERE 1=1`;
        const countResult = await pool.query(countQuery);
        const total = parseInt(countResult.rows[0].total);

        return NextResponse.json({
            pacientes: result.rows,
            pagination: {
                total,
                limit,
                offset,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Error al listar pacientes:', error);
        return NextResponse.json(
            { error: 'Error al listar pacientes', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Crear nuevo paciente
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            dni, tipo_documento, nombres, apellido_paterno, apellido_materno,
            fecha_nacimiento, genero, celular, telefono_fijo, email, idioma_preferido,
            direccion, distrito_id, referencia, coordenadas,
            emergencia_nombre, emergencia_parentesco, emergencia_telefono, emergencia_telefono_2,
            seguro_compania, seguro_numero_poliza, seguro_vigencia_hasta, seguro_plan, seguro_cobertura_nemt,
            movilidad_tipo, requiere_oxigeno, requiere_acompanante, tipo_silla_ruedas, peso_aproximado_kg, altura_cm,
            condiciones_cronicas, alergias, medicamentos_actuales, restricciones_dieteticas, observaciones_medicas,
            dni_foto_url, carnet_seguro_url, receta_medica_url,
            observaciones_pacientes
        } = body;

        // Validaciones
        if (!dni || !nombres || !apellido_paterno || !fecha_nacimiento || !direccion || !emergencia_nombre || !emergencia_telefono) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        // Calcular edad
        const edad = new Date().getFullYear() - new Date(fecha_nacimiento).getFullYear();

        const result = await pool.query(
            `
      INSERT INTO pacientes (
        dni, tipo_documento, nombres, apellido_paterno, apellido_materno,
        fecha_nacimiento, edad, genero, celular, telefono_fijo, email, idioma_preferido,
        direccion, distrito_id, referencia, coordenadas,
        emergencia_nombre, emergencia_parentesco, emergencia_telefono, emergencia_telefono_2,
        seguro_compania, seguro_numero_poliza, seguro_vigencia_hasta, seguro_plan, seguro_cobertura_nemt,
        movilidad_tipo, requiere_oxigeno, requiere_acompanante, tipo_silla_ruedas, peso_aproximado_kg, altura_cm,
        condiciones_cronicas, alergias, medicamentos_actuales, restricciones_dieteticas, observaciones_medicas,
        dni_foto_url, carnet_seguro_url, receta_medica_url,
        observaciones_pacientes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
        $32, $33, $34, $35, $36, $37, $38, $39, $40, 'api'
      )
      RETURNING *
      `,
            [
                dni, tipo_documento || 'DNI', nombres, apellido_paterno, apellido_materno,
                fecha_nacimiento, edad, genero, celular, telefono_fijo, email, idioma_preferido || 'Español',
                direccion, distrito_id, referencia, coordenadas,
                emergencia_nombre, emergencia_parentesco, emergencia_telefono, emergencia_telefono_2,
                seguro_compania, seguro_numero_poliza, seguro_vigencia_hasta, seguro_plan, seguro_cobertura_nemt || false,
                movilidad_tipo || 'AMBULATORIO', requiere_oxigeno || false, requiere_acompanante || false,
                tipo_silla_ruedas, peso_aproximado_kg, altura_cm,
                condiciones_cronicas, alergias, medicamentos_actuales, restricciones_dieteticas, observaciones_medicas,
                dni_foto_url, carnet_seguro_url, receta_medica_url,
                observaciones_pacientes
            ]
        );

        return NextResponse.json({
            success: true,
            paciente: result.rows[0]
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear paciente:', error);

        if (error.code === '23505') {
            return NextResponse.json(
                { error: 'El DNI ya existe en el sistema' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Error al crear paciente', details: error.message },
            { status: 500 }
        );
    }
}
