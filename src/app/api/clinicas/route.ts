import { NextRequest, NextResponse } from 'next/server';
import { detectarDistritoPorCoordenadas } from '@/utils/detectarDistrito';

/**
 * GET /api/clinicas
 * Obtiene todas las clínicas con estadísticas
 */
export async function GET() {
  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();
    
    const result = await client.query(`
      SELECT 
        ch.id, ch.nombre, ch.tipo, ch.direccion, ch.latitud, ch.longitud, 
        ch.telefono, ch.email, ch.contacto, ch.distrito, ch.estado,
        ch.servicios_24h, ch.emergencia, ch.uci, ch.laboratorio, ch.farmacia,
        ch.radiologia, ch.ambulancia, ch.banco_sangre, ch.dialisis,
        ch.seguros_aceptados, ch.especialidades, ch.numero_consultorios,
        ch.numero_camas, ch.ascensor, ch.estacionamiento, ch.rampas_acceso,
        ch."createdAt", ch."updatedAt"
      FROM clinicas_hospitales ch
      ORDER BY ch.id DESC
    `);

    await client.end();

    const clinicas = result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      direccion: row.direccion,
      distrito: row.distrito,
      latitud: row.latitud,
      longitud: row.longitud,
      telefono: row.telefono,
      email: row.email,
      contacto: row.contacto,
      estado: row.estado || 'ACTIVA',
      
      // Servicios médicos
      servicios24h: row.servicios_24h || false,
      emergencia: row.emergencia || false,
      uci: row.uci || false,
      laboratorio: row.laboratorio || false,
      farmacia: row.farmacia || false,
      radiologia: row.radiologia || false,
      ambulancia: row.ambulancia || false,
      bancoSangre: row.banco_sangre || false,
      dialisis: row.dialisis || false,
      
      // Información adicional
      segurosAceptados: row.seguros_aceptados || '',
      especialidades: row.especialidades || [],
      numeroConsultorios: row.numero_consultorios || 0,
      numeroCamas: row.numero_camas || 0,
      ascensor: row.ascensor || false,
      estacionamiento: row.estacionamiento || false,
      rampasAcceso: row.rampas_acceso || false,
      
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString()
    }));

    const estadisticas = {
      total: clinicas.length,
      activas: clinicas.filter(c => c.estado === 'ACTIVA').length,
      conEmergencia: clinicas.filter(c => c.emergencia).length,
      atienden24h: clinicas.filter(c => c.servicios24h).length,
      conUci: clinicas.filter(c => c.uci).length,
      porTipo: {
        clinicas: clinicas.filter(c => c.tipo?.includes('CLINICA')).length,
        hospitales: clinicas.filter(c => c.tipo?.includes('HOSPITAL')).length,
        centros: clinicas.filter(c => c.tipo?.includes('CENTRO')).length
      }
    };

    return NextResponse.json({ clinicas, estadisticas });

  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/clinicas
 * Crea una nueva clínica con auto-detección de distrito
 */
export async function POST(request: NextRequest) {
  try {
    const { Client } = await import('pg');
    const body = await request.json();

    // Validaciones básicas
    if (!body.nombre?.trim()) {
      return NextResponse.json({ error: 'Nombre de la clínica es requerido' }, { status: 400 });
    }
    if (!body.direccion?.trim()) {
      return NextResponse.json({ error: 'Dirección es requerida' }, { status: 400 });
    }
    if (!body.latitud || !body.longitud) {
      return NextResponse.json({ error: 'Coordenadas GPS son requeridas' }, { status: 400 });
    }

    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // Auto-detectar distrito si no se proporciona
    let distrito = body.distrito;
    if (!distrito && body.latitud && body.longitud) {
      const distritoDetectado = await detectarDistritoPorCoordenadas(body.latitud, body.longitud);
      distrito = distritoDetectado || null;
    }

    // Verificar si ya existe una clínica en esa ubicación
    const existing = await client.query(
      'SELECT id FROM clinicas_hospitales WHERE nombre = $1 OR (latitud = $2 AND longitud = $3)',
      [body.nombre, body.latitud, body.longitud]
    );

    if (existing.rows.length > 0) {
      await client.end();
      return NextResponse.json({ error: 'Ya existe una clínica con ese nombre o en esa ubicación' }, { status: 400 });
    }

    const result = await client.query(`
      INSERT INTO clinicas_hospitales (
        nombre, tipo, direccion, distrito, latitud, longitud, telefono, email, contacto,
        estado, servicios_24h, emergencia, uci, laboratorio, farmacia, radiologia,
        ambulancia, banco_sangre, dialisis, seguros_aceptados, especialidades,
        numero_consultorios, numero_camas, ascensor, estacionamiento, rampas_acceso,
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW(), NOW()
      ) RETURNING *
    `, [
      body.nombre, body.tipo || 'CLINICA_PRIVADA', body.direccion, distrito,
      body.latitud, body.longitud, body.telefono, body.email, body.contacto,
      'ACTIVA', body.servicios24h || false, body.emergencia || false, body.uci || false,
      body.laboratorio || false, body.farmacia || false, body.radiologia || false,
      body.ambulancia || false, body.bancoSangre || false, body.dialisis || false,
      body.segurosAceptados || '', body.especialidades || [],
      body.numeroConsultorios || 0, body.numeroCamas || 0, body.ascensor || false,
      body.estacionamiento || false, body.rampasAcceso || false
    ]);

    await client.end();
    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
