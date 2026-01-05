#!/bin/bash
echo "🔧 Parcheando API de importaciones..."

# Backup del archivo original
cp src/app/api/importaciones/upload/route.ts src/app/api/importaciones/upload/route.ts.backup

# Crear versión corregida
cat > src/app/api/importaciones/upload/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = {
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
};

function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  for (let i = 0; i <= len2; i++) matrix[i] = [i];
  for (let j = 0; j <= len1; j++) matrix[0][j] = j;
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[len2][len1];
}

function calcularSimilaridad(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(str1, str2);
  return Math.round(((maxLen - distance) / maxLen) * 100 * 100) / 100;
}

async function buscarDoctor(nombreDoctor: string, client: Client) {
  const THRESHOLD = 80;
  const nombreNormalizado = nombreDoctor.trim().toUpperCase();
  
  const exactMatch = await client.query(
    'SELECT id, nombre_completo FROM doctores WHERE UPPER(nombre_completo) = $1',
    [nombreNormalizado]
  );
  
  if (exactMatch.rows.length > 0) {
    return {
      id: exactMatch.rows[0].id,
      nombreCompleto: exactMatch.rows[0].nombre_completo,
      similaridad: 100,
      esNuevo: false
    };
  }
  
  const allDoctores = await client.query('SELECT id, nombre_completo FROM doctores');
  let mejorMatch: any = null;
  let mejorSimilaridad = 0;
  
  for (const doctor of allDoctores.rows) {
    const similaridad = calcularSimilaridad(nombreDoctor, doctor.nombre_completo);
    if (similaridad > mejorSimilaridad && similaridad >= THRESHOLD) {
      mejorSimilaridad = similaridad;
      mejorMatch = {
        id: doctor.id,
        nombreCompleto: doctor.nombre_completo,
        similaridad,
        esNuevo: false
      };
    }
  }
  return mejorMatch;
}

async function crearDoctor(nombreDoctor: string, client: Client) {
  const nombreLimpio = nombreDoctor.trim();
  
  // Generar DNI temporal único
  const dniTemp = 'TMP' + Date.now().toString().slice(-5);
  
  const result = await client.query(`
    INSERT INTO doctores (
      dni,
      nombre_completo,
      estado,
      observaciones,
      "createdAt",
      "updatedAt"
    ) VALUES ($1, $2, 'ACTIVO', 'Creado automáticamente desde importación Excel - Completar datos', NOW(), NOW())
    RETURNING id, nombre_completo
  `, [dniTemp, nombreLimpio]);
  
  console.log(`✓ Doctor creado: ${nombreLimpio} (DNI temporal: ${dniTemp})`);
  
  return {
    id: result.rows[0].id,
    nombreCompleto: result.rows[0].nombre_completo,
    similaridad: 100,
    esNuevo: true
  };
}

function limpiarDatos(data: any[]) {
  return data.filter(row => {
    if (!row.FECHA || !row.DOCTOR || !row.HORINI || !row.HORFIN) return false;
    if (row.DOCTOR === 'DOCTOR' || row.FECHA === 'FECHA') return false;
    if (row.TURNO === 'TURNO' || row.CLASIFICACION === 'CLASIFICACION') return false;
    return true;
  });
}

function parsearFecha(fechaStr: string): Date | null {
  try {
    const partes = fechaStr.split(/[-/]/);
    if (partes.length === 3) {
      return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    }
    return null;
  } catch { return null; }
}

function extraerFechaDeNombreArchivo(nombreArchivo: string): Date | null {
  const meses: any = {
    'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5,
    'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
  };
  const match = nombreArchivo.match(/(\d{1,2})\s+([A-Z]+)\s+(?:DEL\s+)?(\d{4})/i);
  if (match && meses[match[2].toUpperCase()] !== undefined) {
    return new Date(parseInt(match[3]), meses[match[2].toUpperCase()], parseInt(match[1]));
  }
  return null;
}

export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  let importacionId: number | null = null;
  
  try {
    await client.connect();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'Archivo Excel inválido' }, { status: 400 });
    }
    
    console.log(`📁 Procesando: ${file.name}`);
    
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const datosRaw: any[] = XLSX.utils.sheet_to_json(hoja);
    const datosLimpios = limpiarDatos(datosRaw);
    
    if (datosLimpios.length === 0) {
      return NextResponse.json({ error: 'Sin datos válidos' }, { status: 400 });
    }
    
    const codigoZuri = (await client.query('SELECT generar_codigo_zuri() as codigo')).rows[0].codigo;
    const fechaArchivo = extraerFechaDeNombreArchivo(file.name) || new Date();
    
    console.log(`🔑 Código: ${codigoZuri}`);
    
    const importacionResult = await client.query(`
      INSERT INTO importaciones_excel (codigo_zuri, nombre_archivo, fecha_archivo, total_registros, estado, usuario_importacion)
      VALUES ($1, $2, $3, $4, 'PROCESANDO', 'Sistema') RETURNING id
    `, [codigoZuri, file.name, fechaArchivo, datosLimpios.length]);
    
    importacionId = importacionResult.rows[0].id;
    
    let registrosProcesados = 0, registrosError = 0, doctoresNuevos = 0, doctoresExistentes = 0;
    const errores: any[] = [];
    
    for (let i = 0; i < datosLimpios.length; i++) {
      const row = datosLimpios[i];
      try {
        let doctorMatch = await buscarDoctor(row.DOCTOR, client);
        if (!doctorMatch) {
          doctorMatch = await crearDoctor(row.DOCTOR, client);
          doctoresNuevos++;
        } else {
          doctoresExistentes++;
        }
        
        const fechaServicio = parsearFecha(row.FECHA) || fechaArchivo;
        
        await client.query(`
          INSERT INTO solicitudes_servicios (
            importacion_id, codigo_zuri, fecha, doctor_nombre, doctor_id,
            doctor_es_nuevo, doctor_similaridad_score, turno, clasificacion,
            hora_inicio, hora_fin, descripcion, conductor_asignado, fila_excel, estado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE')
        `, [
          importacionId, codigoZuri, fechaServicio, row.DOCTOR, doctorMatch.id,
          doctorMatch.esNuevo, doctorMatch.similaridad, row.TURNO, row.CLASIFICACION,
          row.HORINI, row.HORFIN, row.DESCRIPCION, row.CONDUCTOR || null, i + 2
        ]);
        
        registrosProcesados++;
      } catch (error: any) {
        registrosError++;
        errores.push({ fila: i + 2, doctor: row.DOCTOR, error: error.message });
        console.error(`❌ Fila ${i + 2}:`, error.message);
      }
    }
    
    await client.query(`
      UPDATE importaciones_excel SET registros_procesados = $1, registros_error = $2,
      doctores_nuevos = $3, doctores_existentes = $4, estado = $5, errores_log = $6
      WHERE id = $7
    `, [registrosProcesados, registrosError, doctoresNuevos, doctoresExistentes,
        registrosError > 0 ? 'PARCIAL' : 'COMPLETADO', JSON.stringify(errores), importacionId]);
    
    await client.end();
    
    console.log(`✅ Completado: ${registrosProcesados}/${datosLimpios.length} registros`);
    
    return NextResponse.json({
      success: true, codigoZuri, importacionId, totalRegistros: datosLimpios.length,
      registrosProcesados, registrosError, doctoresNuevos, doctoresExistentes, errores
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Error general:', error);
    if (importacionId) {
      await client.query('UPDATE importaciones_excel SET estado = $1 WHERE id = $2', ['ERROR', importacionId]);
    }
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ endpoint: '/api/importaciones/upload', metodo: 'POST' });
}
EOF

echo "✓ Archivo parcheado"
npm run build && pm2 restart zuri-dev
echo "✅ Listo. Prueba importar de nuevo el archivo Excel."
