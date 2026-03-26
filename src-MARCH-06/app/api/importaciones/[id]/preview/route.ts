import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DB_CONFIG || 'postgresql://postgres@localhost:5432/zuri_db',
});

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const importacionId = parseInt(params.id);

    if (isNaN(importacionId)) {
        return NextResponse.json(
            { error: 'ID de importación inválido' },
            { status: 400 }
        );
    }

    try {
        // 1. Obtener datos de la importación
        const importacionResult = await pool.query(
            `SELECT * FROM importaciones_excel WHERE id = $1`,
            [importacionId]
        );

        if (importacionResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Importación no encontrada' },
                { status: 404 }
            );
        }

        const importacion = importacionResult.rows[0];

        // 2. Obtener solicitudes de servicio NO confirmadas
        const solicitudesResult = await pool.query(
            `
      SELECT 
        ss.*,
        d.nombre_completo as doctor_nombre,
        d.cmp as doctor_cmp,
        d.id as doctor_id_encontrado,
        c."nombreCompleto" as conductor_nombre_bd,
        COALESCE(c.dni, ss.conductor_dni) as conductor_dni_bd,
        c.id as conductor_id_encontrado
      FROM solicitudes_servicios ss
      LEFT JOIN doctores d ON ss.doctor_id = d.id
      LEFT JOIN conductores c ON ss.conductor_id = c.id
      WHERE ss.importacion_id = $1
      ORDER BY ss.id ASC
      `,
            [importacionId]
        );

        const solicitudes = solicitudesResult.rows;

        // 3. Calcular validaciones y estadísticas para cada solicitud
        const solicitudesConValidaciones = solicitudes.map(solicitud => {
            const validaciones = {
                fecha_valida: !!solicitud.fecha_servicio,
                hora_valida: !!solicitud.hora_servicio,
                ubicacion_completa: !!(solicitud.direccion_recojo && solicitud.direccion_destino),
                doctor_asignado: !!solicitud.doctor_id,
                conductor_asignado: !!solicitud.conductor_id,
                warnings: [] as string[]
            };

            // Agregar warnings
            if (!solicitud.direccion_recojo) {
                validaciones.warnings.push('Falta dirección de recojo');
            }
            if (!solicitud.direccion_destino) {
                validaciones.warnings.push('Falta dirección de destino');
            }
            if (!solicitud.conductor_id) {
                validaciones.warnings.push('Sin conductor asignado');
            }
            if (!solicitud.doctor_id) {
                validaciones.warnings.push('Sin doctor asignado');
            }

            // Match confidence
            const doctor_match = solicitud.doctor_id ? {
                encontrado: true,
                doctor_id: solicitud.doctor_id_encontrado,
                nombre: solicitud.doctor_nombre,
                cmp: solicitud.doctor_cmp,
                confianza: 100 // TODO: Implementar fuzzy matching
            } : {
                encontrado: false,
                nombre: solicitud.doctor_nombre_excel || 'N/A',
                confianza: 0
            };

            const conductor_match = solicitud.conductor_id ? {
                encontrado: true,
                conductor_id: solicitud.conductor_id_encontrado,
                nombre: solicitud.conductor_nombre_bd || solicitud.conductor_nombre,
                dni: solicitud.conductor_dni_bd,
                confianza: 100
            } : {
                encontrado: false,
                nombre: solicitud.conductor_nombre || 'N/A',
                confianza: 0
            };

            return {
                ...solicitud,
                validaciones,
                doctor_match,
                conductor_match
            };
        });

        // 4. Calcular estadísticas generales
        const stats = {
            total: solicitudes.length,
            confirmados: solicitudes.filter(s => s.confirmado).length,
            sin_confirmar: solicitudes.filter(s => !s.confirmado).length,
            con_warnings: solicitudesConValidaciones.filter(s => s.validaciones.warnings.length > 0).length,
            doctores_nuevos: solicitudes.filter(s => !s.doctor_id && s.doctor_nombre_excel).length,
            conductores_sin_asignar: solicitudes.filter(s => !s.conductor_id).length,
            ubicaciones_incompletas: solicitudes.filter(s => !s.direccion_recojo || !s.direccion_destino).length
        };

        return NextResponse.json({
            importacion,
            solicitudes: solicitudesConValidaciones,
            stats
        });

    } catch (error: any) {
        console.error('Error al obtener preview de importación:', error);
        return NextResponse.json(
            { error: 'Error al obtener preview', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Confirmar todas las solicitudes de una importación
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const importacionId = parseInt(params.id);

    if (isNaN(importacionId)) {
        return NextResponse.json(
            { error: 'ID de importación inválido' },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        const { accion, revisado_por } = body;

        if (accion === 'confirmar') {
            // Confirmar todas las solicitudes
            const result = await pool.query(
                `
        UPDATE solicitudes_servicios
        SET 
          confirmado = true,
          revisado_por = $2,
          fecha_confirmacion = NOW()
        WHERE importacion_id = $1 AND confirmado = false
        RETURNING id
        `,
                [importacionId, revisado_por || 'system']
            );

            // Actualizar estado de la importación
            await pool.query(
                `
        UPDATE importaciones_excel
        SET estado = 'CONFIRMADO'
        WHERE id = $1
        `,
                [importacionId]
            );

            return NextResponse.json({
                success: true,
                solicitudes_confirmadas: result.rowCount
            });

        } else if (accion === 'cancelar') {
            // Eliminar solicitudes no confirmadas (cascade eliminará la importación si no quedan solicitudes)
            const result = await pool.query(
                `
        DELETE FROM solicitudes_servicios
        WHERE importacion_id = $1 AND confirmado = false
        RETURNING id
        `,
                [importacionId]
            );

            // Actualizar estado
            await pool.query(
                `
        UPDATE importaciones_excel
        SET estado = 'CANCELADO'
        WHERE id = $1
        `,
                [importacionId]
            );

            return NextResponse.json({
                success: true,
                solicitudes_eliminadas: result.rowCount
            });

        } else {
            return NextResponse.json(
                { error: 'Acción inválida. Use "confirmar" o "cancelar"' },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error('Error al confirmar importación:', error);
        return NextResponse.json(
            { error: 'Error al confirmar importación', details: error.message },
            { status: 500 }
        );
    }
}
