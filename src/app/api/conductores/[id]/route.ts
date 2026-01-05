// src/app/api/conductores/[id]/route.ts
// OPERACIONES INDIVIDUALES CONDUCTORES - LIMPIO SIN DUPLICACIONES
// ✅ Solo nombres y apellidos como campos separados
// ✅ nombreCompleto se genera automáticamente

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const dbConfig = {
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
};

// GET: Obtener conductor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: Client | null = null;
  
  try {
    const id = parseInt(params.id);
    console.log(`🔍 [GET] Obteniendo conductor ID: ${id}`);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido', success: false },
        { status: 400 }
      );
    }

    client = new Client(dbConfig);
    await client.connect();

    // ✅ Query usando nombres de columnas EXACTOS como están en tu BD
    const query = `
      SELECT 
        id, dni, nombres, apellidos, "fechaNacimiento", foto, celular1, celular2,
        email, "estadoCivil", "numeroHijos", "domicilioCompleto", "domicilioDistrito",
        "domicilioLatitud", "domicilioLongitud", "nombreContactoEmergencia",
        "celularContactoEmergencia", "numeroBrevete", "fechaVencimientoBrevete",
        "marcaVehiculo", "modeloVehiculo", placa, "añoVehiculo", "capacidadPasajeros",
        "tipoVehiculo", estado, observaciones, "fechaIngreso",
        "ubicacionActualLatitud", "ubicacionActualLongitud", "ultimaActualizacionGPS",
        "precisionGPS", "velocidadActual", "rumboActual", "nivelBateria",
        "estaConectado", "ultimaConexion", "modoTracking", "createdAt", "updatedAt"
      FROM conductores 
      WHERE id = $1
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conductor no encontrado', success: false },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    
    // ✅ Mapeo SIMPLE - solo concatenar nombres + apellidos
    const conductor = {
      id: row.id,
      dni: row.dni,
      nombres: row.nombres,
      apellidos: row.apellidos,
      nombreCompleto: `${row.nombres} ${row.apellidos}`.trim(), // ✅ SIMPLE
      fechaNacimiento: row.fechaNacimiento ? new Date(row.fechaNacimiento).toISOString().split('T')[0] : null,
      foto: row.foto,
      celular1: row.celular1,
      celular2: row.celular2,
      email: row.email,
      estadoCivil: row.estadoCivil,
      numeroHijos: row.numeroHijos || 0,
      domicilioCompleto: row.domicilioCompleto,
      domicilioDistrito: row.domicilioDistrito,
      domicilioLatitud: row.domicilioLatitud ? parseFloat(row.domicilioLatitud) : null,
      domicilioLongitud: row.domicilioLongitud ? parseFloat(row.domicilioLongitud) : null,
      nombreContactoEmergencia: row.nombreContactoEmergencia,
      celularContactoEmergencia: row.celularContactoEmergencia,
      numeroBrevete: row.numeroBrevete,
      fechaVencimientoBrevete: row.fechaVencimientoBrevete ? new Date(row.fechaVencimientoBrevete).toISOString().split('T')[0] : null,
      marcaVehiculo: row.marcaVehiculo,
      modeloVehiculo: row.modeloVehiculo,
      placa: row.placa,
      numeroPlaca: row.placa, // ✅ Mapeo para frontend
      añoVehiculo: row.añoVehiculo,
      capacidadPasajeros: row.capacidadPasajeros || 4,
      tipoVehiculo: row.tipoVehiculo || 'SEDAN',
      estado: row.estado || 'ACTIVO',
      observaciones: row.observaciones,
      fechaIngreso: row.fechaIngreso ? new Date(row.fechaIngreso).toISOString().split('T')[0] : null,
      ubicacionActualLatitud: row.ubicacionActualLatitud ? parseFloat(row.ubicacionActualLatitud) : null,
      ubicacionActualLongitud: row.ubicacionActualLongitud ? parseFloat(row.ubicacionActualLongitud) : null,
      ultimaActualizacionGPS: row.ultimaActualizacionGPS ? new Date(row.ultimaActualizacionGPS).toISOString() : null,
      precisionGPS: row.precisionGPS ? parseFloat(row.precisionGPS) : null,
      velocidadActual: row.velocidadActual ? parseFloat(row.velocidadActual) : 0,
      rumboActual: row.rumboActual || 0,
      nivelBateria: row.nivelBateria || 100,
      estaConectado: row.estaConectado || false,
      ultimaConexion: row.ultimaConexion ? new Date(row.ultimaConexion).toISOString() : null,
      modoTracking: row.modoTracking || 'MANUAL',
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null
    };

    console.log(`✅ [GET] Conductor encontrado: ${conductor.nombreCompleto}, foto: ${conductor.foto ? 'SÍ' : 'NO'}`);

    return NextResponse.json({
      conductor,
      success: true
    });

  } catch (error) {
    console.error('❌ [GET] Error al obtener conductor:', error);
    return NextResponse.json(
      { error: `Error interno: ${error.message}`, success: false },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// PUT: Actualizar conductor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client = null;
  try {
    console.log(`🔄 [PUT] Actualizando conductor ID: ${params.id}`);
    
    const { Client } = await import('pg');
    const id = parseInt(params.id);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido', success: false },
        { status: 400 }
      );
    }

    client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // ✅ OBTENER DATOS ACTUALES PRIMERO
    const currentResult = await client.query(
      'SELECT * FROM conductores WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conductor no encontrado', success: false },
        { status: 404 }
      );
    }

    const currentData = currentResult.rows[0];

    // ✅ PROCESAR nombreCompleto SI viene del frontend
    let nombres, apellidos;
    
    if (body.nombreCompleto && !body.nombres && !body.apellidos) {
      const partes = body.nombreCompleto.trim().split(' ');
      nombres = partes[0] || '';
      apellidos = partes.slice(1).join(' ') || '';
    } else {
      nombres = body.nombres !== undefined ? body.nombres : currentData.nombres;
      apellidos = body.apellidos !== undefined ? body.apellidos : currentData.apellidos;
    }

    // ✅ PROCESAR FOTO
    let fotoData = currentData.foto;
    if (body.foto !== undefined) {
      fotoData = body.foto;
    }

    // ✅ UPDATE con 37 campos exactos + WHERE ($38)
    const result = await client.query(`
      UPDATE conductores SET
        dni = $1,
        nombres = $2,
        apellidos = $3,
        "fechaNacimiento" = $4,
        foto = $5,
        celular1 = $6,
        celular2 = $7,
        email = $8,
        "estadoCivil" = $9,
        "numeroHijos" = $10,
        "domicilioCompleto" = $11,
        "domicilioDistrito" = $12,
        "domicilioLatitud" = $13,
        "domicilioLongitud" = $14,
        "nombreContactoEmergencia" = $15,
        "celularContactoEmergencia" = $16,
        "numeroBrevete" = $17,
        "fechaVencimientoBrevete" = $18,
        "marcaVehiculo" = $19,
        "modeloVehiculo" = $20,
        placa = $21,
        "añoVehiculo" = $22,
        "capacidadPasajeros" = $23,
        "tipoVehiculo" = $24,
        estado = $25,
        observaciones = $26,
        "fechaIngreso" = $27,
        "ubicacionActualLatitud" = $28,
        "ubicacionActualLongitud" = $29,
        "ultimaActualizacionGPS" = $30,
        "precisionGPS" = $31,
        "velocidadActual" = $32,
        "rumboActual" = $33,
        "nivelBateria" = $34,
        "estaConectado" = $35,
        "ultimaConexion" = $36,
        "modoTracking" = $37,
        "updatedAt" = NOW()
      WHERE id = $38
      RETURNING *
    `, [
      body.dni !== undefined ? body.dni : currentData.dni,                    // $1
      nombres,                                                                // $2
      apellidos,                                                              // $3
      body.fechaNacimiento !== undefined ? body.fechaNacimiento : currentData.fechaNacimiento, // $4
      fotoData,                                                              // $5
      body.celular1 !== undefined ? body.celular1 : currentData.celular1,    // $6
      body.celular2 !== undefined ? body.celular2 : currentData.celular2,    // $7
      body.email !== undefined ? body.email : currentData.email,             // $8
      body.estadoCivil !== undefined ? body.estadoCivil : currentData.estadoCivil, // $9
      body.numeroHijos !== undefined ? body.numeroHijos : currentData.numeroHijos, // $10
      body.domicilioCompleto !== undefined ? body.domicilioCompleto : currentData.domicilioCompleto, // $11
      body.domicilioDistrito !== undefined ? body.domicilioDistrito : currentData.domicilioDistrito, // $12
      body.domicilioLatitud !== undefined ? body.domicilioLatitud : currentData.domicilioLatitud, // $13
      body.domicilioLongitud !== undefined ? body.domicilioLongitud : currentData.domicilioLongitud, // $14
      body.nombreContactoEmergencia !== undefined ? body.nombreContactoEmergencia : currentData.nombreContactoEmergencia, // $15
      body.celularContactoEmergencia !== undefined ? body.celularContactoEmergencia : currentData.celularContactoEmergencia, // $16
      body.numeroBrevete !== undefined ? body.numeroBrevete : currentData.numeroBrevete, // $17
      body.fechaVencimientoBrevete !== undefined ? body.fechaVencimientoBrevete : currentData.fechaVencimientoBrevete, // $18
      body.marcaVehiculo !== undefined ? body.marcaVehiculo : currentData.marcaVehiculo, // $19
      body.modeloVehiculo !== undefined ? body.modeloVehiculo : currentData.modeloVehiculo, // $20
      body.placa !== undefined ? body.placa : (body.numeroPlaca !== undefined ? body.numeroPlaca : currentData.placa), // $21
      body.añoVehiculo !== undefined ? body.añoVehiculo : currentData.añoVehiculo, // $22
      body.capacidadPasajeros !== undefined ? body.capacidadPasajeros : currentData.capacidadPasajeros, // $23
      body.tipoVehiculo !== undefined ? body.tipoVehiculo : currentData.tipoVehiculo, // $24
      body.estado !== undefined ? body.estado : currentData.estado,           // $25
      body.observaciones !== undefined ? body.observaciones : currentData.observaciones, // $26
      body.fechaIngreso !== undefined ? body.fechaIngreso : currentData.fechaIngreso, // $27
      body.ubicacionActualLatitud !== undefined ? body.ubicacionActualLatitud : currentData.ubicacionActualLatitud, // $28
      body.ubicacionActualLongitud !== undefined ? body.ubicacionActualLongitud : currentData.ubicacionActualLongitud, // $29
      body.ultimaActualizacionGPS !== undefined ? body.ultimaActualizacionGPS : currentData.ultimaActualizacionGPS, // $30
      body.precisionGPS !== undefined ? body.precisionGPS : currentData.precisionGPS, // $31
      body.velocidadActual !== undefined ? body.velocidadActual : currentData.velocidadActual, // $32
      body.rumboActual !== undefined ? body.rumboActual : currentData.rumboActual, // $33
      body.nivelBateria !== undefined ? body.nivelBateria : currentData.nivelBateria, // $34
      body.estaConectado !== undefined ? body.estaConectado : currentData.estaConectado, // $35
      body.ultimaConexion !== undefined ? body.ultimaConexion : currentData.ultimaConexion, // $36
      body.modoTracking !== undefined ? body.modoTracking : currentData.modoTracking, // $37
      id                                                                     // $38
    ]);

    const conductor = result.rows[0];
    
    console.log(`✅ [PUT] Conductor actualizado ID: ${id}, foto: ${conductor.foto ? 'SÍ' : 'NO'}`);

    // ✅ MAPEO SIMPLE PARA FRONTEND
    const conductorMapeado = {
      id: conductor.id,
      dni: conductor.dni,
      nombres: conductor.nombres,
      apellidos: conductor.apellidos,
      nombreCompleto: `${conductor.nombres} ${conductor.apellidos}`.trim(), // ✅ SIMPLE
      fechaNacimiento: conductor.fechaNacimiento ? new Date(conductor.fechaNacimiento).toISOString().split('T')[0] : null,
      foto: conductor.foto,
      celular1: conductor.celular1,
      celular2: conductor.celular2,
      email: conductor.email,
      domicilioCompleto: conductor.domicilioCompleto,
      numeroBrevete: conductor.numeroBrevete,
      marcaVehiculo: conductor.marcaVehiculo,
      modeloVehiculo: conductor.modeloVehiculo,
      placa: conductor.placa,
      numeroPlaca: conductor.placa, // ✅ Mapeo frontend
      estado: conductor.estado,
      estaConectado: conductor.estaConectado,
      createdAt: conductor.createdAt ? new Date(conductor.createdAt).toISOString() : null,
      updatedAt: conductor.updatedAt ? new Date(conductor.updatedAt).toISOString() : null
    };

    return NextResponse.json({
      conductor: conductorMapeado,
      success: true,
      message: 'Conductor actualizado correctamente'
    });

  } catch (error) {
    console.error('❌ [PUT] Error actualizando conductor:', error);
    return NextResponse.json({
      error: `Error interno: ${error.message}`,
      success: false
    }, { status: 500 });
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// DELETE: Eliminar conductor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: Client | null = null;
  
  try {
    const id = parseInt(params.id);
    console.log(`🗑️ [DELETE] Eliminando conductor ID: ${id}`);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido', success: false },
        { status: 400 }
      );
    }

    client = new Client(dbConfig);
    await client.connect();

    // Verificar que existe
    const existsCheck = await client.query(
      'SELECT id, nombres, apellidos, estado FROM conductores WHERE id = $1',
      [id]
    );

    if (existsCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conductor no encontrado', success: false },
        { status: 404 }
      );
    }

    const conductor = existsCheck.rows[0];

    // ✅ Soft delete - cambiar estado
    await client.query(
      'UPDATE conductores SET estado = $1, "updatedAt" = NOW() WHERE id = $2',
      ['ELIMINADO', id]
    );

    console.log(`✅ [DELETE] Conductor eliminado: ${conductor.nombres} ${conductor.apellidos}`);

    return NextResponse.json({
      success: true,
      message: 'Conductor eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [DELETE] Error al eliminar conductor:', error);
    return NextResponse.json(
      { error: `Error interno: ${error.message}`, success: false },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}