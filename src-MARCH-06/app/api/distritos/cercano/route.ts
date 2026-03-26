// src/app/api/distritos/cercano/route.ts
// ENDPOINT FALTANTE PARA FUNCIONALIDAD GPS
// Encuentra el distrito más cercano basado en coordenadas GPS

import { NextRequest, NextResponse } from 'next/server';

interface Distrito {
  id: number;
  nombre: string;
  provincia: string;
  latitud: number;
  longitud: number;
}

// Función para calcular distancia Haversine entre dos puntos GPS
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;
  return distancia;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitud, longitud } = body;

    console.log('🌍 [API] Buscando distrito cercano:', { latitud, longitud });

    if (!latitud || !longitud) {
      return NextResponse.json(
        { success: false, error: 'Latitud y longitud son requeridas' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // Obtener todos los distritos con coordenadas
    const result = await client.query(`
      SELECT 
        id, 
        nombre, 
        provincia, 
        latitud, 
        longitud 
      FROM distritos 
      WHERE latitud IS NOT NULL 
        AND longitud IS NOT NULL
      ORDER BY id
    `);

    await client.end();

    const distritos: Distrito[] = result.rows;

    if (distritos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron distritos con coordenadas'
      });
    }

    // Calcular distancias y encontrar el más cercano
    let distritoMasCercano: Distrito | null = null;
    let distanciaMinima = Number.MAX_VALUE;

    for (const distrito of distritos) {
      const distancia = calcularDistancia(
        parseFloat(latitud),
        parseFloat(longitud),
        distrito.latitud,
        distrito.longitud
      );

      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        distritoMasCercano = distrito;
      }
    }

    if (!distritoMasCercano) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo determinar el distrito más cercano'
      });
    }

    console.log('✅ [API] Distrito más cercano encontrado:', {
      distrito: distritoMasCercano.nombre,
      distancia: distanciaMinima.toFixed(2)
    });

    return NextResponse.json({
      success: true,
      distrito: {
        id: distritoMasCercano.id,
        nombre: distritoMasCercano.nombre,
        provincia: distritoMasCercano.provincia
      },
      distancia_km: parseFloat(distanciaMinima.toFixed(2)),
      coordenadas_encontradas: {
        latitud: distritoMasCercano.latitud,
        longitud: distritoMasCercano.longitud
      }
    });

  } catch (error) {
    console.error('❌ [API] Error al buscar distrito cercano:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Método GET para obtener todos los distritos (si se necesita)
export async function GET() {
  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    const result = await client.query(`
      SELECT 
        id, 
        nombre, 
        provincia,
        latitud,
        longitud,
        created_at
      FROM distritos 
      ORDER BY provincia, nombre
    `);

    await client.end();

    return NextResponse.json({
      success: true,
      distritos: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ [API] Error al obtener distritos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener distritos' },
      { status: 500 }
    );
  }
}