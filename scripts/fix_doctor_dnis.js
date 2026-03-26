// Script: Actualizar DNIs reales de doctores desde solicitudes_servicios (importacion_id=13)
const { Client } = require('pg');

const DB = 'postgresql://postgres@localhost:5432/zuri_db';

async function main() {
    const client = new Client({ connectionString: DB });
    await client.connect();
    console.log('Conectado a la base de datos...\n');

    // 1. Obtener doctores con DNI falso que tienen dato real en solicitudes_servicios
    const res = await client.query(`
    SELECT DISTINCT ON (ss.doctor_id)
      ss.doctor_id,
      ss.doctor_nombre,
      ss.paciente_dni AS dni_real,
      d.dni AS dni_actual,
      d.cmp AS cmp_actual
    FROM solicitudes_servicios ss
    JOIN doctores d ON ss.doctor_id = d.id
    WHERE ss.paciente_dni ~ '^[0-9]{6,12}$'
      AND ss.doctor_id IS NOT NULL
      AND (d.dni IS NULL OR d.dni LIKE 'TEMP%' OR d.dni LIKE 'DNI%' OR d.dni LIKE 'PENDIENTE%')
    ORDER BY ss.doctor_id, ss.id DESC
  `);

    console.log(`Doctores a actualizar: ${res.rows.length}`);

    let actualizados = 0;
    let errores = 0;

    for (const row of res.rows) {
        try {
            // Actualizar DNI real y marcar CMP como pendiente si aún es temporal
            const cmpNuevo = (row.cmp_actual && (row.cmp_actual.startsWith('99') || row.cmp_actual.startsWith('TEMP')))
                ? `PENDIENTE-${row.dni_real}`
                : row.cmp_actual; // Si ya tiene un CMP real, no lo tocamos

            await client.query(`
        UPDATE doctores 
        SET 
          dni = $1,
          cmp = CASE 
            WHEN cmp LIKE '99%' OR cmp LIKE 'TEMP%' OR cmp IS NULL THEN $2
            ELSE cmp
          END,
          updated_at = NOW()
        WHERE id = $3
      `, [row.dni_real, cmpNuevo, row.doctor_id]);

            console.log(`  ✅ ID ${row.doctor_id} - ${row.doctor_nombre}: TEMP → ${row.dni_real} (CMP: ${cmpNuevo})`);
            actualizados++;
        } catch (err) {
            console.error(`  ❌ Error ID ${row.doctor_id}: ${err.message}`);
            errores++;
        }
    }

    // 2. Resumen
    console.log(`\n=== RESUMEN ===`);
    console.log(`  Actualizados: ${actualizados}`);
    console.log(`  Errores: ${errores}`);

    // 3. Verificar resultado
    const check = await client.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN dni ~ '^[0-9]{6,12}$' THEN 1 END) as con_dni_real,
      COUNT(CASE WHEN dni LIKE 'TEMP%' OR dni LIKE 'DNI%' OR dni IS NULL THEN 1 END) as pendientes
    FROM doctores 
    WHERE estado != 'ELIMINADO'
  `);
    console.log(`\n=== Estado final de la BD ===`);
    console.log(`  Total doctores: ${check.rows[0].total}`);
    console.log(`  Con DNI real:   ${check.rows[0].con_dni_real}`);
    console.log(`  Pendientes:     ${check.rows[0].pendientes}`);

    await client.end();
}

main().catch(err => {
    console.error('Error fatal:', err.message);
    process.exit(1);
});
