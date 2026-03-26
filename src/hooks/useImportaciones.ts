'use client';
import { useState, useEffect, useCallback } from 'react';

export interface Importacion {
    id: number;
    codigo_zuri: string;
    nombre_archivo: string;
    tipo_archivo: string;
    fecha_archivo: string;
    estado: string;
    total_registros: number;
    registros_procesados: number;
    registros_error: number;
    doctores_nuevos: number;
    fecha_importacion: string;
    programaciones_creadas: number;
}

export interface ImportacionStats {
    total: number;
    completadas: number;
    procesando: number;
    total_servicios: number;
    doctores_nuevos: number;
}

export function useImportaciones() {
    const [importaciones, setImportaciones] = useState<Importacion[]>([]);
    const [stats, setStats] = useState<ImportacionStats>({
        total: 0, completadas: 0, procesando: 0, total_servicios: 0, doctores_nuevos: 0
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const fetchImportaciones = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/importaciones');
            const data = await res.json();
            setImportaciones(data.importaciones || []);
            setStats(data.stats || { total: 0, completadas: 0, procesando: 0, total_servicios: 0, doctores_nuevos: 0 });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchImportaciones();
    }, [fetchImportaciones]);

    const uploadFile = useCallback(async (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        setError(null);
        try {
            // Simular progreso
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 15, 85));
            }, 200);

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/importaciones/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            setUploadProgress(90);

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al subir archivo');
            }

            // ── AUTO-CREAR PROGRAMACIÓN ──────────────────────────────────
            // Después de importar exitosamente, crear automáticamente la
            // programación con código ZPROG consecutivo
            const importacionIdCreado = data.importacionId || data.importacion?.id;
            if (importacionIdCreado) {
                try {
                    setUploadProgress(95);
                    await fetch('/api/programaciones/desde-importacion', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ importacion_id: importacionIdCreado })
                    });
                } catch (progErr) {
                    console.warn('Auto-programación no se pudo crear:', progErr);
                    // No lanzar error — la importación ya fue exitosa
                }
            }

            setUploadProgress(100);

            // Refrescar lista
            await fetchImportaciones();

            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1500);
        }
    }, [fetchImportaciones]);

    const deleteImportacion = useCallback(async (id: number) => {
        try {
            const res = await fetch(`/api/importaciones?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            await fetchImportaciones();
        } catch (err: any) {
            setError(err.message);
        }
    }, [fetchImportaciones]);

    const generarProgramacion = useCallback(async (importacionId: number) => {
        try {
            const res = await fetch('/api/programaciones/desde-importacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ importacion_id: importacionId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await fetchImportaciones();
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [fetchImportaciones]);

    return {
        importaciones, stats, loading, uploading, uploadProgress, error,
        fetchImportaciones, uploadFile, deleteImportacion, generarProgramacion
    };
}

export const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
        'COMPLETADO': '#10b981',
        'PROCESANDO': '#f59e0b',
        'PARCIAL': '#f97316',
        'ERROR': '#ef4444',
        'PENDIENTE': '#6b7280'
    };
    return colores[estado] || '#6b7280';
};

export const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    try {
        return new Date(fecha).toLocaleDateString('es-PE', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch { return fecha; }
};
