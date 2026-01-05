import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const fecha = searchParams.get('fecha');
    
    let query = 'SELECT * FROM vista_programaciones_resumen WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (estado) {
      query += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }
    
    if (fecha) {
      query += ` AND fecha_programacion = $${paramIndex}`;
      params.push(fecha);
      paramIndex++;
    }
    
    query += ' ORDER BY fecha_programacion DESC, created_at DESC LIMIT 100';
    
    const result = await client.query(query, params);
    await client.end();
    
    const estadisticas = {
      total: result.rows.length,
      borradores: result.rows.filter(p => p.estado === 'BORRADOR').length,
      confirmadas: result.rows.filter(p => p.estado === 'CONFIRMADO').length,
      completadas: result.rows.filter(p => p.estado === 'COMPLETADO').length
    };
    
    return NextResponse.json({ 
      programaciones: result.rows,
      estadisticas
    });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const body = await request.json();
    
    const result = await client.query(`
      INSERT INTO programaciones (
        importacion_id, fecha_programacion, cliente_id, cliente_nombre,
        tipo_servicio_id, estado, notas, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      body.importacion_id || null,
      body.fecha_programacion,
      body.cliente_id || null,
      body.cliente_nombre,
      body.tipo_servicio_id || null,
      body.estado || 'BORRADOR',
      body.notas || null,
      body.creado_por || 'Sistema'
    ]);
    
    await client.end();
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
