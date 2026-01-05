#!/bin/bash
echo "Completando sistema de importación..."

# 1. CREAR SECUENCIA PARA CÓDIGOS ZURI
sudo -u postgres psql -d zuri_db << 'EOSQL'
-- Crear secuencia si no existe
CREATE SEQUENCE IF NOT EXISTS seq_codigo_importacion START WITH 1;

-- Función para generar código
CREATE OR REPLACE FUNCTION generar_codigo_importacion()
RETURNS TEXT AS $$
DECLARE
  nuevo_num INTEGER;
BEGIN
  nuevo_num := nextval('seq_codigo_importacion');
  RETURN 'ZURI' || LPAD(nuevo_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Agregar columna codigo si no existe
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Generar códigos para importaciones existentes
UPDATE importaciones 
SET codigo = generar_codigo_importacion() 
WHERE codigo IS NULL;
EOSQL

# 2. ACTUALIZAR API UPLOAD PARA GENERAR CÓDIGO
cat > src/app/api/importaciones/upload/route.ts << 'EOFUPLOAD'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

const ALIASES = {
  fecha: ['fecha', 'dia', 'date'],
  doctor: ['usuario', 'doctor', 'medico', 'apellidos y nombres', 'profesional'],
  tipo: ['tipo', 'clasificacion', 'servicio'],
  horaInicio: ['h.inicio', 'hora inicio', 'h inicio programada'],
  horaFin: ['h.termino', 'h. termino', 'hora final'],
  conductor: ['conductor', 'chofer', 'conductor asignado'],
  turno: ['turno'],
  ubicacion: ['direccion', 'ubicacion'],
  distrito: ['distrito']
};

function normalizar(t: string): string {
  return t ? t.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function similitud(s1: string, s2: string): number {
  const a = normalizar(s1), b = normalizar(s2);
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 90;
  const p1 = new Set(a.split(' ')), p2 = new Set(b.split(' '));
  const c = [...p1].filter(x => p2.has(x)).length;
  return c > 0 ? Math.round((c / Math.max(p1.size, p2.size)) * 80) : 0;
}

function encontrarCol(h: string[], campo: keyof typeof ALIASES): number {
  let m = -1, s = 0;
  for (let i = 0; i < h.length; i++) {
    if (!h[i]) continue;
    for (const a of ALIASES[campo]) {
      const sc = similitud(h[i], a);
      if (sc > s && sc >= 65) { s = sc; m = i; }
    }
  }
  return m;
}

function detectarHeaders(ws: any): number {
  const d = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  let m = 0, max = 0;
  for (let i = 0; i < Math.min(30, d.length); i++) {
    const f = (d[i] as any[]).filter(c => c !== '' && c != null).length;
    if (f > max && f >= 5) { max = f; m = i; }
  }
  return m;
}

function extraerHeaders(ws: any, f: number): string[] {
  const r = XLSX.utils.decode_range(ws['!ref']), h: string[] = [];
  for (let C = 0; C <= r.e.c; C++) {
    const a = XLSX.utils.encode_cell({ r: f, c: C });
    h.push(ws[a]?.v ? String(ws[a].v).trim() : '');
  }
  return h;
}

function convertirHora(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'number' && v < 1) {
    const m = Math.round(v * 1440);
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  if (typeof v === 'string') {
    const x = v.match(/(\d{1,2}):?(\d{2})?/);
    if (x) return x[1].padStart(2, '0') + ':' + (x[2] || '00').padStart(2, '0');
  }
  return null;
}

function convertirFecha(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'number') {
    const d = new Date((v - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  if (typeof v === 'string') {
    const x = v.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (x) return x[3] + '-' + x[2].padStart(2, '0') + '-' + x[1].padStart(2, '0');
  }
  return null;
}

export async function POST(req: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    const fd = await req.formData();
    const file = fd.get('file') as File;
    if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 });

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const fH = detectarHeaders(ws);
    const hs = extraerHeaders(ws, fH);

    const map: any = {};
    for (const k of Object.keys(ALIASES) as Array<keyof typeof ALIASES>) {
      map[k] = encontrarCol(hs, k);
    }

    if (map.doctor < 0) {
      return NextResponse.json({ error: 'No se detectó columna de doctor', headers: hs.filter(x => x) }, { status: 400 });
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const rows = data.slice(fH + 1);

    await client.connect();

    // GENERAR CÓDIGO ZURI
    const codRes = await client.query('SELECT generar_codigo_importacion() as codigo');
    const codigo = codRes.rows[0].codigo;

    const impRes = await client.query(
      'INSERT INTO importaciones (codigo, nombre_archivo, total_registros, estado) VALUES ($1, $2, $3, $4) RETURNING id',
      [codigo, file.name, rows.length, 'PROCESANDO']
    );
    const impId = impRes.rows[0].id;

    let proc = 0, errs = 0;
    const nuevos: string[] = [];

    for (const r of rows as any[][]) {
      if (!r || r.every(c => !c)) continue;
      const doc = r[map.doctor];
      if (!doc) continue;

      try {
        let docId: number | null = null;
        const dRes = await client.query('SELECT id FROM doctores WHERE UPPER(nombre_completo) = $1', [String(doc).trim().toUpperCase()]);

        if (dRes.rows.length > 0) {
          docId = dRes.rows[0].id;
        } else {
          const nDoc = await client.query(
            'INSERT INTO doctores (dni, nombre_completo, estado) VALUES ($1, $2, $3) RETURNING id',
            ['TMP' + Date.now().toString().slice(-5), String(doc).trim(), 'ACTIVO']
          );
          docId = nDoc.rows[0].id;
          nuevos.push(String(doc).trim());
        }

        await client.query(`
          INSERT INTO solicitudes_servicios (
            importacion_id, fecha_servicio, hora_inicio, hora_fin, turno,
            tipo_servicio, doctor_id, doctor_nombre, cliente_nombre, ubicacion, distrito, estado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          impId,
          map.fecha >= 0 ? convertirFecha(r[map.fecha]) : null,
          map.horaInicio >= 0 ? convertirHora(r[map.horaInicio]) : null,
          map.horaFin >= 0 ? convertirHora(r[map.horaFin]) : null,
          map.turno >= 0 ? r[map.turno] : null,
          map.tipo >= 0 ? r[map.tipo] : 'MAD',
          docId,
          String(doc).trim(),
          'SANNA',
          map.ubicacion >= 0 ? r[map.ubicacion] : null,
          map.distrito >= 0 ? r[map.distrito] : null,
          'PENDIENTE'
        ]);

        proc++;
      } catch (e) {
        errs++;
      }
    }

    await client.query(
      'UPDATE importaciones SET estado = $1, registros_procesados = $2, registros_error = $3, doctores_nuevos = $4 WHERE id = $5',
      ['COMPLETADO', proc, errs, nuevos.length, impId]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      codigo,
      importacionId: impId,
      procesados: proc,
      errores: errs,
      doctoresNuevos: nuevos.length
    });

  } catch (err: any) {
    await client.end();
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
EOFUPLOAD

# 3. CREAR API DE DETALLE [id]
mkdir -p src/app/api/importaciones/[id]

cat > src/app/api/importaciones/[id]/route.ts << 'EOFDETAIL'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    const id = parseInt(params.id);
    
    await client.connect();
    
    // Obtener importación
    const impRes = await client.query('SELECT * FROM importaciones WHERE id = $1', [id]);
    if (impRes.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Importación no encontrada' }, { status: 404 });
    }
    
    // Obtener servicios
    const servRes = await client.query(`
      SELECT 
        s.*,
        d.nombre_completo as doctor_nombre_completo,
        c."nombreCompleto" as conductor_nombre_completo
      FROM solicitudes_servicios s
      LEFT JOIN doctores d ON s.doctor_id = d.id
      LEFT JOIN conductores c ON s.conductor_id = c.id
      WHERE s.importacion_id = $1
      ORDER BY s.fecha_servicio, s.hora_inicio
    `, [id]);
    
    await client.end();
    
    return NextResponse.json({
      importacion: impRes.rows[0],
      servicios: servRes.rows
    });
    
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFDETAIL

# 4. BUILD
npm run build && pm2 restart zuri-dev

echo ""
echo "✅ Sistema completado:"
echo "  - Secuencia de códigos ZURI creada"
echo "  - API upload genera código automático"
echo "  - API detalle [id] para modal"
echo "  - Códigos asignados a importaciones existentes"
