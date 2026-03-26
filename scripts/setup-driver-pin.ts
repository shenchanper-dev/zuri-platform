#!/usr/bin/env npx ts-node
/**
 * Script para configurar PIN de conductor de prueba
 * Uso: npx ts-node scripts/setup-driver-pin.ts <DNI> <PIN>
 * Ejemplo: npx ts-node scripts/setup-driver-pin.ts 08466466 1234
 */

import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

async function setupDriverPin(dni: string, pin: string) {
    // Validaciones
    if (!dni || dni.length !== 8) {
        console.error('❌ DNI debe tener 8 dígitos');
        process.exit(1);
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
        console.error('❌ PIN debe tener 4 dígitos');
        process.exit(1);
    }

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('✅ Conectado a la base de datos');

        // Buscar conductor
        const result = await client.query(
            'SELECT id, nombres, apellidos, pin_hash FROM conductores WHERE dni = $1',
            [dni]
        );

        if (result.rows.length === 0) {
            console.error('❌ Conductor no encontrado con DNI:', dni);
            process.exit(1);
        }

        const conductor = result.rows[0];
        console.log(`📋 Conductor: ${conductor.nombres} ${conductor.apellidos} (ID: ${conductor.id})`);

        if (conductor.pin_hash) {
            console.log('⚠️  Este conductor ya tiene un PIN configurado.');
            console.log('   Se sobrescribirá con el nuevo PIN...');
        }

        // Hash del PIN
        const pinHash = await bcrypt.hash(pin, 10);

        // Actualizar
        await client.query(`
            UPDATE conductores SET 
                pin_hash = $2,
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = $1
        `, [conductor.id, pinHash]);

        console.log('');
        console.log('✅ ¡PIN configurado exitosamente!');
        console.log('');
        console.log('📱 Datos para login en la app:');
        console.log(`   DNI: ${dni}`);
        console.log(`   PIN: ${pin}`);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Obtener argumentos
const args = process.argv.slice(2);
const dni = args[0];
const pin = args[1];

if (!dni || !pin) {
    console.log('');
    console.log('Uso: npx ts-node scripts/setup-driver-pin.ts <DNI> <PIN>');
    console.log('');
    console.log('Ejemplo:');
    console.log('  npx ts-node scripts/setup-driver-pin.ts 08466466 1234');
    console.log('');
    process.exit(1);
}

setupDriverPin(dni, pin);
