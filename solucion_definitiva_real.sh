#!/bin/bash
echo "=== IMPLEMENTACIÓN DEFINITIVA BASADA EN MEJORES PRÁCTICAS ==="

# PASO 1: VERIFICAR Y CREAR APIs FALTANTES
echo "Verificando APIs existentes..."
ls -la src/app/api/importaciones/ 2>/dev/null || echo "Directorio no existe"

# PASO 2: CREAR ESTRUCTURA COMPLETA
mkdir -p src/app/api/importaciones/upload
mkdir -p src/app/api/importaciones/[id]

# PASO 3: API UPLOAD CON MEJORES PRÁCTICAS
cat > src/app/api/importaciones/upload/route.ts << 'EOFUPLOAD'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';

const DB_CONFIG = { 
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db',
  connectionTimeoutMillis: 5000
};

// Aliases expandidos basado en archivos adjuntos
const COLUMN_ALIASES = {
  fecha: ['fecha', 'dia', 'date', 'day', 'fecha programada', 'fecha servicio'],
  doctor: [
    'usuario', 'usuarios', 'doctor', 'doctores', 'medico', 'médico',
    'apellidos y nombres', 'apellidos y nombres del medico', 'nombre completo',
    'apellidos nombres', 'nombres y apellidos', 'profesional', 'personal sanitario'
  ],
  tipo: ['tipo', 'clasificacion', 'clasificación', 'servicio', 'med procedencia', 'procedencia'],
  horaInicio: [
    'h.inicio', 'h inicio', 'h.inicio programada', 'h inicio programada',
    'hora inicio', 'hora de inicio', 'hora programada', 'inicio', 'horini'
  ],
  horaFin: [
    'h.termino', 'h. termino', 'h.termino programada', 'h termino programada',
    'hora fin', 'hora final', 'hora termino', 'termino', 'término', 'fin', 'horfin'
  ],
  conductor: [
    'conductor', 'conductores', 'conductor asignado', 'conductor asignado sm',
    'chofer', 'chófer', 'chofer asignado', 'movil', 'móvil'
  ],
  turno: ['turno', 'jornada', 'shift'],
  ubicacion: [
    'direccion', 'ubicacion', 'dirección', 'ubicación', 'lugar', 'destino',
    'direccion completa', 'dirección recojo', 'direccion inicial', 'direccion final'
  ],
  distrito: ['distrito']
};

function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
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
  const aliases = COLUMN_ALIASES[field];
  let bestMatch = -1;
  let bestScore = 0;
  
  for (let i = 0; i < headers.length; i++) {
    if (!headers[i]) continue;
    
    for (const alias of aliases) {
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
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  let bestRow = 0;
  let maxColumns = 0;
  
  for (let i = 0; i < Math.min(30, jsonData.length); i++) {
    const row = jsonData[i] as any[];
    const nonEmptyCount = row.filter(cell => cell !== '' && cell != null).length;
    
    if (nonEmptyCount > maxColumns && nonEmptyCount >= 5) {
      maxColumns = nonEmptyCount;
      bestRow = i;
    }
  }
  
  console.log(`Headers detected in row ${bestRow + 1} with ${maxColumns} columns`);
  return bestRow;
}

function extractHeaders(worksheet: any, headerRow: number): string[] {
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const headers: string[] = [];
  
  for (let C = 0; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow, c: C });
    const cell = worksheet[addr];
    headers.push(cell?.v ? String(cell.v).trim() : '');
  }
  
  return headers;
}

// CONVERSIÓN ROBUSTA DE FECHAS EXCEL - Basada en mejores prácticas Microsoft
function convertExcelDate(value: any): string | null {
  if (!value) return null;
  
  try {
    // Si es Date object (SheetJS con cellDates: true)
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return value.toISOString().split('T')[0];
    }
    
    // Si es número serial Excel - Fórmula oficial Microsoft
    if (typeof value === 'number') {
      // Excel cuenta desde 1900-01-01 como día 1
      // JavaScript cuenta desde 1970-01-01
      // Diferencia: 25569 días (sin ajuste del bug 1900)
      const jsDate = new Date(Math.round((value - 25569) * 86400 * 1000));
      
      if (isNaN(jsDate.getTime())) return null;
      
      const year = jsDate.getUTCFullYear();
      const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(jsDate.getUTCDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
    
    // Si es string
    if (typeof value === 'string') {
      const cleaned = value.trim();
      
      // DD/MM/YYYY o DD-MM-YYYY
      const dmyMatch = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        const year = dmyMatch[3];
        return `${year}-${month}-${day}`;
      }
      
      // YYYY-MM-DD
      const ymdMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (ymdMatch) {
        const year = ymdMatch[1];
        const month = ymdMatch[2].padStart(2, '0');
        const day = ymdMatch[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error converting date:', error);
    return null;
  }
}

function convertExcelTime(value: any): string | null {
  if (!value) return null;
  
  if (typeof value === 'number' && value < 1) {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
  }
  
  if (typeof value === 'string') {
    const match = value.match(/(\d{1,2}):?(\d{2})?/);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = (match[2] || '00').padStart(2, '0');
      return h + ':' + m;
    }
  }
  
  return null;
}

// GENERACIÓN DE CÓDIGO ÚNICO - Basada en crypto.randomUUID (más rápido según benchmarks)
function generateUniqueCode(): string {
  const uuid = randomUUID();
  const shortId = uuid.split('-')[0].toUpperCase();
  return `ZURI${shortId}`;
}

export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    }
    
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'Solo archivos Excel (.xlsx, .xls)' }, { status: 400 });
    }
    
    console.log('Processing file:', file.name);
    
    const buffer = await file.arrayBuffer();
    
    // USAR MEJORES PRÁCTICAS SHEETJS
    const workbook = XLSX.read(buffer, {
      cellDates: true,     // Convierte fechas automáticamente
      cellText: false,     // Mantener valores originales
      cellFormulas: true   // Procesar fórmulas
    });
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Detectar encabezados automáticamente
    const headerRow = detectHeaderRow(worksheet);
    const headers = extractHeaders(worksheet, headerRow);
    
    console.log('Headers found:', headers.filter(h => h));
    
    // Crear mapeo automático
    const mapping: Record<string, number> = {};
    for (const field of Object.keys(COLUMN_ALIASES) as Array<keyof typeof COLUMN_ALIASES>) {
      mapping[field] = findColumn(headers, field);
    }
    
    console.log('Column mapping:', mapping);
    
    // Validar doctor obligatorio
    if (mapping.doctor < 0) {
      return NextResponse.json({ 
        error: 'No se detectó columna de doctor/médico/usuario',
        headers: headers.filter(h => h),
        suggestion: 'Verifique que exista una columna con nombres de médicos'
      }, { status: 400 });
    }
    
    // Extraer datos (saltar fila de encabezados)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      cellDates: true 
    });
    const dataRows = jsonData.slice(headerRow + 1);
    
    console.log(`Processing ${dataRows.length} rows`);
    
    await client.connect();
    
    // GENERAR CÓDIGO ÚNICO
    const codigo = generateUniqueCode();
    console.log('Generated code:', codigo);
    
    // Crear registro de importación
    const importResult = await client.query(`
      INSERT INTO importaciones (
        codigo, nombre_archivo, total_registros, estado, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id
    `, [codigo, file.name, dataRows.length, 'PROCESANDO']);
    
    const importId = importResult.rows[0].id;
    
    let processed = 0;
    let errors = 0;
    const newDoctors: string[] = [];
    
    // Procesar cada fila
    for (const row of dataRows as any[][]) {
      try {
        // Saltar filas vacías
        if (!row || row.length === 0 || row.every(c => c === '' || c == null)) {
          continue;
        }
        
        const doctorName = row[mapping.doctor];
        if (!doctorName || doctorName === '') {
          continue;
        }
        
        // Buscar o crear doctor
        let doctorId: number | null = null;
        const existingDoctor = await client.query(
          'SELECT id FROM doctores WHERE UPPER(nombre_completo) = $1',
          [String(doctorName).trim().toUpperCase()]
        );
        
        if (existingDoctor.rows.length > 0) {
          doctorId = existingDoctor.rows[0].id;
        } else {
          const newDoctor = await client.query(`
            INSERT INTO doctores (
              dni, nombre_completo, estado, observaciones, "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id
          `, [
            'TMP' + Date.now().toString().slice(-5),
            String(doctorName).trim(),
            'ACTIVO',
            'Creado desde importación Excel'
          ]);
          
          doctorId = newDoctor.rows[0].id;
          newDoctors.push(String(doctorName).trim());
        }
        
        // Convertir datos
        const serviceDate = mapping.fecha >= 0 ? convertExcelDate(row[mapping.fecha]) : null;
        const startTime = mapping.horaInicio >= 0 ? convertExcelTime(row[mapping.horaInicio]) : null;
        const endTime = mapping.horaFin >= 0 ? convertExcelTime(row[mapping.horaFin]) : null;
        
        // Insertar servicio
        await client.query(`
          INSERT INTO solicitudes_servicios (
            importacion_id, fecha_servicio, hora_inicio, hora_fin, turno,
            tipo_servicio, doctor_id, doctor_nombre, cliente_nombre, ubicacion, estado,
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        `, [
          importId,
          serviceDate || new Date().toISOString().split('T')[0],
          startTime,
          endTime,
          mapping.turno >= 0 ? row[mapping.turno] : null,
          mapping.tipo >= 0 ? row[mapping.tipo] : 'MAD',
          doctorId,
          String(doctorName).trim(),
          'SANNA',
          mapping.ubicacion >= 0 ? row[mapping.ubicacion] : null,
          'PENDIENTE'
        ]);
        
        processed++;
        
      } catch (error) {
        errors++;
        console.error('Error processing row:', error);
      }
    }
    
    // Actualizar estado de importación
    await client.query(`
      UPDATE importaciones 
      SET estado = $1, registros_procesados = $2, registros_error = $3, doctores_nuevos = $4, "updatedAt" = NOW()
      WHERE id = $5
    `, [
      processed > 0 ? 'COMPLETADO' : 'ERROR',
      processed,
      errors,
      newDoctors.length,
      importId
    ]);
    
    await client.end();
    
    console.log(`Completed - Code: ${codigo}, Processed: ${processed}, Errors: ${errors}, New doctors: ${newDoctors.length}`);
    
    return NextResponse.json({
      success: true,
      codigo,
      importacionId: importId,
      procesados: processed,
      errores: errors,
      doctoresNuevos: newDoctors.length,
      mapeoUtilizado: Object.entries(mapping)
        .filter(([_, idx]) => idx >= 0)
        .map(([field, idx]) => ({ 
          campo: field, 
          columna: headers[idx],
          posicion: String.fromCharCode(65 + idx)
        }))
    });
    
  } catch (error: any) {
    await client.end();
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
EOFUPLOAD

# PASO 4: API GET LISTA
cat > src/app/api/importaciones/route.ts << 'EOFGET'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        id, codigo, nombre_archivo, total_registros, 
        registros_procesados, registros_error, doctores_nuevos, 
        estado, "createdAt", "updatedAt"
      FROM importaciones 
      ORDER BY "createdAt" DESC 
      LIMIT 50
    `);
    
    await client.end();
    
    const importaciones = result.rows.map(row => ({
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
      procesando: importaciones.filter(i => i.estado === 'PROCESANDO').length,
      error: importaciones.filter(i => i.estado === 'ERROR').length,
      totalServicios: importaciones.reduce((sum, i) => sum + (i.registros_procesados || 0), 0),
      doctoresNuevos: importaciones.reduce((sum, i) => sum + (i.doctores_nuevos || 0), 0)
    };
    
    return NextResponse.json({ importaciones, stats });
    
  } catch (error: any) {
    await client.end();
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: error.message,
      importaciones: [],
      stats: { total: 0, completadas: 0, procesando: 0, error: 0, totalServicios: 0, doctoresNuevos: 0 }
    }, { status: 500 });
  }
}
EOFGET

# PASO 5: API DELETE CON TRANSACCIONES ROBUSTAS
cat > src/app/api/importaciones/[id]/route.ts << 'EOFDELETE'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { 
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db',
  connectionTimeoutMillis: 5000
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    await client.connect();
    
    // Obtener importación
    const importResult = await client.query('SELECT * FROM importaciones WHERE id = $1', [id]);
    if (importResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Importación no encontrada' }, { status: 404 });
    }
    
    // Obtener servicios
    const servicesResult = await client.query(`
      SELECT 
        s.*,
        d.nombre_completo as doctor_nombre_completo
      FROM solicitudes_servicios s
      LEFT JOIN doctores d ON s.doctor_id = d.id
      WHERE s.importacion_id = $1
      ORDER BY s.fecha_servicio, s.hora_inicio
    `, [id]);
    
    await client.end();
    
    return NextResponse.json({
      importacion: importResult.rows[0],
      servicios: servicesResult.rows
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
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    await client.connect();
    
    // Verificar que existe
    const checkResult = await client.query('SELECT codigo, nombre_archivo FROM importaciones WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Importación no encontrada' }, { status: 404 });
    }
    
    const { codigo, nombre_archivo } = checkResult.rows[0];
    
    // TRANSACCIÓN EXPLÍCITA ROBUSTA - Mejores prácticas PostgreSQL
    await client.query('BEGIN');
    
    try {
      // Contar servicios antes de eliminar
      const countResult = await client.query('SELECT COUNT(*) as count FROM solicitudes_servicios WHERE importacion_id = $1', [id]);
      const serviceCount = parseInt(countResult.rows[0].count);
      
      // Eliminar servicios PRIMERO (aunque CASCADE debería hacerlo)
      await client.query('DELETE FROM solicitudes_servicios WHERE importacion_id = $1', [id]);
      console.log(`Deleted ${serviceCount} services for import ${codigo}`);
      
      // Eliminar importación
      const deleteResult = await client.query('DELETE FROM importaciones WHERE id = $1', [id]);
      console.log(`Deleted import ${codigo}`);
      
      // Confirmar transacción
      await client.query('COMMIT');
      
      await client.end();
      
      return NextResponse.json({ 
        success: true, 
        message: `Importación ${codigo} (${nombre_archivo}) eliminada correctamente`,
        codigo,
        serviciosEliminados: serviceCount
      });
      
    } catch (deleteError) {
      // Revertir transacción en caso de error
      await client.query('ROLLBACK');
      console.error('Delete transaction error:', deleteError);
      throw deleteError;
    }
    
  } catch (error: any) {
    await client.end();
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
EOFDELETE

# PASO 6: FRONTEND ACTUALIZADO
cat > src/app/dashboard/gestion-excel/page.tsx << 'EOFFRONTEND'
"use client";

import { useState, useEffect } from 'react';

interface Importacion {
  id: number;
  codigo: string;
  nombre_archivo: string;
  total_registros: number;
  registros_procesados: number;
  registros_error: number;
  doctores_nuevos: number;
  estado: string;
  createdAt: string;
}

interface Stats {
  total: number;
  completadas: number;
  procesando: number;
  error: number;
  totalServicios: number;
  doctoresNuevos: number;
}

export default function GestionExcelPage() {
  const [importaciones, setImportaciones] = useState<Importacion[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completadas: 0,
    procesando: 0,
    error: 0,
    totalServicios: 0,
    doctoresNuevos: 0
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchImportaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/importaciones');
      const data = await response.json();
      
      if (response.ok) {
        setImportaciones(data.importaciones || []);
        setStats(data.stats || {
          total: 0,
          completadas: 0,
          procesando: 0,
          error: 0,
          totalServicios: 0,
          doctoresNuevos: 0
        });
      } else {
        console.error('Error:', data.error);
        alert(`Error cargando datos: ${data.error}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Error de conexión al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(10);
      
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadProgress(30);
      
      const response = await fetch('/api/importaciones/upload', {
        method: 'POST',
        body: formData
      });
      
      setUploadProgress(60);
      
      const data = await response.json();
      
      setUploadProgress(90);
      
      if (response.ok) {
        alert(`¡Importación exitosa!\n\nCódigo: ${data.codigo}\nProcesados: ${data.procesados}\nDoctores nuevos: ${data.doctoresNuevos}`);
        await fetchImportaciones();
      } else {
        alert(`Error: ${data.error}`);
        if (data.headers) {
          console.log('Headers encontrados:', data.headers);
        }
      }
      
      setUploadProgress(100);
      
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleEliminarImportacion = async (id: number, codigo: string) => {
    if (!confirm(`¿Está seguro de eliminar la importación ${codigo}?\n\nEsta acción eliminará:\n- La importación\n- Todos los servicios relacionados\n\nNO se puede deshacer.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/importaciones/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Importación ${codigo} eliminada correctamente\nServicios eliminados: ${data.serviciosEliminados}`);
        await fetchImportaciones();
      } else {
        alert(`Error eliminando: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchImportaciones();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Archivos Excel</h1>
          <p className="text-gray-600">Sistema inteligente de importación con mapeo automático</p>
        </div>
        <div className="text-sm text-gray-500">
          Total servicios: {stats.totalServicios || 0}
        </div>
      </div>

      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
          <div className="text-sm text-gray-600">Importaciones</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.completadas || 0}</div>
          <div className="text-sm text-gray-600">Completadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-500">{stats.totalServicios || 0}</div>
          <div className="text-sm text-gray-600">Total Servicios</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{stats.doctoresNuevos || 0}</div>
          <div className="text-sm text-gray-600">Doctores Nuevos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.procesando || 0}</div>
          <div className="text-sm text-gray-600">Procesando</div>
        </div>
      </div>

      {/* Zona de Upload mejorada */}
      <div className="bg-white p-8 rounded-lg shadow">
        <div 
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            uploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
          onClick={() => !uploading && document.getElementById('fileInput')?.click()}
          onDrop={(e) => {
            e.preventDefault();
            if (!uploading) {
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="space-y-4">
              <div className="text-lg font-medium">Procesando archivo...</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-sm text-gray-500">{uploadProgress}%</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📊</div>
              <div className="text-xl font-medium">Arrastra archivo Excel o haz clic</div>
              <div className="text-sm text-gray-500">.xlsx, .xls (máx. 10MB)</div>
              <div className="text-xs text-gray-400">Mapeo automático de columnas</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla mejorada */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Historial de Importaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium">Código ZURI</th>
                <th className="text-left p-4 font-medium">Archivo</th>
                <th className="text-left p-4 font-medium">Fecha</th>
                <th className="text-left p-4 font-medium">Estado</th>
                <th className="text-left p-4 font-medium">Registros</th>
                <th className="text-left p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : importaciones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay importaciones. Sube tu primer archivo Excel.
                  </td>
                </tr>
              ) : (
                importaciones.map((imp) => (
                  <tr key={imp.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {imp.codigo}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate" title={imp.nombre_archivo}>
                      {imp.nombre_archivo}
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(imp.createdAt).toLocaleString('es-PE')}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        imp.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                        imp.estado === 'PROCESANDO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {imp.estado}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <div>{imp.registros_procesados} / {imp.total_registros}</div>
                      {imp.doctores_nuevos > 0 && (
                        <div className="text-purple-600 text-xs">+{imp.doctores_nuevos} doctores</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                          onClick={() => {
                            // TODO: Implementar modal de ver/editar
                            alert('Función Ver/Editar en desarrollo');
                          }}
                        >
                          Ver/Editar
                        </button>
                        <button 
                          onClick={() => handleEliminarImportacion(imp.id, imp.codigo)}
                          className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-100 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
EOFFRONTEND

# PASO 7: BUILD Y DEPLOY
echo "Building and deploying..."
npm run build

if [ $? -eq 0 ]; then
  pm2 restart zuri-dev
  echo ""
  echo "✅ SISTEMA COMPLETAMENTE IMPLEMENTADO:"
  echo "  ✓ Códigos únicos ZURI con crypto.randomUUID()"
  echo "  ✓ Conversión robusta de fechas Excel (SheetJS + Microsoft formula)"
  echo "  ✓ Eliminación con transacciones explícitas"
  echo "  ✓ Mapeo inteligente de columnas expandido"
  echo "  ✓ UI profesional mejorada"
  echo ""
  echo "🧪 Probar en: https://zuri.pe/dashboard/gestion-excel"
else
  echo "❌ Error en build - verificar logs arriba"
fi
