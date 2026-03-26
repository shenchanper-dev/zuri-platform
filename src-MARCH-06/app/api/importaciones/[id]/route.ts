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

    // Info de la importación
    const impRes = await client.query(
      'SELECT * FROM importaciones_excel WHERE id = $1', [parseInt(params.id)]
    );
    if (impRes.rows.length === 0) {
      return NextResponse.json({ error: 'Importación no encontrada' }, { status: 404 });
    }

    // Solicitudes de esta importación
    const solRes = await client.query(`
      SELECT ss.*,
        d.nombre_completo as doctor_nombre_bd,
        d.dni as doctor_dni_bd,
        COALESCE(c."nombreCompleto", c2."nombreCompleto") as conductor_nombre_bd,
        COALESCE(c.dni, c2.dni, ss.conductor_dni) as conductor_dni_bd,
        COALESCE(c.placa, c.vehiculo_placa, c2.placa, c2.vehiculo_placa) as conductor_placa_bd
      FROM solicitudes_servicios ss
      LEFT JOIN doctores d ON ss.doctor_id = d.id
      LEFT JOIN conductores c ON ss.conductor_id = c.id
      LEFT JOIN conductores c2 ON ss.conductor_id IS NULL
        AND ss.conductor_nombre IS NOT NULL
        AND ss.conductor_nombre != ''
        AND LOWER(REGEXP_REPLACE(TRIM(c2."nombreCompleto"), '\\s+', ' ', 'g'))
          = LOWER(REGEXP_REPLACE(TRIM(ss.conductor_nombre), '\\s+', ' ', 'g'))
      WHERE ss.importacion_id = $1
      ORDER BY ss.fecha, ss.hora_inicio
    `, [parseInt(params.id)]);

    await client.end();

    return NextResponse.json({
      importacion: impRes.rows[0],
      solicitudes: solRes.rows
    });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
