// src/app/api/conductores/[id]/route.ts
// OPERACIONES INDIVIDUALES - CORREGIDO CON NOMBRES EXACTOS DE BD
// ✅ Verificado contra tabla real PostgreSQL

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';

// GET: Obtener conductor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: any = null;

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido', success: false }, { status: 400 });
    }

    client = await pool.connect();

    const query = `
      SELECT 
        c.*,
        d.nombre as distrito_nombre
      FROM conductores c
      LEFT JOIN distritos d ON c."distritoId" = d.id
      WHERE c.id = $1
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Conductor no encontrado', success: false }, { status: 404 });
    }

    const row = result.rows[0];

    const conductor = {
      id: row.id,
      dni: row.dni,
      nombres: row.nombres,
      apellidos: row.apellidos,
      nombreCompleto: row.nombreCompleto || `${row.nombres || ''} ${row.apellidos || ''}`.trim(),
      foto: row.foto,
      fechaNacimiento: row.fechaNacimiento ? new Date(row.fechaNacimiento).toISOString().split('T')[0] : null,
      sexo: row.sexo,
      celular1: row.celular1,
      celular2: row.celular2,
      email: row.email,
      estadoCivil: row.estadoCivil,
      numeroHijos: row.numeroHijos,
      domicilioCompleto: row.domicilioCompleto || row.direccion,
      distritoId: row.distritoId,
      distrito_nombre: row.distrito_nombre,
      nombreContactoEmergencia: row.nombreContactoEmergencia,
      celularContactoEmergencia: row.celularContactoEmergencia,
      numeroBrevete: row.numeroBrevete,
      licencia_categoria: row.licencia_categoria,
      fechaVencimientoBrevete: row.fechaVencimientoBrevete ? new Date(row.fechaVencimientoBrevete).toISOString().split('T')[0] : null,
      marcaVehiculo: row.marcaVehiculo,
      modeloVehiculo: row.modeloVehiculo,
      placa: row.placa,
      tipoVehiculo: row.tipoVehiculo,
      colorVehiculo: row.colorAuto,
      fotoVehiculo: row.fotoVehiculo,
      estado: row.estado,
      observaciones: row.observaciones,
      certificacionMedica: row.certificado_medico,
      antecedentesPenales: row.antecedentes_penales,
      equipamiento: row.equipamiento_nemt && row.equipamiento_nemt !== '[]' ? JSON.parse(row.equipamiento_nemt) : [],
      servicios: row.servicios_habilitados && row.servicios_habilitados !== '[]' ? JSON.parse(row.servicios_habilitados) : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    return NextResponse.json({ conductor, success: true });

  } catch (error: any) {
    console.error('❌ [GET Conductor ID] Error:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

// PUT: Actualizar conductor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: any = null;

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido', success: false }, { status: 400 });
    }

    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    let files: Record<string, File> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        if (value instanceof File) {
          files[key] = value;
        } else {
          body[key] = value.toString();
        }
      });
    } else {
      body = await request.json();
    }

    // 📸 DEBUG: Verificar qué llegó del frontend
    console.log('📸 [DEBUG PUT] Content-Type:', contentType);
    console.log('📸 [DEBUG PUT] Files recibidos:', Object.keys(files));
    console.log('📸 [DEBUG PUT] Body.foto:', body.foto);
    console.log('📸 [DEBUG PUT] Body.fotoVehiculo:', body.fotoVehiculo);

    client = await pool.connect();

    // Obtener datos actuales
    const current = await client.query('SELECT * FROM conductores WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Conductor no encontrado', success: false }, { status: 404 });
    }
    const currentData = current.rows[0];

    // Procesar archivos
    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'conductores');

    const saveFile = async (file: File, prefix: string) => {
      try {
        await mkdir(uploadDir, { recursive: true });
        const ext = path.extname(file.name).toLowerCase() || '.jpg';
        const filename = `${prefix}-${Date.now()}${ext}`;
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, Buffer.from(await file.arrayBuffer()));
        return `/uploads/conductores/${filename}`;
      } catch (e) {
        console.error(`❌ Error guardando archivo ${prefix}:`, e);
        return null;
      }
    };

    let foto = body.foto || currentData.foto;
    console.log('📸 [DEBUG PUT] Foto inicial (antes de procesar):', foto);
    if (files.foto) {
      console.log('📸 [DEBUG PUT] Procesando archivo foto, tamaño:', files.foto.size);
      const newFoto = await saveFile(files.foto, `driver-${id}`);
      console.log('📸 [DEBUG PUT] Nueva foto guardada:', newFoto);
      if (newFoto) foto = newFoto;
    }

    let fotoVehiculo = body.fotoVehiculo || currentData.fotoVehiculo;
    console.log('📸 [DEBUG PUT] FotoVehiculo inicial:', fotoVehiculo);
    if (files.fotoVehiculo) {
      console.log('📸 [DEBUG PUT] Procesando archivo fotoVehiculo, tamaño:', files.fotoVehiculo.size);
      const newFoto = await saveFile(files.fotoVehiculo, `vehiculo-${id}`);
      console.log('📸 [DEBUG PUT] Nueva foto vehículo guardada:', newFoto);
      if (newFoto) fotoVehiculo = newFoto;
    }

    // Validar distritoId - si no existe en la BD, usar el valor actual o NULL
    let distritoIdValido: number | null = currentData.distritoId;
    if (body.distritoId !== undefined && body.distritoId !== null && body.distritoId !== '') {
      const distritoCheck = await client.query('SELECT id FROM distritos WHERE id = $1', [parseInt(body.distritoId)]);
      if (distritoCheck.rows.length > 0) {
        distritoIdValido = parseInt(body.distritoId);
      } else {
        console.log(`⚠️ [API-Conductores PUT] distritoId ${body.distritoId} no existe, manteniendo valor actual`);
      }
    }

    // UPDATE: Cada $N mapea a UNA sola columna
    // NUNCA reutilizar el mismo $N en dos columnas distintas para evitar
    // "inconsistent types deduced for parameter" en PostgreSQL
    const colorVehiculo = body.colorVehiculo || body.colorAuto || currentData.colorVehiculo || currentData.colorAuto;

    const updateQuery = `
      UPDATE conductores SET
        dni = $1,
        nombres = $2,
        apellidos = $3,
        "fechaNacimiento" = $4,
        foto = $5,
        foto_url = $6,
        celular1 = $7,
        celular2 = $8,
        email = $9,
        "estadoCivil" = $10,
        "numeroHijos" = $11,
        "domicilioCompleto" = $12,
        "distritoId" = $13,
        "nombreContactoEmergencia" = $14,
        "celularContactoEmergencia" = $15,
        "numeroBrevete" = $16,
        "fechaVencimientoBrevete" = $17,
        "marcaVehiculo" = $18,
        marca_vehiculo = $19,
        "modeloVehiculo" = $20,
        modelo_vehiculo = $21,
        placa = $22,
        "tipoVehiculo" = $23,
        estado_registro = CASE WHEN $24 = 'ACTIVO' THEN 'APROBADO' ELSE estado_registro END,
        estado = $24::"EstadoConductor",
        observaciones = $25,
        sexo = $26,
        "colorAuto" = $27,
        color_vehiculo = $28,
        "colorVehiculo" = $29,
        "fotoVehiculo" = $30,
        foto_vehiculo = $31,
        certificado_medico = $32,
        antecedentes_penales = $33,
        licencia_categoria = $34,
        equipamiento_nemt = $35,
        servicios_habilitados = $36,
        whatsapp_number = $37,
        "updatedAt" = NOW()
      WHERE id = $38
      RETURNING *
    `;

    const marcaVehiculo = body.marcaVehiculo || currentData.marcaVehiculo;
    const modeloVehiculo = body.modeloVehiculo || currentData.modeloVehiculo;
    const estadoVal = body.estado || currentData.estado;

    const values = [
      body.dni || currentData.dni,                                                                              // $1
      body.nombres || currentData.nombres,                                                                     // $2
      body.apellidos || currentData.apellidos,                                                                 // $3
      body.fechaNacimiento || currentData.fechaNacimiento,                                                     // $4
      foto,                                                                                                    // $5  → foto
      foto,                                                                                                    // $6  → foto_url (mismo valor, parámetro separado)
      body.celular1 || currentData.celular1,                                                                   // $7
      body.celular2 || currentData.celular2,                                                                   // $8
      body.email || currentData.email,                                                                         // $9
      body.estadoCivil || currentData.estadoCivil,                                                             // $10
      body.numeroHijos ? parseInt(body.numeroHijos) : currentData.numeroHijos,                                 // $11
      body.domicilioCompleto || currentData.domicilioCompleto,                                                 // $12
      distritoIdValido,                                                                                        // $13
      body.nombreContactoEmergencia || currentData.nombreContactoEmergencia,                                   // $14
      body.celularContactoEmergencia || currentData.celularContactoEmergencia,                                 // $15
      body.numeroBrevete || currentData.numeroBrevete,                                                         // $16
      body.fechaVencimientoBrevete || currentData.fechaVencimientoBrevete,                                     // $17
      marcaVehiculo,                                                                                           // $18 → marcaVehiculo
      marcaVehiculo,                                                                                           // $19 → marca_vehiculo
      modeloVehiculo,                                                                                          // $20 → modeloVehiculo
      modeloVehiculo,                                                                                          // $21 → modelo_vehiculo
      body.placa || currentData.placa,                                                                         // $22
      body.tipoVehiculo || currentData.tipoVehiculo,                                                           // $23
      estadoVal,                                                                                               // $24 → estado + estado_registro CASE
      body.observaciones || currentData.observaciones,                                                         // $25
      body.sexo || currentData.sexo,                                                                           // $26
      colorVehiculo,                                                                                           // $27 → colorAuto
      colorVehiculo,                                                                                           // $28 → color_vehiculo
      colorVehiculo,                                                                                           // $29 → colorVehiculo
      fotoVehiculo,                                                                                            // $30 → fotoVehiculo
      fotoVehiculo,                                                                                            // $31 → foto_vehiculo
      body.certificacionMedica === 'true' || body.certificacionMedica === true || currentData.certificado_medico,   // $32
      body.antecedentesPenales === 'true' || body.antecedentesPenales === true || currentData.antecedentes_penales, // $33
      body.licencia_categoria || currentData.licencia_categoria,                                               // $34
      body.equipamiento ? (typeof body.equipamiento === 'string' ? body.equipamiento : JSON.stringify(body.equipamiento)) : currentData.equipamiento_nemt, // $35
      body.servicios ? (typeof body.servicios === 'string' ? body.servicios : JSON.stringify(body.servicios)) : currentData.servicios_habilitados,         // $36
      body.whatsapp_number ?? currentData.whatsapp_number ?? null,                                             // $37
      id,                                                                                                      // $38
    ];

    // 📸 DEBUG: Valores finales que se guardarán en BD
    console.log('📸 [DEBUG PUT] Valor final foto (antes UPDATE):', foto);
    console.log('📸 [DEBUG PUT] Valor final fotoVehiculo (antes UPDATE):', fotoVehiculo);

    const result = await client.query(updateQuery, values);
    const conductor = result.rows[0];

    console.log(`✅ [PUT Conductor] Actualizado: ${conductor.nombres} ${conductor.apellidos} (ID: ${id})`);

    return NextResponse.json({
      success: true,
      conductor: {
        id: conductor.id,
        dni: conductor.dni,
        nombres: conductor.nombres,
        apellidos: conductor.apellidos
      },
      message: `Conductor ${conductor.nombres} ${conductor.apellidos} actualizado exitosamente`
    });

  } catch (error: any) {
    console.error('❌ [PUT Conductor] Error:', error);
    return NextResponse.json({ error: error.message, success: false, detalles: error.detail }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

// DELETE: Eliminar físicamente un conductor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: any = null;

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido', success: false }, { status: 400 });
    }

    client = await pool.connect();

    // Primero, obtener información del conductor para logging
    const conductorInfo = await client.query(`
      SELECT nombres, apellidos FROM conductores WHERE id = $1
    `, [id]);

    if (conductorInfo.rows.length === 0) {
      return NextResponse.json({ error: 'Conductor no encontrado', success: false }, { status: 404 });
    }

    const conductor = conductorInfo.rows[0];

    // Eliminar en transacción: primero desasociar tablas dependientes, luego eliminar
    await client.query('BEGIN');
    await client.query(`UPDATE programacion_detalles SET conductor_id = NULL WHERE conductor_id = $1`, [id]);
    await client.query(`UPDATE solicitudes_servicios SET conductor_id = NULL WHERE conductor_id = $1`, [id]);
    await client.query(`UPDATE servicios SET "conductorId" = NULL WHERE "conductorId" = $1`, [id]);
    await client.query(`DELETE FROM conductores WHERE id = $1`, [id]);
    await client.query('COMMIT');

    console.log(`🗑️ [DELETE Conductor] Eliminado permanentemente: ${conductor.nombres} ${conductor.apellidos} (ID: ${id})`);

    return NextResponse.json({
      success: true,
      message: `Conductor ${conductor.nombres} ${conductor.apellidos} eliminado exitosamente`
    });

  } catch (error: any) {
    if (client) await client.query('ROLLBACK').catch(() => { });
    console.error('❌ [DELETE Conductor] Error:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
