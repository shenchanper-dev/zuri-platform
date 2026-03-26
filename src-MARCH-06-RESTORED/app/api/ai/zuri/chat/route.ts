import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DB_CONFIG || 'postgresql://postgres@localhost:5432/zuri_db',
});

// Intent classifier simple (sin LLM por ahora, solo keywords)
function clasificarIntent(mensaje: string): { intent: string; entities: any; confidence: number } {
    const msgLower = mensaje.toLowerCase();

    // 1. CONDUCTOR LOCATION
    if (msgLower.includes('dónde') && (msgLower.includes('conductor') || msgLower.includes('chofer'))) {
        const nombreMatch = mensaje.match(/(?:conductor|chofer)\s+([a-záéíóúñ\s]+)/i);
        return {
            intent: 'conductor_location',
            entities: { nombre_conductor: nombreMatch?.[1]?.trim() },
            confidence: 0.85
        };
    }

    // 2. FLEET STATUS
    if ((msgLower.includes('lista') || msgLower.includes('muestra') || msgLower.includes('cuántos')) &&
        (msgLower.includes('conductor') || msgLower.includes('activo') || msgLower.includes('disponible'))) {
        return {
            intent: 'fleet_active',
            entities: {},
            confidence: 0.90
        };
    }

    // 3. SERVICE STATUS
    if ((msgLower.includes('servicio') || msgLower.includes('programación')) &&
        (msgLower.includes('hoy') || msgLower.includes('mañana'))) {
        return {
            intent: 'service_status',
            entities: { fecha: msgLower.includes('mañana') ? 'mañana' : 'hoy' },
            confidence: 0.80
        };
    }

    // 4. SEND MESSAGE
    if ((msgLower.includes('envía') || msgLower.includes('enviar') || msgLower.includes('mensaje')) &&
        (msgLower.includes('conductor') || msgLower.includes('todos'))) {
        const mensajeMatch = mensaje.match(/:\s*(.+)$/);
        return {
            intent: 'send_message',
            entities: {
                destinatario: msgLower.includes('todos') ? 'all' : 'specific',
                mensaje: mensajeMatch?.[1]?.trim()
            },
            confidence: 0.75
        };
    }

    // 5. SIMPLE QUERY (fallback)
    return {
        intent: 'simple_query',
        entities: { query: mensaje },
        confidence: 0.50
    };
}

// Ejecutar acción según intent
async function ejecutarAccion(intent: string, entities: any): Promise<string> {
    try {
        switch (intent) {
            case 'conductor_location': {
                const nombre = entities.nombre_conductor;
                if (!nombre) {
                    return 'Por favor especifica el nombre del conductor. Ejemplo: "¿Dónde está Max Beltrán?"';
                }

                const result = await pool.query(
                    `
          SELECT 
            c.nombre_completo,
            c.estado_actual,
            c.ultima_ubicacion_lat as lat,
            c.ultima_ubicacion_lng as lng,
            c.ultima_actualizacion_gps,
            EXTRACT(EPOCH FROM (NOW() - c.ultima_actualizacion_gps)) as segundos_desde_update
          FROM conductores c
          WHERE c.nombre_completo ILIKE $1
          AND c.estado = 'APROBADO'
          LIMIT 1
          `,
                    [`%${nombre}%`]
                );

                if (result.rows.length === 0) {
                    return `No encontré al conductor "${nombre}". ¿Podrías verificar el nombre?`;
                }

                const conductor = result.rows[0];
                const minutos = Math.floor(conductor.segundos_desde_update / 60);

                if (!conductor.lat || !conductor.lng) {
                    return `${conductor.nombre_completo} está registrado pero no tengo ubicación GPS disponible.`;
                }

                return `📍 **${conductor.nombre_completo}**\n\n` +
                    `Estado: ${conductor.estado_actual}\n` +
                    `Ubicación: ${conductor.lat.toFixed(6)}, ${conductor.lng.toFixed(6)}\n` +
                    `Última actualización: hace ${minutos} minutos`;
            }

            case 'fleet_active': {
                const result = await pool.query(
                    `
          SELECT 
            COUNT(*) FILTER (WHERE estado_actual = 'disponible') as disponibles,
            COUNT(*) FILTER (WHERE estado_actual = 'en_servicio') as en_servicio,
            COUNT(*) FILTER (WHERE estado_actual = 'offline') as offline,
            COUNT(*) as total
          FROM conductores
          WHERE estado = 'APROBADO'
          `
                );

                const stats = result.rows[0];

                return `🚗 **Estado de Flota**\n\n` +
                    `✅ Disponibles: ${stats.disponibles}\n` +
                    `🔄 En servicio: ${stats.en_servicio}\n` +
                    `⭕ Offline: ${stats.offline}\n` +
                    `**Total activos:** ${stats.total}`;
            }

            case 'service_status': {
                const fecha = entities.fecha === 'mañana'
                    ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0];

                const result = await pool.query(
                    `
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE conductor_id IS NOT NULL) as con_conductor,
            COUNT(*) FILTER (WHERE conductor_id IS NULL) as sin_conductor
          FROM solicitudes_servicios
          WHERE fecha_servicio = $1
          AND confirmado = true
          `,
                    [fecha]
                );

                const stats = result.rows[0];

                return `📅 **Servicios para ${entities.fecha}** (${fecha})\n\n` +
                    `Total: ${stats.total}\n` +
                    `Con conductor asignado: ${stats.con_conductor}\n` +
                    `Sin asignar: ${stats.sin_conductor}`;
            }

            case 'send_message': {
                // TODO: Integrar con Telegram/WhatsApp API
                return `📨 Función de mensajería en desarrollo.\n\n` +
                    `Mensaje a enviar: "${entities.mensaje}"\n` +
                    `Destinatario: ${entities.destinatario === 'all' ? 'Todos los conductores' : 'Conductor específico'}`;
            }

            case 'simple_query':
            default: {
                return `Entiendo que preguntas sobre "${entities.query}".\n\n` +
                    `Puedo ayudarte con:\n` +
                    `• Ubicación de conductores: "¿Dónde está Max Beltrán?"\n` +
                    `• Estado de flota: "Lista conductores activos"\n` +
                    `• Servicios del día: "Servicios para hoy"\n` +
                    `• Enviar mensajes: "Envía mensaje a todos: texto"`;
            }
        }
    } catch (error: any) {
        console.error('Error ejecutando acción:', error);
        return `❌ Ocurrió un error al procesar tu solicitud: ${error.message}`;
    }
}

// POST - Chat con ZURI
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mensaje, usuario_id, session_id } = body;

        if (!mensaje) {
            return NextResponse.json(
                { error: 'Mensaje requerido' },
                { status: 400 }
            );
        }

        const startTime = Date.now();

        // 1. Crear o recuperar conversación
        let conversacionId;
        if (session_id) {
            const existingConv = await pool.query(
                'SELECT id FROM zuri_conversaciones WHERE session_id = $1',
                [session_id]
            );
            if (existingConv.rows.length > 0) {
                conversacionId = existingConv.rows[0].id;
            }
        }

        if (!conversacionId) {
            const newConv = await pool.query(
                'INSERT INTO zuri_conversaciones (usuario_id) VALUES ($1) RETURNING id, session_id',
                [usuario_id || null]
            );
            conversacionId = newConv.rows[0].id;
        }

        // 2. Guardar mensaje del usuario
        const userMsg = await pool.query(
            `INSERT INTO zuri_mensajes (conversacion_id, rol, contenido)
       VALUES ($1, 'USER', $2)
       RETURNING id`,
            [conversacionId, mensaje]
        );
        const mensajeId = userMsg.rows[0].id;

        // 3. Clasificar intent
        const { intent, entities, confidence } = clasificarIntent(mensaje);

        // 4. Ejecutar acción
        const respuesta = await ejecutarAccion(intent, entities);

        // 5. Guardar respuesta de ZURI
        await pool.query(
            `INSERT INTO zuri_mensajes (conversacion_id, rol, contenido, metadata)
       VALUES ($1, 'ASSISTANT', $2, $3)`,
            [conversacionId, respuesta, JSON.stringify({ intent, entities, confidence })]
        );

        // 6. Log de intent
        const tiempoRespuesta = Date.now() - startTime;
        await pool.query(
            `INSERT INTO zuri_intents_log (mensaje_id, intent, entities, confidence, tiempo_respuesta_ms)
       VALUES ($1, $2, $3, $4, $5)`,
            [mensajeId, intent, JSON.stringify(entities), confidence, tiempoRespuesta]
        );

        return NextResponse.json({
            success: true,
            respuesta,
            metadata: {
                intent,
                confidence,
                tiempo_respuesta_ms: tiempoRespuesta
            }
        });

    } catch (error: any) {
        console.error('Error en chat ZURI:', error);
        return NextResponse.json(
            { error: 'Error en chat ZURI', details: error.message },
            { status: 500 }
        );
    }
}

// GET - Obtener historial de conversación
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const conversacion_id = searchParams.get('conversacion_id');

    if (!session_id && !conversacion_id) {
        return NextResponse.json(
            { error: 'Se requiere session_id o conversacion_id' },
            { status: 400 }
        );
    }

    try {
        let conversacionIdNum;

        if (session_id) {
            const conv = await pool.query(
                'SELECT id FROM zuri_conversaciones WHERE session_id = $1',
                [session_id]
            );
            if (conv.rows.length === 0) {
                return NextResponse.json({ mensajes: [] });
            }
            conversacionIdNum = conv.rows[0].id;
        } else {
            conversacionIdNum = parseInt(conversacion_id!);
        }

        const mensajes = await pool.query(
            `SELECT * FROM zuri_mensajes 
       WHERE conversacion_id = $1
       ORDER BY created_at ASC`,
            [conversacionIdNum]
        );

        return NextResponse.json({
            conversacion_id: conversacionIdNum,
            mensajes: mensajes.rows
        });

    } catch (error: any) {
        console.error('Error obteniendo historial:', error);
        return NextResponse.json(
            { error: 'Error obteniendo historial', details: error.message },
            { status: 500 }
        );
    }
}
