'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from '@/components/LeafletComponents';

interface ConductorFlota {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    estado: string;
    estadoConexion: 'ONLINE' | 'RECENT' | 'OFFLINE';
    telefono?: string;
    vehiculo?: string;
    placa?: string;
    ultimaActualizacion?: string;
}

interface MapaFlotaJPSACProps {
    altura?: string;
    onRefresh?: () => void;
}

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];

function clasificarConexion(ultimaAct: string | null): 'ONLINE' | 'RECENT' | 'OFFLINE' {
    if (!ultimaAct) return 'OFFLINE';
    const diff = Date.now() - new Date(ultimaAct).getTime();
    const minutos = diff / 60000;
    if (minutos < 5) return 'ONLINE';
    if (minutos < 30) return 'RECENT';
    return 'OFFLINE';
}

export default function MapaFlotaJPSAC({ altura = '450px', onRefresh }: MapaFlotaJPSACProps) {
    const [conductores, setConductores] = useState<ConductorFlota[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [leafletReady, setLeafletReady] = useState(false);
    const [filtro, setFiltro] = useState<'todos' | 'ONLINE' | 'RECENT' | 'OFFLINE'>('todos');

    useEffect(() => {
        import('leaflet').then((L) => {
            delete (L.default.Icon.Default.prototype as any)._getIconUrl;
            L.default.Icon.Default.mergeOptions({
                iconRetinaUrl: '/leaflet/marker-icon-2x.png',
                iconUrl: '/leaflet/marker-icon.png',
                shadowUrl: '/leaflet/marker-shadow.png',
            });
            setLeafletReady(true);
        }).catch(() => setError('Error cargando mapa'));
    }, []);

    const cargarConductores = useCallback(async () => {
        try {
            const res = await fetch('/api/conductores/gps-tracking?soloConectados=false');
            if (!res.ok) throw new Error('Error cargando flota');
            const data = await res.json();

            // API returns { conductores: { type: "FeatureCollection", features: [...] } }
            const featureCollection = data.conductores || data;
            const features = Array.isArray(featureCollection)
                ? featureCollection
                : (featureCollection.features || []);
            const mapped: ConductorFlota[] = features.map((f: any) => {
                const props = f.properties || f;
                const coords = f.geometry?.coordinates;
                return {
                    id: props.id || props.conductorId,
                    nombre: props.nombreCompleto || props.nombre || 'Sin nombre',
                    latitud: coords ? coords[1] : (props.latitud || 0),
                    longitud: coords ? coords[0] : (props.longitud || 0),
                    estado: props.estado || 'DESCONOCIDO',
                    estadoConexion: props.estadoConexion || clasificarConexion(props.ultimaActualizacion || props.ultimaActualizacionGPS),
                    telefono: props.telefono || props.celular1,
                    vehiculo: props.vehiculo?.modelo || props.modeloVehiculo || '',
                    placa: props.vehiculo?.placa || props.placaVehiculo || '',
                    ultimaActualizacion: props.ultimaActualizacion || props.ultimaActualizacionGPS,
                };
            }).filter((c: ConductorFlota) => c.latitud !== 0 && c.longitud !== 0);

            setConductores(mapped);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarConductores();
        const interval = setInterval(cargarConductores, 15000);
        return () => clearInterval(interval);
    }, [cargarConductores]);

    const conductoresFiltrados = useMemo(() => {
        if (filtro === 'todos') return conductores;
        return conductores.filter(c => c.estadoConexion === filtro);
    }, [conductores, filtro]);

    const stats = useMemo(() => ({
        online: conductores.filter(c => c.estadoConexion === 'ONLINE').length,
        recent: conductores.filter(c => c.estadoConexion === 'RECENT').length,
        offline: conductores.filter(c => c.estadoConexion === 'OFFLINE').length,
        total: conductores.length,
    }), [conductores]);

    if (!leafletReady && !error) {
        return (
            <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: altura }}>
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-blue-500" />
                    <p className="text-gray-600 text-sm">Cargando mapa de flota...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl flex items-center justify-center" style={{ height: altura }}>
                <div className="text-center p-6">
                    <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
                    <p className="text-red-700 font-medium">{error}</p>
                    <button onClick={cargarConductores} className="mt-3 text-sm bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Stats overlay */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow-lg p-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">Flota GPS en Vivo</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <button onClick={() => setFiltro(filtro === 'ONLINE' ? 'todos' : 'ONLINE')} className={`flex items-center gap-1.5 ${filtro === 'ONLINE' ? 'font-bold' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                        <span>{stats.online} En línea</span>
                    </button>
                    <button onClick={() => setFiltro(filtro === 'RECENT' ? 'todos' : 'RECENT')} className={`flex items-center gap-1.5 ${filtro === 'RECENT' ? 'font-bold' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
                        <span>{stats.recent} Recientes</span>
                    </button>
                    <button onClick={() => setFiltro(filtro === 'OFFLINE' ? 'todos' : 'OFFLINE')} className={`flex items-center gap-1.5 ${filtro === 'OFFLINE' ? 'font-bold' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
                        <span>{stats.offline} Offline</span>
                    </button>
                    <button onClick={() => { setFiltro('todos'); cargarConductores(); onRefresh?.(); }} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800">
                        <RefreshCw size={10} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Map */}
            <div style={{ height: altura, width: '100%' }}>
                <MapContainer {...({} as any)}
                    center={LIMA_CENTER}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {conductoresFiltrados.map((c) => (
                        <Marker
                            key={c.id}
                            position={[c.latitud, c.longitud]}
                        >
                            <Popup>
                                <div className="min-w-[200px] text-sm">
                                    <div className="font-bold text-gray-900 mb-1">{c.nombre}</div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className={`w-2 h-2 rounded-full ${
                                            c.estadoConexion === 'ONLINE' ? 'bg-green-500' :
                                            c.estadoConexion === 'RECENT' ? 'bg-yellow-500' : 'bg-gray-400'
                                        }`}></span>
                                        <span className="text-xs text-gray-600">
                                            {c.estadoConexion === 'ONLINE' ? 'En línea' :
                                             c.estadoConexion === 'RECENT' ? 'Reciente' : 'Desconectado'}
                                        </span>
                                    </div>
                                    {c.vehiculo && <p className="text-gray-600">🚗 {c.vehiculo} {c.placa}</p>}
                                    {c.telefono && <p className="text-gray-600">📱 {c.telefono}</p>}
                                    {c.ultimaActualizacion && (
                                        <p className="text-gray-400 text-xs mt-1">
                                            Última señal: {new Date(c.ultimaActualizacion).toLocaleString('es-PE')}
                                        </p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
