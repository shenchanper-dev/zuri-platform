// ============================================================================
// API: /api/conductores/gps-tracking
// MÉTODO: POST
// DESCRIPCIÓN: Actualización de ubicación GPS en tiempo real desde apps móviles
// USO: Llamado cada 5-10 segundos desde la app del conductor
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db',
};

/**
 * POST /api/conductores/gps-tracking
 * Actualiza ubicación GPS del conductor en tiempo real
 * 
 * Body esperado:
 * {
 *   conductorId: number,
 *   latitud: number,
 *   longitud: number,
 *   precision: number (opcional, en metros),
 *   velocidad: number (opcional, en km/h),
 *   rumbo: number (opcional, 0-359 grados),
 *   nivelBateria: number (opcional, 0-100),
 *   dispositivoInfo: {
 *     modelo: string,
 *     so: string,
 *     appVersion: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  
  try {
    const body = await request.json();
    
    // Validaciones críticas
    if (!body.conductorId || typeof body.conductorId !== 'number') {
      return NextResponse.json(
        { error: 'conductorId es requerido y debe ser un número' },
        { status: 400 }
      );
    }
    
    if (typeof body.latitud !== 'number' || typeof body.longitud !== 'number') {
      return NextResponse.json(
        { error: 'latitud y longitud son requeridas y deben ser números' },
        { status: 400 }
      );
    }
    
    // Validar rangos de coordenadas (aproximado para Perú)
    if (body.latitud < -18.5 || body.latitud > -0.5) {
      return NextResponse.json(
        { error: 'Latitud fuera del rango válido para Perú' },
        { status: 400 }
      );
    }
    
    if (body.longitud < -82 || body.longitud > -68) {
      return NextResponse.json(
        { error: 'Longitud fuera del rango válido para Perú' },
        { status: 400 }
      );
    }
    
    await client.connect();
    
    // Verificar que el conductor existe y está activo
    const verificarQuery = `
      SELECT id, "nombreCompleto", estado, "estaConectado"
      FROM conductores 
      WHERE id = $1
    `;
    const verificarResult = await client.query(verificarQuery, [body.conductorId]);
    
    if (verificarResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conductor no encontrado' },
        { status: 404 }
      );
    }
    
    const conductor = verificarResult.rows[0];
    
    // Actualizar ubicación GPS
    const updateQuery = `
      UPDATE conductores
      SET 
        "ubicacionActualLatitud" = $2,
        "ubicacionActualLongitud" = $3,
        "ultimaActualizacionGPS" = NOW(),
        "precisionGPS" = $4,
        "velocidadActual" = $5,
        "rumboActual" = $6,
        "nivelBateria" = $7,
        "estaConectado" = true,
        "ultimaConexion" = NOW(),
        "dispositivoModelo" = $8,
        "sistemaOperativo" = $9,
        "appVersion" = $10,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING 
        id,
        "nombreCompleto",
        "ubicacionActualLatitud",
        "ubicacionActualLongitud",
        "ultimaActualizacionGPS",
        "estaConectado"
    `;
    
    const values = [
      body.conductorId,
      body.latitud,
      body.longitud,
      body.precision || null,
      body.velocidad || null,
      body.rumbo || null,
      body.nivelBateria || null,
      body.dispositivoInfo?.modelo || null,
      body.dispositivoInfo?.so || null,
      body.dispositivoInfo?.appVersion || null,
    ];
    
    const result = await client.query(updateQuery, values);
    const conductorActualizado = result.rows[0];
    
    // Log para debugging (en producción, considerar sistema de logging más robusto)
    console.log(`📍 GPS actualizado: ${conductorActualizado.nombreCompleto} - Lat: ${body.latitud}, Lng: ${body.longitud}`);
    
    return NextResponse.json({
      success: true,
      mensaje: 'Ubicación GPS actualizada exitosamente',
      conductor: {
        id: conductorActualizado.id,
        nombreCompleto: conductorActualizado.nombreCompleto,
        ubicacion: {
          latitud: parseFloat(conductorActualizado.ubicacionActualLatitud),
          longitud: parseFloat(conductorActualizado.ubicacionActualLongitud),
        },
        ultimaActualizacion: conductorActualizado.ultimaActualizacionGPS,
        estaConectado: conductorActualizado.estaConectado,
      },
    });
    
  } catch (error: any) {
    console.error('Error en POST /api/conductores/gps-tracking:', error);
    return NextResponse.json(
      { error: 'Error al actualizar ubicación GPS', detalle: error.message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

/**
 * GET /api/conductores/gps-tracking
 * Obtiene ubicación de TODOS los conductores activos (para mapa)
 * 
 * Query params:
 * - soloConectados: true/false (default: true)
 * - estado: filtrar por estado (default: ACTIVO, EN_SERVICIO)
 */
export async function GET(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const soloConectados = searchParams.get('soloConectados') !== 'false';
    const estado = searchParams.get('estado') || 'ACTIVO,EN_SERVICIO';
    
    await client.connect();
    
    // Query optimizada para mapa en tiempo real
    let query = `
      SELECT 
        id,
        dni,
        "nombreCompleto",
        "ubicacionActualLatitud" as latitud,
        "ubicacionActualLongitud" as longitud,
        "ultimaActualizacionGPS" as "ultimaActualizacion",
        "precisionGPS" as precision,
        "velocidadActual" as velocidad,
        "rumboActual" as rumbo,
        "nivelBateria",
        "estaConectado",
        estado,
        "marcaVehiculo",
        "modeloVehiculo",
        placa,
        "tipoVehiculo",
        CASE 
          WHEN "ultimaActualizacionGPS" > NOW() - INTERVAL '5 minutes' THEN 'ONLINE'
          WHEN "ultimaActualizacionGPS" > NOW() - INTERVAL '30 minutes' THEN 'RECENT'
          ELSE 'OFFLINE'
        END AS "estadoConexion"
      FROM conductores
      WHERE "ubicacionActualLatitud" IS NOT NULL
        AND "ubicacionActualLongitud" IS NOT NULL
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    // Filtro por conectados
    if (soloConectados) {
      query += ` AND "estaConectado" = true`;
      query += ` AND "ultimaActualizacionGPS" > NOW() - INTERVAL '30 minutes'`;
    }
    
    // Filtro por estado
    if (estado) {
      const estados = estado.split(',').map(e => e.trim());
      query += ` AND estado = ANY($${paramCount})`;
      params.push(estados);
      paramCount++;
    }
    
    query += ` ORDER BY "ultimaActualizacionGPS" DESC NULLS LAST`;
    query += ` LIMIT 100`; // Límite de seguridad
    
    const result = await client.query(query, params);
    
    // Formatear para GeoJSON (estándar para mapas)
    const conductoresGeoJSON = {
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(row.longitud), // GeoJSON usa [lng, lat]
            parseFloat(row.latitud),
          ],
        },
        properties: {
          id: row.id,
          dni: row.dni,
          nombreCompleto: row.nombreCompleto,
          ultimaActualizacion: row.ultimaActualizacion,
          precision: row.precision ? parseFloat(row.precision) : null,
          velocidad: row.velocidad ? parseFloat(row.velocidad) : null,
          rumbo: row.rumbo,
          nivelBateria: row.nivelBateria,
          estaConectado: row.estaConectado,
          estado: row.estado,
          estadoConexion: row.estadoConexion,
          vehiculo: {
            marca: row.marcaVehiculo,
            modelo: row.modeloVehiculo,
            placa: row.placa,
            tipo: row.tipoVehiculo,
          },
        },
      })),
    };
    
    return NextResponse.json({
      conductores: conductoresGeoJSON,
      total: result.rows.length,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('Error en GET /api/conductores/gps-tracking:', error);
    return NextResponse.json(
      { error: 'Error al obtener ubicaciones GPS', detalle: error.message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}