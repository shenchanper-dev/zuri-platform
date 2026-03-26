/**
 * ZURI NEMT Platform - GPS Tracking Hook
 * 
 * Hook especializado para tracking de conductores en tiempo real.
 * Usa polling como fallback, preparado para WebSockets en futuro.
 * 
 * Principios: SOLID, Clean Architecture, Optimistic Updates
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWebSocketDashboard } from '@/hooks/useWebSocketDashboard';

// ============================================================================
// INTERFACES DE GPS TRACKING
// ============================================================================

export interface ConductorGPS {
    id: number;
    dni: string;
    nombreCompleto: string;
    latitud: number;
    longitud: number;
    ultimaActualizacion: string;
    precision?: number;
    velocidad?: number;
    rumbo?: number;
    nivelBateria?: number;
    estaConectado: boolean;
    estado: string;
    estadoConexion: 'ONLINE' | 'RECENT' | 'OFFLINE';
    vehiculo?: {
        marca?: string;
        modelo?: string;
        placa?: string;
        tipo?: string;
    };
    foto?: string;
}

export interface GPSEstadisticas {
    total: number;
    online: number;
    recent: number;
    offline: number;
    enRuta: number;
    enServicio: number;
    bateriaBaja: number;
    sinUbicacion: number;
    velocidadPromedio: number;
}

export interface GPSTrackingFilters {
    soloConectados?: boolean;
    estados?: string[];
    bateriaBaja?: boolean;
}

export interface UseGPSTrackingConfig {
    intervaloPolling?: number;      // Default: 10000ms (10s)
    autoStart?: boolean;            // Default: true
    filtros?: GPSTrackingFilters;
}

export interface UseGPSTrackingReturn {
    // Data
    conductores: ConductorGPS[];
    conductoresOnline: ConductorGPS[];
    conductoresRecent: ConductorGPS[];
    conductoresOffline: ConductorGPS[];
    estadisticas: GPSEstadisticas;

    // Estado
    loading: boolean;
    error: string | null;
    ultimaActualizacion: Date | null;
    polling: boolean;

    // Acciones
    refetch: () => Promise<void>;
    iniciarPolling: () => void;
    pausarPolling: () => void;
    configurarIntervalo: (ms: number) => void;
    aplicarFiltros: (filtros: GPSTrackingFilters) => void;
    buscarConductor: (id: number) => ConductorGPS | undefined;
    centrarEnConductor: (id: number) => ConductorGPS | undefined;
}

// ============================================================================
// API CLIENT PARA GPS
// ============================================================================

const API_GPS_URL = '/api/conductores/gps-tracking';

async function fetchConductoresGPS(filtros: GPSTrackingFilters = {}): Promise<{
    conductores: ConductorGPS[];
    total: number;
    timestamp: string;
}> {
    const params = new URLSearchParams();

    if (filtros.soloConectados !== undefined) {
        params.append('soloConectados', String(filtros.soloConectados));
    }

    if (filtros.estados?.length) {
        params.append('estado', filtros.estados.join(','));
    }

    const url = `${API_GPS_URL}?${params.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-Version': '2.0.0',
        },
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Transformar GeoJSON a array de ConductorGPS
    const conductores: ConductorGPS[] = data.conductores?.features?.map((feature: any) => ({
        id: feature.properties.id,
        dni: feature.properties.dni,
        nombreCompleto: feature.properties.nombreCompleto,
        latitud: feature.geometry.coordinates[1],  // GeoJSON usa [lng, lat]
        longitud: feature.geometry.coordinates[0],
        ultimaActualizacion: feature.properties.ultimaActualizacion,
        precision: feature.properties.precision,
        velocidad: feature.properties.velocidad,
        rumbo: feature.properties.rumbo,
        nivelBateria: feature.properties.nivelBateria,
        estaConectado: feature.properties.estaConectado,
        estado: feature.properties.estado,
        estadoConexion: feature.properties.estadoConexion,
        vehiculo: feature.properties.vehiculo,
        foto: feature.properties.foto,
    })) || [];

    return {
        conductores,
        total: data.total || conductores.length,
        timestamp: data.timestamp || new Date().toISOString(),
    };
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useGPSTracking(config: UseGPSTrackingConfig = {}): UseGPSTrackingReturn {
    const {
        intervaloPolling = 10000, // 10 segundos
        autoStart = true,
        filtros: filtrosIniciales = {},
    } = config;

    // ============================================
    // ESTADO
    // ============================================

    const [conductores, setConductores] = useState<ConductorGPS[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
    const [polling, setPolling] = useState(autoStart);
    const [intervalo, setIntervalo] = useState(intervaloPolling);
    const [filtros, setFiltros] = useState<GPSTrackingFilters>(filtrosIniciales);

    const ws = useWebSocketDashboard();

    // Refs para control de polling
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // ============================================
    // FETCH DE DATOS
    // ============================================

    const refetch = useCallback(async () => {
        if (!isMountedRef.current) return;

        setLoading(true);
        setError(null);

        try {
            const data = await fetchConductoresGPS(filtros);

            if (isMountedRef.current) {
                setConductores(data.conductores);
                setUltimaActualizacion(new Date(data.timestamp));
                console.log(`📍 [GPS] ${data.total} conductores actualizados - ${new Date().toLocaleTimeString()}`);
            }
        } catch (err: any) {
            if (isMountedRef.current) {
                console.error('❌ [GPS] Error al obtener ubicaciones:', err);
                setError(err.message || 'Error al obtener ubicaciones GPS');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [filtros]);

    useEffect(() => {
        const unsubLocation = ws.onLocationUpdate((data) => {
            setConductores((prev) => {
                const idx = prev.findIndex((c) => c.id === data.conductorId);
                if (idx === -1) return prev;
                const updated: ConductorGPS = {
                    ...prev[idx],
                    latitud: data.latitude,
                    longitud: data.longitude,
                    rumbo: data.heading ?? prev[idx].rumbo,
                    velocidad: data.speed ?? prev[idx].velocidad,
                    precision: data.accuracy ?? prev[idx].precision,
                    nivelBateria: data.batteryLevel ?? prev[idx].nivelBateria,
                    estaConectado: true,
                    estadoConexion: 'ONLINE',
                    ultimaActualizacion: data.timestamp,
                };
                const copy = prev.slice();
                copy[idx] = updated;
                return copy;
            });
            setUltimaActualizacion(new Date(data.timestamp));
        });

        const unsubConnected = ws.onDriverConnected((id) => {
            setConductores((prev) => prev.map((c) => (c.id === id ? { ...c, estaConectado: true, estadoConexion: 'ONLINE' } : c)));
        });

        const unsubDisconnected = ws.onDriverDisconnected((id) => {
            setConductores((prev) => prev.map((c) => (c.id === id ? { ...c, estaConectado: false, estadoConexion: 'OFFLINE' } : c)));
        });

        return () => {
            unsubLocation();
            unsubConnected();
            unsubDisconnected();
        };
    }, [ws]);

    // ============================================
    // CONTROL DE POLLING
    // ============================================

    const iniciarPolling = useCallback(() => {
        setPolling(true);
    }, []);

    const pausarPolling = useCallback(() => {
        setPolling(false);
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const configurarIntervalo = useCallback((ms: number) => {
        if (ms >= 5000 && ms <= 60000) { // Entre 5s y 60s
            setIntervalo(ms);
        }
    }, []);

    // Efecto para manejar el polling
    useEffect(() => {
        if (!polling) return;

        // Fetch inicial inmediato
        refetch();

        // Configurar intervalo
        pollingRef.current = setInterval(() => {
            refetch();
        }, intervalo);

        console.log(`🔄 [GPS] Polling iniciado cada ${intervalo / 1000}s`);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [polling, intervalo, refetch]);

    // Cleanup al desmontar
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    // ============================================
    // FILTROS Y UTILIDADES
    // ============================================

    const aplicarFiltros = useCallback((nuevosFiltros: GPSTrackingFilters) => {
        setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
    }, []);

    const buscarConductor = useCallback((id: number) => {
        return conductores.find(c => c.id === id);
    }, [conductores]);

    const centrarEnConductor = useCallback((id: number) => {
        const conductor = conductores.find(c => c.id === id);
        if (conductor) {
            console.log(`🎯 [GPS] Centrando en conductor ${conductor.nombreCompleto}`);
        }
        return conductor;
    }, [conductores]);

    // ============================================
    // DATOS COMPUTADOS (MEMOIZADOS)
    // ============================================

    const conductoresOnline = useMemo(() =>
        conductores.filter(c => c.estadoConexion === 'ONLINE'),
        [conductores]
    );

    const conductoresRecent = useMemo(() =>
        conductores.filter(c => c.estadoConexion === 'RECENT'),
        [conductores]
    );

    const conductoresOffline = useMemo(() =>
        conductores.filter(c => c.estadoConexion === 'OFFLINE'),
        [conductores]
    );

    const estadisticas = useMemo<GPSEstadisticas>(() => {
        const velocidades = conductores
            .filter(c => c.velocidad && c.velocidad > 0)
            .map(c => c.velocidad!);

        return {
            total: conductores.length,
            online: conductoresOnline.length,
            recent: conductoresRecent.length,
            offline: conductoresOffline.length,
            enRuta: conductores.filter(c => c.estado === 'EN_RUTA').length,
            enServicio: conductores.filter(c => c.estado === 'EN_SERVICIO').length,
            bateriaBaja: conductores.filter(c => c.nivelBateria !== undefined && c.nivelBateria !== null && c.nivelBateria < 20).length,
            sinUbicacion: 0, // Se calculará en el componente comparando con total de conductores
            velocidadPromedio: velocidades.length > 0
                ? velocidades.reduce((a, b) => a + b, 0) / velocidades.length
                : 0,
        };
    }, [conductores, conductoresOnline, conductoresRecent, conductoresOffline]);

    // ============================================
    // RETURN INMUTABLE
    // ============================================

    return {
        conductores: [...conductores],
        conductoresOnline,
        conductoresRecent,
        conductoresOffline,
        estadisticas,
        loading,
        error,
        ultimaActualizacion,
        polling,
        refetch,
        iniciarPolling,
        pausarPolling,
        configurarIntervalo,
        aplicarFiltros,
        buscarConductor,
        centrarEnConductor,
    };
}

export default useGPSTracking;
