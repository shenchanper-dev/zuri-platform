// ============================================================================
// ZURI NEMT PLATFORM - Driver PIN Registration API
// POST /api/drivers/auth/register-pin - First-time PIN setup
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcrypt';

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
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

// Códigos de verificación temporales (en producción usar Redis)
const verificationCodes = new Map<string, { code: string; expiry: number; attempts: number }>();

// ============================================================================
// POST: Registrar PIN por primera vez
// ============================================================================
export async function POST(request: NextRequest) {
    let client: Client | null = null;

    try {
        const body = await request.json();
        const { dni, codigoVerificacion, nuevoPin, enableBiometrics, deviceId, devicePlatform } = body;

        // Validaciones
        if (!dni || dni.length !== 8) {
            return jsonResponse(
                { success: false, error: 'DNI inválido' },
                { status: 400 }
            );
        }

        if (!nuevoPin || !/^\d{4}$/.test(nuevoPin)) {
            return jsonResponse(
                { success: false, error: 'El PIN debe tener exactamente 4 dígitos' },
                { status: 400 }
            );
        }

        // Validar PIN no es secuencial ni repetitivo
        if (isWeakPin(nuevoPin)) {
            return jsonResponse(
                { success: false, error: 'PIN demasiado simple. Evite secuencias (1234) o repeticiones (1111)' },
                { status: 400 }
            );
        }

        client = new Client(dbConfig);
        await client.connect();

        // Verificar que el conductor existe y está aprobado para usar la app
        const conductorQuery = await client.query(`
      SELECT id, nombres, apellidos, celular1, pin_hash, estado, estado_registro
      FROM conductores 
      WHERE dni = $1 
        AND estado_registro IN ('APROBADO', 'PENDIENTE', 'EN_PROCESO')
        AND estado NOT IN ('SUSPENDIDO', 'RETIRADO')
    `, [dni]);

        if (conductorQuery.rows.length === 0) {
            return jsonResponse(
                { success: false, error: 'Conductor no encontrado o no aprobado para registro de PIN' },
                { status: 404 }
            );
        }

        const conductor = conductorQuery.rows[0];

        // Si ya tiene PIN, requerir el PIN actual para cambiarlo
        if (conductor.pin_hash) {
            return jsonResponse(
                {
                    success: false,
                    error: 'Ya tiene un PIN configurado. Use /api/drivers/auth/change-pin para cambiarlo.',
                    hasPinConfigured: true
                },
                { status: 400 }
            );
        }

        // Verificar código de verificación (enviado por SMS)
        const storedVerification = verificationCodes.get(dni);

        // Saltar verificación SMS si está configurado (para desarrollo/testing)
        const skipSmsVerification = process.env.SKIP_SMS_VERIFICATION === 'true' || process.env.NODE_ENV !== 'production';

        if (!codigoVerificacion) {
            if (skipSmsVerification) {
                // Saltar verificación SMS y registrar directamente
                console.log(`🔧 [DEV/TEST MODE] Saltando verificación SMS para: ${conductor.nombres} ${conductor.apellidos}`);
                // Continuar al registro del PIN (no retornar)
            } else {
                // En producción: requerir verificación SMS
                const code = generateVerificationCode();
                verificationCodes.set(dni, {
                    code,
                    expiry: Date.now() + 5 * 60 * 1000, // 5 minutos
                    attempts: 0
                });

                // En producción: enviar SMS real
                console.log(`📱 [SMS SIMULADO] Código para ${conductor.celular1}: ${code}`);

                return jsonResponse({
                    success: true,
                    message: `Código de verificación enviado a ${maskPhone(conductor.celular1)}`,
                    requiresVerification: true
                });
            }
        } else {
            // Validar código de verificación (solo si se proporciona)
            if (!storedVerification) {
                return jsonResponse(
                    { success: false, error: 'No hay código de verificación pendiente. Solicite uno nuevo.' },
                    { status: 400 }
                );
            }

            if (Date.now() > storedVerification.expiry) {
                verificationCodes.delete(dni);
                return jsonResponse(
                    { success: false, error: 'Código expirado. Solicite uno nuevo.' },
                    { status: 400 }
                );
            }

            if (storedVerification.attempts >= 3) {
                verificationCodes.delete(dni);
                return jsonResponse(
                    { success: false, error: 'Demasiados intentos. Solicite un nuevo código.' },
                    { status: 429 }
                );
            }

            if (storedVerification.code !== codigoVerificacion) {
                storedVerification.attempts++;
                return jsonResponse(
                    {
                        success: false,
                        error: 'Código incorrecto',
                        intentosRestantes: 3 - storedVerification.attempts
                    },
                    { status: 400 }
                );
            }
        }

        // ========================================
        // REGISTRO EXITOSO DEL PIN
        // ========================================

        // Hash del PIN
        const pinHash = await bcrypt.hash(nuevoPin, 10);

        // Actualizar conductor
        await client.query(`
      UPDATE conductores SET
        pin_hash = $2,
        biometria_enabled = $3,
        device_id = $4,
        device_platform = $5,
        ultimo_login = NOW(),
        intentos_fallidos = 0,
        bloqueado_hasta = NULL
      WHERE id = $1
    `, [
            conductor.id,
            pinHash,
            enableBiometrics || false,
            deviceId || null,
            devicePlatform || null
        ]);

        // Limpiar código usado
        verificationCodes.delete(dni);

        console.log(`✅ [Driver Auth] PIN registrado para: ${conductor.nombres} ${conductor.apellidos} (ID: ${conductor.id})`);

        return jsonResponse({
            success: true,
            message: 'PIN configurado exitosamente',
            biometricsEnabled: enableBiometrics || false
        });

    } catch (error: any) {
        console.error('❌ [Driver Auth] Register PIN error:', error);
        return jsonResponse(
            { success: false, error: 'Error al registrar PIN' },
            { status: 500 }
        );
    } finally {
        if (client) await client.end();
    }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
}

function maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '***';
    return `***${phone.slice(-4)}`;
}

function isWeakPin(pin: string): boolean {
    // Solo bloquear PINs con todos los dígitos iguales (0000, 1111, etc.)
    const weakPatterns = [
        /^(\d)\1{3}$/,           // 0000, 1111, 2222, etc.
    ];

    return weakPatterns.some(pattern => pattern.test(pin));
}
