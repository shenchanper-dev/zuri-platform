import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'zuri',
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

    // Consulta SQL para obtener todas las métricas en una sola ejecución para eficiencia
    const query = `
      SELECT
        COUNT(c.id) as total_conductores,
        COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END) as activos,
        COUNT(CASE WHEN estado_servicio = 'DISPONIBLE' THEN 1 END) as disponibles,
        COUNT(CASE WHEN estado_servicio = 'OCUPADO' THEN 1 END) as ocupados,
        COUNT(CASE WHEN estado_servicio = 'DESCANSO' THEN 1 END) as en_descanso,
        COUNT(CASE WHEN propietario = 'PROPIO' THEN 1 END) as con_vehiculo_propio,
        COALESCE(AVG(c.calificacion_promedio), 5.0) as calificacion_promedio_flota
      FROM conductores c
      LEFT JOIN conductor_info_adicional cia ON c.id = cia.conductor_id;
    `;

    const result = await client.query(query);
    const row = result.rows[0];

    const estadisticas = {
      total: parseInt(row.total_conductores) || 0,
      activos: parseInt(row.activos) || 0,
      disponibles: parseInt(row.disponibles) || 0,
      ocupados: parseInt(row.ocupados) || 0,
      enDescanso: parseInt(row.en_descanso) || 0,
      conVehiculoPropio: parseInt(row.con_vehiculo_propio) || 0,
      calificacionPromedioFlota: parseFloat(row.calificacion_promedio_flota).toFixed(2),
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