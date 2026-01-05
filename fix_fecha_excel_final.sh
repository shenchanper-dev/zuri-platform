#!/bin/bash
set -e

echo "=== SOLUCIÓN DEFINITIVA: FECHAS EXCEL FORMATO PERUANO DD/MM/YYYY ==="

cat > src/app/api/importaciones/upload/route.ts <<'EOFUPLOAD'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = {
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db',
  connectionTimeoutMillis: 10000
};

const COLUMN_ALIASES = {
  fecha: ['fecha', 'dia', 'date', 'day', 'fecha programada', 'fecha servicio'],
  doctor: [
    'usuario', 'usuarios', 'doctor', 'doctores', 'medico', 'médico',
    'apellidos y nombres', 'apellidos y nombres del medico',
    'nombre completo', 'profesional', 'personal sanitario'
  ],
  tipo: ['tipo', 'clasificacion', 'clasificación', 'servicio', 'med procedencia'],
  horaInicio: ['h.inicio', 'h inicio', 'hora inicio', 'horini', 'inicio'],
  horaFin: ['h.termino', 'h. termino', 'hora fin', 'horfin', 'termino', 'fin'],
  conductor: ['conductor', 'chofer', 'conductor asignado', 'movil'],
  turno: ['turno', 'jornada'],
  ubicacion: ['direccion', 'ubicacion', 'dirección', 'lugar', 'destino'],
  distrito: ['distrito']
};

function normalizeText(text: string): string {
  return text ? text.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 95;
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const common = [...words1].filter(w => words2.has(w)).length;
  return common > 0 ? Math.round((common / Math.max(words1.size, words2.size)) * 85) : 0;
}

function findColumn(headers: string[], field: keyof typeof COLUMN_ALIASES): number {
  let bestMatch = -1;
  let bestScore = 0;
  for (let i = 0; i < headers.length; i++) {
    if (!headers[i]) continue;
    for (const alias of COLUMN_ALIASES[field]) {
      const score = calculateSimilarity(headers[i], alias);
      if (score > bestScore && score >= 70) {
        bestScore = score;
        bestMatch = i;
      }
    }
  }
  return bestMatch;
}

function detectHeaderRow(worksheet: any): number {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  let bestRow = 0;
  let maxCols = 0;
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const nonEmpty = (data[i] as any[]).filter(c => c !== '' && c != null).length;
    if (nonEmpty > maxCols && nonEmpty >= 5) {
      maxCols = nonEmpty;
      bestRow = i;
    }
  }
  return bestRow;
}

function extractHeaders(worksheet: any, row: number): string[] {
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const headers: string[] = [];
  for (let C = 0; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: row, c: C });
    headers.push(worksheet[addr]?.v ? String(worksheet[addr].v).trim() : '');
  }
  return headers;
}

function convertExcelDate(value: any): string | null {
  if (!value) return null;
  
  try {
    if (typeof value === 'string') {
      const cleaned = value.trim();
      const peruanoMatch = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (peruanoMatch) {
        const dia = peruanoMatch[1].padStart(2, '0');
        const mes = peruanoMatch[2].padStart(2, '0');
        const anio = peruanoMatch[3];
        const testDate = new Date(\`\${anio}-\${mes}-\${dia}\`);
        if (!isNaN(testDate.getTime())) {
          return \`\${anio}-\${mes}-\${dia}\`;
        }
      }
      const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoMatch) {
        const anio = isoMatch[1];
        const mes = isoMatch[2].padStart(2, '0');
        const dia = isoMatch[3].padStart(2, '0');
        return \`\${anio}-\${mes}-\${dia}\`;
      }
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return \`\${year}-\${month}-\${day}\`;
    }
    if (typeof value === 'number' && value > 0 && value < 100000) {
      const EXCEL_EPOCH_DIFF = 25569;
      const MS_PER_DAY = 86400000;
      let serial = value;
      if (serial > 60) serial -= 1;
      const timestamp = (serial - EXCEL_EPOCH_DIFF) * MS_PER_DAY;
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return \`\${year}-\${month}-\${day}\`;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

function convertExcelTime(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'number' && value < 1) {
    const totalMins = Math.round(value * 1440);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
  }
  if (typeof value === 'string') {
    const match = value.match(/(\d{1,2}):?(\d{2})?/);
    if (match) {
      return match[1].padStart(2, '0') + ':' + (match[2] || '00').padStart(2, '0');
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 });
    }
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { cellDates: false, cellText: false, cellFormulas: true, raw: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headerRow = detectHeaderRow(worksheet);
    const headers = extractHeaders(worksheet, headerRow);
    const mapping: Record<string, number> = {};
    for (const field of Object.keys(COLUMN_ALIASES) as Array<keyof typeof COLUMN_ALIASES>) {
      mapping[field] = findColumn(headers, field);
    }
    if (mapping.doctor < 0) {
      return NextResponse.json({ error: 'No se detectó columna de doctor', headers: headers.filter(h => h) }, { status: 400 });
    }
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
    const dataRows = jsonData.slice(headerRow + 1);
    await client.connect();
    const codigoResult = await client.query('SELECT generar_codigo_zuri() as codigo');
    const codigo = codigoResult.rows[0].codigo;
    const importResult = await client.query(\`INSERT INTO importaciones (codigo, nombre_archivo, total_registros, estado, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id\`, [codigo, file.name, dataRows.length, 'PROCESANDO']);
    const importId = importResult.rows[0].id;
    let processed = 0, errors = 0;
    const newDoctors: string[] = [];
    for (const row of dataRows as any[][]) {
      if (!row || row.every(c => !c)) continue;
      const doctorName = row[mapping.doctor];
      if (!doctorName) continue;
      try {
        let doctorId: number | null = null;
        const existing = await client.query('SELECT id FROM doctores WHERE UPPER(nombre_completo) = $1', [String(doctorName).trim().toUpperCase()]);
        if (existing.rows.length > 0) {
          doctorId = existing.rows[0].id;
        } else {
          const newDoc = await client.query(\`INSERT INTO doctores (dni, nombre_completo, estado, observaciones, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id\`, ['TMP' + Date.now().toString().slice(-5), String(doctorName).trim(), 'ACTIVO', 'Creado desde Excel']);
          doctorId = newDoc.rows[0].id;
          newDoctors.push(String(doctorName).trim());
        }
        const rawFecha = mapping.fecha >= 0 ? row[mapping.fecha] : null;
        const fechaServicio = convertExcelDate(rawFecha) || new Date().toISOString().split('T')[0];
        const horaInicio = mapping.horaInicio >= 0 ? convertExcelTime(row[mapping.horaInicio]) : null;
        const horaFin = mapping.horaFin >= 0 ? convertExcelTime(row[mapping.horaFin]) : null;
        await client.query(\`INSERT INTO solicitudes_servicios (importacion_id, fecha_servicio, hora_inicio, hora_fin, turno, tipo_servicio, doctor_id, doctor_nombre, cliente_nombre, ubicacion, estado, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())\`, [importId, fechaServicio, horaInicio, horaFin, mapping.turno >= 0 ? row[mapping.turno] : null, mapping.tipo >= 0 ? row[mapping.tipo] : 'MAD', doctorId, String(doctorName).trim(), 'SANNA', mapping.ubicacion >= 0 ? row[mapping.ubicacion] : null, 'PENDIENTE']);
        processed++;
      } catch (err) {
        errors++;
      }
    }
    await client.query(\`UPDATE importaciones SET estado = $1, registros_procesados = $2, registros_error = $3, doctores_nuevos = $4, "updatedAt" = NOW() WHERE id = $5\`, [processed > 0 ? 'COMPLETADO' : 'ERROR', processed, errors, newDoctors.length, importId]);
    await client.end();
    return NextResponse.json({ success: true, codigo, importacionId: importId, procesados: processed, errores: errors, doctoresNuevos: newDoctors.length });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFUPLOAD

npm run build
pm2 restart zuri-dev

echo "✅ Formato DD/MM/YYYY aplicado correctamente"
