// ============================================================================
// ZURI NEMT PLATFORM - Driver PIN Reset API
// POST /api/drivers/auth/reset-pin - Reset forgotten PIN
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcrypt';

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

function jsonResponse(data: any, options: { status?: number } = {}) {
    return NextResponse.json(data, { ...options, headers: corsHeaders });
}

// ============================================================================
// PIN Validation Rules
// ============================================================================
function validatePin(pin: string): { valid: boolean; message: string } {
    if (!/^\d{4}$/.test(pin)) {
        return { valid: false, message: 'El PIN debe tener exactamente 4 dígitos' };
    }

    // Block 1234 (most common)
    if (pin === '1234') {
        return { valid: false, message: 'El PIN 1234 es demasiado común. Elige otro.' };
    }

    // Block all same digits: 0000, 1111, 2222, etc.
    if (/^(\d)\1{3}$/.test(pin)) {
        return { valid: false, message: 'No usar dígitos repetidos (ej: 1111, 2222). Prueba combinar pares como 2233 o 6677.' };
    }

    return { valid: true, message: '' };
}

// ============================================================================
// POST: Reset PIN (forgot PIN flow)
// Steps:
//   1. Send { dni, celular } → validates identity, returns confirmation
//   2. Send { dni, celular, nuevoPin, confirmarPin } → resets PIN
// ============================================================================
export async function POST(request: NextRequest) {
    let client: Client | null = null;

    try {
        const body = await request.json();
        const { dni, celular, nuevoPin, confirmarPin, step } = body;

        // Validate DNI
        if (!dni || dni.length !== 8) {
            return jsonResponse(
                { success: false, error: 'DNI inválido (debe tener 8 dígitos)' },
                { status: 400 }
            );
        }

        client = new Client(dbConfig);
        await client.connect();

        // Find conductor
        const result = await client.query(`
            SELECT id, nombres, apellidos, celular1, pin_hash, estado, estado_registro
            FROM conductores
            WHERE dni = $1
              AND estado_registro IN ('APROBADO', 'PENDIENTE', 'EN_PROCESO')
              AND estado NOT IN ('SUSPENDIDO', 'RETIRADO')
        `, [dni]);

        if (result.rows.length === 0) {
            return jsonResponse(
                { success: false, error: 'No se encontró un conductor con este DNI' },
                { status: 404 }
            );
        }

        const conductor = result.rows[0];

        // Verify conductor is not suspended (handled in query, but good to be explicit)
        if (conductor.estado === 'SUSPENDIDO' || conductor.estado === 'RETIRADO') {
            return jsonResponse(
                { success: false, error: 'Tu cuenta no está habilitada. Contacta al administrador.' },
                { status: 403 }
            );
        }

        // ========================================
        // STEP 1: Verify identity (DNI + celular)
        // ========================================
        if (step === 'verify' || !nuevoPin) {
            if (!celular) {
                return jsonResponse(
                    { success: false, error: 'Ingresa tu número de celular registrado para verificar tu identidad' },
                    { status: 400 }
                );
            }

            // Check if celular matches (last 4 digits for security)
            const storedPhone = (conductor.celular1 || '').replace(/\D/g, '');
            const inputPhone = celular.replace(/\D/g, '');

            // Match full number or last 9 digits
            const match = storedPhone === inputPhone ||
                storedPhone.slice(-9) === inputPhone.slice(-9);

            if (!match) {
                return jsonResponse(
                    { success: false, error: 'El número de celular no coincide con el registrado' },
                    { status: 400 }
                );
            }

            return jsonResponse({
                success: true,
                message: `Identidad verificada. Hola ${conductor.nombres}, ahora crea tu nuevo PIN.`,
                verified: true,
                conductorNombre: conductor.nombres
            });
        }

        // ========================================
        // STEP 2: Set new PIN
        // ========================================
        if (!nuevoPin) {
            return jsonResponse(
                { success: false, error: 'Ingresa tu nuevo PIN' },
                { status: 400 }
            );
        }

        // Verify celular again for security
        if (!celular) {
            return jsonResponse(
                { success: false, error: 'Se requiere verificar el celular nuevamente' },
                { status: 400 }
            );
        }

        const storedPhone = (conductor.celular1 || '').replace(/\D/g, '');
        const inputPhone = celular.replace(/\D/g, '');
        const phoneMatch = storedPhone === inputPhone ||
            storedPhone.slice(-9) === inputPhone.slice(-9);

        if (!phoneMatch) {
            return jsonResponse(
                { success: false, error: 'Verificación de identidad fallida' },
                { status: 400 }
            );
        }

        // Validate PIN
        const pinValidation = validatePin(nuevoPin);
        if (!pinValidation.valid) {
            return jsonResponse(
                { success: false, error: pinValidation.message },
                { status: 400 }
            );
        }

        // Confirm PIN matches
        if (confirmarPin && nuevoPin !== confirmarPin) {
            return jsonResponse(
                { success: false, error: 'Los PINs no coinciden' },
                { status: 400 }
            );
        }

        // Hash and save new PIN
        const pinHash = await bcrypt.hash(nuevoPin, 10);

        await client.query(`
            UPDATE conductores SET
                pin_hash = $2,
                intentos_fallidos = 0,
                bloqueado_hasta = NULL,
                "updatedAt" = NOW()
            WHERE id = $1
        `, [conductor.id, pinHash]);

        console.log(`🔑 [Driver Auth] PIN resetado para: ${conductor.nombres} ${conductor.apellidos} (ID: ${conductor.id})`);

        return jsonResponse({
            success: true,
            message: '¡PIN actualizado! Ya puedes iniciar sesión con tu nuevo PIN.',
        });

    } catch (error: any) {
        console.error('❌ [Driver Auth] Reset PIN error:', error);
        return jsonResponse(
            { success: false, error: 'Error al resetar el PIN' },
            { status: 500 }
        );
    } finally {
        if (client) await client.end();
    }
}
