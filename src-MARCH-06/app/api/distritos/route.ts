import { NextRequest, NextResponse } from 'next/server';

/**
 * API DISTRITOS PROFESIONAL - ZURI PLATFORM
 * Maneja los 50 distritos de Lima + Callao con autodetección GPS
 * 
 * Endpoints:
 * - GET /api/distritos - Lista todos los distritos
 * - GET /api/distritos?provincia=Lima - Filtrar por provincia
 * - GET /api/distritos?gps=true&lat=-12.04&lon=-77.04 - Autodetección GPS
 * - POST /api/distritos - Crear nuevo distrito
 * - PUT /api/distritos - Actualizar distrito existente
 * - DELETE /api/distritos?id=123 - Desactivar distrito
 * 
 * Versión: 2.0 - Estructura optimizada
 * Autor: Equipo ZURI Platform
 */

interface Distrito {
  id: number;
  nombre: string;
  provincia: string;
  departamento: string;
  latitud: number;
  longitud: number;
  codigo_postal?: string;
  ubigeo?: string;
  activo: boolean;
  zona?: string;
  distancia_km?: number;
  created_at?: string;
  updated_at?: string;
}

interface DistritoResponse {
  success: boolean;
  distritos: Distrito[];
  total: number;
  zona_detectada?: string;
  distrito_cercano?: Distrito;
  error?: string;
  message?: string;
}

/**
 * GET /api/distritos
 * Obtiene lista de distritos con filtros opcionales y autodetección GPS
 */
export async function GET(request: NextRequest) {
  try {
    const { Client } = await import('pg');
    const { searchParams } = new URL(request.url);

    // 1️⃣ LEER PARÁMETROS
    const provincia = searchParams.get('provincia');
    const activo = searchParams.get('activo') !== 'false';
    const gps = searchParams.get('gps') === 'true';
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // Conexión a base de datos
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // 2️⃣ AUTODETECCIÓN GPS (ANTES de la consulta normal)
    if (gps && lat && lon) {
      try {
        const latitud = parseFloat(lat);
        const longitud = parseFloat(lon);

        // Validación de coordenadas GPS
        if (!latitud || !longitud || isNaN(latitud) || isNaN(longitud)) {
          await client.end();
          return NextResponse.json({
            success: false,
            error: 'Coordenadas GPS inválidas',
            distritos: [],
            total: 0
          }, { status: 400 });
        }

        // Validar coordenadas para Lima Metropolitana
        if (latitud < -13 || latitud > -11 || longitud < -78 || longitud > -76) {
          await client.end();
          return NextResponse.json({
            success: false,
            error: 'Coordenadas fuera del rango de Lima Metropolitana',
            distritos: [],
            total: 0
          }, { status: 400 });
        }

        // Buscar distrito más cercano usando función SQL
        const resultadoGPS = await client.query(`
          SELECT * FROM encontrar_distrito_por_gps($1, $2)
        `, [latitud, longitud]);

        const distritoDetectado = resultadoGPS.rows[0];

        if (distritoDetectado) {
          // Obtener información completa del distrito detectado
          const distritoCompleto = await client.query(`
            SELECT 
              id, nombre, provincia, departamento, latitud, longitud, 
              codigo_postal, ubigeo, activo, created_at, updated_at,
              CASE 
                WHEN provincia = 'Lima' THEN 'LIMA_METROPOLITANA'
                WHEN provincia = 'Callao' THEN 'CALLAO'
                ELSE 'OTRO'
              END as zona
            FROM distritos 
            WHERE id = $1 AND activo = TRUE
          `, [distritoDetectado.distrito_id]);

          await client.end();

          // SALIR AQUÍ si hay resultado GPS válido
          return NextResponse.json({
            success: true,
            distritos: distritoCompleto.rows,
            total: 1,
            zona_detectada: distritoCompleto.rows[0]?.zona,
            distrito_cercano: {
              ...distritoCompleto.rows[0],
              distancia_km: Math.round(distritoDetectado.distancia * 100) / 100
            }
          });
        }
      } catch (gpsError) {
        console.error('Error en autodetección GPS:', gpsError);
        // CONTINUAR con consulta normal si falla GPS
      }
    }

    // 3️⃣ CONSULTA NORMAL DE DISTRITOS (si no hay GPS o falla)
    let query = `
      SELECT 
        id, nombre, provincia, departamento, 
        latitud, longitud, codigo_postal, ubigeo, activo,
        created_at, updated_at,
        CASE 
          WHEN provincia = 'Lima' THEN 'LIMA_METROPOLITANA'
          WHEN provincia = 'Callao' THEN 'CALLAO'
          ELSE 'OTRO'
        END as zona
      FROM distritos 
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filtro por provincia
    if (provincia) {
      query += ` AND UPPER(provincia) = UPPER($${params.length + 1})`;
      params.push(provincia);
    }

    // Filtro por estado activo
    if (activo !== undefined) {
      query += ` AND activo = $${params.length + 1}`;
      params.push(activo);
    }

    // Ordenamiento
    query += ` ORDER BY provincia ASC, nombre ASC`;

    // Ejecutar consulta
    const result = await client.query(query, params);
    await client.end();

    // Formatear respuesta

    // Formatear respuesta
    let distritos: Distrito[] = result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      provincia: row.provincia,
      departamento: row.departamento,
      latitud: parseFloat(row.latitud),
      longitud: parseFloat(row.longitud),
      codigo_postal: row.codigo_postal,
      ubigeo: row.ubigeo,
      activo: row.activo,
      zona: row.zona,
      created_at: row.created_at?.toISOString(),
      updated_at: row.updated_at?.toISOString()
    }));

    // FALLBACK SI NO HAY DATOS: LIMA METROPOLITANA + CALLAO
    if (distritos.length === 0) {
      console.warn('⚠️ Base de datos de distritos vacía. Usando fallback hardcoded.');
      const FALLBACK_DISTRITOS = [
        // LIMA (43)
        { id: 1, nombre: 'Lima', provincia: 'Lima' }, { id: 2, nombre: 'Ancón', provincia: 'Lima' }, { id: 3, nombre: 'Ate', provincia: 'Lima' },
        { id: 4, nombre: 'Barranco', provincia: 'Lima' }, { id: 5, nombre: 'Breña', provincia: 'Lima' }, { id: 6, nombre: 'Carabayllo', provincia: 'Lima' },
        { id: 7, nombre: 'Chaclacayo', provincia: 'Lima' }, { id: 8, nombre: 'Chorrillos', provincia: 'Lima' }, { id: 9, nombre: 'Cieneguilla', provincia: 'Lima' },
        { id: 10, nombre: 'Comas', provincia: 'Lima' }, { id: 11, nombre: 'El Agustino', provincia: 'Lima' }, { id: 12, nombre: 'Independencia', provincia: 'Lima' },
        { id: 13, nombre: 'Jesús María', provincia: 'Lima' }, { id: 14, nombre: 'La Molina', provincia: 'Lima' }, { id: 15, nombre: 'La Victoria', provincia: 'Lima' },
        { id: 16, nombre: 'Lince', provincia: 'Lima' }, { id: 17, nombre: 'Los Olivos', provincia: 'Lima' }, { id: 18, nombre: 'Lurigancho-Chosica', provincia: 'Lima' },
        { id: 19, nombre: 'Lurín', provincia: 'Lima' }, { id: 20, nombre: 'Magdalena del Mar', provincia: 'Lima' }, { id: 21, nombre: 'Miraflores', provincia: 'Lima' },
        { id: 22, nombre: 'Pachacámac', provincia: 'Lima' }, { id: 23, nombre: 'Pucusana', provincia: 'Lima' }, { id: 24, nombre: 'Pueblo Libre', provincia: 'Lima' },
        { id: 25, nombre: 'Puente Piedra', provincia: 'Lima' }, { id: 26, nombre: 'Punta Hermosa', provincia: 'Lima' }, { id: 27, nombre: 'Punta Negra', provincia: 'Lima' },
        { id: 28, nombre: 'Rímac', provincia: 'Lima' }, { id: 29, nombre: 'San Bartolo', provincia: 'Lima' }, { id: 30, nombre: 'San Borja', provincia: 'Lima' },
        { id: 31, nombre: 'San Isidro', provincia: 'Lima' }, { id: 32, nombre: 'San Juan de Lurigancho', provincia: 'Lima' }, { id: 33, nombre: 'San Juan de Miraflores', provincia: 'Lima' },
        { id: 34, nombre: 'San Luis', provincia: 'Lima' }, { id: 35, nombre: 'San Martín de Porres', provincia: 'Lima' }, { id: 36, nombre: 'San Miguel', provincia: 'Lima' },
        { id: 37, nombre: 'Santa Anita', provincia: 'Lima' }, { id: 38, nombre: 'Santa María del Mar', provincia: 'Lima' }, { id: 39, nombre: 'Santa Rosa', provincia: 'Lima' },
        { id: 40, nombre: 'Santiago de Surco', provincia: 'Lima' }, { id: 41, nombre: 'Surquillo', provincia: 'Lima' }, { id: 42, nombre: 'Villa El Salvador', provincia: 'Lima' },
        { id: 43, nombre: 'Villa María del Triunfo', provincia: 'Lima' },
        // CALLAO (7)
        { id: 44, nombre: 'Callao', provincia: 'Callao' }, { id: 45, nombre: 'Bellavista', provincia: 'Callao' }, { id: 46, nombre: 'Carmen de la Legua-Reynoso', provincia: 'Callao' },
        { id: 47, nombre: 'La Perla', provincia: 'Callao' }, { id: 48, nombre: 'La Punta', provincia: 'Callao' }, { id: 49, nombre: 'Mi Perú', provincia: 'Callao' },
        { id: 50, nombre: 'Ventanilla', provincia: 'Callao' }
      ].map(d => ({
        id: d.id,
        nombre: d.nombre,
        provincia: d.provincia,
        departamento: 'Lima',
        latitud: -12.0464, // Default center
        longitud: -77.0428,
        activo: true,
        zona: d.provincia === 'Lima' ? 'LIMA_METROPOLITANA' : 'CALLAO'
      }));

      // Aplicar filtros básicos al fallback
      distritos = FALLBACK_DISTRITOS.filter(d => {
        if (provincia && d.provincia.toUpperCase() !== provincia.toUpperCase()) return false;
        return true;
      }) as Distrito[];
    }

    const response: DistritoResponse = {
      success: true,
      distritos,
      total: distritos.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en API distritos:', error);

    // FALLBACK ROBUSTO: Si falla la conexión a BD, retornar distritos hardcoded
    console.warn('⚠️ Usando fallback hardcoded por error de DB.');
    const FALLBACK_DISTRITOS = [
      // LIMA (43)
      { id: 1, nombre: 'Lima', provincia: 'Lima' }, { id: 2, nombre: 'Ancón', provincia: 'Lima' }, { id: 3, nombre: 'Ate', provincia: 'Lima' },
      { id: 4, nombre: 'Barranco', provincia: 'Lima' }, { id: 5, nombre: 'Breña', provincia: 'Lima' }, { id: 6, nombre: 'Carabayllo', provincia: 'Lima' },
      { id: 7, nombre: 'Chaclacayo', provincia: 'Lima' }, { id: 8, nombre: 'Chorrillos', provincia: 'Lima' }, { id: 9, nombre: 'Cieneguilla', provincia: 'Lima' },
      { id: 10, nombre: 'Comas', provincia: 'Lima' }, { id: 11, nombre: 'El Agustino', provincia: 'Lima' }, { id: 12, nombre: 'Independencia', provincia: 'Lima' },
      { id: 13, nombre: 'Jesús María', provincia: 'Lima' }, { id: 14, nombre: 'La Molina', provincia: 'Lima' }, { id: 15, nombre: 'La Victoria', provincia: 'Lima' },
      { id: 16, nombre: 'Lince', provincia: 'Lima' }, { id: 17, nombre: 'Los Olivos', provincia: 'Lima' }, { id: 18, nombre: 'Lurigancho-Chosica', provincia: 'Lima' },
      { id: 19, nombre: 'Lurín', provincia: 'Lima' }, { id: 20, nombre: 'Magdalena del Mar', provincia: 'Lima' }, { id: 21, nombre: 'Miraflores', provincia: 'Lima' },
      { id: 22, nombre: 'Pachacámac', provincia: 'Lima' }, { id: 23, nombre: 'Pucusana', provincia: 'Lima' }, { id: 24, nombre: 'Pueblo Libre', provincia: 'Lima' },
      { id: 25, nombre: 'Puente Piedra', provincia: 'Lima' }, { id: 26, nombre: 'Punta Hermosa', provincia: 'Lima' }, { id: 27, nombre: 'Punta Negra', provincia: 'Lima' },
      { id: 28, nombre: 'Rímac', provincia: 'Lima' }, { id: 29, nombre: 'San Bartolo', provincia: 'Lima' }, { id: 30, nombre: 'San Borja', provincia: 'Lima' },
      { id: 31, nombre: 'San Isidro', provincia: 'Lima' }, { id: 32, nombre: 'San Juan de Lurigancho', provincia: 'Lima' }, { id: 33, nombre: 'San Juan de Miraflores', provincia: 'Lima' },
      { id: 34, nombre: 'San Luis', provincia: 'Lima' }, { id: 35, nombre: 'San Martín de Porres', provincia: 'Lima' }, { id: 36, nombre: 'San Miguel', provincia: 'Lima' },
      { id: 37, nombre: 'Santa Anita', provincia: 'Lima' }, { id: 38, nombre: 'Santa María del Mar', provincia: 'Lima' }, { id: 39, nombre: 'Santa Rosa', provincia: 'Lima' },
      { id: 40, nombre: 'Santiago de Surco', provincia: 'Lima' }, { id: 41, nombre: 'Surquillo', provincia: 'Lima' }, { id: 42, nombre: 'Villa El Salvador', provincia: 'Lima' },
      { id: 43, nombre: 'Villa María del Triunfo', provincia: 'Lima' },
      // CALLAO (7)
      { id: 44, nombre: 'Callao', provincia: 'Callao' }, { id: 45, nombre: 'Bellavista', provincia: 'Callao' }, { id: 46, nombre: 'Carmen de la Legua-Reynoso', provincia: 'Callao' },
      { id: 47, nombre: 'La Perla', provincia: 'Callao' }, { id: 48, nombre: 'La Punta', provincia: 'Callao' }, { id: 49, nombre: 'Mi Perú', provincia: 'Callao' },
      { id: 50, nombre: 'Ventanilla', provincia: 'Callao' }
    ].map(d => ({
      id: d.id,
      nombre: d.nombre,
      provincia: d.provincia,
      departamento: 'Lima',
      latitud: -12.0464,
      longitud: -77.0428,
      activo: true,
      zona: d.provincia === 'Lima' ? 'LIMA_METROPOLITANA' : 'CALLAO'
    })) as any[];

    return NextResponse.json({
      success: true,
      error: 'Error de conexión a DB, usando datos locales',
      distritos: FALLBACK_DISTRITOS,
      total: FALLBACK_DISTRITOS.length
    });
  }
}

/**
 * POST /api/distritos
 * Crear nuevo distrito (solo para administradores)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, provincia, departamento, latitud, longitud, codigo_postal, ubigeo } = body;

    // Validaciones de entrada
    if (!nombre?.trim() || !provincia?.trim() || !departamento?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Campos requeridos: nombre, provincia, departamento'
      }, { status: 400 });
    }

    if (!latitud || !longitud || isNaN(parseFloat(latitud)) || isNaN(parseFloat(longitud))) {
      return NextResponse.json({
        success: false,
        error: 'Coordenadas de latitud y longitud son requeridas y deben ser números válidos'
      }, { status: 400 });
    }

    const lat = parseFloat(latitud);
    const lon = parseFloat(longitud);

    // Validar coordenadas para Lima Metropolitana
    if (lat < -13 || lat > -11 || lon < -78 || lon > -76) {
      return NextResponse.json({
        success: false,
        error: 'Las coordenadas deben estar dentro del rango de Lima Metropolitana'
      }, { status: 400 });
    }

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // Verificar si ya existe un distrito con el mismo nombre y provincia
    const existingDistrict = await client.query(`
      SELECT id, nombre, provincia 
      FROM distritos 
      WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($1)) 
        AND UPPER(TRIM(provincia)) = UPPER(TRIM($2))
    `, [nombre, provincia]);

    if (existingDistrict.rows.length > 0) {
      await client.end();
      return NextResponse.json({
        success: false,
        error: `Ya existe un distrito "${nombre}" en la provincia "${provincia}"`
      }, { status: 409 }); // 409 Conflict
    }

    // Insertar nuevo distrito
    const result = await client.query(`
      INSERT INTO distritos (
        nombre, provincia, departamento, latitud, longitud, 
        codigo_postal, ubigeo, activo, created_at, updated_at
      ) VALUES (
        TRIM($1), TRIM($2), TRIM($3), $4, $5, $6, $7, TRUE, NOW(), NOW()
      )
      RETURNING *
    `, [nombre, provincia, departamento, lat, lon, codigo_postal, ubigeo]);

    await client.end();

    // Formatear respuesta
    const distritoCreado = {
      ...result.rows[0],
      latitud: parseFloat(result.rows[0].latitud),
      longitud: parseFloat(result.rows[0].longitud),
      created_at: result.rows[0].created_at?.toISOString(),
      updated_at: result.rows[0].updated_at?.toISOString()
    };

    return NextResponse.json({
      success: true,
      distrito: distritoCreado,
      message: `Distrito "${nombre}" creado exitosamente`
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear distrito:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor al crear distrito'
    }, { status: 500 });
  }
}

/**
 * PUT /api/distritos
 * Actualizar distrito existente (solo para administradores)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nombre, provincia, departamento, latitud, longitud, codigo_postal, ubigeo, activo } = body;

    // Validación ID requerido
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        success: false,
        error: 'ID del distrito es requerido y debe ser un número válido'
      }, { status: 400 });
    }

    // Validar coordenadas si se proporcionan
    if ((latitud !== undefined && isNaN(parseFloat(latitud))) ||
      (longitud !== undefined && isNaN(parseFloat(longitud)))) {
      return NextResponse.json({
        success: false,
        error: 'Las coordenadas deben ser números válidos'
      }, { status: 400 });
    }

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // Verificar que el distrito existe
    const existing = await client.query(`
      SELECT id, nombre, provincia 
      FROM distritos 
      WHERE id = $1
    `, [id]);

    if (existing.rows.length === 0) {
      await client.end();
      return NextResponse.json({
        success: false,
        error: 'Distrito no encontrado'
      }, { status: 404 });
    }

    // Validar coordenadas para Lima si se están actualizando
    const lat = latitud ? parseFloat(latitud) : null;
    const lon = longitud ? parseFloat(longitud) : null;

    if ((lat && (lat < -13 || lat > -11)) || (lon && (lon < -78 || lon > -76))) {
      await client.end();
      return NextResponse.json({
        success: false,
        error: 'Las coordenadas deben estar dentro del rango de Lima Metropolitana'
      }, { status: 400 });
    }

    // Actualizar distrito usando COALESCE para mantener valores existentes
    const result = await client.query(`
      UPDATE distritos SET 
        nombre = COALESCE(NULLIF(TRIM($2), ''), nombre),
        provincia = COALESCE(NULLIF(TRIM($3), ''), provincia),
        departamento = COALESCE(NULLIF(TRIM($4), ''), departamento),
        latitud = COALESCE($5, latitud),
        longitud = COALESCE($6, longitud),
        codigo_postal = COALESCE($7, codigo_postal),
        ubigeo = COALESCE($8, ubigeo),
        activo = COALESCE($9, activo),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, nombre, provincia, departamento, lat, lon, codigo_postal, ubigeo, activo]);

    await client.end();

    // Formatear respuesta
    const distritoActualizado = {
      ...result.rows[0],
      latitud: parseFloat(result.rows[0].latitud),
      longitud: parseFloat(result.rows[0].longitud),
      created_at: result.rows[0].created_at?.toISOString(),
      updated_at: result.rows[0].updated_at?.toISOString()
    };

    return NextResponse.json({
      success: true,
      distrito: distritoActualizado,
      message: `Distrito "${result.rows[0].nombre}" actualizado exitosamente`
    });

  } catch (error) {
    console.error('Error al actualizar distrito:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor al actualizar distrito'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/distritos?id=123
 * Desactivar distrito (soft delete) - solo para administradores
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validación ID requerido
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        success: false,
        error: 'ID del distrito es requerido y debe ser un número válido'
      }, { status: 400 });
    }

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();

    // Verificar que el distrito existe y está activo
    const existing = await client.query(`
      SELECT id, nombre, provincia, activo 
      FROM distritos 
      WHERE id = $1
    `, [id]);

    if (existing.rows.length === 0) {
      await client.end();
      return NextResponse.json({
        success: false,
        error: 'Distrito no encontrado'
      }, { status: 404 });
    }

    if (!existing.rows[0].activo) {
      await client.end();
      return NextResponse.json({
        success: false,
        error: 'El distrito ya está desactivado'
      }, { status: 400 });
    }

    // Desactivar distrito (soft delete)
    const result = await client.query(`
      UPDATE distritos SET 
        activo = FALSE,
        updated_at = NOW()
      WHERE id = $1
      RETURNING nombre, provincia
    `, [id]);

    await client.end();

    return NextResponse.json({
      success: true,
      message: `Distrito "${result.rows[0].nombre}, ${result.rows[0].provincia}" desactivado exitosamente`,
      distrito_desactivado: {
        id: parseInt(id),
        nombre: result.rows[0].nombre,
        provincia: result.rows[0].provincia,
        activo: false
      }
    });

  } catch (error) {
    console.error('Error al eliminar distrito:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor al eliminar distrito'
    }, { status: 500 });
  }
}
