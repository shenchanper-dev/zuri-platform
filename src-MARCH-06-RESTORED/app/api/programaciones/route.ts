import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado');
  const fecha = searchParams.get('fecha');

  const client = new Client(DB_CONFIG);
  try {
    await client.connect();

    let query = `
      SELECT 
        p.id, p.codigo_programacion, p.fecha_programacion,
        p.cliente_nombre, p.cliente_especial_id, p.estado,
        p.importacion_id, p.notas, p.creado_por,
        p.created_at, p.updated_at,
        ce.nombre as cliente_especial_nombre,
        COUNT(pd.id) as total_detalles,
        COUNT(CASE WHEN pd.conductor_id IS NOT NULL THEN 1 END) as detalles_asignados,
        COUNT(CASE WHEN pd.estado = 'COMPLETADO' THEN 1 END) as detalles_completados
      FROM programaciones p
      LEFT JOIN clientes_especiales ce ON p.cliente_especial_id = ce.id
      LEFT JOIN programacion_detalles pd ON pd.programacion_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (estado) {
      query += ` AND p.estado = $${idx}`;
      params.push(estado);
      idx++;
    }
    if (fecha) {
      query += ` AND p.fecha_programacion = $${idx}`;
      params.push(fecha);
      idx++;
    }

    query += ` GROUP BY p.id, ce.nombre ORDER BY p.fecha_programacion DESC, p.id DESC`;

    const res = await client.query(query, params);

    // Estadísticas
    const statsRes = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'BORRADOR' THEN 1 END) as borradores,
        COUNT(CASE WHEN estado = 'CONFIRMADO' THEN 1 END) as confirmados,
        COUNT(CASE WHEN estado = 'EN_EJECUCION' THEN 1 END) as en_ejecucion,
        COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END) as completados
      FROM programaciones
    `);

    await client.end();

    return NextResponse.json({
      programaciones: res.rows,
      stats: statsRes.rows[0]
    });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    const body = await request.json();
    await client.connect();

    const res = await client.query(`
      INSERT INTO programaciones (
        fecha_programacion, cliente_nombre, cliente_id,
        cliente_especial_id, tipo_servicio_id, importacion_id,
        estado, notas, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      body.fecha_programacion,
      body.cliente_nombre || null,
      body.cliente_id || null,
      body.cliente_especial_id || null,
      body.tipo_servicio_id || null,
      body.importacion_id || null,
      body.estado || 'BORRADOR',
      body.notas || null,
      body.creado_por || 'admin'
    ]);

    await client.end();
    return NextResponse.json({ programacion: res.rows[0] }, { status: 201 });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
