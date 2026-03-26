import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();

    const progRes = await client.query(`
      SELECT p.*,
        ts.nombre as tipo_servicio_nombre,
        ce.nombre as cliente_especial_nombre
      FROM programaciones p
      LEFT JOIN tipos_servicio ts ON p.tipo_servicio_id = ts.id
      LEFT JOIN clientes_especiales ce ON p.cliente_especial_id = ce.id
      WHERE p.id = $1
    `, [parseInt(params.id)]);

    if (progRes.rows.length === 0) {
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 });
    }

    const detRes = await client.query(`
      SELECT pd.*,
        ts.nombre as tipo_servicio_nombre,
        ase.nombre as area_nombre,
        cal.descripcion as calificacion_desc, cal.color as calificacion_color,
        mnd.descripcion as motivo_desc,
        c."nombreCompleto" as conductor_nombre_bd
      FROM programacion_detalles pd
      LEFT JOIN tipos_servicio ts ON pd.tipo_servicio_id = ts.id
      LEFT JOIN areas_servicio ase ON pd.area_servicio_id = ase.id
      LEFT JOIN calificaciones cal ON pd.calificacion_id = cal.id
      LEFT JOIN motivos_no_disponibilidad mnd ON pd.motivo_no_disponibilidad_id = mnd.id
      LEFT JOIN conductores c ON pd.conductor_id = c.id
      WHERE pd.programacion_id = $1
      ORDER BY pd.orden, pd.hora_inicio
    `, [parseInt(params.id)]);

    await client.end();

    return NextResponse.json({
      programacion: progRes.rows[0],
      detalles: detRes.rows
    });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new Client(DB_CONFIG);
  try {
    const body = await request.json();
    await client.connect();

    const campos: string[] = [];
    const valores: any[] = [];
    let idx = 1;

    const editables = [
      'fecha_programacion', 'cliente_nombre', 'cliente_id',
      'cliente_especial_id', 'tipo_servicio_id',
      'estado', 'notas'
    ];

    for (const campo of editables) {
      if (body[campo] !== undefined) {
        campos.push(`${campo} = $${idx}`);
        valores.push(body[campo]);
        idx++;
      }
    }

    if (campos.length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    campos.push('updated_at = NOW()');
    valores.push(parseInt(params.id));

    const res = await client.query(
      `UPDATE programaciones SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
      valores
    );
    await client.end();

    return NextResponse.json({ programacion: res.rows[0] });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    await client.query('DELETE FROM programaciones WHERE id = $1', [parseInt(params.id)]);
    await client.end();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
