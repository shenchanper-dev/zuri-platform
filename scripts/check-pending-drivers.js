/**
 * Updated check-pending-drivers script using FREE email service
 */

const { Client } = require('pg');
const {
    sendRegistrationWarningDay20,
    sendRegistrationWarningDay25,
    sendRegistrationWarningDay28,
    sendRejectionNotification
} = require('../dist/lib/notifications');

const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
};

function getFechaLimite(fechaRegistro) {
    const fecha = new Date(fechaRegistro);
    fecha.setDate(fecha.getDate() + 30);
    return fecha.toLocaleDateString('es-PE');
}

async function checkPendingDrivers() {
    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('🔍 Verificando conductores pendientes...');

        // 1. ADVERTENCIA DÍA 20
        const warning20 = await client.query(`
      SELECT id, nombres, apellidos, email, celular1, fecha_registro,
             advertencias_enviadas, ultima_advertencia_tipo
      FROM conductores
      WHERE estado_registro IN ('EN_PROCESO', 'PENDIENTE')
        AND fecha_registro >= NOW() - INTERVAL '21 days'
        AND fecha_registro < NOW() - INTERVAL '20 days'
        AND (ultima_advertencia_tipo IS NULL OR ultima_advertencia_tipo != 'DIA_20')
    `);

        console.log(`⚠️  Advertencias día 20: ${warning20.rows.length} conductores`);

        for (const c of warning20.rows) {
            const fechaLimite = getFechaLimite(c.fecha_registro);
            const nombreCompleto = `${c.nombres} ${c.apellidos}`;

            const result = await sendRegistrationWarningDay20(
                nombreCompleto,
                c.email,
                c.celular1,
                fechaLimite
            );

            if (result.success) {
                await client.query(`
          UPDATE conductores
          SET advertencias_enviadas = advertencias_enviadas + 1,
              ultima_advertencia_fecha = NOW(),
              ultima_advertencia_tipo = 'DIA_20'
          WHERE id = $1
        `, [c.id]);

                console.log(`  ✅ ${nombreCompleto} - Email enviado`);
            }
        }

        // 2. ADVERTENCIA DÍA 25
        const warning25 = await client.query(`
      SELECT id, nombres, apellidos, email, celular1
      FROM conductores
      WHERE estado_registro IN ('EN_PROCESO', 'PENDIENTE')
        AND fecha_registro >= NOW() - INTERVAL '26 days'
        AND fecha_registro < NOW() - INTERVAL '25 days'
        AND ultima_advertencia_tipo != 'DIA_25'
    `);

        console.log(`⚠️  Advertencias día 25: ${warning25.rows.length} conductores`);

        for (const c of warning25.rows) {
            const nombreCompleto = `${c.nombres} ${c.apellidos}`;

            const result = await sendRegistrationWarningDay25(nombreCompleto, c.email, c.celular1);

            if (result.success) {
                await client.query(`
          UPDATE conductores
          SET advertencias_enviadas = advertencias_enviadas + 1,
              ultima_advertencia_fecha = NOW(),
              ultima_advertencia_tipo = 'DIA_25'
          WHERE id = $1
        `, [c.id]);

                console.log(`  ✅ ${nombreCompleto} - Email enviado`);
            }
        }

        // 3. ADVERTENCIA DÍA 28
        const warning28 = await client.query(`
      SELECT id, nombres, apellidos, email, celular1
      FROM conductores
      WHERE estado_registro IN ('EN_PROCESO', 'PENDIENTE')
        AND fecha_registro >= NOW() - INTERVAL '29 days'
        AND fecha_registro < NOW() - INTERVAL '28 days'
        AND ultima_advertencia_tipo != 'DIA_28'
    `);

        console.log(`🚨 Advertencias día 28 (URGENTE): ${warning28.rows.length} conductores`);

        for (const c of warning28.rows) {
            const nombreCompleto = `${c.nombres} ${c.apellidos}`;

            const result = await sendRegistrationWarningDay28(nombreCompleto, c.email, c.celular1);

            if (result.success) {
                await client.query(`
          UPDATE conductores
          SET advertencias_enviadas = advertencias_enviadas + 1,
              ultima_advertencia_fecha = NOW(),
              ultima_advertencia_tipo = 'DIA_28'
          WHERE id = $1
        `, [c.id]);

                console.log(`  ✅ ${nombreCompleto} - Email enviado`);
            }
        }

        // 4. AUTO-RECHAZO DÍA 30
        const rejected = await client.query(`
      UPDATE conductores
      SET estado_registro = 'RECHAZADO',
          fecha_rechazo = NOW(),
          razon_rechazo = 'Documentación no completada en el plazo de 30 días',
          estado = 'INACTIVO'
      WHERE estado_registro IN ('EN_PROCESO', 'PENDIENTE')
        AND fecha_registro < NOW() - INTERVAL '30 days'
      RETURNING id, nombres, apellidos, email, celular1
    `);

        console.log(`❌ Auto-rechazados: ${rejected.rows.length} conductores`);

        for (const c of rejected.rows) {
            const nombreCompleto = `${c.nombres} ${c.apellidos}`;

            await sendRejectionNotification(
                nombreCompleto,
                c.email,
                c.celular1,
                'Documentación no completada en el plazo de 30 días'
            );

            console.log(`  ❌ ${nombreCompleto} - Email de rechazo enviado`);
        }

        console.log('✅ Verificación completada');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

checkPendingDrivers()
    .then(() => {
        console.log('✅ Script finalizado exitosamente');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
