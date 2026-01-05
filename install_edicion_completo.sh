#!/bin/bash
echo "🔧 Instalando Sistema Completo de Edición"

# 1. API actualizar servicios
mkdir -p src/app/api/solicitudes-servicios/[id]
cat > src/app/api/solicitudes-servicios/[id]/route.ts << 'EOF1'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;
    
    ['fecha', 'hora_inicio', 'hora_fin', 'turno', 'clasificacion', 'descripcion', 'conductor_id', 'estado', 'observaciones'].forEach(campo => {
      if (body[campo] !== undefined) { updates.push(`${campo} = $${i}`); values.push(body[campo]); i++; }
    });
    
    if (!updates.length) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
    
    values.push(parseInt(params.id));
    const result = await client.query(`UPDATE solicitudes_servicios SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`, values);
    await client.end();
    return NextResponse.json({ success: true, servicio: result.rows[0] });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOF1

# 2. API conductores disponibles
mkdir -p src/app/api/conductores-disponibles
cat > src/app/api/conductores-disponibles/route.ts << 'EOF2'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const result = await client.query(`
      SELECT c.id, c."nombreCompleto" as nombre_completo, c."marcaAuto" as marca, c.modelo, c.placa, d.nombre as distrito
      FROM conductores c LEFT JOIN distritos d ON c."distritoId" = d.id
      WHERE c.estado = 'ACTIVO' ORDER BY c."nombreCompleto"
    `);
    await client.end();
    
    const conductores = result.rows.map(c => ({
      id: c.id, nombre_completo: c.nombre_completo,
      vehiculo: `${c.marca} ${c.modelo} - ${c.placa || 'S/N'}`,
      distrito: c.distrito || 'N/A'
    }));
    
    return NextResponse.json({ conductores });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOF2

# 3. Actualizar página principal con botón Ver/Editar
cat > src/app/dashboard/gestion-excel/page.tsx << 'EOF3'
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
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
  };
  
  return (
    <div className="mb-6">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} ${uploading ? 'opacity-60' : ''}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} className="hidden" />
        {uploading ? (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-md mx-auto">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-sm mt-2">{uploadProgress}%</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold mb-2">Arrastra archivo Excel o haz clic</p>
            <p className="text-xs text-gray-400">.xlsx, .xls (máx. 10MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalEditarServicios({ importacion, onClose, onSave }: any) {
  const [servicios, setServicios] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<any>(null);

  useState(() => {
    if (importacion) cargarDatos();
  });

  const cargarDatos = async () => {
    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/importaciones/${importacion.id}`),
        fetch('/api/conductores-disponibles')
      ]);
      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      setServicios(data1.servicios || []);
      setConductores(data2.conductores || []);
    } finally {
      setLoading(false);
    }
  };

  const guardar = async (id: number) => {
    await fetch(`/api/solicitudes-servicios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editando, estado: editando.conductor_id ? 'PROGRAMADO' : 'PENDIENTE' })
    });
    await cargarDatos();
    setEditando(null);
    onSave?.();
  };

  if (!importacion) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Editar Servicios - {importacion.codigo_zuri}</h2>
            <p className="text-sm text-gray-600">{importacion.nombre_archivo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {loading ? <div className="text-center py-12">Cargando...</div> : (
            <div className="space-y-4">
              {servicios.map((s, i) => (
                <div key={s.id} className="border rounded-lg p-4">
                  {editando?.id === s.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <input type="date" value={editando.fecha} onChange={e => setEditando({...editando, fecha: e.target.value})} className="px-2 py-1 border rounded" />
                        <input type="time" value={editando.hora_inicio} onChange={e => setEditando({...editando, hora_inicio: e.target.value})} className="px-2 py-1 border rounded" />
                        <input type="time" value={editando.hora_fin} onChange={e => setEditando({...editando, hora_fin: e.target.value})} className="px-2 py-1 border rounded" />
                      </div>
                      <select value={editando.conductor_id || ''} onChange={e => setEditando({...editando, conductor_id: e.target.value})} className="w-full px-2 py-1 border rounded">
                        <option value="">Sin conductor</option>
                        {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre_completo} - {c.vehiculo}</option>)}
                      </select>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditando(null)} className="px-3 py-1 border rounded">Cancelar</button>
                        <button onClick={() => guardar(s.id)} className="px-3 py-1 bg-blue-600 text-white rounded">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">#{i+1} {s.doctor_nombre}</div>
                        <div className="text-sm text-gray-600">{s.fecha_servicio} | {s.hora_inicio}-{s.hora_fin} | {s.descripcion}</div>
                        {s.conductor_nombre_completo && <div className="text-sm text-green-600 mt-1">🚗 {s.conductor_nombre_completo}</div>}
                      </div>
                      <button onClick={() => setEditando(s)} className="text-blue-600 text-sm">Editar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function GestionExcelPage() {
  const { importaciones, estadisticas, uploading, uploadProgress, uploadExcel, deleteImportacion } = useImportaciones();
  const [notification, setNotification] = useState<any>(null);
  const [modalEdicion, setModalEdicion] = useState<any>(null);

  const handleFileSelect = async (file: File) => {
    const result = await uploadExcel(file);
    setNotification({ type: result.success ? 'success' : 'error', message: result.success ? `Importado: ${result.data?.codigoZuri}` : result.error });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Archivos Excel</h1>
        <p className="text-gray-600">Importa solicitudes de conductores</p>
      </div>

      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${notification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{notification.message}</p>
        </div>
      )}

      <UploadArea onFileSelect={handleFileSelect} uploading={uploading} uploadProgress={uploadProgress} />

      {estadisticas && (
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Importaciones', value: estadisticas.total_importaciones, color: 'blue' },
            { label: 'Total Servicios', value: estadisticas.total_servicios, color: 'green' },
            { label: 'Doctores Nuevos', value: estadisticas.total_doctores_nuevos, color: 'purple' },
            { label: 'Completadas', value: estadisticas.importaciones_completadas, color: 'green' }
          ].map(stat => (
            <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm text-gray-600">{stat.label}</h3>
              <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Historial de Importaciones</h2></div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registros</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {importaciones.map(imp => (
              <tr key={imp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><span className="font-mono text-sm font-semibold text-blue-600">{imp.codigo_zuri}</span></td>
                <td className="px-6 py-4"><p className="text-sm font-medium truncate max-w-xs">{imp.nombre_archivo}</p></td>
                <td className="px-6 py-4 text-sm">{formatFecha(imp.fecha_importacion)}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(imp.estado)}`}>{getEstadoLabel(imp.estado)}</span></td>
                <td className="px-6 py-4 text-sm"><span className="font-semibold text-green-600">{imp.registros_procesados}</span> / {imp.total_registros}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setModalEdicion(imp)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver/Editar</button>
                    <button onClick={() => deleteImportacion(imp.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalEdicion && <ModalEditarServicios importacion={modalEdicion} onClose={() => setModalEdicion(null)} onSave={() => {}} />}
    </div>
  );
}
EOF3

echo "✓ Archivos creados"
npm run build && pm2 restart zuri-dev
echo "✅ Listo. Ahora tienes botón Ver/Editar en cada importación"
