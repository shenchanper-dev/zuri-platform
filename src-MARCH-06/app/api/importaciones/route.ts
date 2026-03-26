import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();

    // Lista de importaciones con vista resumen
    const res = await client.query(
      `SELECT * FROM vista_resumen_importaciones ORDER BY fecha_importacion DESC LIMIT 50`
    );

    // Estadísticas
    const statsRes = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END) as completadas,
        COUNT(CASE WHEN estado = 'PROCESANDO' THEN 1 END) as procesando,
        COALESCE(SUM(registros_procesados), 0) as total_servicios,
        COALESCE(SUM(doctores_nuevos), 0) as doctores_nuevos
      FROM importaciones_excel
    `);

    return NextResponse.json({
      importaciones: res.rows,
      stats: statsRes.rows[0]
    });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({
      importaciones: [],
      stats: { total: 0, completadas: 0, procesando: 0, total_servicios: 0, doctores_nuevos: 0 }
    });
  } finally {
    try { await client.end(); } catch { }
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    // Cascada eliminará solicitudes_servicios automáticamente
    await client.query('DELETE FROM importaciones_excel WHERE id = $1', [parseInt(id)]);
    await client.end();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
