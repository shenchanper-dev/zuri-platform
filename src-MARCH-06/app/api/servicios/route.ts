// ============================================================================
// ZURI NEMT PLATFORM - Dashboard Services API
// POST: Crear y asignar servicios a conductores
// GET: Obtener todos los servicios para el dashboard
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import redis from '@/lib/redis';

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

// ============================================================================
// GET: Obtener servicios del día (para dashboard)
// ============================================================================
export async function GET(request: NextRequest) {
    let client: Client | null = null;

    try {
        const { searchParams } = new URL(request.url);
        const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
        const estado = searchParams.get('estado');
        const conductorId = searchParams.get('conductorId');

        client = new Client(dbConfig);
        await client.connect();

        let whereConditions = [`DATE(s."fechaHora") = '${fecha}'`];

        if (estado) {
            whereConditions.push(`s.estado = '${estado}'`);
        }
        if (conductorId) {
            whereConditions.push(`s."conductorId" = ${conductorId}`);
        }

        const query = `
            SELECT 
                s.*,
                c.nombres || ' ' || c.apellidos as conductor_nombre,
                c.celular1 as conductor_celular,
                cl.nombre as clinica_nombre
            FROM servicios s
            LEFT JOIN conductores c ON s."conductorId" = c.id
            LEFT JOIN clinicas cl ON s."clinicaId" = cl.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY s."fechaHora" ASC
        `;

        const result = await client.query(query);

        return NextResponse.json({
            success: true,
            count: result.rows.length,
            servicios: result.rows
        });

    } catch (error: any) {
        console.error('❌ [Dashboard Services] GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}

// ============================================================================
// POST: Crear servicio y opcionalmente asignar a conductor
// ============================================================================
export async function POST(request: NextRequest) {
    let client: Client | null = null;

    try {
        const body = await request.json();
        const {
            // Paciente
            pacienteNombre,
            pacienteDni,
            pacienteTelefono,
            pacienteObservaciones,
            // Origen
            origenDireccion,
            origenLatitud,
            origenLongitud,
            origenReferencia,
            // Destino
            destinoDireccion,
            destinoLatitud,
            destinoLongitud,
            destinoReferencia,
            // Servicio
            fechaHora,
            tipoServicio,
            prioridad = 'NORMAL',
            clinicaId,
            // Asignación
            conductorId,
            asignacionAutomatica = false
        } = body;

        // Validaciones básicas
        if (!pacienteNombre || !origenDireccion || !destinoDireccion || !fechaHora || !tipoServicio || !clinicaId) {
            return NextResponse.json({
                success: false,
                error: 'Campos requeridos: pacienteNombre, origenDireccion, destinoDireccion, fechaHora, tipoServicio, clinicaId'
            }, { status: 400 });
        }

        client = new Client(dbConfig);
        await client.connect();

        // Si se solicita asignación automática, buscar conductor más cercano
        let conductorAsignado = conductorId;

        if (asignacionAutomatica && origenLatitud && origenLongitud) {
            const nearbyQuery = await client.query(`
                SELECT id, nombres, apellidos,
                    (3959 * acos(
                        cos(radians($1)) * cos(radians("ubicacionActualLatitud")) *
                        cos(radians("ubicacionActualLongitud") - radians($2)) +
                        sin(radians($1)) * sin(radians("ubicacionActualLatitud"))
                    )) AS distance_km
                FROM conductores
                WHERE estado = 'ACTIVO'
                  AND "estadoServicio" = 'DISPONIBLE'
                  AND "ubicacionActualLatitud" IS NOT NULL
                  AND "ubicacionActualLongitud" IS NOT NULL
                  AND "ultimaActualizacionGPS" > NOW() - INTERVAL '10 minutes'
                  AND placa IS NOT NULL AND placa <> ''
                  AND "numeroBrevete" IS NOT NULL AND "numeroBrevete" <> ''
                  AND celular1 IS NOT NULL AND celular1 <> ''
                  AND COALESCE(NULLIF(servicios_habilitados, ''), '[]')::jsonb <> '[]'::jsonb
                  AND COALESCE(NULLIF(equipamiento_nemt, ''), '[]')::jsonb ?| ARRAY['OXIGENO','RAMPA']
                ORDER BY distance_km ASC
                LIMIT 1
            `, [origenLatitud, origenLongitud]);

            if (nearbyQuery.rows.length > 0) {
                conductorAsignado = nearbyQuery.rows[0].id;
                console.log(`🚗 Auto-asignado a: ${nearbyQuery.rows[0].nombres} ${nearbyQuery.rows[0].apellidos} (${nearbyQuery.rows[0].distance_km.toFixed(2)} km)`);
            }
        }

        // Crear servicio
        const insertQuery = await client.query(`
            INSERT INTO servicios (
                "pacienteNombre", "pacienteDni", "pacienteTelefono", "pacienteObservaciones",
                "origenDireccion", "origenLatitud", "origenLongitud", "origenReferencia",
                "destinoDireccion", "destinoLatitud", "destinoLongitud", "destinoReferencia",
                "fechaHora", "tipoServicio", prioridad, "clinicaId",
                "conductorId", "fechaAsignacion", estado,
                "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15, $16,
                $17, $18, $19,
                NOW(), NOW()
            ) RETURNING id, codigo
        `, [
            pacienteNombre, pacienteDni || null, pacienteTelefono || null, pacienteObservaciones || null,
            origenDireccion, origenLatitud || 0, origenLongitud || 0, origenReferencia || null,
            destinoDireccion, destinoLatitud || 0, destinoLongitud || 0, destinoReferencia || null,
            fechaHora, tipoServicio, prioridad, clinicaId,
            conductorAsignado || null,
            conductorAsignado ? new Date() : null,
            conductorAsignado ? 'ASIGNADO' : 'PENDIENTE'
        ]);

        const nuevoServicio = insertQuery.rows[0];

        // Si hay conductor asignado, notificar via WebSocket/Redis
        if (conductorAsignado) {
            // Obtener datos completos del servicio para notificar
            const servicioCompleto = await client.query(`
                SELECT 
                    s.*,
                    c.nombre as clinica_nombre
                FROM servicios s
                LEFT JOIN clinicas c ON s."clinicaId" = c.id
                WHERE s.id = $1
            `, [nuevoServicio.id]);

            // Publicar en Redis para que WebSocket lo envíe
            await redis.publish('service:assigned', JSON.stringify({
                conductorId: conductorAsignado,
                servicio: {
                    id: nuevoServicio.id,
                    codigo: nuevoServicio.codigo,
                    paciente: {
                        nombre: pacienteNombre,
                        telefono: pacienteTelefono,
                        observaciones: pacienteObservaciones
                    },
                    origen: {
                        direccion: origenDireccion,
                        latitud: origenLatitud,
                        longitud: origenLongitud,
                        referencia: origenReferencia
                    },
                    destino: {
                        direccion: destinoDireccion,
                        latitud: destinoLatitud,
                        longitud: destinoLongitud,
                        referencia: destinoReferencia
                    },
                    fechaHora,
                    tipoServicio,
                    prioridad,
                    clinica: {
                        nombre: servicioCompleto.rows[0]?.clinica_nombre
                    },
                    estado: 'ASIGNADO'
                }
            }));

            console.log(`📋 Servicio ${nuevoServicio.codigo} creado y asignado a conductor ${conductorAsignado}`);
        } else {
            console.log(`📋 Servicio ${nuevoServicio.codigo} creado (sin asignar)`);
        }

        return NextResponse.json({
            success: true,
            message: conductorAsignado
                ? 'Servicio creado y asignado a conductor'
                : 'Servicio creado (pendiente de asignación)',
            servicio: {
                id: nuevoServicio.id,
                codigo: nuevoServicio.codigo,
                conductorId: conductorAsignado,
                estado: conductorAsignado ? 'ASIGNADO' : 'PENDIENTE'
            }
        });

    } catch (error: any) {
        console.error('❌ [Dashboard Services] POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}

// ============================================================================
// PATCH: Asignar/Reasignar conductor a servicio existente
// ============================================================================
export async function PATCH(request: NextRequest) {
    let client: Client | null = null;

    try {
        const body = await request.json();
        const { servicioId, conductorId, asignacionAutomatica, origenLatitud, origenLongitud, operador } = body;

        if (!servicioId) {
            return NextResponse.json({ success: false, error: 'servicioId requerido' }, { status: 400 });
        }

        client = new Client(dbConfig);
        await client.connect();

        let conductorAsignado = conductorId;

        // Auto-asignación si se solicita
        if (asignacionAutomatica && origenLatitud && origenLongitud) {
            const nearbyQuery = await client.query(`
                SELECT id FROM conductores
                WHERE estado = 'ACTIVO'
                  AND "estadoServicio" = 'DISPONIBLE'
                  AND "ubicacionActualLatitud" IS NOT NULL
                  AND "ubicacionActualLongitud" IS NOT NULL
                  AND "ultimaActualizacionGPS" > NOW() - INTERVAL '10 minutes'
                  AND placa IS NOT NULL AND placa <> ''
                  AND "numeroBrevete" IS NOT NULL AND "numeroBrevete" <> ''
                  AND celular1 IS NOT NULL AND celular1 <> ''
                  AND COALESCE(NULLIF(servicios_habilitados, ''), '[]')::jsonb <> '[]'::jsonb
                  AND COALESCE(NULLIF(equipamiento_nemt, ''), '[]')::jsonb ?| ARRAY['OXIGENO','RAMPA']
                ORDER BY (
                    3959 * acos(
                        cos(radians($1)) * cos(radians("ubicacionActualLatitud")) *
                        cos(radians("ubicacionActualLongitud") - radians($2)) +
                        sin(radians($1)) * sin(radians("ubicacionActualLatitud"))
                    )
                ) ASC
                LIMIT 1
            `, [origenLatitud, origenLongitud]);

            if (nearbyQuery.rows.length > 0) {
                conductorAsignado = nearbyQuery.rows[0].id;
            } else {
                return NextResponse.json({
                    success: false,
                    error: 'No hay conductores disponibles para asignación automática'
                }, { status: 400 });
            }
        }

        if (!conductorAsignado) {
            return NextResponse.json({ success: false, error: 'conductorId requerido' }, { status: 400 });
        }

        // Verificar servicio
        const servicioQuery = await client.query(`
            SELECT id, codigo, "conductorId", estado, "origenDireccion", "pacienteNombre", 
                   "origenLatitud", "origenLongitud", "destinoDireccion", "destinoLatitud", 
                   "destinoLongitud", "fechaHora", "tipoServicio", prioridad, "puntoControl", observaciones
            FROM servicios WHERE id = $1
        `, [servicioId]);

        if (servicioQuery.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Servicio no encontrado' }, { status: 404 });
        }

        const servicio = servicioQuery.rows[0];
        const conductorAnterior = servicio.conductorId || null;

        // Solo se puede asignar si está PENDIENTE
        if (!['PENDIENTE', 'ASIGNADO'].includes(servicio.estado)) {
            return NextResponse.json({
                success: false,
                error: `No se puede asignar servicio en estado ${servicio.estado}`
            }, { status: 400 });
        }

        const tipoAsignacion = asignacionAutomatica ? 'AUTO' : 'MANUAL';
        const operadorNombre = typeof operador === 'string' && operador.trim() ? operador.trim().slice(0, 80) : null;

        const puntoControlActual = servicio.puntoControl && typeof servicio.puntoControl === 'object' ? servicio.puntoControl : {};
        const asignacionesActuales = Array.isArray(puntoControlActual.asignaciones) ? puntoControlActual.asignaciones : [];
        const nuevaAsignacion = {
            tipo: tipoAsignacion,
            operador: operadorNombre,
            fromConductorId: conductorAnterior,
            toConductorId: conductorAsignado,
            timestamp: new Date().toISOString()
        };
        const puntoControlActualizado = {
            ...puntoControlActual,
            asignaciones: [...asignacionesActuales, nuevaAsignacion]
        };

        const observacionesPrevias = typeof servicio.observaciones === 'string' ? servicio.observaciones : '';
        const linea = `[ASIGNACION_${tipoAsignacion}] ${new Date().toISOString()}${operadorNombre ? ` operador=${operadorNombre}` : ''} from=${conductorAnterior ?? 'null'} to=${conductorAsignado}`;
        const observacionesActualizadas = observacionesPrevias ? `${observacionesPrevias}\n${linea}` : linea;

        // Actualizar asignación
        await client.query(`
            UPDATE servicios SET
                "conductorId" = $2,
                "fechaAsignacion" = NOW(),
                estado = 'ASIGNADO',
                "puntoControl" = $3,
                observaciones = $4
            WHERE id = $1
        `, [servicioId, conductorAsignado, JSON.stringify(puntoControlActualizado), observacionesActualizadas]);

        // Notificar al conductor via WebSocket
        await redis.publish('service:assigned', JSON.stringify({
            conductorId: conductorAsignado,
            servicio: {
                id: servicio.id,
                codigo: servicio.codigo,
                paciente: { nombre: servicio.pacienteNombre },
                origen: {
                    direccion: servicio.origenDireccion,
                    latitud: servicio.origenLatitud,
                    longitud: servicio.origenLongitud
                },
                destino: {
                    direccion: servicio.destinoDireccion,
                    latitud: servicio.destinoLatitud,
                    longitud: servicio.destinoLongitud
                },
                fechaHora: servicio.fechaHora,
                tipoServicio: servicio.tipoServicio,
                prioridad: servicio.prioridad,
                estado: 'ASIGNADO'
            }
        }));

        console.log(`📋 Servicio ${servicio.codigo} asignado a conductor ${conductorAsignado}`);

        return NextResponse.json({
            success: true,
            message: 'Conductor asignado correctamente',
            servicio: {
                id: servicioId,
                codigo: servicio.codigo,
                conductorId: conductorAsignado,
                estado: 'ASIGNADO'
            },
            asignacion: nuevaAsignacion
        });

    } catch (error: any) {
        console.error('❌ [Dashboard Services] PATCH error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}
