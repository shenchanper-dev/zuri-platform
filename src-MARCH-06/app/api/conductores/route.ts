// src/app/api/conductores/route.ts
// API CONDUCTORES - CORREGIDO CON NOMBRES EXACTOS DE LA BASE DE DATOS
// ✅ Verificado contra tabla real PostgreSQL

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';

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
      whereClauses.push(`(
        c.dni ILIKE $${paramIndex} OR
        c.nombres ILIKE $${paramIndex} OR
        c.apellidos ILIKE $${paramIndex} OR
        c."nombreCompleto" ILIKE $${paramIndex} OR
        c.placa ILIKE $${paramIndex} OR
        c.celular1 ILIKE $${paramIndex}
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
      whereClauses.push(`d.nombre = $${paramIndex}`);
      queryParams.push(distritoFilter);
      paramIndex++;
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
        c.nombres,
        c.apellidos,
        c."nombreCompleto",
        c.foto,
        c."fechaNacimiento",
        c.sexo,
        c.celular1,
        c.celular2,
        c.email,
        c."estadoCivil",
        c."numeroHijos",
        c.direccion,
        c."domicilioCompleto",
        c."distritoId",
        c."numeroBrevete",
        c.licencia_categoria,
        c."fechaVencimientoBrevete",
        c."marcaVehiculo",
        c."modeloVehiculo",
        c.placa,
        c."tipoVehiculo",
        c."colorAuto",
        c."fotoVehiculo",
        c.estado,
        c.observaciones,
        c.certificado_medico,
        c.antecedentes_penales,
        c.latitud_actual,
        c.longitud_actual,
        c."ultimaUbicacion",
        c."estadoServicio",
        c.calificacion_promedio,
        c.total_servicios,
        c.equipamiento_nemt,
        c.servicios_habilitados,
        c.estado_registro,
        c.fecha_registro,
        c.fecha_aprobacion,
        c.fecha_rechazo,
        c.razon_rechazo,
        c.email_verificado,
        c.advertencias_enviadas,
        c."createdAt",
        c."updatedAt",
        d.nombre as distrito_nombre
      FROM conductores c
      LEFT JOIN distritos d ON c."distritoId" = d.id
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
      LEFT JOIN distritos d ON c."distritoId" = d.id
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
    const conductores = result.rows.map(row => ({
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
      fotoVehiculo: row.fotoVehiculo,
      estado: row.estado || 'ACTIVO',
      observaciones: row.observaciones,
      certificacionMedica: row.certificado_medico,
      antecedentesPenales: row.antecedentes_penales,
      equipamiento: parseStringArray(row.equipamiento_nemt),
      servicios: parseStringArray(row.servicios_habilitados),
      ubicacionActualLatitud: row.latitud_actual ? parseFloat(row.latitud_actual) : null,
      ubicacionActualLongitud: row.longitud_actual ? parseFloat(row.longitud_actual) : null,
      ultimaActualizacionGPS: row.ultimaUbicacion,
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

    // Procesar archivos si existen
    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'conductores');

    const saveFile = async (file: File, prefix: string) => {
      try {
        await mkdir(uploadDir, { recursive: true });
        const timestamp = Date.now();
        const ext = path.extname(file.name).toLowerCase() || '.jpg';
        const filename = `${prefix}-${timestamp}${ext}`;
        const filepath = path.join(uploadDir, filename);
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));
        return `/uploads/conductores/${filename}`;
      } catch (e) {
        console.error(`❌ Error guardando ${prefix}:`, e);
        return null;
      }
    };

    if (files.foto) {
      body.foto = await saveFile(files.foto, `driver-${body.dni}`);
    }
    if (files.fotoVehiculo) {
      body.fotoVehiculo = await saveFile(files.fotoVehiculo, `vehiculo-${body.dni}`);
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

    // INSERT con nombres EXACTOS de la base de datos real + timestamps
    const insertQuery = `
      INSERT INTO conductores (
        dni, nombres, apellidos, "fechaNacimiento", foto, celular1, celular2, email,
        "estadoCivil", "numeroHijos", "domicilioCompleto", "distritoId",
        "nombreContactoEmergencia", "celularContactoEmergencia", "numeroBrevete",
        "fechaVencimientoBrevete", "marcaVehiculo", "modeloVehiculo", placa,
        "tipoVehiculo", estado, observaciones,
        "fechaIngreso", sexo, "colorAuto", "fotoVehiculo", certificado_medico,
        antecedentes_penales, licencia_categoria, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW(), NOW()
      ) RETURNING id, dni, nombres, apellidos
    `;


    const values = [
      body.dni,
      body.nombres,
      body.apellidos,
      body.fechaNacimiento || null,
      body.foto || null,
      body.celular1,
      body.celular2 || null,
      body.email || null,
      body.estadoCivil || null,
      body.numeroHijos ? parseInt(body.numeroHijos) : 0,
      body.domicilioCompleto || body.direccion || null,
      distritoIdValido,
      body.nombreContactoEmergencia || null,
      body.celularContactoEmergencia || null,
      body.numeroBrevete || null,
      body.fechaVencimientoBrevete || null,
      body.marcaVehiculo || null,
      body.modeloVehiculo || null,
      body.placa || null,
      body.tipoVehiculo || 'SEDAN',
      body.estado || 'ACTIVO',
      body.observaciones || null,
      body.fechaIngreso || new Date().toISOString().split('T')[0],
      body.sexo || 'M',
      body.colorVehiculo || null,
      body.fotoVehiculo || null,
      body.certificacionMedica === 'true' || body.certificacionMedica === true,
      body.antecedentesPenales === 'true' || body.antecedentesPenales === true,
      body.licencia_categoria || 'A-I'
    ];

    const result = await client.query(insertQuery, values);
    const conductor = result.rows[0];

    console.log(`✅ [API-Conductores] Conductor creado: ${conductor.nombres} ${conductor.apellidos} (ID: ${conductor.id})`);

    return NextResponse.json({
      success: true,
      id: conductor.id,
      conductor: conductor,
      message: `Conductor ${conductor.nombres} ${conductor.apellidos} creado exitosamente`
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
