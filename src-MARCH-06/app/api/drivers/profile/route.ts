// ============================================================================
// ZURI NEMT PLATFORM - Driver Profile API
// GET/PATCH driver profile, photo upload, device token
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { verify } from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'zuri-secret-key-change-this';
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

// ============================================================================
// Helper: Extraer conductor del token
// ============================================================================
async function getConductorFromToken(request: NextRequest): Promise<{ conductorId: number } | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = verify(token, JWT_SECRET) as { conductorId: number };
        return decoded;
    } catch {
        return null;
    }
}

// ============================================================================
// GET: Obtener perfil completo del conductor
// ============================================================================
export async function GET(request: NextRequest) {
    let client: Client | null = null;

    try {
        const auth = await getConductorFromToken(request);
        if (!auth) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        client = new Client(dbConfig);
        await client.connect();

        const result = await client.query(`
      SELECT 
        c.*,
        d.nombre AS distrito_nombre
      FROM conductores c
      LEFT JOIN distritos d ON c."distritoId" = d.id
      WHERE c.id = $1
    `, [auth.conductorId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Conductor no encontrado' }, { status: 404 });
        }

        const c = result.rows[0];

        // Normalizar URLs de fotos
        const formatUrl = (url: string | null) => {
            if (!url) return null;
            if (url.startsWith('http')) return url;
            if (url.startsWith('/api/uploads/')) return url;
            if (url.startsWith('/uploads/')) return `/api${url}`;
            return `/api/uploads/conductores/${url}`;
        };

        return NextResponse.json({
            success: true,
            conductor: {
                id: c.id,
                dni: c.dni,
                nombres: c.nombres,
                apellidos: c.apellidos,
                nombreCompleto: c.nombreCompleto || `${c.nombres} ${c.apellidos}`.trim(),
                foto: formatUrl(c.foto || c.foto_url),
                sexo: c.sexo,
                contacto: {
                    celular1: c.celular1,
                    celular2: c.celular2,
                    email: c.email
                },
                personal: {
                    sexo: c.sexo,
                    estadoCivil: c.estadoCivil,
                    fechaNacimiento: c.fecha_nacimiento || c.fechaNacimiento,
                    distrito: c.distrito_nombre,
                    distritoId: c.distritoId
                },
                operativo: {
                    estado: c.estado,
                    estadoServicio: c.estadoServicio || 'DESCONECTADO'
                },
                licencia: {
                    numero: c.numeroBrevete || c.licencia_numero,
                    categoria: c.licencia_categoria,
                    vencimiento: c.fecha_vencimiento_licencia || c.fechaVencimientoBrevete,
                    certificacionMedica: c.certificado_medico,
                    antecedentesPenales: c.antecedentes_penales
                },
                vehiculo: {
                    placa: c.placa,
                    marca: c.marcaAuto || c.marcaVehiculo || c.marca_vehiculo,
                    modelo: c.modelo || c.modeloVehiculo || c.modelo_vehiculo,
                    color: c.colorAuto || c.color_vehiculo,
                    tipo: c.tipo_vehiculo || c.tipoVehiculo,
                    foto: formatUrl(c.fotoVehiculo || c.foto_vehiculo)
                },
                metricas: {
                    totalServicios: parseInt(c.total_servicios) || 0,
                    calificacion: parseFloat(c.calificacion_promedio) || 5.0,
                    totalKilometros: parseFloat(c.total_kilometros) || 0
                },
                app: {
                    biometriaEnabled: c.biometria_enabled || false,
                    version: c.app_version || '1.0.0',
                    ultimoLogin: c.ultimo_login
                }
            }
        });

    } catch (error: any) {
        console.error('❌ [Driver Profile] GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}


// ============================================================================
// PATCH: Actualizar perfil (campos permitidos)
// ============================================================================
export async function PATCH(request: NextRequest) {
    let client: Client | null = null;

    try {
        const auth = await getConductorFromToken(request);
        if (!auth) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const contentType = request.headers.get('content-type') || '';
        let body: any = {};
        let fotoFile: File | null = null;

        // Soporte para multipart/form-data (subida de foto)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            formData.forEach((value, key) => {
                if (value instanceof File) {
                    fotoFile = value;
                } else {
                    body[key] = value.toString();
                }
            });
        } else {
            body = await request.json();
        }

        client = new Client(dbConfig);
        await client.connect();

        // Campos que el conductor puede actualizar
        const camposPermitidos = [
            'celular1', 'celular2', 'email',
            'device_token', 'biometria_enabled', 'app_version',
            'estadoServicio' // Cambiar disponibilidad
        ];

        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Procesar campos permitidos
        for (const campo of camposPermitidos) {
            if (body[campo] !== undefined) {
                // Validación específica por campo
                if (campo === 'estadoServicio') {
                    const estadosPermitidos = ['DISPONIBLE', 'NO_DISPONIBLE', 'DESCONECTADO'];
                    if (!estadosPermitidos.includes(body[campo])) {
                        return NextResponse.json({
                            success: false,
                            error: `Estado inválido. Use: ${estadosPermitidos.join(', ')}`
                        }, { status: 400 });
                    }
                }

                if (campo === 'celular1' && body[campo]) {
                    const celular = body[campo].replace(/\D/g, '');
                    if (celular.length !== 9) {
                        return NextResponse.json({
                            success: false,
                            error: 'Número de celular inválido (debe tener 9 dígitos)'
                        }, { status: 400 });
                    }
                    values.push(celular);
                } else if (campo === 'biometria_enabled') {
                    values.push(body[campo] === 'true' || body[campo] === true);
                } else {
                    values.push(body[campo]);
                }

                updates.push(`"${campo}" = $${paramIndex}`);
                paramIndex++;
            }
        }

        // Procesar foto si se subió
        // IMPORTANTE: Guardar en AMBAS columnas (foto y foto_url)
        // porque el dashboard lee `foto` y la app lee `foto_url`
        if (fotoFile) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'conductores');
            try { await mkdir(uploadDir, { recursive: true }); } catch { }

            const timestamp = Date.now();
            const extension = path.extname(fotoFile.name).toLowerCase() || '.jpg';
            const filename = `driver-${auth.conductorId}-${timestamp}${extension}`;
            const filepath = path.join(uploadDir, filename);

            const bytes = await fotoFile.arrayBuffer();
            await writeFile(filepath, Buffer.from(bytes));

            const fotoUrl = `/uploads/conductores/${filename}`;

            // Escribir en AMBAS columnas
            updates.push(`foto_url = $${paramIndex}`);
            values.push(fotoUrl);
            paramIndex++;

            updates.push(`foto = $${paramIndex}`);
            values.push(fotoUrl);
            paramIndex++;

            console.log(`📸 [Driver Profile] Foto actualizada en ambas columnas: ${fotoUrl}`);
        }

        if (updates.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No hay campos válidos para actualizar'
            }, { status: 400 });
        }

        // Agregar updatedAt
        updates.push(`"updatedAt" = NOW()`);

        // Ejecutar update
        values.push(auth.conductorId);
        await client.query(
            `UPDATE conductores SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
        );

        console.log(`✅ [Driver Profile] Perfil actualizado para conductor ${auth.conductorId}`);

        return NextResponse.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            camposActualizados: updates.length - 1 // -1 por updatedAt
        });

    } catch (error: any) {
        console.error('❌ [Driver Profile] PATCH error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}
