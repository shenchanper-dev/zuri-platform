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
      'SELECT * FROM clinicas_hospitales WHERE id = $1',
      [id]
    );
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error('Error en GET:', error.message);
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

    // IMPORTANTE: Buscar distritoId si viene el nombre del distrito
    let distritoId = null;
    if (body.distrito) {
      const distritoResult = await client.query(
        'SELECT id FROM distritos WHERE nombre = $1 LIMIT 1',
        [body.distrito]
      );
      if (distritoResult.rows.length > 0) {
        distritoId = distritoResult.rows[0].id;
      }
    }

    // UPDATE completo con TODOS los campos
    const result = await client.query(`
      UPDATE clinicas_hospitales SET 
        nombre = $2,
        tipo = $3,
        direccion = $4,
        distrito = $5,
        "distritoId" = $6,
        latitud = $7,
        longitud = $8,
        telefono = $9,
        email = $10,
        contacto = $11,
        estado = $12,
        servicios_24h = $13,
        emergencia = $14,
        uci = $15,
        laboratorio = $16,
        farmacia = $17,
        radiologia = $18,
        ambulancia = $19,
        banco_sangre = $20,
        dialisis = $21,
        seguros_aceptados = $22,
        numero_consultorios = $23,
        numero_camas = $24,
        ascensor = $25,
        estacionamiento = $26,
        rampas_acceso = $27,
        "updatedAt" = NOW()
      WHERE id = $1 
      RETURNING *
    `, [
      id,
      body.nombre,
      body.tipo || 'CLINICA_PRIVADA',
      body.direccion,
      body.distrito, // CRÍTICO: Guardar nombre del distrito
      distritoId, // BONUS: FK si existe
      body.latitud || null,
      body.longitud || null,
      body.telefono || null,
      body.email || null,
      body.contacto || null,
      body.estado || 'ACTIVA',
      body.servicios24h || false,
      body.emergencia || false,
      body.uci || false,
      body.laboratorio || false,
      body.farmacia || false,
      body.radiologia || false,
      body.ambulancia || false,
      body.bancoSangre || false,
      body.dialisis || false,
      body.segurosAceptados || null,
      body.numeroConsultorios || 0,
      body.numeroCamas || 0,
      body.ascensor || false,
      body.estacionamiento || false,
      body.rampasAcceso || false
    ]);

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    console.log('✅ [API] Clínica actualizada:', result.rows[0].id);
    console.log('📍 [API] Distrito guardado:', result.rows[0].distrito);

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
      'DELETE FROM clinicas_hospitales WHERE id = $1 RETURNING *',
      [id]
    );
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });

  } catch (error: any) {
    console.error('Error en DELETE:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
