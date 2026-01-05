import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    const id = parseInt(params.id);
    
    // Obtener datos de la importación
    const importacionResult = await client.query(
      'SELECT * FROM importaciones_excel WHERE id = $1',
      [id]
    );
    
    if (importacionResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }
    
    // Obtener servicios con TODOS los campos incluyendo conflictos
    const serviciosResult = await client.query(`
      SELECT 
        s.id,
        s.fecha as fecha_servicio,
        s.hora_inicio,
        s.hora_fin,
        s.turno,
        s.clasificacion,
        s.doctor_nombre,
        s.doctor_es_nuevo,
        s.doctor_similaridad_score,
        s.descripcion,
        s.conductor_id as conductor_db_id,
        c."nombreCompleto" as conductor_nombre_completo,
        s.estado,
        s.observaciones,
        s.tiene_conflicto,
        s.conflicto_detalle
      FROM solicitudes_servicios s
      LEFT JOIN conductores c ON s.conductor_id = c.id
      WHERE s.importacion_id = $1
      ORDER BY s.fecha, s.hora_inicio
    `, [id]);
    
    await client.end();
    
    return NextResponse.json({
      importacion: importacionResult.rows[0],
      servicios: serviciosResult.rows,
      totalServicios: serviciosResult.rows.length
    });
    
  } catch (error: any) {
    await client.end();
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
