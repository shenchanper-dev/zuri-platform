import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();
    const result = await client.query(
      'SELECT * FROM clinicas WHERE id = $1',
      [id]
    );
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error('Error en GET /api/clinicas/[id]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔄 [API] PUT /api/clinicas/[id] - Actualizando...');

  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    console.log('📥 Datos recibidos:', JSON.stringify(body, null, 2));

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // UPDATE con los campos del schema de Prisma
    const result = await client.query(`
      UPDATE clinicas SET 
        nombre = $2,
        direccion = $3,
        latitud = $4,
        longitud = $5,
        radio = $6,
        telefono = $7,
        email = $8,
        contacto = $9,
        estado = $10,
        "horarioAtencion" = $11,
        especialidades = $12,
        "codigoSIS" = $13,
        "updatedAt" = NOW()
      WHERE id = $1 
      RETURNING *
    `, [
      id,
      body.nombre,
      body.direccion || null,
      body.latitud || null,
      body.longitud || null,
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

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    console.log('✅ [API] Clínica actualizada:', result.rows[0].id);

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error('❌ [API] Error en PUT:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();
    const result = await client.query(
      'DELETE FROM clinicas WHERE id = $1 RETURNING *',
      [id]
    );
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });

  } catch (error: any) {
    console.error('Error en DELETE /api/clinicas/[id]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
