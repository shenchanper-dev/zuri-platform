import { NextRequest, NextResponse } from 'next/server';

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
        id, nombre, direccion, latitud, longitud, radio,
        telefono, email, contacto, estado,
        "horarioAtencion", especialidades, "codigoSIS",
        "createdAt", "updatedAt"
      FROM clinicas
      ORDER BY id DESC
    `);

    await client.end();

    const clinicas = result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      direccion: row.direccion,
      latitud: row.latitud,
      longitud: row.longitud,
      radio: row.radio,
      telefono: row.telefono,
      email: row.email,
      contacto: row.contacto,
      estado: row.estado || 'ACTIVA',
      horarioAtencion: row.horarioAtencion || {},
      especialidades: row.especialidades || [],
      codigoSIS: row.codigoSIS,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString()
    }));

    const estadisticas = {
      total: clinicas.length,
      activas: clinicas.filter(c => c.estado === 'ACTIVA').length,
      inactivas: clinicas.filter(c => c.estado === 'INACTIVA').length
    };

    return NextResponse.json({ clinicas, estadisticas });

  } catch (error: any) {
    console.error('GET /api/clinicas Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/clinicas
 * Crea una nueva clínica
 */
export async function POST(request: NextRequest) {
  try {
    const { Client } = await import('pg');
    const body = await request.json();

    // Validaciones básicas
    if (!body.nombre?.trim()) {
      return NextResponse.json({ error: 'Nombre de la clínica es requerido' }, { status: 400 });
    }
    if (!body.latitud || !body.longitud) {
      return NextResponse.json({ error: 'Coordenadas GPS son requeridas' }, { status: 400 });
    }

    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // Verificar si ya existe una clínica con ese nombre
    const existing = await client.query(
      'SELECT id FROM clinicas WHERE nombre = $1',
      [body.nombre]
    );

    if (existing.rows.length > 0) {
      await client.end();
      return NextResponse.json({ error: 'Ya existe una clínica con ese nombre' }, { status: 400 });
    }

    const result = await client.query(`
      INSERT INTO clinicas (
        nombre, direccion, latitud, longitud, radio,
        telefono, email, contacto, estado,
        "horarioAtencion", especialidades, "codigoSIS",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      ) RETURNING *
    `, [
      body.nombre,
      body.direccion || null,
      body.latitud,
      body.longitud,
      body.radio || null,
      body.telefono || null,
      body.email || null,
      body.contacto || null,
      body.estado || 'ACTIVA',
      body.horarioAtencion ? JSON.stringify(body.horarioAtencion) : null,
      body.especialidades || [],
      body.codigoSIS || null
    ]);

    await client.end();
    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error: any) {
    console.error('POST /api/clinicas Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
