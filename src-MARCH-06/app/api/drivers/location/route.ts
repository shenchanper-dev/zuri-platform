import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zuri-secret-key-change-this';

// ========================================
// POST: Update driver location (fallback si WebSocket falla)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { conductorId, latitude, longitude, heading, speed, accuracy, batteryLevel } = body;
    
    // Validation
    if (!conductorId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = verify(token, JWT_SECRET) as { conductorId?: number | string };
          conductorId = decoded?.conductorId;
        } catch {
          // ignore
        }
      }
    }

    const hasLat = latitude !== undefined && latitude !== null;
    const hasLng = longitude !== undefined && longitude !== null;

    if (!conductorId || !hasLat || !hasLng) {
      return NextResponse.json(
        {
          success: true,
          ignored: true,
          mensaje: 'Actualización de ubicación ignorada (faltan datos requeridos).',
          detalle: {
            conductorId: !!conductorId,
            latitude: hasLat,
            longitude: hasLng,
          },
        },
        { status: 200 }
      );
    }

    const toNumber = (v: any) => (typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN);
    const conductorIdNum = typeof conductorId === 'number' ? conductorId : parseInt(String(conductorId), 10);
    const latNum = toNumber(latitude);
    const lngNum = toNumber(longitude);

    if (!Number.isFinite(conductorIdNum) || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos para ubicación' },
        { status: 400 }
      );
    }
    
    // Update conductor's current location
    const conductor = await prisma.conductor.update({
      where: { id: conductorIdNum },
      data: {
        latitud_actual: latNum,
        longitud_actual: lngNum,
        rumbo: heading !== undefined && heading !== null ? toNumber(heading) : null,
        velocidad: speed !== undefined && speed !== null ? toNumber(speed) : null,
        precision: accuracy !== undefined && accuracy !== null ? toNumber(accuracy) : null,
        bateria: batteryLevel !== undefined && batteryLevel !== null ? parseInt(String(batteryLevel), 10) : null,
        ultimaUbicacion: new Date(),
      },
    });
    
    // Store in historical table
    await prisma.ubicacionConductor.create({
      data: {
        conductorId: conductor.id,
        latitud: latNum,
        longitud: lngNum,
        rumbo: heading !== undefined && heading !== null ? toNumber(heading) : null,
        velocidad: speed !== undefined && speed !== null ? toNumber(speed) : null,
        precision: accuracy !== undefined && accuracy !== null ? toNumber(accuracy) : null,
        bateria: batteryLevel !== undefined && batteryLevel !== null ? parseInt(String(batteryLevel), 10) : null,
        timestamp: new Date(),
        fuente: 'API', // vs 'WEBSOCKET'
      },
    });
    
    // Cache in Redis (TTL: 2 minutes)
    await redis.setWithExpiry(
      `driver:location:${conductorId}`,
      JSON.stringify({ latitude: latNum, longitude: lngNum, timestamp: new Date().toISOString() }),
      120
    );
    
    return NextResponse.json({
      success: true,
      conductor: {
        id: conductor.id,
        nombre: conductor.nombreCompleto,
        ultimaUbicacion: conductor.ultimaUbicacion,
      },
    });
    
  } catch (error) {
    console.error('Location update error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// ========================================
// GET: Get nearby drivers (geospatial query)
// ========================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseInt(searchParams.get('radius') || '5000', 10); // Default 5km
    const status = searchParams.get('status') || 'DISPONIBLE'; // DISPONIBLE, EN_CAMINO, etc.
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'lat and lng query parameters are required' },
        { status: 400 }
      );
    }
    
    // PostgreSQL query with ST_DWithin (requires PostGIS)
    // For now, using simple distance calculation
    // TODO: Add PostGIS extension for production
    
    const conductores = await prisma.conductor.findMany({
      where: {
        latitud_actual: { not: null },
        longitud_actual: { not: null },
        estadoServicio: status as any,
        ultimaUbicacion: {
          gte: new Date(Date.now() - 2 * 60 * 1000), // Last 2 minutes
        },
      },
      select: {
        id: true,
        nombreCompleto: true,
        telefono: true,
        latitud_actual: true,
        longitud_actual: true,
        rumbo: true,
        velocidad: true,
        ultimaUbicacion: true,
        estadoServicio: true,
        foto_url: true,
      },
      take: 50, // Limit results
    });
    
    // Calculate distances
    const conductoresWithDistance = conductores.map((c) => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        c.latitud_actual as number,
        c.longitud_actual as number
      );
      
      return {
        ...c,
        distance_meters: Math.round(distance),
      };
    });
    
    // Filter by radius and sort by distance
    const nearby = conductoresWithDistance
      .filter((c) => c.distance_meters <= radius)
      .sort((a, b) => a.distance_meters - b.distance_meters);
    
    return NextResponse.json({
      success: true,
      count: nearby.length,
      drivers: nearby,
    });
    
  } catch (error) {
    console.error('Get nearby drivers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
