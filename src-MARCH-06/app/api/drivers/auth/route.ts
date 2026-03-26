// ============================================================================
// ZURI NEMT PLATFORM - Driver Authentication API
// POST /api/drivers/auth - Login with DNI + PIN (4 digits) + optional biometrics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { evaluarAprobacionConductor } from '@/domain/entities/Conductor.entity';

const JWT_SECRET = process.env.JWT_SECRET || 'zuri-secret-key-change-this';
const JWT_EXPIRY = '7d'; // 7 días para apps móviles

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

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

// ============================================================================
// CORS Headers para permitir peticiones desde app móvil/web
// ============================================================================
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler para preflight (OPTIONS)
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Helper para respuestas con CORS
function jsonResponse(data: any, options: { status?: number } = {}) {
    return NextResponse.json(data, { ...options, headers: corsHeaders });
}

// ============================================================================
// POST: Login conductor
// ============================================================================
export async function POST(request: NextRequest) {
    let client: Client | null = null;

    try {
        const body = await request.json();
        const { dni, pin, biometricToken, deviceId, devicePlatform, appVersion } = body;

        // Validación básica
        if (!dni || dni.length !== 8) {
            return jsonResponse(
                { success: false, error: 'DNI inválido (debe tener 8 dígitos)' },
                { status: 400 }
            );
        }

        // Requerir PIN o token biométrico
        if (!pin && !biometricToken) {
            return jsonResponse(
                { success: false, error: 'Se requiere PIN o autenticación biométrica' },
                { status: 400 }
            );
        }

        // Validar formato PIN (4 dígitos)
        if (pin && (!/^\d{4}$/.test(pin))) {
            return jsonResponse(
                { success: false, error: 'El PIN debe tener exactamente 4 dígitos' },
                { status: 400 }
            );
        }

        client = new Client(dbConfig);
        await client.connect();

        // Buscar conductor por DNI
        const conductorQuery = await client.query(`
      SELECT 
        c.*,
        d.nombre as distrito_nombre
      FROM conductores c
      LEFT JOIN distritos d ON c."distritoId" = d.id
      WHERE c.dni = $1
    `, [dni]);

        if (conductorQuery.rows.length === 0) {
            return jsonResponse(
                { success: false, error: 'Conductor no encontrado' },
                { status: 404 }
            );
        }

        const c = conductorQuery.rows[0];

        // ========================================
        // VERIFICAR ESTADO DEL CONDUCTOR
        // ========================================

        // 1. Verificar estado de registro (nuevo)
        if (c.estado_registro !== 'APROBADO') {
            const mensajes = {
                'EN_PROCESO': 'Tu registro está en proceso. Completa tu documentación en la app.',
                'PENDIENTE': 'Tu solicitud está en revisión. Te notificaremos cuando sea aprobada.',
                'RECHAZADO': `Tu solicitud fue rechazada. Razón: ${c.razon_rechazo || 'Contacta al administrador'}`
            };

            return jsonResponse({
                success: false,
                error: mensajes[c.estado_registro as keyof typeof mensajes] || 'No estás autorizado para acceder',
                estadoRegistro: c.estado_registro,
                razonRechazo: c.razon_rechazo
            }, { status: 403 });
        }

        // 2. Verificar estado de conductor
        if (c.estado !== 'ACTIVO') {
            return jsonResponse(
                { success: false, error: `Conductor ${c.estado.toLowerCase()}. Contacte al administrador.` },
                { status: 403 }
            );
        }

        // ========================================
        // VERIFICAR BLOQUEO POR INTENTOS FALLIDOS
        // ========================================
        if (c.bloqueado_hasta && new Date(c.bloqueado_hasta) > new Date()) {
            const minutosRestantes = Math.ceil((new Date(c.bloqueado_hasta).getTime() - Date.now()) / 60000);
            return jsonResponse(
                { success: false, error: `Cuenta bloqueada. Intente en ${minutosRestantes} minutos.` },
                { status: 429 }
            );
        }

        // ========================================
        // VERIFICAR PIN
        // ========================================
        if (pin) {
            // Verificar si tiene PIN configurado
            if (!c.pin_hash) {
                return jsonResponse({
                    success: false,
                    error: 'No tiene PIN configurado. Debe registrar su PIN primero.',
                    requiresPinSetup: true
                }, { status: 400 });
            }

            // Comparar PIN con hash
            const isValidPin = await bcrypt.compare(pin, c.pin_hash);

            if (!isValidPin) {
                // Incrementar intentos fallidos
                const newAttempts = (c.intentos_fallidos || 0) + 1;
                const maxAttempts = 5;

                if (newAttempts >= maxAttempts) {
                    // Bloquear por 15 minutos
                    await client.query(`
                        UPDATE conductores SET 
                            intentos_fallidos = $2,
                            bloqueado_hasta = NOW() + INTERVAL '15 minutes'
                        WHERE id = $1
                    `, [c.id, newAttempts]);

                    return jsonResponse({
                        success: false,
                        error: 'Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos.'
                    }, { status: 429 });
                } else {
                    await client.query(`
                        UPDATE conductores SET intentos_fallidos = $2 WHERE id = $1
                    `, [c.id, newAttempts]);

                    return jsonResponse({
                        success: false,
                        error: `PIN incorrecto. ${maxAttempts - newAttempts} intentos restantes.`
                    }, { status: 401 });
                }
            }
        }

        // TODO: Implementar verificación de biometricToken si es necesario

        // ========================================
        // LOGIN EXITOSO
        // ========================================

        // Generar JWT
        const token = sign(
            {
                conductorId: c.id,
                dni: c.dni,
                role: 'driver'
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        // Actualizar información del dispositivo y resetear intentos
        await client.query(`
      UPDATE conductores SET
        intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        ultimo_login = NOW(),
        device_id = COALESCE($2, device_id),
        device_platform = COALESCE($3, device_platform),
        app_version = COALESCE($4, app_version)
      WHERE id = $1
    `, [c.id, deviceId, devicePlatform, appVersion]);

        console.log(`✅ [Driver Auth] Login exitoso: ${c.nombres} ${c.apellidos} (ID: ${c.id})`);

        const aprobacion = evaluarAprobacionConductor({
            dni: c.dni,
            nombres: c.nombres,
            apellidos: c.apellidos,
            celular1: c.celular1,
            placa: c.placa,
            numeroBrevete: c.numeroBrevete,
            estado: c.estado,
            equipamiento: parseStringArray(c.equipamiento_nemt),
            servicios: parseStringArray(c.servicios_habilitados),
        });

        return jsonResponse({
            success: true,
            token,
            conductor: {
                id: c.id,
                dni: c.dni,
                nombres: c.nombres,
                apellidos: c.apellidos,
                nombreCompleto: c.nombreCompleto || `${c.nombres} ${c.apellidos}`.trim(),
                foto: c.foto_url,
                sexo: c.sexo,
                estado: c.estado,
                estadoServicio: c.estadoServicio || c.estadoServicio || 'DESCONECTADO',
                biometriaEnabled: c.biometria_enabled || false,
                contacto: {
                    celular1: c.celular1,
                    celular2: c.celular2,
                    email: c.email
                },
                ubicacion: {
                    distritoId: c.distritoId,
                    distritoNombre: c.distrito_nombre,
                    direccion: c.direccion
                },
                licencia: {
                    numero: c.numeroBrevete,
                    categoria: c.licencia_categoria,
                    vencimiento: c.fecha_vencimiento_licencia,
                    certificacionMedica: c.certificado_medico,
                    antecedentesPenales: c.antecedentes_penales
                },
                vehiculo: {
                    placa: c.placa,
                    marca: c.marcaAuto,
                    modelo: c.modelo,
                    color: c.colorAuto,
                    tipo: c.tipo_vehiculo,
                    foto: c.foto_vehiculo
                },
                app: {
                    version: appVersion || '1.0.0',
                    biometriaEnabled: c.biometria_enabled || false
                },
                aprobacion
            }
        });


    } catch (error: any) {
        console.error('❌ [Driver Auth] Error:', error);
        return jsonResponse(
            { success: false, error: 'Error de autenticación' },
            { status: 500 }
        );
    } finally {
        if (client) await client.end();
    }
}

// ... (GET method update follows similar pattern)
export async function GET(request: NextRequest) {
    let client: Client | null = null;

    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return jsonResponse({ success: false, error: 'Token requerido' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = verify(token, JWT_SECRET);
        } catch (err) {
            return jsonResponse({ success: false, error: 'Token inválido' }, { status: 401 });
        }

        client = new Client(dbConfig);
        await client.connect();

        const result = await client.query(`
      SELECT 
        c.*,
        d.nombre as distrito_nombre
      FROM conductores c
      LEFT JOIN distritos d ON c."distritoId" = d.id
      WHERE c.id = $1
    `, [decoded.conductorId]);

        if (result.rows.length === 0) {
            return jsonResponse({ success: false, error: 'Conductor no encontrado' }, { status: 404 });
        }

        const c = result.rows[0];

        const aprobacion = evaluarAprobacionConductor({
            dni: c.dni,
            nombres: c.nombres,
            apellidos: c.apellidos,
            celular1: c.celular1,
            placa: c.placa,
            numeroBrevete: c.numeroBrevete,
            estado: c.estado,
            equipamiento: parseStringArray(c.equipamiento_nemt),
            servicios: parseStringArray(c.servicios_habilitados),
        });

        return jsonResponse({
            success: true,
            conductor: {
                id: c.id,
                dni: c.dni,
                nombres: c.nombres,
                apellidos: c.apellidos,
                nombreCompleto: c.nombreCompleto || `${c.nombres} ${c.apellidos}`.trim(),
                foto: c.foto_url,
                sexo: c.sexo,
                estado: c.estado,
                estadoServicio: c.estadoServicio || c.estadoServicio || 'DESCONECTADO',
                biometriaEnabled: c.biometria_enabled || false,
                contacto: {
                    celular1: c.celular1,
                    celular2: c.celular2,
                    email: c.email
                },
                ubicacion: {
                    distritoId: c.distritoId,
                    distritoNombre: c.distrito_nombre,
                    direccion: c.direccion
                },
                licencia: {
                    numero: c.numeroBrevete,
                    categoria: c.licencia_categoria,
                    vencimiento: c.fecha_vencimiento_licencia,
                    certificacionMedica: c.certificado_medico,
                    antecedentesPenales: c.antecedentes_penales
                },
                vehiculo: {
                    placa: c.placa,
                    marca: c.marcaAuto,
                    modelo: c.modelo,
                    color: c.colorAuto,
                    tipo: c.tipo_vehiculo,
                    foto: c.foto_vehiculo
                },
                app: {
                    biometriaEnabled: c.biometria_enabled || false,
                    version: c.app_version || '1.0.0'
                },
                aprobacion
            }
        });


    } catch (error: any) {
        console.error('❌ [Driver Auth] Verify error:', error);
        return jsonResponse({ success: false, error: 'Error de verificación' }, { status: 500 });
    } finally {
        if (client) await client.end();
    }
}
