import { useState, useEffect, useCallback } from 'react';

interface Servicio {
    id: number;
    paciente_id: number;
    paciente_nombre: string;
    origen: string;
    origen_lat: number;
    origen_lng: number;
    destino: string;
    destino_lat: number;
    destino_lng: number;
    fecha_servicio: string;
    hora_recojo: string;
    hora_fin?: string;
    tipo_servicio: 'ambulatory' | 'wheelchair' | 'stretcher';
    distancia_km: number;
    tarifa_calculada: number;
    estado: string;
    conductor_id?: number;
    conductor_nombre?: string;
    notas_especiales?: string;
}

interface Conductor {
    id: number;
    nombreCompleto: string;
    estado: string;
    calificacion_promedio: number;
    ultima_latitud: number | null;
    ultima_longitud: number | null;
    vehiculo_modelo?: string;
    vehiculo_placa?: string;
    vehiculo_color?: string;
    foto_url?: string;
    online: boolean;
}

interface Stats {
    activos: number;
    pendientes: number;
    completados: number;
    cancelados: number;
}

export function useServiciosEnVivo() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [conductores, setConductores] = useState<Conductor[]>([]);
    const [stats, setStats] = useState<Stats>({
        activos: 0,
        pendientes: 0,
        completados: 0,
        cancelados: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // Conectar a WebSocket
    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:3005');

        websocket.onopen = () => {
            console.log('[WebSocket] Conectado a servidor');
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Actualizar ubicación de conductor
                if (data.type === 'location_update') {
                    setConductores(prev => prev.map(c =>
                        c.id === data.conductor_id
                            ? { ...c, ultima_latitud: data.lat, ultima_longitud: data.lng }
                            : c
                    ));
                }

                // Servicio asignado
                if (data.type === 'SERVICIO_ASIGNADO') {
                    setServicios(prev => prev.map(s =>
                        s.id === data.servicio_id
                            ? { ...s, conductor_id: data.conductor_id, conductor_nombre: data.conductor_nombre, estado: 'ASIGNADO' }
                            : s
                    ));
                }
            } catch (err) {
                console.error('[WebSocket] Error parsing message:', err);
            }
        };

        websocket.onerror = (error) => {
            console.error('[WebSocket] Error:', error);
        };

        websocket.onclose = () => {
            console.log('[WebSocket] Desconectado');
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, []);

    // Cargar servicios del día
    const cargarServicios = useCallback(async (fecha?: string) => {
        setLoading(true);
        setError(null);

        try {
            const fechaParam = fecha || new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/servicios/hoy?fecha=${fechaParam}`);

            if (!response.ok) {
                throw new Error('Error al cargar servicios');
            }

            const data = await response.json();
            setServicios(data.servicios || []);
            setStats(data.stats || { activos: 0, pendientes: 0, completados: 0, cancelados: 0 });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar conductores activos
    const cargarConductores = useCallback(async () => {
        try {
            const response = await fetch('/api/conductores/activos');
            if (!response.ok) throw new Error('Error al cargar conductores');

            const data = await response.json();
            setConductores(data.conductores || []);
        } catch (err: any) {
            console.error('Error cargando conductores:', err);
        }
    }, []);

    // Solicitar nuevo servicio
    const solicitarServicio = useCallback(async (servicioData: Partial<Servicio>) => {
        try {
            const response = await fetch('/api/servicios/solicitar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(servicioData)
            });

            if (!response.ok) throw new Error('Error al solicitar servicio');

            const data = await response.json();
            await cargarServicios(); // Recargar lista
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [cargarServicios]);

    // Dispatch automático
    const dispatchAutomatico = useCallback(async (servicioId: number) => {
        try {
            const response = await fetch('/api/servicios/dispatch-automatico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ servicio_id: servicioId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error en dispatch automático');
            }

            const data = await response.json();
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Asignar conductor manualmente
    const asignarConductor = useCallback(async (servicioId: number, conductorId: number) => {
        try {
            const response = await fetch(`/api/servicios/ofertas/${servicioId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'aceptar', conductor_id: conductorId })
            });

            if (!response.ok) throw new Error('Error al asignar conductor');

            const data = await response.json();
            await cargarServicios(); // Recargar lista
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [cargarServicios]);

    // Actualizar estado de servicio
    const actualizarEstado = useCallback(async (servicioId: number, nuevoEstado: string) => {
        try {
            const response = await fetch(`/api/servicios/${servicioId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) throw new Error('Error al actualizar estado');

            await cargarServicios(); // Recargar lista
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [cargarServicios]);

    // Cargar datos iniciales
    useEffect(() => {
        cargarServicios();
        cargarConductores();

        // Auto-refresh cada 30 segundos
        const interval = setInterval(() => {
            cargarServicios();
            cargarConductores();
        }, 30000);

        return () => clearInterval(interval);
    }, [cargarServicios, cargarConductores]);

    return {
        servicios,
        conductores,
        stats,
        loading,
        error,
        cargarServicios,
        solicitarServicio,
        dispatchAutomatico,
        asignarConductor,
        actualizarEstado
    };
}
