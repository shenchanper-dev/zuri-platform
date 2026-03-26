'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useImportaciones, getEstadoColor, formatFecha } from '@/hooks/useImportaciones';
import { BotonGenerarProgramacion } from '@/components/BotonGenerarProgramacion';

// ============================================================================
// UPLOAD AREA
// ============================================================================
function UploadArea({
  onFileSelect,
  uploading,
  uploadProgress
}: {
  onFileSelect: (file: File) => void;
  uploading: boolean;
  uploadProgress: number;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
  }, [onFileSelect]);

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-300 ease-in-out
        ${dragActive
          ? 'border-emerald-400 bg-emerald-50 scale-[1.02] shadow-lg shadow-emerald-100'
          : uploading
            ? 'border-blue-300 bg-blue-50 cursor-wait'
            : 'border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/50'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
        disabled={uploading}
      />

      {uploading ? (
        <div className="space-y-4">
          <div className="animate-pulse text-4xl">📊</div>
          <p className="text-blue-700 font-semibold">Procesando archivo...</p>
          <div className="max-w-xs mx-auto">
            <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-blue-500 mt-1">{uploadProgress}%</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-4xl">
            {dragActive ? '📥' : '📁'}
          </div>
          <div>
            <p className="text-gray-700 font-semibold">
              {dragActive ? 'Soltar archivo aquí' : 'Arrastra un archivo Excel o haz clic'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Formatos: .xlsx, .xls, .csv
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================
function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: number | string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// IMPORT ROW
// ============================================================================
function ImportRow({
  imp,
  onDelete,
  onRefresh
}: {
  imp: any;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const estadoColor = getEstadoColor(imp.estado);
  const detalleHref = `/dashboard/gestion-excel/view/${imp.id}`;
  const detalleTitle = 'Ver Detalle';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900 text-sm">{imp.nombre_archivo}</p>
          <p className="text-xs text-gray-400">{imp.codigo_zuri}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatFecha(imp.fecha_importacion)}
      </td>
      <td className="px-4 py-3">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: estadoColor }}
        >
          {imp.estado}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-semibold text-gray-900">{imp.registros_procesados}</span>
        {imp.registros_error > 0 && (
          <span className="text-xs text-red-500 ml-1">({imp.registros_error} err)</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {imp.doctores_nuevos > 0 ? (
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
            +{imp.doctores_nuevos}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {imp.programaciones_creadas > 0 ? (
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {imp.programaciones_creadas}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 justify-end">
          <Link
            href={detalleHref}
            className="text-blue-600 hover:text-blue-800 text-lg transition-colors p-1 rounded hover:bg-blue-50"
            title={detalleTitle}
          >
            👁️
          </Link>

          {imp.estado === 'COMPLETADO' && imp.programaciones_creadas === 0 && (
            <BotonGenerarProgramacion
              importacionId={imp.id}
              codigoZuri={imp.codigo_zuri || imp.nombre_archivo}
              onSuccess={onRefresh}
            />
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(imp.id); setConfirmDelete(false); }}
                className="text-red-600 hover:text-red-800 text-xs font-medium"
              >
                ✓ Sí
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                ✗ No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-gray-400 hover:text-red-500 text-sm transition-colors p-1 rounded hover:bg-red-50"
              title="Eliminar"
            >
              🗑️
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function GestionExcelPage() {
  const {
    importaciones, stats, loading, uploading, uploadProgress, error,
    uploadFile, deleteImportacion, fetchImportaciones
  } = useImportaciones();

  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileSelect = async (file: File) => {
    try {
      const result = await uploadFile(file);
      setUploadResult(result);
      setTimeout(() => setUploadResult(null), 8000);
    } catch {
      // Error already handled by hook
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Gestión Excel</h1>
          <p className="text-gray-500 text-sm mt-1">
            Importa archivos Excel, gestiona servicios y genera programaciones
          </p>
        </div>
        <button
          onClick={fetchImportaciones}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Upload Area */}
      <UploadArea
        onFileSelect={handleFileSelect}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />

      {/* Upload Result */}
      {uploadResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-600 text-lg">✅</span>
            <h3 className="font-semibold text-emerald-800">Importación Exitosa</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-emerald-600 font-medium">{uploadResult.procesados}</span>
              <span className="text-emerald-700"> servicios procesados</span>
            </div>
            {uploadResult.errores > 0 && (
              <div>
                <span className="text-red-600 font-medium">{uploadResult.errores}</span>
                <span className="text-red-700"> errores</span>
              </div>
            )}
            {uploadResult.doctoresNuevos > 0 && (
              <div>
                <span className="text-amber-600 font-medium">{uploadResult.doctoresNuevos}</span>
                <span className="text-amber-700"> doctores nuevos</span>
              </div>
            )}
          </div>
          {uploadResult.mapeoDetectado?.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-emerald-600 cursor-pointer hover:underline">
                Ver columnas detectadas ({uploadResult.mapeoDetectado.length})
              </summary>
              <div className="mt-2 flex flex-wrap gap-1">
                {uploadResult.mapeoDetectado.map((m: any, i: number) => (
                  <span key={i} className="bg-white border border-emerald-200 px-2 py-0.5 rounded text-xs">
                    <strong>{m.campo}</strong>: {m.columna}
                  </span>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📥" label="Total Importaciones" value={stats.total} color="bg-blue-50" />
        <StatCard icon="✅" label="Completadas" value={stats.completadas} color="bg-emerald-50" />
        <StatCard icon="📋" label="Servicios Procesados" value={stats.total_servicios} color="bg-purple-50" />
        <StatCard icon="👨‍⚕️" label="Doctores Nuevos" value={stats.doctores_nuevos} color="bg-amber-50" />
      </div>

      {/* Import History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Historial de Importaciones</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <p className="mt-2 text-sm">Cargando importaciones...</p>
          </div>
        ) : importaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No hay importaciones aún. Sube un archivo Excel para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Archivo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Registros</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Nuevos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Prog.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {importaciones.map((imp) => (
                  <ImportRow
                    key={imp.id}
                    imp={imp}
                    onDelete={deleteImportacion}
                    onRefresh={fetchImportaciones}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
