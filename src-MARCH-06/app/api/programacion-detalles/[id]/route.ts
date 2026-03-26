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
      'tipo_servicio_id', 'area_servicio_id',
      'doctor_id', 'doctor_nombre',
      'conductor_id', 'conductor_nombre',
      'fecha', 'hora_inicio', 'hora_fin', 'turno',
      'ubicacion', 'direccion_completa',
      'estado', 'calificacion_id', 'calificacion_detalle',
      'motivo_no_disponibilidad_id',
      'observaciones', 'incidencias', 'orden',
      'cliente_especial_id', 'cliente_nombre',
      'distrito_id', 'distrito_nombre',
      'especialidad_id', 'especialidad_nombre',
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
      `UPDATE programacion_detalles SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
      valores
    );
    await client.end();

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Detalle no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ detalle: res.rows[0] });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// PATCH: Assign Conductor with Conflict Validation
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  const client = new Client(DB_CONFIG);
  try {
    const body = await request.json();
    const { conductor_id, conductor_nombre } = body;

    if (!conductor_id) {
      return NextResponse.json({ error: 'conductor_id es requerido' }, { status: 400 });
    }

    await client.connect();

    // 1. Get detalle info
    const detalleRes = await client.query(
      'SELECT * FROM programacion_detalles WHERE id = $1',
      [parseInt(params.id)]
    );

    if (detalleRes.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Detalle no encontrado' }, { status: 404 });
    }

    const detalle = detalleRes.rows[0];

    // 2. Validate conductor exists
    const conductorRes = await client.query(
      'SELECT id, "nombreCompleto", estado, calificacion_promedio FROM conductores WHERE id = $1',
      [conductor_id]
    );

    if (conductorRes.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Conductor no encontrado' }, { status: 404 });
    }

    const conductor = conductorRes.rows[0];

    // 3. Check for conflicts (unless force=true)
    let conflictos: any[] = [];
    if (!force) {
      const conflictRes = await client.query(`
        SELECT DISTINCT
          p.codigo_programacion,
          pd.doctor_nombre,
          pd.hora_inicio,
          pd.hora_fin,
          pd.ubicacion,
          pd.fecha
        FROM programacion_detalles pd
        JOIN programaciones p ON pd.programacion_id = p.id
        WHERE pd.conductor_id = $1
          AND pd.fecha = $2
          AND pd.estado NOT IN ('CANCELADO', 'NO_DISPONIBLE')
          AND p.estado NOT IN ('CANCELADO')
          AND pd.id != $3
          AND ((pd.hora_inicio < $4::time AND pd.hora_fin > $3::time))
        ORDER BY pd.hora_inicio
      `, [conductor_id, detalle.fecha, parseInt(params.id), detalle.hora_fin, detalle.hora_inicio]);

      conflictos = conflictRes.rows.map(c => ({
        programacion_codigo: c.codigo_programacion,
        doctor_nombre: c.doctor_nombre,
        hora_inicio: c.hora_inicio,
        hora_fin: c.hora_fin,
        ubicacion: c.ubicacion,
        fecha: c.fecha
      }));

      if (conflictos.length > 0) {
        await client.end();
        return NextResponse.json({
          error: 'Conflicto de horario detectado',
          conflictos,
          detalle: null
        }, { status: 409 });
      }
    }

    // 4. Update detalle (in transaction)
    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE programacion_detalles
      SET 
        conductor_id = $1,
        conductor_nombre = $2,
        estado = CASE 
          WHEN estado = 'PROGRAMADO' THEN 'ASIGNADO'
          ELSE estado
        END,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [conductor_id, conductor_nombre || conductor.nombreCompleto, parseInt(params.id)]);

    await client.query('COMMIT');
    await client.end();

    return NextResponse.json({
      detalle: updateRes.rows[0],
      conductor: {
        id: conductor.id,
        nombreCompleto: conductor.nombreCompleto,
        estado: conductor.estado,
        calificacion_promedio: conductor.calificacion_promedio
      },
      conflictos: [],
      warning: conductor.estado !== 'ACTIVO' ? `Conductor está en estado: ${conductor.estado}` : null
    });

  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
      await client.end();
    } catch { }
    console.error('[PATCH Detalle Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
