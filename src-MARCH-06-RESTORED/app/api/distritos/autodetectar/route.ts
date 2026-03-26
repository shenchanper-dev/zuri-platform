import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function POST(request: Request) {
  const client = new Client(DB_CONFIG);
  
  try {
    const { latitud, longitud } = await request.json();
    
    if (!latitud || !longitud) {
      return NextResponse.json({ 
        success: false,
        error: 'Se requieren latitud y longitud' 
      }, { status: 400 });
    }
    
    await client.connect();
    
    // INCLUIR codigo_ubigeo EN EL RESULTADO
    const result = await client.query(`
      SELECT 
        id, nombre, provincia, departamento,
        latitud, longitud, codigo_postal, codigo_ubigeo,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(latitud)) * 
            cos(radians(longitud) - radians($2)) + 
            sin(radians($1)) * sin(radians(latitud))
          )
        ) AS distancia_km
      FROM distritos 
      WHERE latitud IS NOT NULL AND longitud IS NOT NULL
      ORDER BY distancia_km 
      LIMIT 1
    `, [latitud, longitud]);
    
    await client.end();
    
    return NextResponse.json({
      success: true,
      distrito: result.rows[0]
    });
  } catch (error: any) {
    await client.end();
    console.error('❌ [API] Error en autodetectar distrito:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
