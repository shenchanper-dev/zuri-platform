#!/bin/bash

echo "🚀 Instalando Módulo Gestión Excel - ZURI Platform"
echo "=================================================="

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Instalar dependencia xlsx
echo -e "\n${BLUE}📦 Instalando dependencia xlsx...${NC}"
npm install xlsx --legacy-peer-deps

# 2. Crear directorios
echo -e "\n${BLUE}📁 Creando estructura de directorios...${NC}"
mkdir -p src/app/api/importaciones/upload
mkdir -p src/app/api/importaciones/[id]
mkdir -p src/app/dashboard/gestion-excel
mkdir -p src/hooks

# 3. Crear API Upload
echo -e "\n${BLUE}📝 Creando API Upload...${NC}"
cat > src/app/api/importaciones/upload/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = {
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
};

interface ExcelRow {
  FECHA: string;
  DOCTOR: string;
  TURNO: string;
  CLASIFICACION: string;
  HORINI: string;
  HORFIN: string;
  DESCRIPCION: string;
  CONDUCTOR?: string;
}

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
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
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
    'SELECT id, "nombreCompleto" FROM doctores WHERE UPPER("nombreCompleto") = $1',
    [nombreNormalizado]
  );
  
  if (exactMatch.rows.length > 0) {
    return {
      id: exactMatch.rows[0].id,
      nombreCompleto: exactMatch.rows[0].nombreCompleto,
      similaridad: 100,
      esNuevo: false
    };
  }
  
  const allDoctores = await client.query('SELECT id, "nombreCompleto" FROM doctores');
  let mejorMatch: any = null;
  let mejorSimilaridad = 0;
  
  for (const doctor of allDoctores.rows) {
    const similaridad = calcularSimilaridad(nombreDoctor, doctor.nombreCompleto);
    if (similaridad > mejorSimilaridad && similaridad >= THRESHOLD) {
      mejorSimilaridad = similaridad;
      mejorMatch = {
        id: doctor.id,
        nombreCompleto: doctor.nombreCompleto,
        similaridad,
        esNuevo: false
      };
    }
  }
  return mejorMatch;
}

async function crearDoctor(nombreDoctor: string, client: Client) {
  const result = await client.query(`
    INSERT INTO doctores ("nombreCompleto", "createdAt", "updatedAt")
    VALUES ($1, NOW(), NOW()) RETURNING id, "nombreCompleto"
  `, [nombreDoctor.trim()]);
  
  return {
    id: result.rows[0].id,
    nombreCompleto: result.rows[0].nombreCompleto,
    similaridad: 100,
    esNuevo: true
  };
}

function limpiarDatos(data: any[]): ExcelRow[] {
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
      }
    }
    
    await client.query(`
      UPDATE importaciones_excel SET registros_procesados = $1, registros_error = $2,
      doctores_nuevos = $3, doctores_existentes = $4, estado = $5, errores_log = $6
      WHERE id = $7
    `, [registrosProcesados, registrosError, doctoresNuevos, doctoresExistentes,
        registrosError > 0 ? 'PARCIAL' : 'COMPLETADO', JSON.stringify(errores), importacionId]);
    
    await client.end();
    
    return NextResponse.json({
      success: true, codigoZuri, importacionId, totalRegistros: datosLimpios.length,
      registrosProcesados, registrosError, doctoresNuevos, doctoresExistentes, errores
    }, { status: 201 });
    
  } catch (error: any) {
    if (importacionId) {
      await client.query('UPDATE importaciones_excel SET estado = $1 WHERE id = $2',
        ['ERROR', importacionId]);
    }
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/importaciones/upload',
    metodo: 'POST',
    formato: 'FormData con campo "file"'
  });
}
EOF

echo -e "${GREEN}✓ API Upload creada${NC}"

# 4. Crear API List
echo -e "\n${BLUE}📝 Creando API List...${NC}"
cat > src/app/api/importaciones/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = {
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
};

export async function GET(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limit') || '50');
    const estado = searchParams.get('estado');
    
    let query = 'SELECT * FROM vista_resumen_importaciones WHERE 1=1';
    const params: any[] = [];
    
    if (estado && estado !== 'TODOS') {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }
    
    params.push(limite);
    query += ` LIMIT $${params.length}`;
    
    const result = await client.query(query, params);
    const statsResult = await client.query(`
      SELECT COUNT(*) as total_importaciones, SUM(total_registros) as total_servicios,
      SUM(doctores_nuevos) as total_doctores_nuevos,
      COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END) as importaciones_completadas,
      COUNT(CASE WHEN estado = 'ERROR' THEN 1 END) as importaciones_error,
      COUNT(CASE WHEN estado = 'PARCIAL' THEN 1 END) as importaciones_parciales
      FROM importaciones_excel
    `);
    
    await client.end();
    return NextResponse.json({
      importaciones: result.rows,
      estadisticas: statsResult.rows[0],
      total: result.rows.length
    });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    
    await client.connect();
    const checkResult = await client.query('SELECT codigo_zuri FROM importaciones_excel WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }
    
    await client.query('DELETE FROM importaciones_excel WHERE id = $1', [id]);
    await client.end();
    return NextResponse.json({ message: 'Eliminada correctamente' });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOF

echo -e "${GREEN}✓ API List creada${NC}"

# 5. Crear API Detail
echo -e "\n${BLUE}📝 Creando API Detail...${NC}"
cat > src/app/api/importaciones/[id]/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = {
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const id = parseInt(params.id);
    
    const importacionResult = await client.query('SELECT * FROM vista_resumen_importaciones WHERE id = $1', [id]);
    if (importacionResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }
    
    const importacion = importacionResult.rows[0];
    const serviciosResult = await client.query(
      'SELECT * FROM vista_servicios_completos WHERE codigo_zuri = $1 ORDER BY fecha_servicio, hora_inicio',
      [importacion.codigo_zuri]
    );
    
    await client.end();
    return NextResponse.json({
      importacion,
      servicios: serviciosResult.rows,
      totalServicios: serviciosResult.rows.length
    });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOF

echo -e "${GREEN}✓ API Detail creada${NC}"

# Continúa en el siguiente mensaje...
echo -e "\n${GREEN}=================================================="
echo -e "✓ Archivos API creados correctamente${NC}"
echo -e "\nPresiona Enter para continuar con Hook y UI..."
read


# 6. Crear Hook useImportaciones
echo -e "\n📝 Creando Hook useImportaciones..."
cat > src/hooks/useImportaciones.ts << 'EOF'
import { useState, useEffect } from 'react';

export interface ImportacionData {
  id: number;
  codigo_zuri: string;
  nombre_archivo: string;
  fecha_archivo: string;
  fecha_importacion: string;
  estado: string;
  total_registros: number;
  registros_procesados: number;
  registros_error: number;
  doctores_nuevos: number;
  doctores_existentes: number;
  servicios_registrados: number;
  usuario_importacion: string;
}

export function useImportaciones() {
  const [importaciones, setImportaciones] = useState<ImportacionData[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchImportaciones = async (limite = 50, estado?: string) => {
    try {
      setLoading(true);
      let url = `/api/importaciones?limit=${limite}`;
      if (estado) url += `&estado=${estado}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setImportaciones(data.importaciones || []);
        setEstadisticas(data.estadisticas || null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadExcel = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        return { success: false, error: 'Archivo debe ser Excel' };
      }
      
      const formData = new FormData();
      formData.append('file', file);
      setUploadProgress(30);
      
      const response = await fetch('/api/importaciones/upload', {
        method: 'POST',
        body: formData
      });
      
      setUploadProgress(70);
      const data = await response.json();
      setUploadProgress(100);
      
      if (response.ok) {
        await fetchImportaciones();
        return { success: true, data };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteImportacion = async (id: number) => {
    try {
      const response = await fetch(`/api/importaciones?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchImportaciones();
        return { success: true };
      }
      const data = await response.json();
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchImportaciones();
  }, []);

  return {
    importaciones,
    estadisticas,
    loading,
    uploading,
    uploadProgress,
    uploadExcel,
    deleteImportacion,
    refetch: fetchImportaciones
  };
}

export function getEstadoColor(estado: string): string {
  const colors: any = {
    'PENDIENTE': 'bg-gray-100 text-gray-800',
    'PROCESANDO': 'bg-blue-100 text-blue-800',
    'COMPLETADO': 'bg-green-100 text-green-800',
    'ERROR': 'bg-red-100 text-red-800',
    'PARCIAL': 'bg-yellow-100 text-yellow-800'
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
}

export function getEstadoLabel(estado: string): string {
  const labels: any = {
    'PENDIENTE': 'Pendiente',
    'PROCESANDO': 'Procesando',
    'COMPLETADO': 'Completado',
    'ERROR': 'Error',
    'PARCIAL': 'Parcial'
  };
  return labels[estado] || estado;
}

export function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
EOF

echo -e "✓ Hook creado"

# 7. Crear componente UI (versión compacta para el script)
echo -e "\n📝 Creando Dashboard UI..."
cat > src/app/dashboard/gestion-excel/page.tsx << 'EOF'
"use client";
import { useState, useRef } from 'react';
import { useImportaciones, getEstadoColor, getEstadoLabel, formatFecha } from '@/hooks/useImportaciones';

function UploadArea({ onFileSelect, uploading, uploadProgress }: any) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  
  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
  };
  
  return (
    <div className="mb-6">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        {uploading ? (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-md mx-auto">
              <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{uploadProgress}%</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Arrastra un archivo Excel aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400">Formatos: .xlsx, .xls (máx. 10MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GestionExcelPage() {
  const { importaciones, estadisticas, uploading, uploadProgress, uploadExcel, deleteImportacion } = useImportaciones();
  const [notification, setNotification] = useState<any>(null);
  
  const handleFileSelect = async (file: File) => {
    const result = await uploadExcel(file);
    setNotification({
      type: result.success ? 'success' : 'error',
      message: result.success ? `Importado: ${result.data?.codigoZuri}` : `Error: ${result.error}`
    });
    setTimeout(() => setNotification(null), 5000);
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta importación?')) {
      const result = await deleteImportacion(id);
      setNotification({
        type: result.success ? 'success' : 'error',
        message: result.success ? 'Eliminado' : `Error: ${result.error}`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Archivos Excel</h1>
        <p className="text-gray-600">Importa solicitudes de conductores</p>
      </div>
      
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        } border`}>
          <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {notification.message}
          </p>
        </div>
      )}
      
      <UploadArea onFileSelect={handleFileSelect} uploading={uploading} uploadProgress={uploadProgress} />
      
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Total Importaciones</h3>
            <p className="text-3xl font-bold text-blue-600">{estadisticas.total_importaciones}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Total Servicios</h3>
            <p className="text-3xl font-bold text-green-600">{estadisticas.total_servicios}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Doctores Nuevos</h3>
            <p className="text-3xl font-bold text-purple-600">{estadisticas.total_doctores_nuevos}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-600">Completadas</h3>
            <p className="text-3xl font-bold text-green-600">{estadisticas.importaciones_completadas}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Importaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código ZURI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registros</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {importaciones.map((imp) => (
                <tr key={imp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-blue-600">{imp.codigo_zuri}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{imp.nombre_archivo}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatFecha(imp.fecha_importacion)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(imp.estado)}`}>
                      {getEstadoLabel(imp.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-semibold text-green-600">{imp.registros_procesados}</span>
                    {' / '}
                    <span className="text-gray-500">{imp.total_registros}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(imp.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {importaciones.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay importaciones. Sube tu primer archivo Excel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
EOF

echo -e "✓ Dashboard UI creado"

# 8. Build y restart
echo -e "\n🔨 Compilando proyecto..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "\n✓ Build exitoso"
    echo -e "\n🔄 Reiniciando servidor PM2..."
    pm2 restart zuri-dev
    echo -e "\n✅ INSTALACIÓN COMPLETADA"
    echo -e "\nAccede a: https://zuri.pe/dashboard/gestion-excel"
else
    echo -e "\n❌ Error en el build. Revisa los errores arriba."
fi
