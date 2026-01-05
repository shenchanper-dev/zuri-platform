#!/bin/bash
echo "Creando sistema de importación Excel completo..."

# 1. CREAR TABLAS EN BD
sudo -u postgres psql -d zuri_db << 'EOSQL'
-- Tabla de importaciones
CREATE TABLE IF NOT EXISTS importaciones (
  id SERIAL PRIMARY KEY,
  nombre_archivo TEXT NOT NULL,
  total_registros INTEGER DEFAULT 0,
  registros_procesados INTEGER DEFAULT 0,
  registros_error INTEGER DEFAULT 0,
  doctores_nuevos INTEGER DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabla de solicitudes de servicios
CREATE TABLE IF NOT EXISTS solicitudes_servicios (
  id SERIAL PRIMARY KEY,
  importacion_id INTEGER REFERENCES importaciones(id) ON DELETE CASCADE,
  
  -- Datos del servicio
  fecha_servicio DATE,
  hora_inicio TIME,
  hora_fin TIME,
  turno VARCHAR(10),
  tipo_servicio VARCHAR(50),
  
  -- Doctor
  doctor_id INTEGER REFERENCES doctores(id),
  doctor_nombre TEXT NOT NULL,
  
  -- Cliente y ubicación
  cliente_nombre VARCHAR(100),
  ubicacion TEXT,
  distrito VARCHAR(100),
  
  -- Conductor (opcional)
  conductor_id INTEGER REFERENCES conductores(id),
  conductor_nombre TEXT,
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  observaciones TEXT,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_importaciones_fecha ON importaciones("createdAt");
CREATE INDEX IF NOT EXISTS idx_solicitudes_importacion ON solicitudes_servicios(importacion_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_doctor ON solicitudes_servicios(doctor_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_servicios(fecha_servicio);

EOSQL

# 2. CREAR API DE IMPORTACIÓN
mkdir -p src/app/api/importaciones/upload

cat > src/app/api/importaciones/upload/route.ts << 'EOFAPI'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

const ALIASES = {
  fecha: ['fecha', 'dia', 'date', 'day'],
  doctor: ['usuario', 'doctor', 'medico', 'apellidos y nombres', 'nombre completo', 'profesional'],
  tipo: ['tipo', 'clasificacion', 'servicio', 'med procedencia'],
  area: ['area', 'especialidad', 'esp'],
  cliente: ['cliente', 'empresa'],
  horaInicio: ['h.inicio', 'hora inicio', 'h inicio programada', 'horini'],
  horaFin: ['h.termino', 'h. termino', 'hora final', 'hora fin', 'horfin'],
  conductor: ['conductor', 'chofer', 'conductor asignado'],
  turno: ['turno', 'shift'],
  ubicacion: ['direccion', 'ubicacion', 'lugar', 'direccion recojo'],
  distrito: ['distrito']
};

function normalizar(texto: string): string {
  if (!texto) return '';
  return texto.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function similitud(str1: string, str2: string): number {
  const s1 = normalizar(str1);
  const s2 = normalizar(str2);
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 90;
  const p1 = new Set(s1.split(' '));
  const p2 = new Set(s2.split(' '));
  const comunes = [...p1].filter(p => p2.has(p)).length;
  return comunes > 0 ? Math.round((comunes / Math.max(p1.size, p2.size)) * 80) : 0;
}

function encontrarCol(headers: string[], campo: keyof typeof ALIASES): number {
  let mejor = -1, mejorScore = 0;
  for (let i = 0; i < headers.length; i++) {
    if (!headers[i]) continue;
    for (const alias of ALIASES[campo]) {
      const score = similitud(headers[i], alias);
      if (score > mejorScore && score >= 65) {
        mejorScore = score;
        mejor = i;
      }
    }
  }
  return mejor;
}

function detectarEncabezados(ws: any): number {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  let mejor = 0, maxCols = 0;
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const row = data[i] as any[];
    const filled = row.filter(c => c !== '' && c != null).length;
    if (filled > maxCols && filled >= 5) {
      maxCols = filled;
      mejor = i;
    }
  }
  return mejor;
}

function extraerHeaders(ws: any, fila: number): string[] {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const headers: string[] = [];
  for (let C = 0; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: fila, c: C });
    const cell = ws[addr];
    headers.push(cell?.v ? String(cell.v).trim() : '');
  }
  return headers;
}

function convertirHora(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number' && val < 1) {
    const mins = Math.round(val * 24 * 60);
    return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
  }
  if (typeof val === 'string') {
    const m = val.match(/(\d{1,2}):?(\d{2})?/);
    if (m) return m[1].padStart(2, '0') + ':' + (m[2] || '00').padStart(2, '0');
  }
  return null;
}

function convertirFecha(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const m = val.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  }
  return null;
}

export async function POST(req: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];

    const filaH = detectarEncabezados(ws);
    const headers = extraerHeaders(ws, filaH);

    const mapeo: any = {};
    for (const campo of Object.keys(ALIASES) as Array<keyof typeof ALIASES>) {
      mapeo[campo] = encontrarCol(headers, campo);
    }

    if (mapeo.doctor < 0) {
      return NextResponse.json({ 
        error: 'No se detectó columna de doctor/médico',
        headers: headers.filter(h => h)
      }, { status: 400 });
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const filas = data.slice(filaH + 1);

    await client.connect();

    const impRes = await client.query(
      'INSERT INTO importaciones (nombre_archivo, total_registros, estado) VALUES ($1, $2, $3) RETURNING id',
      [file.name, filas.length, 'PROCESANDO']
    );
    const impId = impRes.rows[0].id;

    let procesados = 0, errores = 0;
    const nuevos: string[] = [];

    for (const fila of filas as any[][]) {
      if (!fila || fila.every(c => !c)) continue;

      const doctor = fila[mapeo.doctor];
      if (!doctor) continue;

      try {
        let docId: number | null = null;
        const docRes = await client.query(
          'SELECT id FROM doctores WHERE UPPER(nombre_completo) = $1',
          [String(doctor).trim().toUpperCase()]
        );

        if (docRes.rows.length > 0) {
          docId = docRes.rows[0].id;
        } else {
          const newDoc = await client.query(
            'INSERT INTO doctores (dni, nombre_completo, estado) VALUES ($1, $2, $3) RETURNING id',
            ['TMP' + Date.now().toString().slice(-5), String(doctor).trim(), 'ACTIVO']
          );
          docId = newDoc.rows[0].id;
          nuevos.push(String(doctor).trim());
        }

        await client.query(`
          INSERT INTO solicitudes_servicios (
            importacion_id, fecha_servicio, hora_inicio, hora_fin, turno,
            tipo_servicio, doctor_id, doctor_nombre, cliente_nombre, ubicacion, estado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          impId,
          mapeo.fecha >= 0 ? convertirFecha(fila[mapeo.fecha]) : null,
          mapeo.horaInicio >= 0 ? convertirHora(fila[mapeo.horaInicio]) : null,
          mapeo.horaFin >= 0 ? convertirHora(fila[mapeo.horaFin]) : null,
          mapeo.turno >= 0 ? fila[mapeo.turno] : null,
          mapeo.tipo >= 0 ? fila[mapeo.tipo] : 'MAD',
          docId,
          String(doctor).trim(),
          mapeo.cliente >= 0 ? fila[mapeo.cliente] : 'SANNA',
          mapeo.ubicacion >= 0 ? fila[mapeo.ubicacion] : null,
          'PENDIENTE'
        ]);

        procesados++;
      } catch (err) {
        errores++;
        console.error('Error fila:', err);
      }
    }

    await client.query(
      'UPDATE importaciones SET estado = $1, registros_procesados = $2, registros_error = $3, doctores_nuevos = $4 WHERE id = $5',
      ['COMPLETADO', procesados, errores, nuevos.length, impId]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      importacionId: impId,
      procesados,
      errores,
      doctoresNuevos: nuevos.length
    });

  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

# 3. CREAR API GET
cat > src/app/api/importaciones/route.ts << 'EOFGET'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM importaciones ORDER BY "createdAt" DESC LIMIT 50');
    await client.end();

    const importaciones = res.rows;
    const stats = {
      total: importaciones.length,
      completadas: importaciones.filter(i => i.estado === 'COMPLETADO').length,
      totalServicios: importaciones.reduce((s, i) => s + (i.registros_procesados || 0), 0),
      doctoresNuevos: importaciones.reduce((s, i) => s + (i.doctores_nuevos || 0), 0)
    };

    return NextResponse.json({ importaciones, stats });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ 
      importaciones: [], 
      stats: { total: 0, completadas: 0, totalServicios: 0, doctoresNuevos: 0 }
    }, { status: 500 });
  }
}
EOFGET

# 4. BUILD Y RESTART
npm run build && pm2 restart zuri-dev

echo ""
echo "Sistema de importación creado:"
echo "  - Tablas BD creadas"
echo "  - API upload funcional"
echo "  - API GET con stats"
echo "  - Detección automática de encabezados"
echo "  - Mapeo flexible de columnas"
