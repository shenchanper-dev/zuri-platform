import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = {
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
};

export async function GET(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limit') || '50');
    const estado = searchParams.get('estado');
    
    let query = 'SELECT * FROM vista_resumen_importaciones WHERE 1=1';
    const params: any[] = [];
    
    if (estado && estado !== 'TODOS') {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }
    
    params.push(limite);
    query += ` LIMIT $${params.length}`;
    
    const result = await client.query(query, params);
    const statsResult = await client.query(`
      SELECT COUNT(*) as total_importaciones, SUM(total_registros) as total_servicios,
      SUM(doctores_nuevos) as total_doctores_nuevos,
      COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END) as importaciones_completadas,
      COUNT(CASE WHEN estado = 'ERROR' THEN 1 END) as importaciones_error,
      COUNT(CASE WHEN estado = 'PARCIAL' THEN 1 END) as importaciones_parciales
      FROM importaciones_excel
    `);
    
    await client.end();
    return NextResponse.json({
      importaciones: result.rows,
      estadisticas: statsResult.rows[0],
      total: result.rows.length
    });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    
    await client.connect();
    const checkResult = await client.query('SELECT codigo_zuri FROM importaciones_excel WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }
    
    await client.query('DELETE FROM importaciones_excel WHERE id = $1', [id]);
    await client.end();
    return NextResponse.json({ message: 'Eliminada correctamente' });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
