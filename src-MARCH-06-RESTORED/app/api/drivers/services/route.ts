// ============================================================================
// ZURI NEMT PLATFORM - Driver Services API
// Manages service assignments, acceptance, and status updates
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { verify } from 'jsonwebtoken';
import { evaluarAprobacionConductor } from '@/domain/entities/Conductor.entity';

const JWT_SECRET = process.env.JWT_SECRET || 'zuri-secret-key-change-this';
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

const parseStringArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(v => typeof v === 'string') as string[];
    if (typeof value !== 'string') return [];
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '[]') return [];
    try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : [];
    } catch {
        return [];
    }
};

// ============================================================================
// Helper: Extraer conductor del token
// ============================================================================
async function getConductorFromToken(request: NextRequest): Promise<{ conductorId: number } | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = verify(token, JWT_SECRET) as { conductorId: number };
        return decoded;
    } catch {
        return null;
    }
}

// ============================================================================
// GET: Obtener servicios asignados al conductor
// ============================================================================
export async function GET(request: NextRequest) {
    let client: Client | null = null;

    try {
        const auth = await getConductorFromToken(request);
        if (!auth) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const estado = searchParams.get('estado') || 'all'; // all, pendiente, activo, completado
        const fecha = searchParams.get('fecha'); // YYYY-MM-DD

        client = new Client(dbConfig);
        await client.connect();

        let whereConditions = [`s."conductorId" = ${auth.conductorId}`];

        if (estado !== 'all') {
            const estadoMap: Record<string, string[]> = {
                'pendiente': ['ASIGNADO'],
                'activo': ['ACEPTADO', 'EN_CAMINO', 'EN_ORIGEN', 'EN_TRANSPORTE'],
                'completado': ['COMPLETADO', 'CANCELADO']
            };
            const estados = estadoMap[estado] || [];
            if (estados.length > 0) {
                whereConditions.push(`s.estado IN (${estados.map(e => `'${e}'`).join(',')})`);
            }
        }

        if (fecha) {
            whereConditions.push(`DATE(s."fechaHora") = '${fecha}'`);
        }

        const query = `
      SELECT 
        s.id,
        s.codigo,
        s."pacienteNombre",
        s."pacienteTelefono",
        s."pacienteObservaciones",
        s."origenDireccion",
        s."origenLatitud",
        s."origenLongitud",
        s."origenReferencia",
        s."destinoDireccion",
        s."destinoLatitud",
        s."destinoLongitud",
        s."destinoReferencia",
        s."fechaHora",
        s."tiempoEstimado",
        s."distanciaEstimada",
        s.estado,
        s."tipoServicio",
        s.prioridad,
        s."fechaAsignacion",
        s."fechaAceptacion",
        s."fechaInicio",
        s."fechaFinalizacion",
        c.nombre AS "clinicaNombre",
        c.direccion AS "clinicaDireccion",
        c.telefono AS "clinicaTelefono"
      FROM servicios s
      LEFT JOIN clinicas c ON s."clinicaId" = c.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        CASE s.estado 
          WHEN 'EN_TRANSPORTE' THEN 1
          WHEN 'EN_ORIGEN' THEN 2
          WHEN 'EN_CAMINO' THEN 3
          WHEN 'ACEPTADO' THEN 4
          WHEN 'ASIGNADO' THEN 5
          ELSE 6
        END,
        s."fechaHora" ASC
    `;

        const result = await client.query(query);

        // Agrupar por estado para vista de lista
        const servicios = result.rows.map(row => ({
            id: row.id,
            codigo: row.codigo,
            paciente: {
                nombre: row.pacienteNombre,
                telefono: row.pacienteTelefono,
                observaciones: row.pacienteObservaciones
            },
            origen: {
                direccion: row.origenDireccion,
                latitud: parseFloat(row.origenLatitud),
                longitud: parseFloat(row.origenLongitud),
                referencia: row.origenReferencia
            },
            destino: {
                direccion: row.destinoDireccion,
                latitud: parseFloat(row.destinoLatitud),
                longitud: parseFloat(row.destinoLongitud),
                referencia: row.destinoReferencia
            },
            fechaHora: row.fechaHora,
            tiempoEstimado: row.tiempoEstimado,
            distanciaEstimada: row.distanciaEstimada,
            estado: row.estado,
            tipoServicio: row.tipoServicio,
            prioridad: row.prioridad,
            clinica: {
                nombre: row.clinicaNombre,
                direccion: row.clinicaDireccion,
                telefono: row.clinicaTelefono
            },
            timestamps: {
                asignado: row.fechaAsignacion,
                aceptado: row.fechaAceptacion,
                iniciado: row.fechaInicio,
                finalizado: row.fechaFinalizacion
            }
        }));

        return NextResponse.json({
            success: true,
            count: servicios.length,
            servicios
        });

    } catch (error: any) {
        console.error('❌ [Driver Services] GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}

// ============================================================================
// POST: Aceptar/Rechazar servicio
// ============================================================================
export async function POST(request: NextRequest) {
    let client: Client | null = null;

    try {
        const auth = await getConductorFromToken(request);
        if (!auth) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { servicioId, accion, motivo } = body; // accion: 'aceptar' | 'rechazar'

        if (!servicioId || !accion) {
            return NextResponse.json(
                { success: false, error: 'servicioId y accion son requeridos' },
                { status: 400 }
            );
        }

        if (!['aceptar', 'rechazar'].includes(accion)) {
            return NextResponse.json(
                { success: false, error: 'Acción inválida. Use "aceptar" o "rechazar"' },
                { status: 400 }
            );
        }

        client = new Client(dbConfig);
        await client.connect();

        const conductorQuery = await client.query(
            `
        SELECT 
          id,
          dni,
          nombres,
          apellidos,
          celular1,
          placa,
          "numeroBrevete",
          estado,
          equipamiento_nemt,
          servicios_habilitados
        FROM conductores
        WHERE id = $1
      `,
            [auth.conductorId]
        );

        if (conductorQuery.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Conductor no encontrado' },
                { status: 404 }
            );
        }

        const c = conductorQuery.rows[0];
        const aprobacion = evaluarAprobacionConductor({
            dni: c.dni,
            nombres: c.nombres,
            apellidos: c.apellidos,
            celular1: c.celular1,
            placa: c.placa,
            numeroBrevete: c.numeroBrevete,
            estado: c.estado,
            equipamiento: parseStringArray(c.equipamiento_nemt),
            servicios: parseStringArray(c.servicios_habilitados),
        });

        if (accion === 'aceptar' && !aprobacion.aprobadoParaAceptarServicios) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Conductor no aprobado para aceptar servicios',
                    aprobacion,
                },
                { status: 403 }
            );
        }

        // Verificar que el servicio está asignado a este conductor
        const servicioQuery = await client.query(`
      SELECT id, estado, codigo FROM servicios 
      WHERE id = $1 AND "conductorId" = $2
    `, [servicioId, auth.conductorId]);

        if (servicioQuery.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Servicio no encontrado o no asignado' },
                { status: 404 }
            );
        }

        const servicio = servicioQuery.rows[0];

        if (servicio.estado !== 'ASIGNADO') {
            return NextResponse.json(
                { success: false, error: `No se puede ${accion} un servicio en estado ${servicio.estado}` },
                { status: 400 }
            );
        }

        if (accion === 'aceptar') {
            await client.query(`
        UPDATE servicios SET
          estado = 'ACEPTADO',
          "fechaAceptacion" = NOW()
        WHERE id = $1
      `, [servicioId]);

            // Actualizar estado del conductor
            await client.query(`
        UPDATE conductores SET
          "estadoServicio" = 'EN_CAMINO'
        WHERE id = $1
      `, [auth.conductorId]);

            console.log(`✅ [Driver Services] Servicio ${servicio.codigo} ACEPTADO por conductor ${auth.conductorId}`);

            return NextResponse.json({
                success: true,
                message: 'Servicio aceptado',
                nuevoEstado: 'ACEPTADO'
            });

        } else {
            // Rechazar - El servicio vuelve a PENDIENTE para reasignación
            await client.query(`
        UPDATE servicios SET
          estado = 'PENDIENTE',
          "conductorId" = NULL,
          "fechaAsignacion" = NULL,
          "motivoCancelacion" = $2
        WHERE id = $1
      `, [servicioId, motivo || 'Rechazado por conductor']);

            console.log(`⚠️ [Driver Services] Servicio ${servicio.codigo} RECHAZADO por conductor ${auth.conductorId}`);

            return NextResponse.json({
                success: true,
                message: 'Servicio rechazado y devuelto a la cola',
                nuevoEstado: 'PENDIENTE'
            });
        }

    } catch (error: any) {
        console.error('❌ [Driver Services] POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}

// ============================================================================
// PATCH: Actualizar estado del servicio (workflow del viaje)
// ============================================================================
export async function PATCH(request: NextRequest) {
    let client: Client | null = null;

    try {
        const auth = await getConductorFromToken(request);
        if (!auth) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { servicioId, nuevoEstado, ubicacion, observacion } = body;

        // Estados válidos para el flujo del conductor
        const estadosValidos = [
            'EN_CAMINO',      // Dirigiéndose al origen
            'EN_ORIGEN',      // Llegó a recoger paciente
            'EN_TRANSPORTE',  // Paciente a bordo
            'EN_DESTINO',     // Llegó a la clínica
            'COMPLETADO',     // Servicio terminado
            'INCIDENTE'       // Problema durante servicio
        ];

        if (!estadosValidos.includes(nuevoEstado)) {
            return NextResponse.json(
                { success: false, error: `Estado inválido. Use: ${estadosValidos.join(', ')}` },
                { status: 400 }
            );
        }

        client = new Client(dbConfig);
        await client.connect();

        // Verificar servicio
        const servicioQuery = await client.query(`
      SELECT id, estado, codigo FROM servicios 
      WHERE id = $1 AND "conductorId" = $2
    `, [servicioId, auth.conductorId]);

        if (servicioQuery.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        const servicio = servicioQuery.rows[0];

        // Validar transición de estado
        const transicionesValidas: Record<string, string[]> = {
            'ACEPTADO': ['EN_CAMINO'],
            'EN_CAMINO': ['EN_ORIGEN', 'INCIDENTE'],
            'EN_ORIGEN': ['EN_TRANSPORTE', 'INCIDENTE'],
            'EN_TRANSPORTE': ['EN_DESTINO', 'INCIDENTE'],
            'EN_DESTINO': ['COMPLETADO', 'INCIDENTE']
        };

        const transicionesPermitidas = transicionesValidas[servicio.estado] || [];
        if (!transicionesPermitidas.includes(nuevoEstado)) {
            return NextResponse.json({
                success: false,
                error: `No puede cambiar de ${servicio.estado} a ${nuevoEstado}. Permitidos: ${transicionesPermitidas.join(', ')}`
            }, { status: 400 });
        }

        // Construir updates
        const updates: string[] = [`estado = '${nuevoEstado}'`];

        if (nuevoEstado === 'EN_CAMINO') {
            updates.push(`"fechaInicio" = NOW()`);
        } else if (nuevoEstado === 'COMPLETADO') {
            updates.push(`"fechaFinalizacion" = NOW()`);
        }

        if (observacion) {
            updates.push(`observaciones = COALESCE(observaciones, '') || '\n' || '${observacion}'`);
        }

        // Actualizar servicio
        await client.query(`UPDATE servicios SET ${updates.join(', ')} WHERE id = $1`, [servicioId]);

        // Actualizar estado del conductor según el servicio
        const estadoConductorMap: Record<string, string> = {
            'EN_CAMINO': 'EN_CAMINO',
            'EN_ORIGEN': 'EN_ORIGEN',
            'EN_TRANSPORTE': 'EN_TRANSPORTE',
            'EN_DESTINO': 'EN_DESTINO',
            'COMPLETADO': 'DISPONIBLE',
            'INCIDENTE': 'EMERGENCIA'
        };

        await client.query(`
      UPDATE conductores SET "estadoServicio" = $2 WHERE id = $1
    `, [auth.conductorId, estadoConductorMap[nuevoEstado] || 'DISPONIBLE']);

        // Guardar ubicación si se proporciona
        if (ubicacion?.latitud && ubicacion?.longitud) {
            await client.query(`
        UPDATE conductores SET
          latitud_actual = $2,
          longitud_actual = $3,
          "ultimaUbicacion" = NOW()
        WHERE id = $1
      `, [auth.conductorId, ubicacion.latitud, ubicacion.longitud]);
        }

        console.log(`📍 [Driver Services] Servicio ${servicio.codigo}: ${servicio.estado} → ${nuevoEstado}`);

        return NextResponse.json({
            success: true,
            message: `Estado actualizado a ${nuevoEstado}`,
            servicio: {
                id: servicioId,
                codigo: servicio.codigo,
                estadoAnterior: servicio.estado,
                nuevoEstado
            }
        });

    } catch (error: any) {
        console.error('❌ [Driver Services] PATCH error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}
