// src/app/api/conductores/route.ts
// API CONDUCTORES - CORREGIDO CON NOMBRES EXACTOS DE LA BASE DE DATOS
// ✅ Verificado contra tabla real PostgreSQL

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';

let cachedConductoresCols: Set<string> | null = null;
let cachedConductoresColsAt = 0;

async function getConductoresCols(client: any) {
  const now = Date.now();
  if (cachedConductoresCols && now - cachedConductoresColsAt < 5 * 60 * 1000) return cachedConductoresCols;
  const res = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conductores'
    `
  );
  const cols = new Set<string>((res.rows || []).map((r: any) => String(r.column_name).toLowerCase()));
  cachedConductoresCols = cols;
  cachedConductoresColsAt = now;
  return cols;
}

const parseStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string') as string[];
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '[]') return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

// GET: Obtener conductores con PAGINACIÓN (Fix 504 Timeout)
export async function GET(request: NextRequest) {
  let client: any = null;

  try {
    // ============================================
    // PARSEO DE PARÁMETROS DE PAGINACIÓN Y FILTROS
    // ============================================
    const { searchParams } = new URL(request.url);

    // Paginación con valores por defecto seguros
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Filtros opcionales
    const search = searchParams.get('search')?.trim() || '';
    const estadoFilter = searchParams.get('estado')?.toUpperCase() || '';
    const estadoRegistro = searchParams.get('estadoRegistro')?.toUpperCase() || ''; // NUEVO: filtro de registro
    const distritoFilter = searchParams.get('distrito')?.trim() || '';

    console.log(`🔍 [API-Conductores] Página ${page}, Límite ${limit}, Búsqueda: "${search}", EstadoRegistro: "${estadoRegistro}"`);

    client = await pool.connect();

    const cols = await getConductoresCols(client);
    const hasNombreCompleto = cols.has('nombrecompleto');
    const hasNombres = cols.has('nombres');
    const hasApellidos = cols.has('apellidos');
    const hasCalificacionSnake = cols.has('calificacion_promedio');
    const hasCalificacionCamel = cols.has('calificacionpromedio');
    const hasFotoVehiculoCamel = cols.has('fotovehiculo');
    const hasFotoVehiculoSnake = cols.has('foto_vehiculo');
    const hasFoto = cols.has('foto');
    const hasFotoUrlSnake = cols.has('foto_url');
    const hasFotoUrlCamel = cols.has('fotourl');
    const hasDistritoIdCamel = cols.has('distritoid');
    const hasDistritoIdSnake = cols.has('distrito_id');
    const hasEstadoServicioCamel = cols.has('estadoservicio');
    const hasEstadoServicioSnake = cols.has('estado_servicio');
    const hasMarcaVehiculo = cols.has('marcavehiculo');
    const hasMarcaVehiculoSnake = cols.has('marca_vehiculo');
    const hasModeloVehiculo = cols.has('modelovehiculo');
    const hasModeloVehiculoSnake = cols.has('modelo_vehiculo');
    const hasPinHash = cols.has('pin_hash');

    const nombreCompletoExpr = hasNombreCompleto
      ? 'c."nombreCompleto"'
      : (hasNombres && hasApellidos)
        ? `TRIM(CONCAT(c.nombres, ' ', c.apellidos))`
        : hasNombres
          ? 'c.nombres'
          : 'NULL';

    const nombresExpr = hasNombres ? 'c.nombres' : 'NULL';
    const apellidosExpr = hasApellidos ? 'c.apellidos' : 'NULL';

    const calificacionExpr = hasCalificacionSnake
      ? 'c.calificacion_promedio'
      : hasCalificacionCamel
        ? 'c."calificacionPromedio"'
        : '0';

    const fotoExpr = hasFoto
      ? 'c.foto'
      : hasFotoUrlSnake
        ? 'c.foto_url'
        : hasFotoUrlCamel
          ? 'c."fotoUrl"'
          : 'NULL';

    const fotoVehiculoExpr = hasFotoVehiculoCamel
      ? 'c."fotoVehiculo"'
      : hasFotoVehiculoSnake
        ? 'c.foto_vehiculo'
        : 'NULL';

    const distritoIdExpr = hasDistritoIdCamel
      ? 'c."distritoId"'
      : hasDistritoIdSnake
        ? 'c.distrito_id'
        : 'NULL';

    const estadoServicioExpr = hasEstadoServicioCamel
      ? 'c."estadoServicio"'
      : hasEstadoServicioSnake
        ? 'c.estado_servicio'
        : 'NULL';

    const marcaVehiculoExpr = hasMarcaVehiculo
      ? 'c."marcaVehiculo"'
      : hasMarcaVehiculoSnake
        ? 'c.marca_vehiculo'
        : 'NULL';

    const modeloVehiculoExpr = hasModeloVehiculo
      ? 'c."modeloVehiculo"'
      : hasModeloVehiculoSnake
        ? 'c.modelo_vehiculo'
        : 'NULL';

    // ============================================
    // CONFIGURACIÓN DE TIMEOUT PARA EVITAR 504
    // ============================================
    // Establecer timeout de 30 segundos para queries lentas
    await client.query('SET statement_timeout = 30000');

    // ============================================
    // CONSTRUCCIÓN DINÁMICA DE LA QUERY CON FILTROS
    // ============================================
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro de búsqueda (dni, nombre, apellidos, placa, celular)
    if (search) {
      const searchClauses: string[] = [];
      if (cols.has('dni')) searchClauses.push(`c.dni ILIKE $${paramIndex}`);
      if (hasNombres) searchClauses.push(`c.nombres ILIKE $${paramIndex}`);
      if (hasApellidos) searchClauses.push(`c.apellidos ILIKE $${paramIndex}`);
      if (hasNombreCompleto) searchClauses.push(`c."nombreCompleto" ILIKE $${paramIndex}`);
      if (cols.has('placa')) searchClauses.push(`c.placa ILIKE $${paramIndex}`);
      if (cols.has('celular1')) searchClauses.push(`c.celular1 ILIKE $${paramIndex}`);

      whereClauses.push(`(
        ${searchClauses.length > 0 ? searchClauses.join(' OR ') : `(${nombreCompletoExpr}) ILIKE $${paramIndex}`}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por estado
    if (estadoFilter && estadoFilter !== 'TODOS') {
      whereClauses.push(`c.estado = $${paramIndex}`);
      queryParams.push(estadoFilter);
      paramIndex++;
    }

    // Filtro por estado de registro (NUEVO)
    if (estadoRegistro && estadoRegistro !== 'TODOS') {
      whereClauses.push(`c.estado_registro = $${paramIndex}`);
      queryParams.push(estadoRegistro);
      paramIndex++;
    }

    // Filtro por distrito
    if (distritoFilter && distritoFilter !== 'todos') {
      if (hasDistritoIdCamel || hasDistritoIdSnake) {
        whereClauses.push(`d.nombre = $${paramIndex}`);
        queryParams.push(distritoFilter);
        paramIndex++;
      }
    }

    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    // ============================================
    // QUERY PRINCIPAL CON PAGINACIÓN
    // ============================================
    const query = `
      SELECT 
        c.id,
        c.dni,
        (${nombresExpr}) AS nombres,
        (${apellidosExpr}) AS apellidos,
        (${nombreCompletoExpr}) AS "nombreCompleto",
        (${fotoExpr}) AS foto,
        c.celular1,
        (${distritoIdExpr}) AS "distritoId",
        (${marcaVehiculoExpr}) AS "marcaVehiculo",
        (${modeloVehiculoExpr}) AS "modeloVehiculo",
        c.placa,
        (${fotoVehiculoExpr}) AS "fotoVehiculo",
        c.estado,
        (${estadoServicioExpr}) AS "estadoServicio",
        (${calificacionExpr}) AS calificacion_promedio,
        ${hasDistritoIdCamel || hasDistritoIdSnake ? 'd.nombre as distrito_nombre,' : 'NULL as distrito_nombre,'}
        ${hasPinHash ? '(c.pin_hash IS NOT NULL) as tiene_pin' : 'false as tiene_pin'}
      FROM conductores c
      ${hasDistritoIdCamel || hasDistritoIdSnake ? `LEFT JOIN distritos d ON ${distritoIdExpr} = d.id` : ''}
      ${whereClause}
      ORDER BY c.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // ============================================
    // QUERY DE CONTEO TOTAL (Para paginación)
    // ============================================
    const countQuery = `
      SELECT COUNT(*) as total
      FROM conductores c
      ${hasDistritoIdCamel || hasDistritoIdSnake ? `LEFT JOIN distritos d ON ${distritoIdExpr} = d.id` : ''}
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, -2); // Excluir LIMIT y OFFSET

    // Ejecutar ambas queries en paralelo
    const [result, countResult] = await Promise.all([
      client.query(query, queryParams),
      client.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ [API-Conductores] Encontrados: ${result.rows.length} de ${total} conductores (página ${page}/${totalPages})`);

    // ============================================
    // MAPEO DE DATOS
    // ============================================
    // normalizar URLs de fotos para que usen /api/uploads/
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

    const conductores = result.rows.map(row => ({
      id: row.id,
      dni: row.dni,
      nombres: row.nombres ?? splitNombreCompleto(row.nombreCompleto).nombres,
      apellidos: row.apellidos ?? splitNombreCompleto(row.nombreCompleto).apellidos,
      nombreCompleto: row.nombreCompleto || `${row.nombres || ''} ${row.apellidos || ''}`.trim(),
      foto: normalizeUrl(row.foto),
      fechaNacimiento: row.fechaNacimiento ? new Date(row.fechaNacimiento).toISOString().split('T')[0] : null,
      sexo: row.sexo,
      celular1: row.celular1,
      celular2: row.celular2,
      email: row.email,
      estadoCivil: row.estadoCivil,
      numeroHijos: row.numeroHijos || 0,
      domicilioCompleto: row.domicilioCompleto || row.direccion,
      distritoId: row.distritoId,
      distrito_nombre: row.distrito_nombre,
      numeroBrevete: row.numeroBrevete,
      licencia_categoria: row.licencia_categoria,
      fechaVencimientoBrevete: row.fechaVencimientoBrevete ? new Date(row.fechaVencimientoBrevete).toISOString().split('T')[0] : null,
      marcaVehiculo: row.marcaVehiculo,
      modeloVehiculo: row.modeloVehiculo,
      placa: row.placa,
      tipoVehiculo: row.tipoVehiculo || 'SEDAN',
      colorVehiculo: row.colorAuto,
      fotoVehiculo: normalizeUrl(row.fotoVehiculo),
      estado: row.estado || 'ACTIVO',
      observaciones: row.observaciones,
      certificacionMedica: row.certificado_medico,
      antecedentesPenales: row.antecedentes_penales,
      equipamiento: parseStringArray(row.equipamiento_nemt),
      servicios: parseStringArray(row.servicios_habilitados),
      // GPS: usar campo real primero, luego el legacy como fallback
      ubicacionActualLatitud: row.ubicacionActualLatitud
        ? parseFloat(row.ubicacionActualLatitud)
        : (row.latitud_actual ? parseFloat(row.latitud_actual) : null),
      ubicacionActualLongitud: row.ubicacionActualLongitud
        ? parseFloat(row.ubicacionActualLongitud)
        : (row.longitud_actual ? parseFloat(row.longitud_actual) : null),
      ultimaActualizacionGPS: row.ultimaActualizacionGPS || row.ultimaUbicacion || null,
      precisionGPS: row.precisionGPS ? parseFloat(row.precisionGPS) : null,
      velocidadActual: row.velocidadActual ? parseFloat(row.velocidadActual) : null,
      nivelBateria: row.nivelBateria ? parseFloat(row.nivelBateria) : null,
      estaConectado: row.estaConectado || false,
      estadoServicio: row.estadoServicio,
      calificacionPromedio: row.calificacion_promedio ? parseFloat(row.calificacion_promedio) : 0,
      totalServicios: row.total_servicios || 0,
      estado_registro: row.estado_registro || 'APROBADO',
      fecha_registro: row.fecha_registro,
      fecha_aprobacion: row.fecha_aprobacion,
      fecha_rechazo: row.fecha_rechazo,
      razon_rechazo: row.razon_rechazo,
      email_verificado: row.email_verificado || false,
      advertencias_enviadas: row.advertencias_enviadas || 0,
      tienePin: row.tiene_pin || false,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    // ============================================
    // RESPUESTA CON METADATOS DE PAGINACIÓN
    // ============================================
    return NextResponse.json({
      success: true,
      conductores,
      data: conductores, // Alias para compatibilidad
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      // Stats calculados desde el total (no desde la página actual)
      stats: {
        total,
        // Para stats detallados, se calculan en el endpoint /estadisticas
      }
    });

  } catch (error: any) {
    console.error('❌ [API-Conductores] Error en GET:', error);
    return NextResponse.json(
      {
        error: error.message,
        success: false,
        codigo_error: 'CONDUCTOR_GET_ERROR'
      },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// POST: Crear conductor
export async function POST(request: NextRequest) {
  let client: any = null;

  try {
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

    console.log('💾 [API-Conductores] Creando conductor DNI:', body.dni);

    // Validaciones básicas
    if (!body.dni || body.dni.length !== 8) {
      return NextResponse.json({
        error: 'DNI inválido - debe tener 8 dígitos',
        success: false
      }, { status: 400 });
    }

    if (!body.celular1) {
      return NextResponse.json({
        error: 'Celular es obligatorio',
        success: false
      }, { status: 400 });
    }

    client = await pool.connect();

    // Verificar si ya existe
    const existeQuery = await client.query('SELECT id FROM conductores WHERE dni = $1', [body.dni]);
    if (existeQuery.rows.length > 0) {
      return NextResponse.json({
        error: 'Ya existe un conductor con este DNI',
        success: false
      }, { status: 409 });
    }

    // Validar distritoId - si no existe en la BD, usar NULL para evitar error FK
    let distritoIdValido: number | null = null;
    if (body.distritoId) {
      const distritoCheck = await client.query('SELECT id FROM distritos WHERE id = $1', [parseInt(body.distritoId)]);
      if (distritoCheck.rows.length > 0) {
        distritoIdValido = parseInt(body.distritoId);
      } else {
        console.log(`⚠️ [API-Conductores] distritoId ${body.distritoId} no existe, usando NULL`);
      }
    }

    // INSERT con nombres EXACTOS de la base de datos
    // ⚠️ IMPORTANTE: Cada $N mapea a UNA sola columna para evitar
    // "inconsistent types deduced for parameter" en PostgreSQL
    const insertQuery = `
      INSERT INTO conductores (
        dni, nombres, apellidos, "fechaNacimiento",
        foto, celular1, celular2, email,
        "estadoCivil", "numeroHijos", "domicilioCompleto", "distritoId",
        "nombreContactoEmergencia", "celularContactoEmergencia", "numeroBrevete",
        "fechaVencimientoBrevete", "marcaVehiculo", "modeloVehiculo", placa,
        "tipoVehiculo", estado, observaciones,
        "fechaIngreso", sexo, "colorAuto", "fotoVehiculo",
        certificado_medico, antecedentes_penales, licencia_categoria,
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21::\"EstadoConductor\", $22,
        $23, $24, $25, $26,
        $27, $28, $29,
        NOW(), NOW()
      ) RETURNING *
    `;

    const values = [
      body.dni,                                                          // $1
      body.nombres,                                                      // $2
      body.apellidos,                                                    // $3
      body.fechaNacimiento || null,                                      // $4
      body.foto || null,                                                 // $5
      body.celular1,                                                     // $6
      body.celular2 || null,                                             // $7
      body.email || null,                                                // $8
      body.estadoCivil || null,                                          // $9
      body.numeroHijos ? parseInt(body.numeroHijos) : 0,                 // $10
      body.domicilioCompleto || body.direccion || null,                  // $11
      distritoIdValido,                                                  // $12
      body.nombreContactoEmergencia || null,                             // $13
      body.celularContactoEmergencia || null,                            // $14
      body.numeroBrevete || null,                                        // $15
      body.fechaVencimientoBrevete || null,                              // $16
      body.marcaVehiculo || null,                                        // $17
      body.modeloVehiculo || null,                                       // $18
      body.placa || null,                                                // $19
      body.tipoVehiculo || 'SEDAN',                                      // $20
      body.estado || 'ACTIVO',                                           // $21
      body.observaciones || null,                                        // $22
      body.fechaIngreso || new Date().toISOString().split('T')[0],       // $23
      body.sexo || 'M',                                                  // $24
      body.colorVehiculo || null,                                        // $25
      body.fotoVehiculo || null,                                         // $26
      body.certificacionMedica === 'true' || body.certificacionMedica === true, // $27
      body.antecedentesPenales === 'true' || body.antecedentesPenales === true, // $28
      body.licencia_categoria || 'A-I',                                  // $29
    ];

    const result = await client.query(insertQuery, values);

    // Sincronizar columnas redundantes (legacy) en un UPDATE separado
    // Esto evita el error de tipos incompatibles en el INSERT
    const newId = result.rows[0].id;
    await client.query(`
      UPDATE conductores SET
        foto_url        = foto,
        marca_vehiculo  = "marcaVehiculo",
        modelo_vehiculo = "modeloVehiculo",
        color_vehiculo  = "colorAuto",
        "colorVehiculo" = "colorAuto",
        "fotoVehiculo"  = "fotoVehiculo"
      WHERE id = $1
    `, [newId]);

    const row = result.rows[0];

    // Mapear el objeto completo para devolverlo (consistente con GET/PUT)
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

    console.log(`✅ [API-Conductores] Conductor creado completo: ${conductor.nombreCompleto} (ID: ${conductor.id})`);

    return NextResponse.json({
      success: true,
      conductor,
      message: `Conductor ${conductor.nombreCompleto} creado exitosamente`
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ [API-Conductores] Error en POST:', error);
    return NextResponse.json({
      error: error.message || 'Error al crear conductor',
      success: false,
      detalles: error.detail || null
    }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
