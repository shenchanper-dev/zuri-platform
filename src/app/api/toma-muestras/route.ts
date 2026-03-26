/**
 * API Toma de Muestras
 * GET: Listar reportes con filtros por fecha, conductor, distrito
 * POST: Recibe { texto } → Claude parser → entity resolver → INSERT toma_muestras
 * Incluye JOINs a conductores, doctores y pacientes
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';
import { parsearReporteTomaMuestra } from '@/lib/claude-parser';
import { resolverConductor, resolverTecnico, resolverOCrearPaciente } from '@/lib/entity-resolver';
import { sendEmail } from '@/lib/email';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
  const conductorId = searchParams.get('conductor_id');
  const distrito = searchParams.get('distrito');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const client = await pool.connect();

  try {
    const params: any[] = [fecha];
    let paramIdx = 2;
    let whereExtra = '';

    if (conductorId) {
      whereExtra += ` AND tm.conductor_id = $${paramIdx}`;
      params.push(parseInt(conductorId));
      paramIdx++;
    }

    if (distrito) {
      whereExtra += ` AND tm.distrito ILIKE $${paramIdx}`;
      params.push(`%${distrito}%`);
      paramIdx++;
    }

    const query = `
      SELECT 
        tm.*,
        c."nombreCompleto" as conductor_nombre,
        c.placa as conductor_placa,
        d.nombre_completo as tecnico_nombre,
        p.nombre_completo as paciente_nombre,
        p.celular as paciente_celular
      FROM toma_muestras tm
      LEFT JOIN conductores c ON tm.conductor_id = c.id
      LEFT JOIN doctores d ON tm.tecnico_id = d.id
      LEFT JOIN pacientes p ON tm.paciente_id = p.id
      WHERE tm.fecha = $1 ${whereExtra}
      ORDER BY tm.fecha_recibido DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(limit, offset);

    const result = await client.query(query, params);

    // Estadísticas del día
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_servicios,
        COUNT(DISTINCT tm.conductor_id) FILTER (WHERE tm.conductor_id IS NOT NULL) as conductores_activos,
        ROUND(AVG(tm.duracion_minutos) FILTER (WHERE tm.duracion_minutos IS NOT NULL), 1) as tiempo_promedio,
        COUNT(DISTINCT tm.distrito) FILTER (WHERE tm.distrito IS NOT NULL AND tm.distrito != '') as distritos_cubiertos,
        COUNT(*) FILTER (WHERE tm.error_parse = true) as errores_parse
      FROM toma_muestras tm
      WHERE tm.fecha = $1
    `, [fecha]);

    // Distritos desglose
    const distritosResult = await client.query(`
      SELECT distrito, COUNT(*) as total
      FROM toma_muestras
      WHERE fecha = $1 AND distrito IS NOT NULL AND distrito != ''
      GROUP BY distrito
      ORDER BY total DESC
    `, [fecha]);

    // Por conductor desglose
    const conductoresResult = await client.query(`
      SELECT 
        c."nombreCompleto" as nombre,
        c.placa,
        COUNT(*) as total_servicios,
        ROUND(AVG(tm.duracion_minutos) FILTER (WHERE tm.duracion_minutos IS NOT NULL), 1) as tiempo_promedio
      FROM toma_muestras tm
      JOIN conductores c ON tm.conductor_id = c.id
      WHERE tm.fecha = $1
      GROUP BY c.id, c."nombreCompleto", c.placa
      ORDER BY total_servicios DESC
    `, [fecha]);

    return NextResponse.json({
      success: true,
      reportes: result.rows,
      stats: statsResult.rows[0],
      distritos: distritosResult.rows,
      porConductor: conductoresResult.rows,
    });

  } catch (error: any) {
    console.error('❌ [API Toma Muestras] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ─── POST: Parsear texto y guardar en toma_muestras ──────────────────
export async function POST(request: NextRequest) {
  let body: { texto?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON inválido' }, { status: 400 });
  }

  const texto = body?.texto?.trim();
  if (!texto || texto.length < 5) {
    return NextResponse.json(
      { success: false, error: 'El campo "texto" es requerido y debe tener al menos 5 caracteres' },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    // 1. Claude parser — extrae estructurado del texto libre
    const parsed = await parsearReporteTomaMuestra(texto);
    console.log('🤖 [Claude Parser] Resultado:', JSON.stringify(parsed));

    // 2. Resolver entidades en paralelo
    const [conductorMatch, tecnicoMatch, pacienteMatch] = await Promise.all([
      (parsed.conductor || parsed.placa)
        ? resolverConductor(parsed.conductor, parsed.placa)
        : Promise.resolve(null),
      parsed.tecnico
        ? resolverTecnico(parsed.tecnico)
        : Promise.resolve(null),
      parsed.paciente
        ? resolverOCrearPaciente(parsed.paciente, parsed.distrito, parsed.observaciones, parsed.fecha)
        : Promise.resolve(null),
    ]);

    console.log('🔗 Conductor:', conductorMatch?.nombre ?? `❌ "${parsed.conductor}"`);
    console.log('🔗 Técnico  :', tecnicoMatch?.nombre ?? `❌ "${parsed.tecnico}"`);
    console.log('🔗 Paciente :', pacienteMatch?.nombre ?? `❌ "${parsed.paciente}"`,
      pacienteMatch && 'esNuevo' in pacienteMatch && pacienteMatch.esNuevo ? '(NUEVO)' : '');

    // Helper: "HH:MM" → "HH:MM:SS" | null
    const toTimeSQL = (t: string): string | null => {
      const m = t?.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      const h = parseInt(m[1]), min = parseInt(m[2]);
      if (h > 23 || min > 59) return null;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
    };

    // 3. INSERT en toma_muestras
    const insertResult = await client.query(
      `INSERT INTO toma_muestras (
        fecha,
        conductor_id, tecnico_id, paciente_id,
        conductor_raw, tecnico_raw, paciente_raw, placa_raw,
        hora_llegada, hora_salida,
        distrito, observaciones,
        mensaje_original,
        match_conductor, match_tecnico, match_paciente,
        error_parse
      ) VALUES (
        $1, $2::integer, $3::integer, $4::integer,
        $5, $6, $7, $8,
        $9, $10,
        $11, $12,
        $13,
        $14, $15, $16,
        $17
      ) RETURNING id`,
      [
        parsed.fecha || new Date().toISOString().split('T')[0],
        conductorMatch?.id ?? null,
        tecnicoMatch?.id ?? null,
        pacienteMatch?.id ?? null,
        parsed.conductor || null,
        parsed.tecnico || null,
        parsed.paciente || null,
        parsed.placa || null,
        toTimeSQL(parsed.hora_llegada),
        toTimeSQL(parsed.hora_salida),
        parsed.distrito || null,
        parsed.observaciones || null,
        texto,
        !!conductorMatch,
        !!tecnicoMatch,
        !!pacienteMatch,
        parsed.confianza !== undefined ? parsed.confianza < 0.3 : false,
      ]
    );

    const newId = insertResult.rows[0].id;

    // 4. Alerta email si el conductor no fue reconocido
    if (!conductorMatch) {
      const conductorRaw = parsed.conductor || 'desconocido';
      const placaRaw = parsed.placa || 'sin placa';
      // fire-and-forget — no bloquea la respuesta
      sendEmail({
        to: 'admin@zuri.pe',
        subject: `⚠️ Conductor no registrado en reporte WhatsApp — ${conductorRaw}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#dc2626;margin-bottom:8px">⚠️ Conductor no registrado</h2>
            <p style="color:#374151;margin-bottom:16px">
              Se recibió un reporte de toma de muestra vía WhatsApp con un conductor
              que <strong>no se encontró en el sistema</strong>.
            </p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr style="background:#fef2f2">
                <td style="padding:10px 14px;border:1px solid #fecaca;font-weight:bold;color:#991b1b">Nombre reportado</td>
                <td style="padding:10px 14px;border:1px solid #fecaca;color:#1f2937">${conductorRaw}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:bold;color:#374151">Placa reportada</td>
                <td style="padding:10px 14px;border:1px solid #e5e7eb;font-family:monospace;color:#1f2937">${placaRaw}</td>
              </tr>
              <tr style="background:#f9fafb">
                <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:bold;color:#374151">Distrito</td>
                <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#1f2937">${parsed.distrito || '—'}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:bold;color:#374151">Fecha / Hora</td>
                <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#1f2937">${parsed.fecha || new Date().toLocaleDateString('es-PE')} — ${parsed.hora_llegada || '?'}–${parsed.hora_salida || '?'}</td>
              </tr>
            </table>
            <a href="https://admin.zuri.pe/dashboard/conductores"
               style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
              👤 Registrar conductor ahora
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:20px">ZURI Platform — alerta automática</p>
          </div>
        `,
      }).catch((err) => console.error('❌ [Email Alerta Conductor]', err));
    }

    // 4. Retornar registro completo con JOINs
    const fullRecord = await client.query(
      `SELECT
        tm.*,
        c."nombreCompleto"  AS conductor_nombre,
        c.placa             AS conductor_placa,
        d.nombre_completo   AS tecnico_nombre,
        p.nombre_completo   AS paciente_nombre,
        p.celular           AS paciente_celular
       FROM toma_muestras tm
       LEFT JOIN conductores c ON tm.conductor_id = c.id
       LEFT JOIN doctores    d ON tm.tecnico_id   = d.id
       LEFT JOIN pacientes   p ON tm.paciente_id  = p.id
       WHERE tm.id = $1`,
      [newId]
    );

    return NextResponse.json(
      {
        success: true,
        reporte: fullRecord.rows[0],
        entidades: {
          conductor: conductorMatch ?? null,
          tecnico: tecnicoMatch ?? null,
          paciente: pacienteMatch ?? null,
        },
        parsed,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ [POST Toma Muestras] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
