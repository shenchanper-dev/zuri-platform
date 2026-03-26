import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'zuri_db',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

/**
 * GET /api/conductores/estadisticas
 * Obtiene métricas clave de la flota de conductores.
 */
export async function GET() {
  let client;
  try {
    client = await pool.connect();

    // Query corregida con nombres de columna correctos (camelCase)
    // Convertimos enum a texto para evitar errores de comparación como 'ELIMINADO'
    const query = `
      SELECT
        COUNT(*) as total_conductores,
        COUNT(CASE WHEN CAST(estado AS TEXT) = 'ACTIVO' THEN 1 END) as activos,
        COUNT(CASE WHEN CAST(estado AS TEXT) = 'INACTIVO' THEN 1 END) as inactivos,
        COUNT(CASE WHEN CAST("estadoServicio" AS TEXT) = 'DISPONIBLE' THEN 1 END) as disponibles,
        COUNT(CASE WHEN CAST("estadoServicio" AS TEXT) IN ('EN_CAMINO', 'EN_ORIGEN', 'EN_TRANSPORTE', 'EN_DESTINO') THEN 1 END) as en_servicio,
        COUNT(CASE WHEN foto IS NOT NULL AND foto != '' THEN 1 END) as con_foto,
        COUNT(DISTINCT "distritoId") as distritos
      FROM conductores
      WHERE CAST(estado AS TEXT) != 'ELIMINADO' OR estado IS NULL
    `;

    const result = await client.query(query);
    const row = result.rows[0];

    const estadisticas = {
      total: parseInt(row.total_conductores) || 0,
      activos: parseInt(row.activos) || 0,
      inactivos: parseInt(row.inactivos) || 0,
      disponibles: parseInt(row.disponibles) || 0,
      enServicio: parseInt(row.en_servicio) || 0,
      conFoto: parseInt(row.con_foto) || 0,
      distritos: parseInt(row.distritos) || 0,
    };

    return NextResponse.json(estadisticas);

  } catch (error) {
    console.error('Error al obtener estadísticas de conductores:', error);
    return NextResponse.json({ error: 'Error interno del servidor al obtener estadísticas.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}