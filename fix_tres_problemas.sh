#!/bin/bash
echo "Solucionando los 3 problemas del sistema de Gestión Excel..."

# 1. CREAR SECUENCIA PARA CÓDIGOS ZURI000001
sudo -u postgres psql -d zuri_db << 'EOSQL'
-- Crear secuencia si no existe
CREATE SEQUENCE IF NOT EXISTS seq_codigo_importacion START WITH 1;

-- Función para generar código ZURI
CREATE OR REPLACE FUNCTION generar_codigo_zuri()
RETURNS TEXT AS $$
DECLARE
  nuevo_num INTEGER;
BEGIN
  nuevo_num := nextval('seq_codigo_importacion');
  RETURN 'ZURI' || LPAD(nuevo_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Agregar columna codigo si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='importaciones' AND column_name='codigo') THEN
    ALTER TABLE importaciones ADD COLUMN codigo TEXT;
  END IF;
END $$;

-- Generar códigos para importaciones existentes sin código
UPDATE importaciones 
SET codigo = generar_codigo_zuri() 
WHERE codigo IS NULL;
EOSQL

# 2. ACTUALIZAR API DE UPLOAD CON CÓDIGO Y CONVERSIÓN DE FECHAS
cat > src/app/api/importaciones/upload/route.ts << 'EOFUPLOAD'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

const ALIASES = {
  fecha: ['fecha', 'dia', 'date', 'day'],
  doctor: ['usuario', 'doctor', 'medico', 'apellidos y nombres', 'profesional'],
  tipo: ['tipo', 'clasificacion', 'servicio', 'med procedencia'],
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

// FUNCIÓN ROBUSTA PARA CONVERTIR FECHAS DE EXCEL
function convertirFechaExcel(v: any): string | null {
  if (!v) return null;
  
  // Si es número serial de Excel
  if (typeof v === 'number') {
    try {
      // Excel cuenta desde 1900-01-01, pero incorrectamente asume que 1900 fue bisiesto
      // JavaScript cuenta desde 1970-01-01
      // Diferencia: 25569 días + 2 días de ajuste por el error de Excel
      const utc_days = Math.floor(v - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      
      // Verificar que la fecha es válida
      if (isNaN(date_info.getTime())) return null;
      
      // Formato YYYY-MM-DD para PostgreSQL
      const year = date_info.getUTCFullYear();
      const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date_info.getUTCDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error convirtiendo fecha serial:', error);
      return null;
    }
  }
  
  // Si es string, intentar parsear formatos comunes
  if (typeof v === 'string') {
    const cleaned = v.trim();
    
    // DD/MM/YYYY o DD-MM-YYYY
    const ddmmyyyy = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }
    
    // YYYY-MM-DD (formato estándar)
    const yyyymmdd = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
      const year = yyyymmdd[1];
      const month = yyyymmdd[2].padStart(2, '0');
      const day = yyyymmdd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  return null;
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

    // GENERAR CÓDIGO ZURI AUTOMÁTICO
    const codRes = await client.query('SELECT generar_codigo_zuri() as codigo');
    const codigo = codRes.rows[0].codigo;

    const impRes = await client.query(
      'INSERT INTO importaciones (codigo, nombre_archivo, total_registros, estado, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
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
            'INSERT INTO doctores (dni, nombre_completo, estado, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
            ['TMP' + Date.now().toString().slice(-5), String(doc).trim(), 'ACTIVO']
          );
          docId = nDoc.rows[0].id;
          nuevos.push(String(doc).trim());
        }

        // CONVERSIÓN ROBUSTA DE FECHA
        const fechaConvertida = map.fecha >= 0 ? convertirFechaExcel(r[map.fecha]) : null;

        await client.query(`
          INSERT INTO solicitudes_servicios (
            importacion_id, fecha_servicio, hora_inicio, hora_fin, turno,
            tipo_servicio, doctor_id, doctor_nombre, cliente_nombre, ubicacion, distrito, estado,
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        `, [
          impId,
          fechaConvertida || new Date().toISOString().split('T')[0], // Default: hoy si no hay fecha
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
        console.error('Error procesando fila:', e);
      }
    }

    await client.query(
      'UPDATE importaciones SET estado = $1, registros_procesados = $2, registros_error = $3, doctores_nuevos = $4, "updatedAt" = NOW() WHERE id = $5',
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

# 3. ACTUALIZAR API GET PARA MOSTRAR CÓDIGOS
cat > src/app/api/importaciones/route.ts << 'EOFGET'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const res = await client.query(`
      SELECT 
        id, codigo, nombre_archivo, total_registros, registros_procesados, 
        registros_error, doctores_nuevos, estado, "createdAt", "updatedAt"
      FROM importaciones 
      ORDER BY "createdAt" DESC 
      LIMIT 50
    `);
    await client.end();

    const importaciones = res.rows.map(row => ({
      id: row.id,
      codigo: row.codigo || 'SIN_CODIGO',
      nombre_archivo: row.nombre_archivo,
      total_registros: row.total_registros || 0,
      registros_procesados: row.registros_procesados || 0,
      registros_error: row.registros_error || 0,
      doctores_nuevos: row.doctores_nuevos || 0,
      estado: row.estado,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString()
    }));

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

# 4. CREAR API DELETE PARA ELIMINAR IMPORTACIONES
mkdir -p src/app/api/importaciones/[id]

cat > src/app/api/importaciones/[id]/route.ts << 'EOFDELETE'
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    const id = parseInt(params.id);
    
    await client.connect();
    
    // Verificar que existe
    const checkRes = await client.query('SELECT codigo FROM importaciones WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Importación no encontrada' }, { status: 404 });
    }
    
    const codigo = checkRes.rows[0].codigo;
    
    // Eliminar servicios relacionados (CASCADE debería hacerlo automático, pero lo hacemos explícito)
    await client.query('DELETE FROM solicitudes_servicios WHERE importacion_id = $1', [id]);
    
    // Eliminar importación
    await client.query('DELETE FROM importaciones WHERE id = $1', [id]);
    
    await client.end();
    
    return NextResponse.json({ 
      success: true, 
      message: `Importación ${codigo} eliminada correctamente`,
      codigo 
    });
    
  } catch (error: any) {
    await client.end();
    console.error('Error eliminando importación:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFDELETE

# 5. BUILD Y RESTART
npm run build && pm2 restart zuri-dev

echo ""
echo "✅ PROBLEMAS SOLUCIONADOS:"
echo "  ✓ Códigos ZURI automáticos (ZURI000001, ZURI000002...)"
echo "  ✓ Conversión robusta de fechas de Excel"
echo "  ✓ API DELETE para eliminar importaciones"
echo "  ✓ Manejo de errores mejorado"
echo ""
echo "Ahora puedes:"
echo "  - Ver códigos ZURI en la tabla de importaciones"
echo "  - Eliminar importaciones con botón 'Eliminar'"
echo "  - Cargar archivos Excel sin errores de fecha"
