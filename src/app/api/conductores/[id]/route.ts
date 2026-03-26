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

    const normalizeUrl = (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('/uploads/')) return `/api${url}`;
      return url;
    };

    const splitNombreCompleto = (full: string | null) => {
      const text = (full || '').trim();
      if (!text) return { nombres: '', apellidos: '' };
      const parts = text.split(/\s+/);
      if (parts.length === 1) return { nombres: parts[0], apellidos: '' };
      return { nombres: parts.slice(0, 1).join(' '), apellidos: parts.slice(1).join(' ') };
    };

    const derived = splitNombreCompleto(row.nombreCompleto || null);

    const conductor = {
      id: row.id,
      dni: row.dni,
      nombres: row.nombres ?? derived.nombres,
      apellidos: row.apellidos ?? derived.apellidos,
      nombreCompleto: row.nombreCompleto || `${row.nombres || ''} ${row.apellidos || ''}`.trim(),
      foto: normalizeUrl(row.foto),
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
      colorVehiculo: row.colorVehiculo || row.colorAuto,
      fotoVehiculo: normalizeUrl(row.fotoVehiculo),
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

    // Verificar qué llegó del frontend (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      console.log('📸 [PUT DEBUG] Content-Type:', contentType, '| foto?', !!body.foto, '| fotoVehiculo?', !!body.fotoVehiculo);
    }

    client = await pool.connect();

    // Obtener datos actuales
    const current = await client.query('SELECT * FROM conductores WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Conductor no encontrado', success: false }, { status: 404 });
    }
    const currentData = current.rows[0];

    // 🚀 FIX CRÍTICO: Evitar que strings vacíos o 'null' borren la foto existente
    const isValidValue = (val: any) => val !== undefined && val !== null && val !== '' && val !== 'null' && val !== 'undefined';

    // Si recibimos Base64 o URL, la usamos. Si no, mantenemos la actual.
    let foto = isValidValue(body.foto) ? body.foto : currentData.foto;
    let fotoVehiculo = isValidValue(body.fotoVehiculo) ? body.fotoVehiculo : currentData.fotoVehiculo;

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

    const colorVehiculo = body.colorVehiculo || body.colorAuto || currentData.colorVehiculo || currentData.colorAuto;

    const colsRes = await client.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'conductores'
      `
    );
    const colMap = new Map<string, string>();
    for (const r of colsRes.rows || []) {
      const name = String(r.column_name);
      colMap.set(name.toLowerCase(), name);
    }
    const cols = new Set<string>((colsRes.rows || []).map((r: any) => String(r.column_name).toLowerCase()));
    const hasNombres = cols.has('nombres');
    const hasApellidos = cols.has('apellidos');
    const hasNombreCompleto = cols.has('nombrecompleto');
    const hasFoto = cols.has('foto');
    const hasFotoUrl = cols.has('foto_url');
    const hasFotoVehiculo = cols.has('fotovehiculo') || cols.has('foto_vehiculo');
    const hasFechaNacimiento = cols.has('fechanacimiento') || cols.has('fecha_nacimiento');
    const hasEstadoRegistro = cols.has('estado_registro');

    const colIdent = (name: string) => {
      const actual = colMap.get(name.toLowerCase());
      if (!actual) return null;
      return `"${actual.replace(/"/g, '""')}"`;
    };

    const nombresVal = body.nombres ?? currentData.nombres ?? '';
    const apellidosVal = body.apellidos ?? currentData.apellidos ?? '';
    const nombreCompletoVal =
      body.nombreCompleto ?? currentData.nombreCompleto ?? `${nombresVal} ${apellidosVal}`.trim();

    const marcaVehiculo = body.marcaVehiculo || currentData.marcaVehiculo;
    const modeloVehiculo = body.modeloVehiculo || currentData.modeloVehiculo;
    const estadoVal = body.estado || currentData.estado;

    const updates: string[] = [];
    const values: any[] = [];

    const push = (sql: string, value: any) => {
      values.push(value);
      updates.push(`${sql} = $${values.length}`);
    };

    const pushCol = (name: string, value: any) => {
      const ident = colIdent(name);
      if (!ident) return false;
      push(ident, value);
      return true;
    };

    push('dni', body.dni || currentData.dni);
    if (hasNombres) push('nombres', nombresVal);
    if (hasApellidos) push('apellidos', apellidosVal);
    if (hasNombreCompleto) pushCol('nombreCompleto', nombreCompletoVal);
    if (hasFechaNacimiento) pushCol('fechaNacimiento', body.fechaNacimiento || currentData.fechaNacimiento);
    if (hasFoto) push('foto', foto);
    if (hasFotoUrl && foto && !foto.startsWith('data:')) push('foto_url', foto);
    push('celular1', body.celular1 || currentData.celular1);
    push('celular2', body.celular2 || currentData.celular2);
    push('email', body.email || currentData.email);
    pushCol('estadoCivil', body.estadoCivil || currentData.estadoCivil);
    pushCol('numeroHijos', body.numeroHijos ? parseInt(body.numeroHijos) : currentData.numeroHijos);
    {
      const domicilioVal =
        body.domicilioCompleto ||
        body.direccion ||
        currentData.domicilioCompleto ||
        currentData.direccion ||
        currentData.domicilio ||
        null;
      pushCol('domicilioCompleto', domicilioVal) || pushCol('direccion', domicilioVal) || pushCol('domicilio', domicilioVal);
    }
    pushCol('distritoId', distritoIdValido);
    {
      const nombreContactoVal = body.nombreContactoEmergencia || currentData.nombreContactoEmergencia || null;
      pushCol('nombreContactoEmergencia', nombreContactoVal) || pushCol('contacto_emergencia_nombre', nombreContactoVal) || pushCol('nombreContacto', nombreContactoVal);
    }
    {
      const celularContactoVal = body.celularContactoEmergencia || currentData.celularContactoEmergencia || null;
      pushCol('celularContactoEmergencia', celularContactoVal) || pushCol('contacto_emergencia_telefono', celularContactoVal) || pushCol('celularContacto', celularContactoVal);
    }
    {
      const numeroBreveteVal = body.numeroBrevete || currentData.numeroBrevete || null;
      pushCol('numeroBrevete', numeroBreveteVal) || pushCol('licencia_numero', numeroBreveteVal);
    }
    {
      const fechaVencVal = body.fechaVencimientoBrevete || currentData.fechaVencimientoBrevete || null;
      pushCol('fechaVencimientoBrevete', fechaVencVal) || pushCol('fecha_vencimiento_licencia', fechaVencVal);
    }
    pushCol('marcaVehiculo', marcaVehiculo);
    pushCol('marca_vehiculo', marcaVehiculo);
    pushCol('modeloVehiculo', modeloVehiculo);
    pushCol('modelo_vehiculo', modeloVehiculo);
    push('placa', body.placa || currentData.placa);
    {
      const tipoVehiculoVal = body.tipoVehiculo || currentData.tipoVehiculo || null;
      pushCol('tipoVehiculo', tipoVehiculoVal) || pushCol('tipo_vehiculo', tipoVehiculoVal);
    }

    if (hasEstadoRegistro) {
      values.push(estadoVal);
      updates.push(`estado_registro = CASE WHEN $${values.length} = 'ACTIVO' THEN 'APROBADO' ELSE estado_registro END`);
    }
    values.push(estadoVal);
    updates.push(`estado = $${values.length}::"EstadoConductor"`);

    push('observaciones', body.observaciones || currentData.observaciones);
    pushCol('sexo', body.sexo || currentData.sexo);
    pushCol('colorAuto', colorVehiculo) || pushCol('color_auto', colorVehiculo);
    pushCol('color_vehiculo', colorVehiculo);
    pushCol('colorVehiculo', colorVehiculo);
    pushCol('fotoVehiculo', fotoVehiculo) || pushCol('foto_vehiculo', fotoVehiculo);
    {
      const certMedVal = body.certificacionMedica === 'true' || body.certificacionMedica === true || currentData.certificado_medico;
      pushCol('certificado_medico', certMedVal) || pushCol('certificacionMedica', certMedVal);
    }
    {
      const antecedentesVal = body.antecedentesPenales === 'true' || body.antecedentesPenales === true || currentData.antecedentes_penales;
      pushCol('antecedentes_penales', antecedentesVal) || pushCol('antecedentesPenales', antecedentesVal);
    }
    {
      const licenciaCatVal = body.licencia_categoria || currentData.licencia_categoria || null;
      pushCol('licencia_categoria', licenciaCatVal) || pushCol('licenciaCategoria', licenciaCatVal);
    }
    {
      const equipVal = body.equipamiento
        ? (typeof body.equipamiento === 'string' ? body.equipamiento : JSON.stringify(body.equipamiento))
        : currentData.equipamiento_nemt;
      pushCol('equipamiento_nemt', equipVal) || pushCol('equipamientoNemt', equipVal);
    }
    {
      const servVal = body.servicios
        ? (typeof body.servicios === 'string' ? body.servicios : JSON.stringify(body.servicios))
        : currentData.servicios_habilitados;
      pushCol('servicios_habilitados', servVal) || pushCol('serviciosHabilitados', servVal);
    }
    {
      const waVal = body.whatsapp_number ?? currentData.whatsapp_number ?? null;
      pushCol('whatsapp_number', waVal) || pushCol('whatsappNumber', waVal);
    }
    updates.push(`"updatedAt" = NOW()`);

    values.push(id);
    const updateQuery = `
      UPDATE conductores SET
        ${updates.join(',\n        ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📸 [PUT DEBUG] Conductor ${id} | foto?`, !!foto, '| fotoVehiculo?', !!fotoVehiculo);
    }

    const result = await client.query(updateQuery, values);
    const row = result.rows[0];

    // 🔔 TRIGGER: Si el estado cambió a ACTIVO, notificar al conductor por email
    const estadoAnterior = currentData.estado;
    const estadoNuevo = body.estado || currentData.estado;
    if (estadoAnterior !== 'ACTIVO' && estadoNuevo === 'ACTIVO' && row.email) {
      const nombreCompleto = `${row.nombres || ''} ${row.apellidos || ''}`.trim();
      import('@/lib/notifications').then(({ sendApprovalNotification }) => {
        sendApprovalNotification(
          nombreCompleto,
          row.email,
          row.celular1 || ''
        ).catch((err: Error) =>
          console.error('❌ [PUT Conductor] Approval email error:', err.message)
        );
      });
      console.log(`✅ [PUT Conductor] Email de aprobación enviado a ${row.email}`);
    }

    // Mapear el objeto completo para devolverlo (igual que el GET)
    const normalizeUrl = (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('/uploads/')) return `/api${url}`;
      return url;
    };

    const conductor = {
      id: row.id,
      dni: row.dni,
      nombres: row.nombres,
      apellidos: row.apellidos,
      nombreCompleto: row.nombreCompleto || `${row.nombres || ''} ${row.apellidos || ''}`.trim(),
      foto: normalizeUrl(row.foto),
      fechaNacimiento: row.fechaNacimiento ? new Date(row.fechaNacimiento).toISOString().split('T')[0] : null,
      sexo: row.sexo,
      celular1: row.celular1,
      celular2: row.celular2,
      email: row.email,
      estadoCivil: row.estadoCivil,
      numeroHijos: row.numeroHijos,
      domicilioCompleto: row.domicilioCompleto || row.direccion,
      distritoId: row.distritoId,
      nombreContactoEmergencia: row.nombreContactoEmergencia,
      celularContactoEmergencia: row.celularContactoEmergencia,
      numeroBrevete: row.numeroBrevete,
      licencia_categoria: row.licencia_categoria,
      fechaVencimientoBrevete: row.fechaVencimientoBrevete ? new Date(row.fechaVencimientoBrevete).toISOString().split('T')[0] : null,
      marcaVehiculo: row.marcaVehiculo,
      modeloVehiculo: row.modeloVehiculo,
      placa: row.placa,
      tipoVehiculo: row.tipoVehiculo,
      colorVehiculo: row.colorVehiculo || row.colorAuto,
      fotoVehiculo: normalizeUrl(row.fotoVehiculo),
      estado: row.estado,
      observations: row.observaciones,
      certificacionMedica: row.certificado_medico,
      antecedentesPenales: row.antecedentes_penales,
      equipamiento: row.equipamiento_nemt && row.equipamiento_nemt !== '[]' ? JSON.parse(row.equipamiento_nemt) : [],
      servicios: row.servicios_habilitados && row.servicios_habilitados !== '[]' ? JSON.parse(row.servicios_habilitados) : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    console.log(`✅ [PUT Conductor] Actualizado completo: ${conductor.nombreCompleto} (ID: ${id})`);

    return NextResponse.json({
      success: true,
      conductor,
      message: `Conductor ${conductor.nombreCompleto} actualizado exitosamente`
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

    // Eliminar en transacción: desasociar TODAS las tablas dependientes antes de eliminar
    // (las tablas con ON DELETE CASCADE se limpian solas; las NO ACTION deben nullearse manualmente)
    await client.query('BEGIN');
    // SET NULL en tablas con ON DELETE SET NULL
    await client.query(`UPDATE programacion_detalles SET conductor_id = NULL WHERE conductor_id = $1`, [id]);
    await client.query(`UPDATE solicitudes_servicios SET conductor_id = NULL WHERE conductor_id = $1`, [id]);
    await client.query(`UPDATE servicios SET "conductorId" = NULL WHERE "conductorId" = $1`, [id]);
    // SET NULL en toma_muestras (ON DELETE NO ACTION — bloquea el DELETE si no se nullea)
    await client.query(`UPDATE toma_muestras SET conductor_id = NULL WHERE conductor_id = $1`, [id]);
    // Las tablas con ON DELETE CASCADE se eliminan automáticamente:
    // conductor_certificaciones_nemt, ubicaciones_conductores, conductor_documentos,
    // ofertas_rechazadas, ubicaciones_conductor
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
