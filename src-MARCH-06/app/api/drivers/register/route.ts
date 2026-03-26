/**
 * API: POST /api/drivers/register
 * Driver self-registration from mobile app
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcrypt';

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

interface RegistrationData {
    // Personal
    dni: string;
    nombres: string;
    apellidos: string;
    sexo?: 'M' | 'F';
    fechaNacimiento?: string;

    // Dirección
    direccion?: string;
    distritoId?: number;

    // Contacto
    email: string;
    celular1: string;
    celular2?: string;

    // Licencia
    numeroLicencia?: string;
    categoriaLicencia?: string;
    vencimientoLicencia?: string;
    sinAntecedentes?: boolean;

    // Vehículo
    placa?: string;
    marcaVehiculo?: string;
    modeloVehiculo?: string;
    añoVehiculo?: number;
    tipoVehiculo?: string;
    colorVehiculo?: string;

    // T&C
    terminosAceptados: boolean;
    versionTerminos?: string;
}

export async function POST(request: NextRequest) {
    const client = new Client(dbConfig);

    try {
        const data: RegistrationData = await request.json();

        // Validaciones básicas
        if (!data.dni || !data.email || !data.celular1 || !data.nombres || !data.apellidos) {
            return NextResponse.json(
                { error: 'Campos obligatorios faltantes: dni, email, celular1, nombres, apellidos' },
                { status: 400 }
            );
        }

        if (!data.terminosAceptados) {
            return NextResponse.json(
                { error: 'Debes aceptar los términos y condiciones' },
                { status: 400 }
            );
        }

        // Validar formato DNI (8 dígitos)
        if (!/^\d{8}$/.test(data.dni)) {
            return NextResponse.json(
                { error: 'DNI debe tener 8 dígitos' },
                { status: 400 }
            );
        }

        // Validar email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            return NextResponse.json(
                { error: 'Email inválido' },
                { status: 400 }
            );
        }

        await client.connect();

        // Verificar si el DNI, email, celular o placa ya existen
        const existeQuery = `
      SELECT dni, email, celular1, placa 
      FROM conductores 
      WHERE dni = $1 OR email = $2 OR celular1 = $3 OR (placa IS NOT NULL AND placa = $4)
    `;
        const existeResult = await client.query(existeQuery, [
            data.dni,
            data.email,
            data.celular1,
            data.placa || null
        ]);

        if (existeResult.rows.length > 0) {
            const existe = existeResult.rows[0];
            if (existe.dni === data.dni) {
                return NextResponse.json(
                    { error: 'Ya existe un conductor registrado con este DNI' },
                    { status: 409 }
                );
            }
            if (existe.email === data.email) {
                return NextResponse.json(
                    { error: 'Ya existe un conductor registrado con este email' },
                    { status: 409 }
                );
            }
            if (existe.celular1 === data.celular1) {
                return NextResponse.json(
                    { error: 'Ya existe un conductor registrado con este número de celular' },
                    { status: 409 }
                );
            }
            if (data.placa && existe.placa === data.placa) {
                return NextResponse.json(
                    { error: 'Ya existe un conductor registrado con esta placa de vehículo' },
                    { status: 409 }
                );
            }
        }

        // Generar código de verificación de email (6 dígitos)
        const codigoEmail = Math.floor(100000 + Math.random() * 900000).toString();
        const expiracionCodigo = new Date();
        expiracionCodigo.setHours(expiracionCodigo.getHours() + 24); // Válido por 24 horas

        // Crear conductor - ESCRIBIR EN AMBOS sets de columnas
        // La DB tiene columnas duplicadas (snake_case y camelCase).
        // El dashboard lee: numeroBrevete, marcaVehiculo, modeloVehiculo, colorAuto, foto
        // La app escribe: licencia_numero, marca_vehiculo, modelo_vehiculo, color_vehiculo, foto_url
        // AMBOS se deben poblar para consistencia total.
        const insertQuery = `
      INSERT INTO conductores (
        dni, nombres, apellidos, "nombreCompleto", sexo, "fechaNacimiento",
        direccion, "distritoId",
        email, celular1, celular2,
        licencia_numero, "numeroBrevete", licencia_categoria, fecha_vencimiento_licencia, antecedentes_penales,
        placa, marca_vehiculo, "marcaVehiculo", modelo_vehiculo, "modeloVehiculo", tipo_vehiculo, "tipoVehiculo",
        año_vehiculo, color_vehiculo, "colorAuto",
        estado_registro, fecha_registro,
        email_verificado, codigo_verificacion_email, expiracion_codigo_email,
        terminos_aceptados, fecha_aceptacion_terminos, version_terminos,
        estado, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8,
        $9, $10, $11,
        $12, $12, $13, $14, $15,
        $16, $17, $17, $18, $18, $19, $19,
        $20, $21, $21,
        'EN_PROCESO', NOW(),
        false, $22, $23,
        true, NOW(), $24,
        'INACTIVO', NOW(), NOW()
      )
      RETURNING id, dni, nombres, apellidos, email, estado_registro
    `;

        const values = [
            data.dni,                         // $1
            data.nombres,                     // $2
            data.apellidos,                   // $3
            `${data.nombres} ${data.apellidos}`, // $4
            data.sexo || null,                // $5
            data.fechaNacimiento || null,      // $6
            data.direccion || null,            // $7
            data.distritoId || null,           // $8
            data.email,                        // $9
            data.celular1,                     // $10
            data.celular2 || null,             // $11
            data.numeroLicencia || null,        // $12 → licencia_numero Y numeroBrevete
            data.categoriaLicencia || null,     // $13
            data.vencimientoLicencia || null,   // $14
            data.sinAntecedentes ?? false,      // $15
            data.placa || null,                // $16
            data.marcaVehiculo || null,         // $17 → marca_vehiculo Y marcaVehiculo
            data.modeloVehiculo || null,        // $18 → modelo_vehiculo Y modeloVehiculo
            data.tipoVehiculo || null,          // $19 → tipo_vehiculo Y tipoVehiculo
            data.añoVehiculo || null,           // $20
            data.colorVehiculo || null,         // $21 → color_vehiculo Y colorAuto
            codigoEmail,                        // $22
            expiracionCodigo,                   // $23
            data.versionTerminos || '1.0'       // $24
        ];

        const result = await client.query(insertQuery, values);
        const conductor = result.rows[0];

        console.log(`✅ [Driver Registration] Nuevo conductor registrado: ${conductor.nombres} ${conductor.apellidos} (ID: ${conductor.id})`);

        // Enviar email con código de verificación
        const { sendVerificationCodeEmail } = await import('@/lib/notifications');
        await sendVerificationCodeEmail(data.email, data.nombres, codigoEmail);

        return NextResponse.json({
            success: true,
            conductorId: conductor.id,
            mensaje: 'Registro completado. Por favor verifica tu email.',
            estadoRegistro: 'EN_PROCESO',
            codigoVerificacion: codigoEmail // TODO: Remover en producción
        });

    } catch (error: any) {
        console.error('❌ [Driver Registration] Error:', error);
        return NextResponse.json(
            { error: 'Error al registrar conductor', detalle: error.message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
