/**
 * WhatsApp Webhook — Meta Cloud API
 * GET: Verificación del webhook (challenge)
 * POST: Recepción de mensajes → Claude parser → Entity resolver → INSERT toma_muestras
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';
import { parsearReporteTomaMuestra } from '@/lib/claude-parser';
import {
    resolverConductor,
    resolverTecnico,
    resolverOCrearPaciente,
    resolverConductorPorTelefono,
    crearConductorProvisional,
} from '@/lib/entity-resolver';
import { sendEmail } from '@/lib/email';


const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'zuri_webhook_2026';

// ─── GET: Webhook Verification ───────────────────────────────────────
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ [WhatsApp Webhook] Verificado exitosamente');
        return new NextResponse(challenge, { status: 200 });
    }

    console.warn('⚠️ [WhatsApp Webhook] Verificación fallida');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ─── POST: Recibir mensajes ──────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Responder 200 inmediatamente para que Meta no reintente
        // Procesar en background
        processWebhookAsync(body).catch((err) =>
            console.error('❌ [WhatsApp Webhook] Error procesando:', err.message)
        );

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('❌ [WhatsApp Webhook] Error parsing body:', error);
        return NextResponse.json({ status: 'ok' });
    }
}

// ─── Procesamiento asíncrono ─────────────────────────────────────────
async function processWebhookAsync(body: any) {
    const entry = body?.entry?.[0];
    if (!entry) return;

    const changes = entry?.changes?.[0];
    if (!changes || changes.field !== 'messages') return;

    const messages = changes.value?.messages;
    if (!messages || messages.length === 0) return;

    for (const message of messages) {
        // Solo procesar mensajes de texto
        if (message.type !== 'text') continue;

        const textoMensaje = message.text?.body;
        const whatsappPhone = message.from; // número del remitente

        if (!textoMensaje || textoMensaje.length < 10) continue;

        console.log(`📩 [WhatsApp] Mensaje de ${whatsappPhone}: ${textoMensaje.substring(0, 80)}...`);

        await procesarMensajeTomaMuestra(textoMensaje, whatsappPhone);
    }
}

// ─── Procesar un mensaje individual ──────────────────────────────────
async function procesarMensajeTomaMuestra(texto: string, whatsappPhone: string) {
    const client = await pool.connect();

    try {
        // 1. Parsear con Claude AI
        const parsed = await parsearReporteTomaMuestra(texto);

        console.log('🤖 [Claude] Parseado:', JSON.stringify(parsed, null, 2));

        // 2. Resolver entidades
        // — Conductor: primero por teléfono WA, luego por nombre/placa del texto
        let conductorMatch = await resolverConductorPorTelefono(whatsappPhone);
        let esProvisional = false;

        if (!conductorMatch) {
            conductorMatch = (parsed.conductor || parsed.placa)
                ? await resolverConductor(parsed.conductor, parsed.placa)
                : null;
        }

        // Si sigue sin encontrar → crear provisional
        if (!conductorMatch) {
            try {
                const prov = await crearConductorProvisional(whatsappPhone);
                conductorMatch = { id: prov.id, nombre: 'Por Verificar' };
                esProvisional = true;
            } catch (e: any) {
                console.error('❌ [Provisional] No se pudo crear:', e.message);
            }
        }

        const [tecnicoMatch, pacienteMatch] = await Promise.all([
            parsed.tecnico
                ? resolverTecnico(parsed.tecnico)
                : Promise.resolve(null),
            parsed.paciente
                ? resolverOCrearPaciente(parsed.paciente, parsed.distrito, parsed.observaciones, parsed.fecha)
                : Promise.resolve(null),
        ]);

        console.log('🔗 [Resolver] Conductor:', conductorMatch?.nombre || '❌ No match', esProvisional ? '(PROVISIONAL)' : '');
        console.log('🔗 [Resolver] Técnico:', tecnicoMatch?.nombre || '❌ No match');
        console.log('🔗 [Resolver] Paciente:', pacienteMatch?.nombre || '❌ No match',
            pacienteMatch && 'esNuevo' in pacienteMatch && pacienteMatch.esNuevo ? '(NUEVO)' : '');

        // 3. INSERT en toma_muestras
        const horaLlegada = parsed.hora_llegada ? parseTimeToSQL(parsed.hora_llegada) : null;
        const horaSalida = parsed.hora_salida ? parseTimeToSQL(parsed.hora_salida) : null;

        await client.query(
            `INSERT INTO toma_muestras (
        fecha, conductor_id, tecnico_id, paciente_id,
        conductor_raw, tecnico_raw, paciente_raw, placa_raw,
        hora_llegada, hora_salida, distrito, observaciones,
        whatsapp_phone, mensaje_original,
        match_conductor, match_tecnico, match_paciente,
        error_parse
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14,
        $15, $16, $17,
        $18
      )`,
            [
                parsed.fecha || new Date().toISOString().split('T')[0],
                conductorMatch?.id || null,
                tecnicoMatch?.id || null,
                pacienteMatch?.id || null,
                parsed.conductor || null,
                parsed.tecnico || null,
                parsed.paciente || null,
                parsed.placa || null,
                horaLlegada,
                horaSalida,
                parsed.distrito || null,
                parsed.observaciones || null,
                whatsappPhone,
                texto,
                !!conductorMatch,
                !!tecnicoMatch,
                !!pacienteMatch,
                parsed.confianza < 0.3,
            ]
        );

        // 4. Email si se creó conductor provisional
        if (esProvisional) {
            sendEmail({
                to: 'admin@zuri.pe',
                subject: `🚗 Conductor nuevo detectado por WhatsApp — completar datos`,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
                    <h2 style="color:#ea580c;margin-bottom:8px">🚗 Conductor nuevo por WhatsApp</h2>
                    <p style="color:#374151;margin-bottom:16px">
                      Se recibió un reporte de toma de muestra de un número <strong>no registrado en el sistema</strong>.
                      Se creó un perfil provisional automáticamente.
                    </p>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                      <tr style="background:#fff7ed">
                        <td style="padding:10px 14px;border:1px solid #fed7aa;font-weight:bold;color:#9a3412">Teléfono WhatsApp</td>
                        <td style="padding:10px 14px;border:1px solid #fed7aa;font-family:monospace;color:#1f2937">${whatsappPhone}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:bold;color:#374151">Nombre reportado</td>
                        <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#1f2937">${parsed.conductor || '—'}</td>
                      </tr>
                      <tr style="background:#f9fafb">
                        <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:bold;color:#374151">Placa reportada</td>
                        <td style="padding:10px 14px;border:1px solid #e5e7eb;font-family:monospace">${parsed.placa || '—'}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:bold;color:#374151">Mensaje</td>
                        <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:12px;color:#6b7280">${texto.substring(0, 200)}</td>
                      </tr>
                      <tr style="background:#f9fafb">
                        <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:bold;color:#374151">Fecha / Hora</td>
                        <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#1f2937">${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}</td>
                      </tr>
                    </table>
                    <a href="https://admin.zuri.pe/dashboard/conductores/pendientes"
                       style="display:inline-block;padding:12px 24px;background:#ea580c;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
                      ✏️ Completar perfil del conductor
                    </a>
                    <p style="color:#9ca3af;font-size:12px;margin-top:20px">ZURI Platform — alerta automática</p>
                  </div>
                `,
            }).catch((err) => console.error('❌ [Email Provisional]', err));
        }

        // 5. Si conductor resuelto, actualizar ultima actividad
        if (conductorMatch) {
            await client.query(
                `UPDATE conductores SET "updatedAt" = NOW() WHERE id = $1`,
                [conductorMatch.id]
            );
        }

        console.log(
            `✅ [WhatsApp] Toma de muestra registrada — Conductor: ${conductorMatch?.nombre || parsed.conductor || 'N/A'} | Paciente: ${pacienteMatch?.nombre || parsed.paciente || 'N/A'}`
        );
    } catch (error: any) {
        console.error('❌ [WhatsApp] Error procesando mensaje:', error.message);

        // Guardar el registro con error para revisión manual
        try {
            await client.query(
                `INSERT INTO toma_muestras (
          fecha, mensaje_original, whatsapp_phone, error_parse
        ) VALUES (CURRENT_DATE, $1, $2, true)`,
                [texto, whatsappPhone]
            );
        } catch (e) {
            console.error('❌ [WhatsApp] Error guardando registro de error:', e);
        }
    } finally {
        client.release();
    }
}

// ─── Helper: Parsear hora ────────────────────────────────────────────
function parseTimeToSQL(time: string): string | null {
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}
