/**
 * sync-conductores-from-excel.js
 * =====================================================
 * Lee uno o más archivos Excel, extrae la columna "NOMBRE DEL CONDUCTOR",
 * "DNI" y "PLACA" y hace UPSERT en la tabla conductores.
 *
 * Reglas:
 *  - Si el conductor YA EXISTE (por DNI o por nombre exacto) → no modifica nada.
 *  - Si NO EXISTE → crea con estado PENDIENTE y los datos básicos disponibles.
 *
 * Uso:
 *   node scripts/sync-conductores-from-excel.js [archivo.xlsx ...]
 *   Si no se pasa argumento, procesa todos los .xlsx del raíz del proyecto.
 */

const XLSX = require('xlsx');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const DB = 'postgresql://postgres@localhost:5432/zuri_db';

// ─── Aliases para detectar columnas ────────────────────────────────────────
const ALIASES_CONDUCTOR = ['nombre del conductor', 'conductor', 'chofer', 'driver'];
const ALIASES_DNI = ['dni', 'documento de identidad', 'documento'];
const ALIASES_PLACA = ['placa', 'numero de placa'];

function norm(s) {
    if (!s) return '';
    return String(s).toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findCol(headers, aliases) {
    for (let i = 0; i < headers.length; i++) {
        const h = norm(headers[i]);
        if (aliases.some(a => h.includes(norm(a)))) return i;
    }
    return -1;
}

function detectHeaderRow(ws) {
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    let best = 0, max = 0;
    for (let i = 0; i < Math.min(30, data.length); i++) {
        const filled = data[i].filter(c => c !== '').length;
        if (filled > max && filled >= 5) { max = filled; best = i; }
    }
    return best;
}

function getHeaders(ws, row) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const h = [];
    for (let C = 0; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: C });
        h.push(ws[addr]?.v ? String(ws[addr].v).trim() : '');
    }
    return h;
}

function parseName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 4) return { apellidos: parts.slice(0, 2).join(' '), nombres: parts.slice(2).join(' ') };
    if (parts.length === 3) return { apellidos: parts.slice(0, 2).join(' '), nombres: parts[2] };
    if (parts.length === 2) return { apellidos: parts[0], nombres: parts[1] };
    return { apellidos: fullName, nombres: 'Temporal' };
}

async function processFile(filePath, client) {
    console.log(`\n📂 Procesando: ${path.basename(filePath)}`);
    const wb = XLSX.readFile(filePath);

    let creados = 0, existentes = 0, sinPlaca = 0;
    const yaVistos = new Set(); // evitar duplicados dentro del mismo Excel

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const filaH = detectHeaderRow(ws);
        const headers = getHeaders(ws, filaH);

        const colCond = findCol(headers, ALIASES_CONDUCTOR);
        const colDni = findCol(headers, ALIASES_DNI);
        const colPlaca = findCol(headers, ALIASES_PLACA);

        if (colCond < 0) {
            console.log(`  ⚠️  Hoja "${sheetName}": sin columna de conductor, omitida.`);
            continue;
        }

        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const filas = data.slice(filaH + 1);

        for (const fila of filas) {
            const condNombreRaw = fila[colCond] ? String(fila[colCond]).trim() : '';
            if (!condNombreRaw) continue;

            const condDni = colDni >= 0 ? String(fila[colDni] || '').trim().replace(/\D/g, '') : '';
            const condPlaca = colPlaca >= 0 ? String(fila[colPlaca] || '').trim() : '';

            // Evitar duplicados dentro del mismo archivo
            const key = condDni || condNombreRaw.toUpperCase();
            if (yaVistos.has(key)) continue;
            yaVistos.add(key);

            // 1️⃣ Buscar por DNI
            let existente = null;
            if (condDni && condDni.length >= 7) {
                const r = await client.query(
                    `SELECT id, "nombreCompleto" FROM conductores WHERE dni = $1 LIMIT 1`,
                    [condDni]
                );
                if (r.rows.length > 0) existente = r.rows[0];
            }

            // 2️⃣ Buscar por nombre exacto
            if (!existente && condNombreRaw) {
                const r = await client.query(
                    `SELECT id, "nombreCompleto" FROM conductores
           WHERE UPPER(TRIM("nombreCompleto")) = $1 LIMIT 1`,
                    [condNombreRaw.toUpperCase()]
                );
                if (r.rows.length > 0) existente = r.rows[0];
            }

            if (existente) {
                console.log(`  ✅ Ya existe: ${existente.nombreCompleto}`);
                existentes++;
                continue;
            }

            // 3️⃣ Crear nuevo
            const { apellidos, nombres } = parseName(condNombreRaw);

            try {
                // dni max 8 chars
                const dniInsert = (condDni && condDni.length >= 7)
                    ? condDni.slice(0, 8)
                    : ('T' + Date.now().toString().slice(-7));

                await client.query(
                    `INSERT INTO conductores (
             dni, "nombreCompleto", nombres, apellidos,
             placa, celular1, estado, estado_registro, "createdAt", "updatedAt"
           ) VALUES ($1,$2,$3,$4,$5,'','ACTIVO','EN_PROCESO',NOW(),NOW())`,
                    [dniInsert, condNombreRaw, nombres, apellidos, condPlaca || null]
                );
                console.log(`  ➕ Creado: ${condNombreRaw}  DNI:${dniInsert}  Placa:${condPlaca || '-'}`);
                creados++;
                if (!condPlaca) sinPlaca++;
            } catch (err) {
                // Conflicto de DNI temporal → ignorar silenciosamente
                console.log(`  ⚠️  No se pudo crear "${condNombreRaw}": ${err.message}`);
            }
        }
    }

    return { creados, existentes, sinPlaca };
}

async function main() {
    const args = process.argv.slice(2);

    // Si no se pasa argumento, usar los xlsx del raíz
    let archivos = args.length > 0
        ? args
        : fs.readdirSync(path.join(__dirname, '..'))
            .filter(f => f.endsWith('.xlsx'))
            .map(f => path.join(__dirname, '..', f));

    if (archivos.length === 0) {
        console.error('❌ No se encontraron archivos .xlsx');
        process.exit(1);
    }

    const client = new Client({ connectionString: DB });
    await client.connect();

    let totalCreados = 0, totalExistentes = 0;

    for (const archivo of archivos) {
        if (!fs.existsSync(archivo)) {
            console.warn(`⚠️  No se encontró: ${archivo}`);
            continue;
        }
        const { creados, existentes } = await processFile(archivo, client);
        totalCreados += creados;
        totalExistentes += existentes;
    }

    await client.end();

    console.log('\n═══════════════════════════════════');
    console.log(`✅ Proceso completo`);
    console.log(`   Conductores creados:    ${totalCreados}`);
    console.log(`   Conductores existentes: ${totalExistentes} (sin cambios)`);
    console.log('═══════════════════════════════════');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
