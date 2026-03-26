import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

// ============================================================================
// POST /api/programaciones/desde-importacion
// Creates a programación + detalles from an importación Excel.
// Carries ALL available fields: cliente, area, tipo, distrito, especialidad.
// ============================================================================
export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    const body = await request.json();
    const { importacion_id } = body;
    if (!importacion_id) {
      return NextResponse.json({ error: 'importacion_id requerido' }, { status: 400 });
    }

    await client.connect();

    // 1. Verify importación exists
    const impRes = await client.query(
      'SELECT * FROM importaciones_excel WHERE id = $1', [importacion_id]
    );
    if (impRes.rows.length === 0) {
      return NextResponse.json({ error: 'Importación no encontrada' }, { status: 404 });
    }
    const imp = impRes.rows[0];

    // 2. Check if programación already exists for this importación
    const existingProg = await client.query(
      'SELECT id, codigo_programacion FROM programaciones WHERE importacion_id = $1', [importacion_id]
    );
    if (existingProg.rows.length > 0) {
      return NextResponse.json({
        success: true,
        programacion: existingProg.rows[0],
        detallesCreados: 0,
        message: 'Ya existe una programación para esta importación'
      });
    }

    // 3. Get solicitudes from this importación
    const solRes = await client.query(
      'SELECT * FROM solicitudes_servicios WHERE importacion_id = $1 ORDER BY fecha, hora_inicio',
      [importacion_id]
    );

    if (solRes.rows.length === 0) {
      return NextResponse.json({ error: 'No hay solicitudes en esta importación' }, { status: 400 });
    }

    // 4. Resolve lookup IDs from text values
    // Pre-load lookup tables for matching
    const [areasDb, tiposDb, distritosDb, clientesDb] = await Promise.all([
      client.query("SELECT id, codigo, nombre FROM areas_servicio"),
      client.query("SELECT id, codigo, nombre FROM tipos_servicio"),
      client.query("SELECT id, nombre FROM distritos"),
      client.query("SELECT id, codigo, nombre FROM clientes_especiales"),
    ]);

    const findArea = (text: string | null): number | null => {
      if (!text) return null;
      const t = text.toUpperCase().trim();
      return areasDb.rows.find((a: any) =>
        a.codigo === t || a.nombre.toUpperCase() === t
      )?.id ?? null;
    };

    const findTipo = (text: string | null): number | null => {
      if (!text) return null;
      const t = text.toUpperCase().trim();
      return tiposDb.rows.find((ts: any) =>
        ts.codigo === t || ts.nombre.toUpperCase() === t
      )?.id ?? null;
    };

    const findDistrito = (text: string | null): { id: number | null; nombre: string | null } => {
      if (!text) return { id: null, nombre: null };
      const t = text.toUpperCase().trim();
      const match = distritosDb.rows.find((d: any) => d.nombre.toUpperCase() === t);
      return match ? { id: match.id, nombre: match.nombre } : { id: null, nombre: text };
    };

    const findCliente = (text: string | null): { id: number | null; nombre: string | null } => {
      if (!text) return { id: null, nombre: null };
      const t = text.toUpperCase().trim();
      const match = clientesDb.rows.find((c: any) =>
        c.codigo.toUpperCase() === t || c.nombre.toUpperCase() === t
      );
      return match ? { id: match.id, nombre: match.nombre } : { id: null, nombre: text };
    };

    // 5. Create programación
    const fechaProg = solRes.rows[0].fecha || new Date().toISOString().split('T')[0];
    const progRes = await client.query(`
      INSERT INTO programaciones (
        importacion_id, fecha_programacion, cliente_nombre, estado, creado_por
      ) VALUES ($1, $2, $3, 'BORRADOR', 'admin')
      RETURNING *
    `, [importacion_id, fechaProg, imp.nombre_archivo]);

    const progId = progRes.rows[0].id;

    // 6. Create detalles carrying ALL fields
    let orden = 1;
    for (const sol of solRes.rows) {
      const areaId = findArea(sol.area);
      const tipoId = findTipo(sol.tipo_servicio);
      const distrito = findDistrito(sol.distrito || sol.distrito_recojo);
      const clienteInfo = findCliente(sol.cliente_nombre);

      await client.query(`
        INSERT INTO programacion_detalles (
          programacion_id, solicitud_servicio_id,
          doctor_id, doctor_nombre,
          conductor_id, conductor_nombre,
          fecha, hora_inicio, hora_fin, turno,
          ubicacion, direccion_completa,
          area_servicio_id, tipo_servicio_id,
          cliente_especial_id, cliente_nombre,
          distrito_id, distrito_nombre,
          estado, orden, observaciones
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
      `, [
        progId, sol.id,
        sol.doctor_id, sol.doctor_nombre,
        sol.conductor_id, sol.conductor_nombre,
        sol.fecha || fechaProg,
        sol.hora_inicio || '08:00',
        sol.hora_fin || '09:00',
        sol.turno,
        sol.ubicacion || sol.direccion_recojo || '',
        sol.direccion_recojo
          ? `${sol.direccion_recojo}${sol.direccion_destino ? ' → ' + sol.direccion_destino : ''}`
          : sol.ubicacion || '',
        areaId,
        tipoId,
        clienteInfo.id,
        clienteInfo.nombre,
        distrito.id,
        distrito.nombre,
        sol.conductor_id ? 'ASIGNADO' : 'PROGRAMADO',
        orden++,
        sol.observaciones || null,
      ]);
    }

    await client.end();

    return NextResponse.json({
      success: true,
      programacion: progRes.rows[0],
      detallesCreados: orden - 1
    }, { status: 201 });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
