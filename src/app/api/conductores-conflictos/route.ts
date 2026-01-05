import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

/**
 * POST /api/conductores-conflictos
 * Verifica si un conductor tiene conflictos de horario
 * 
 * Body: {
 *   conductorId: number,
 *   fecha: string (YYYY-MM-DD),
 *   horaInicio: string (HH:MM),
 *   horaFin: string (HH:MM),
 *   servicioIdActual?: number (para excluir al editar)
 * }
 */
export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    const body = await request.json();
    const { conductorId, fecha, horaInicio, horaFin, servicioIdActual } = body;

    // Validar parámetros requeridos
    if (!conductorId || !fecha || !horaInicio || !horaFin) {
      await client.end();
      return NextResponse.json({ 
        error: 'Faltan parámetros requeridos' 
      }, { status: 400 });
    }

    // Buscar conflictos de horario
    const query = `
      SELECT 
        s.id,
        s.fecha,
        s.hora_inicio,
        s.hora_fin,
        s.doctor_nombre,
        s.descripcion,
        s.estado,
        d.nombre_completo as doctor_nombre_bd
      FROM solicitudes_servicios s
      LEFT JOIN doctores d ON s.doctor_id = d.id
      WHERE s.conductor_id = $1
        AND s.fecha = $2
        AND s.estado NOT IN ('CANCELADO', 'COMPLETADO')
        ${servicioIdActual ? 'AND s.id != $5' : ''}
        AND (
          -- El nuevo servicio empieza durante un servicio existente
          (s.hora_inicio <= $3 AND s.hora_fin > $3)
          OR
          -- El nuevo servicio termina durante un servicio existente
          (s.hora_inicio < $4 AND s.hora_fin >= $4)
          OR
          -- El nuevo servicio engloba completamente un servicio existente
          (s.hora_inicio >= $3 AND s.hora_fin <= $4)
        )
      ORDER BY s.hora_inicio
    `;

    const params = servicioIdActual 
      ? [conductorId, fecha, horaInicio, horaFin, servicioIdActual]
      : [conductorId, fecha, horaInicio, horaFin];

    const result = await client.query(query, params);
    await client.end();

    const tieneConflicto = result.rows.length > 0;

    return NextResponse.json({
      tieneConflicto,
      conflictos: result.rows.map(row => ({
        id: row.id,
        fecha: row.fecha,
        horaInicio: row.hora_inicio,
        horaFin: row.hora_fin,
        doctorNombre: row.doctor_nombre_bd || row.doctor_nombre,
        descripcion: row.descripcion,
        estado: row.estado
      })),
      mensaje: tieneConflicto 
        ? `⚠️ El conductor ya tiene ${result.rows.length} servicio(s) programado(s) en este horario`
        : 'Conductor disponible'
    });

  } catch (error: any) {
    await client.end();
    console.error('Error verificando conflictos:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
