'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ServicioJPSAC {
    id: number;
    fecha: string;
    hora_inicio: string | null;
    hora_fin: string | null;
    turno: string | null;
    doctor_nombre: string;
    paciente_nombre: string | null;
    paciente_dni: string | null;
    paciente_telefono: string | null;
    cliente_nombre: string | null;
    tipo_servicio: string | null;
    area: string | null;
    descripcion: string | null;
    ubicacion: string | null;
    distrito: string | null;
    direccion_recojo: string | null;
    distrito_recojo: string | null;
    direccion_destino: string | null;
    distrito_destino: string | null;
    conductor_id: number | null;
    conductor_nombre: string | null;
    placa: string | null;
    estado: string | null;
    observaciones: string | null;
    paciente_movilidad: string | null;
    requiere_oxigeno: boolean | null;
    conductor_nombre_completo: string | null;
    conductor_telefono: string | null;
    conductor_vehiculo: string | null;
    conductor_placa: string | null;
    conductor_foto: string | null;
}

export interface JPSACStats {
    total: number;
    activos: number;
    pendientes: number;
    completados: number;
    cancelados: number;
}

export interface TipoServicioCount {
    tipo_servicio: string;
    cantidad: number;
}

export function useServiciosJPSAC() {
    const [servicios, setServicios] = useState<ServicioJPSAC[]>([]);
    const [stats, setStats] = useState<JPSACStats>({ total: 0, activos: 0, pendientes: 0, completados: 0, cancelados: 0 });
    const [tiposServicio, setTiposServicio] = useState<TipoServicioCount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarServicios = useCallback(async (fecha?: string, filtroTipo?: string) => {
        setLoading(true);
        setError(null);

        try {
            const fechaParam = fecha || new Date().toISOString().split('T')[0];
            let url = `/api/servicios/jpsac?fecha=${fechaParam}`;
            if (filtroTipo) url += `&tipo_servicio=${encodeURIComponent(filtroTipo)}`;

            const response = await fetch(url);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al cargar servicios JPSAC');
            }

            const data = await response.json();
            setServicios(data.servicios || []);
            setStats(data.stats || { total: 0, activos: 0, pendientes: 0, completados: 0, cancelados: 0 });
            setTiposServicio(data.tiposServicio || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarServicios();
        const interval = setInterval(() => cargarServicios(), 60000);
        return () => clearInterval(interval);
    }, [cargarServicios]);

    return {
        servicios,
        stats,
        tiposServicio,
        loading,
        error,
        cargarServicios,
    };
}
