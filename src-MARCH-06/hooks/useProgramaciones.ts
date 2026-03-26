"use client";

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TIPOS
// ============================================================================

export interface Programacion {
    id: number;
    codigo_programacion: string;
    importacion_id: number | null;
    fecha_programacion: string;
    cliente_id: number | null;
    cliente_nombre: string | null;
    cliente_especial_id: number | null;
    cliente_especial_nombre?: string;
    tipo_servicio_id: number | null;
    tipo_servicio_nombre?: string;
    estado: 'BORRADOR' | 'CONFIRMADO' | 'EN_EJECUCION' | 'COMPLETADO' | 'CANCELADO';
    notas: string | null;
    creado_por: string | null;
    created_at: string;
    updated_at: string;
    // Campos de vista resumen
    total_detalles?: number;
    detalles_asignados?: number;
    detalles_completados?: number;
}

export interface ProgramacionDetalle {
    id: number;
    programacion_id: number;
    solicitud_servicio_id: number | null;
    tipo_servicio_id: number | null;
    tipo_servicio_nombre?: string;
    area_servicio_id: number | null;
    area_nombre?: string;
    cliente_id: number | null;
    cliente_nombre: string | null;
    cliente_especial_id: number | null;
    doctor_id: number | null;
    doctor_nombre: string;
    doctor_clinica_id: number | null;
    paciente_id: number | null;
    conductor_id: number | null;
    conductor_nombre: string | null;
    conductor_nombre_bd?: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    turno: string | null;
    ubicacion: string | null;
    direccion_completa: string | null;
    estado: string;
    calificacion_id: number | null;
    calificacion_desc?: string;
    calificacion_color?: string;
    calificacion_detalle: string | null;
    motivo_no_disponibilidad_id: number | null;
    motivo_desc?: string;
    observaciones: string | null;
    incidencias: string | null;
    orden: number | null;
}

export interface ProgramacionStats {
    total: number;
    borradores: number;
    confirmados: number;
    en_ejecucion: number;
    completados: number;
}

export interface ClienteEspecial {
    id: number;
    codigo: string;
    nombre: string;
    nombre_completo: string;
    activo: boolean;
}

interface FiltrosProgramacion {
    estado?: string;
    fecha?: string;
    clienteEspecialId?: number;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useProgramaciones() {
    const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
    const [stats, setStats] = useState<ProgramacionStats>({
        total: 0, borradores: 0, confirmados: 0, en_ejecucion: 0, completados: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<FiltrosProgramacion>({});

    // Detalle
    const [programacionActiva, setProgramacionActiva] = useState<Programacion | null>(null);
    const [detalles, setDetalles] = useState<ProgramacionDetalle[]>([]);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    // Cargar listado
    const cargarProgramaciones = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.fecha) params.append('fecha', filtros.fecha);

            const res = await fetch(`/api/programaciones?${params.toString()}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();

            setProgramaciones(data.programaciones || []);
            setStats(data.stats || { total: 0, borradores: 0, confirmados: 0, en_ejecucion: 0, completados: 0 });
        } catch (err: any) {
            setError(err.message);
            console.error('❌ [Programaciones] Error cargando:', err);
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    // Cargar detalle de una programación
    const cargarDetalle = useCallback(async (id: number) => {
        setLoadingDetalle(true);
        try {
            const res = await fetch(`/api/programaciones/${id}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();

            setProgramacionActiva(data.programacion);
            setDetalles(data.detalles || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

    // Actualizar estado de programación
    const actualizarEstado = useCallback(async (id: number, estado: string) => {
        try {
            const res = await fetch(`/api/programaciones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado }),
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            await cargarProgramaciones();
            if (programacionActiva?.id === id) {
                await cargarDetalle(id);
            }
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    }, [cargarProgramaciones, cargarDetalle, programacionActiva]);

    // Asignar conductor a un detalle
    const asignarConductor = useCallback(async (
        detalleId: number, conductorId: number, conductorNombre: string
    ) => {
        try {
            const res = await fetch(`/api/programacion-detalles/${detalleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conductor_id: conductorId,
                    conductor_nombre: conductorNombre,
                    estado: 'ASIGNADO',
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Error ${res.status}`);
            }
            // Recargar detalle
            if (programacionActiva) {
                await cargarDetalle(programacionActiva.id);
            }
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    }, [cargarDetalle, programacionActiva]);

    // Eliminar programación
    const eliminarProgramacion = useCallback(async (id: number) => {
        try {
            const res = await fetch(`/api/programaciones/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            await cargarProgramaciones();
            if (programacionActiva?.id === id) {
                setProgramacionActiva(null);
                setDetalles([]);
            }
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    }, [cargarProgramaciones, programacionActiva]);

    // Cerrar detalle
    const cerrarDetalle = useCallback(() => {
        setProgramacionActiva(null);
        setDetalles([]);
    }, []);

    // Auto-cargar al montar y cuando cambian filtros
    useEffect(() => {
        cargarProgramaciones();
    }, [cargarProgramaciones]);

    return {
        // Listado
        programaciones,
        stats,
        loading,
        error,
        filtros,
        setFiltros,
        cargarProgramaciones,

        // Detalle
        programacionActiva,
        detalles,
        loadingDetalle,
        cargarDetalle,
        cerrarDetalle,

        // Acciones
        actualizarEstado,
        asignarConductor,
        eliminarProgramacion,
    };
}
