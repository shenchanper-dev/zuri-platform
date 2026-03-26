/**
 * ZURI NEMT Platform - Real-Time Driver Map with Service Status
 * 
 * Shows drivers on map with color-coded service status:
 * - DISPONIBLE (green) - Ready for assignment
 * - EN_CAMINO (blue) - Driving to pickup
 * - EN_ORIGEN (orange) - At pickup location
 * - EN_TRANSPORTE (purple) - Patient on board
 * - EN_DESTINO (teal) - At destination
 * - DESCONECTADO (gray) - Offline
 * 
 * Integrates with WebSocket for real-time updates
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, AlertCircle, Loader2, Wifi, WifiOff, Battery, Navigation } from 'lucide-react';
import { CarIcon } from './icons/CarIcon';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ConductorRealTime {
    id: number;
    nombre: string;
    foto?: string;
    latitud: number;
    longitud: number;
    estado: string;           // ACTIVO, INACTIVO, etc.
    estadoServicio: string;   // DISPONIBLE, EN_CAMINO, EN_ORIGEN, EN_TRANSPORTE, EN_DESTINO, DESCONECTADO
    telefono?: string;
    vehiculo?: {
        placa?: string;
        marca?: string;
        modelo?: string;
        color?: string;
    };
    // Real-time tracking data
    velocidad?: number;       // km/h
    rumbo?: number;           // 0-360 degrees
    bateria?: number;         // 0-100 %
    precision?: number;       // meters
    ultimaActualizacion?: string;
    estaConectado?: boolean;
}

interface MapaRealTimeProps {
    conductores: ConductorRealTime[];
    altura?: string;
    centroInicial?: [number, number];
    zoomInicial?: number;
    onConductorClick?: (conductor: ConductorRealTime) => void;
    onConductorSelect?: (conductor: ConductorRealTime | null) => void;
    wsConnected?: boolean;
    lastUpdate?: Date | null;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const ESTADO_SERVICIO_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
    'DISPONIBLE': { color: '#22c55e', label: 'Disponible', icon: '🟢' },
    'EN_CAMINO': { color: '#3b82f6', label: 'En Camino', icon: '🚗' },
    'EN_ORIGEN': { color: '#f97316', label: 'En Origen', icon: '📍' },
    'EN_TRANSPORTE': { color: '#8b5cf6', label: 'Transportando', icon: '🚑' },
    'EN_DESTINO': { color: '#14b8a6', label: 'En Destino', icon: '🏥' },
    'RETORNANDO': { color: '#06b6d4', label: 'Retornando', icon: '↩️' },
    'NO_DISPONIBLE': { color: '#f59e0b', label: 'No Disponible', icon: '⏸️' },
    'DESCONECTADO': { color: '#9ca3af', label: 'Desconectado', icon: '⭕' },
    'EMERGENCIA': { color: '#ef4444', label: 'Emergencia', icon: '🚨' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MapaRealTime: React.FC<MapaRealTimeProps> = ({
    conductores,
    altura = '500px',
    centroInicial = [-12.0464, -77.0428],
    zoomInicial = 12,
    onConductorClick,
    onConductorSelect,
    wsConnected = false,
    lastUpdate = null,
}) => {
    const [selectedConductor, setSelectedConductor] = useState<ConductorRealTime | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const mapRef = useRef<any>(null);

    // Filter valid conductores
    const conductoresValidos = useMemo(() => {
        return conductores.filter(c =>
            c.latitud && c.longitud &&
            c.latitud !== 0 && c.longitud !== 0 &&
            Math.abs(c.latitud) <= 90 && Math.abs(c.longitud) <= 180
        );
    }, [conductores]);

    // Group by status for legend
    const estadisticasEstado = useMemo(() => {
        const stats: Record<string, number> = {};
        conductoresValidos.forEach(c => {
            const estado = c.estadoServicio || 'DESCONECTADO';
            stats[estado] = (stats[estado] || 0) + 1;
        });
        return stats;
    }, [conductoresValidos]);

    // Handle conductor click
    const handleConductorClick = useCallback((conductor: ConductorRealTime) => {
        setSelectedConductor(conductor);
        onConductorClick?.(conductor);
        onConductorSelect?.(conductor);
    }, [onConductorClick, onConductorSelect]);

    // Get status config
    const getStatusConfig = (estadoServicio: string) => {
        return ESTADO_SERVICIO_CONFIG[estadoServicio] || ESTADO_SERVICIO_CONFIG['DESCONECTADO'];
    };

    // Battery icon color
    const getBatteryColor = (level?: number) => {
        if (!level) return '#9ca3af';
        if (level > 50) return '#22c55e';
        if (level > 20) return '#f59e0b';
        return '#ef4444';
    };

    // Load map
    useEffect(() => {
        const loadMap = async () => {
            try {
                await import('leaflet');
                setMapLoaded(true);
            } catch (err) {
                setMapError('Error al cargar el mapa');
            }
        };
        loadMap();
    }, []);

    // Loading state
    if (!mapLoaded && !mapError) {
        return (
            <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: altura }}>
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-gray-600">Cargando mapa en tiempo real...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (mapError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg flex items-center justify-center" style={{ height: altura }}>
                <div className="text-center p-6">
                    <AlertCircle size={40} className="mx-auto mb-2 text-red-500" />
                    <p className="text-red-700">{mapError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header with status */}
            <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-white via-white/95 to-transparent p-4">
                <div className="flex items-center justify-between">
                    {/* Connection status */}
                    <div className="flex items-center gap-2">
                        {wsConnected ? (
                            <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                <Wifi size={16} />
                                <span>En vivo</span>
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm">
                                <WifiOff size={16} />
                                <span>Desconectado</span>
                            </div>
                        )}

                        {lastUpdate && (
                            <span className="text-xs text-gray-500">
                                Actualizado: {lastUpdate.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {/* Driver count */}
                    <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                        {conductoresValidos.length} conductores
                    </div>
                </div>

                {/* Status legend */}
                <div className="flex flex-wrap gap-3 mt-3">
                    {Object.entries(estadisticasEstado).map(([estado, count]) => {
                        const config = getStatusConfig(estado);
                        return (
                            <div key={estado} className="flex items-center gap-1.5 text-xs">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: config.color }}
                                />
                                <span className="text-gray-600">{config.label}:</span>
                                <span className="font-bold text-gray-900">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Map placeholder - In production this would be the actual Leaflet map */}
            <div
                className="bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative"
                style={{ height: altura }}
            >
                {/* Grid of driver markers */}
                <div className="absolute inset-0 p-20">
                    <div className="relative w-full h-full">
                        {conductoresValidos.slice(0, 20).map((conductor, index) => {
                            const config = getStatusConfig(conductor.estadoServicio || 'DESCONECTADO');
                            // Calculate position based on lat/lng (normalized for demo)
                            const x = ((conductor.longitud + 77.1) / 0.2) * 100;
                            const y = ((conductor.latitud + 12.1) / 0.2) * 100;

                            return (
                                <button
                                    key={conductor.id}
                                    onClick={() => handleConductorClick(conductor)}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 
                    transition-all duration-200 hover:scale-125 hover:z-20
                    ${selectedConductor?.id === conductor.id ? 'scale-125 z-20' : ''}`}
                                    style={{
                                        left: `${Math.min(95, Math.max(5, x))}%`,
                                        top: `${Math.min(95, Math.max(5, y))}%`
                                    }}
                                    title={`${conductor.nombre} - ${config.label}`}
                                >
                                    {/* Ícono de auto SVG con rotación según rumbo */}
                                    <CarIcon
                                        heading={conductor.rumbo || 0}
                                        color={config.color}
                                        size={40}
                                        showShadow={true}
                                    />

                                    {/* Low battery indicator */}
                                    {conductor.bateria !== undefined && conductor.bateria < 20 && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                            <Battery size={10} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Map attribution */}
                <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                    © OpenStreetMap contributors
                </div>
            </div>

            {/* Selected conductor detail panel */}
            {selectedConductor && (
                <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white rounded-xl shadow-2xl p-4 animate-slide-up">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                            style={{ backgroundColor: getStatusConfig(selectedConductor.estadoServicio || 'DESCONECTADO').color }}
                        >
                            {selectedConductor.foto ? (
                                <img src={selectedConductor.foto} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                selectedConductor.nombre.charAt(0)
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 truncate">{selectedConductor.nombre}</h3>
                                <span
                                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: getStatusConfig(selectedConductor.estadoServicio || 'DESCONECTADO').color }}
                                >
                                    {getStatusConfig(selectedConductor.estadoServicio || 'DESCONECTADO').label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                {selectedConductor.vehiculo?.placa && (
                                    <p className="text-gray-600">
                                        <span className="font-medium">Placa:</span> {selectedConductor.vehiculo.placa}
                                    </p>
                                )}
                                {selectedConductor.telefono && (
                                    <p className="text-gray-600">
                                        <span className="font-medium">Tel:</span> {selectedConductor.telefono}
                                    </p>
                                )}
                                {selectedConductor.velocidad !== undefined && (
                                    <p className="text-gray-600">
                                        <span className="font-medium">Velocidad:</span> {selectedConductor.velocidad.toFixed(0)} km/h
                                    </p>
                                )}
                                {selectedConductor.bateria !== undefined && (
                                    <p className="text-gray-600 flex items-center gap-1">
                                        <span className="font-medium">Batería:</span>
                                        <Battery size={14} style={{ color: getBatteryColor(selectedConductor.bateria) }} />
                                        {selectedConductor.bateria}%
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => {
                                setSelectedConductor(null);
                                onConductorSelect?.(null);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default MapaRealTime;
