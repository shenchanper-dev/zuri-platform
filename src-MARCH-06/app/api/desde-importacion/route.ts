import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const body = await request.json();
    const { importacionId } = body;
    
    await client.query('BEGIN');
    
    const importResult = await client.query(
      'SELECT * FROM importaciones_excel WHERE id = $1',
      [importacionId]
    );
    
    if (importResult.rows.length === 0) {
      await client.query('ROLLBACK');
      await client.end();
      return NextResponse.json({ error: 'Importación no encontrada' }, { status: 404 });
    }
    
    const importacion = importResult.rows[0];
    
    const progResult = await client.query(`
      INSERT INTO programaciones (
        importacion_id, fecha_programacion, cliente_nombre, estado, creado_por
      ) VALUES ($1, $2, $3, 'BORRADOR', 'Sistema')
      RETURNING *
    `, [importacionId, importacion.fecha_archivo, 'SANNA']);
    
    const programacionId = progResult.rows[0].id;
    
    const serviciosResult = await client.query(`
      SELECT * FROM solicitudes_servicios 
      WHERE importacion_id = $1 
      AND estado IN ('PROGRAMADO', 'RESERVADO')
      ORDER BY fecha, hora_inicio
    `, [importacionId]);
    
    for (let i = 0; i < serviciosResult.rows.length; i++) {
      const servicio = serviciosResult.rows[i];
      await client.query(`
        INSERT INTO programacion_detalles (
          programacion_id, solicitud_servicio_id, cliente_nombre,
          doctor_id, doctor_nombre, conductor_id,
          fecha, hora_inicio, hora_fin, turno, ubicacion,
          direccion_completa, estado, observaciones, orden
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        programacionId, servicio.id, 'SANNA',
        servicio.doctor_id, servicio.doctor_nombre, servicio.conductor_id,
        servicio.fecha, servicio.hora_inicio, servicio.hora_fin, 
        servicio.turno, servicio.descripcion, servicio.descripcion,
        'PROGRAMADO', servicio.observaciones, i + 1
      ]);
    }
    
    await client.query('COMMIT');
    await client.end();
    
    return NextResponse.json({
      success: true,
      programacion: progResult.rows[0],
      serviciosImportados: serviciosResult.rows.length
    }, { status: 201 });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
