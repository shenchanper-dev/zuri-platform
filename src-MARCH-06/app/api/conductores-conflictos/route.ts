import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

/**
 * API: Verificar conflictos de horario de conductores
 * 
 * GET /api/conductores-conflictos?fecha=YYYY-MM-DD&hora_inicio=HH:MM&hora_fin=HH:MM
 * 
 * Retorna lista de conductores que ya tienen asignaciones en el horario solicitado
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');
  const horaInicio = searchParams.get('hora_inicio');
  const horaFin = searchParams.get('hora_fin');

  if (!fecha || !horaInicio || !horaFin) {
    return NextResponse.json({
      error: 'Parámetros requeridos: fecha, hora_inicio, hora_fin'
    }, { status: 400 });
  }

  const client = new Client(DB_CONFIG);
  try {
    await client.connect();

    // Buscar conductores con asignaciones que se solapan en horario
    const res = await client.query(`
      SELECT DISTINCT
        pd.conductor_id,
        pd.conductor_nombre,
        pd.hora_inicio as conflicto_hora_inicio,
        pd.hora_fin as conflicto_hora_fin,
        pd.doctor_nombre as conflicto_doctor,
        pd.ubicacion as conflicto_ubicacion,
        p.codigo_programacion as conflicto_programacion
      FROM programacion_detalles pd
      JOIN programaciones p ON pd.programacion_id = p.id
      WHERE pd.conductor_id IS NOT NULL
        AND pd.fecha = $1
        AND pd.estado NOT IN ('CANCELADO', 'COMPLETADO')
        AND p.estado NOT IN ('CANCELADO', 'COMPLETADO')
        AND (
          (pd.hora_inicio < $3::time AND pd.hora_fin > $2::time)
        )
      ORDER BY pd.hora_inicio
    `, [fecha, horaInicio, horaFin]);

    const conflictos = res.rows.map(r => ({
      conductor_id: r.conductor_id,
      conductor_nombre: r.conductor_nombre,
      detalle: `${r.conflicto_hora_inicio?.toString().slice(0, 5)}-${r.conflicto_hora_fin?.toString().slice(0, 5)} → Dr. ${r.conflicto_doctor} (${r.conflicto_programacion})`,
      conflicto_hora_inicio: r.conflicto_hora_inicio,
      conflicto_hora_fin: r.conflicto_hora_fin,
      conflicto_doctor: r.conflicto_doctor,
      conflicto_ubicacion: r.conflicto_ubicacion,
      conflicto_programacion: r.conflicto_programacion,
    }));

    await client.end();

    return NextResponse.json({
      conflictos,
      total: conflictos.length,
      parametros: { fecha, horaInicio, horaFin }
    });
  } catch (error: any) {
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message, conflictos: [] }, { status: 500 });
  }
}
