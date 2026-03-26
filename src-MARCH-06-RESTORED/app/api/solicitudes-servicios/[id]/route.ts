import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

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
      'fecha', 'hora_inicio', 'hora_fin', 'turno',
      'doctor_id', 'doctor_nombre',
      'paciente_nombre', 'paciente_dni',
      'cliente_nombre', 'tipo_servicio', 'area',
      'ubicacion', 'distrito',
      'direccion_recojo', 'direccion_destino',
      'conductor_id', 'conductor_nombre',
      'estado', 'observaciones'
    ];

    for (const campo of editables) {
      if (body[campo] !== undefined) {
        campos.push(`${campo} = $${idx}`);
        valores.push(body[campo]);
        idx++;
      }
    }

    if (campos.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    campos.push(`updated_at = NOW()`);
    valores.push(parseInt(params.id));

    const res = await client.query(
      `UPDATE solicitudes_servicios SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
      valores
    );
    await client.end();

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ solicitud: res.rows[0] });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
