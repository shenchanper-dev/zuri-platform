import { MapContainer, TileLayer, Marker, Popup } from './LeafletComponents';
// components/MapaConductoresNEMT.tsx - Versión mejorada con manejo de errores
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Importación dinámica de Leaflet para evitar errores de SSR


// Interfaces
interface ConductorMapa {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  telefono: string;
  vehiculo: string;
}

interface MapaConductoresNEMTProps {
  conductores: ConductorMapa[];
  altura?: string;
  centroInicial?: [number, number];
  zoomInicial?: number;
  onConductorClick?: (conductor: ConductorMapa) => void;
}

// Hook para manejar Leaflet de forma segura
const useLeafletSafe = () => {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [leafletError, setLeafletError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Pre-cargar Leaflet de forma segura
        await import('leaflet');
        await import('react-leaflet');
        
        // Configurar iconos de Leaflet
        const L = (await import('leaflet')).default;
        
        // Fix para iconos de Leaflet en Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        });
        
        setLeafletLoaded(true);
        console.log('✅ [MapaGPS] Leaflet cargado exitosamente');
      } catch (error) {
        console.error('❌ [MapaGPS] Error al cargar Leaflet:', error);
        setLeafletError('Error al cargar el mapa. Intente recargar la página.');
        setLeafletLoaded(false);
      }
    };

    loadLeaflet();
  }, []);

  return { leafletLoaded, leafletError };
};

// Componente principal
export const MapaConductoresNEMT: React.FC<MapaConductoresNEMTProps> = ({
  conductores,
  altura = '400px',
  centroInicial = [-12.0464, -77.0428], // Lima, Perú
  zoomInicial = 11,
  onConductorClick
}) => {
  const { leafletLoaded, leafletError } = useLeafletSafe();
  const [selectedConductor, setSelectedConductor] = useState<ConductorMapa | null>(null);

  // Filtrar conductores con coordenadas válidas
  const conductoresValidos = useMemo(() => {
    return conductores.filter(c => 
      c.latitud && c.longitud && 
      c.latitud !== 0 && c.longitud !== 0 &&
      Math.abs(c.latitud) <= 90 && Math.abs(c.longitud) <= 180
    );
  }, [conductores]);

  // Manejar click en conductor
  const handleConductorClick = useCallback((conductor: ConductorMapa) => {
    setSelectedConductor(conductor);
    onConductorClick?.(conductor);
  }, [onConductorClick]);

  // Obtener color del marker según estado
  const getMarkerColor = useCallback((estado: string) => {
    switch (estado) {
      case 'ACTIVO': return '#22c55e'; // green-500
      case 'INACTIVO': return '#6b7280'; // gray-500  
      case 'SUSPENDIDO': return '#ef4444'; // red-500
      default: return '#6b7280';
    }
  }, []);

  // Loading state
  if (!leafletLoaded && !leafletError) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height: altura }}
      >
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (leafletError) {
    return (
      <div 
        className="bg-red-50 border border-red-200 rounded-lg flex items-center justify-center"
        style={{ height: altura }}
      >
        <div className="text-center p-6">
          <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
          <p className="text-red-700 font-medium mb-2">Error al cargar el mapa</p>
          <p className="text-red-600 text-sm mb-3">{leafletError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  // Fallback sin mapa
  if (conductoresValidos.length === 0) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height: altura }}
      >
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">No hay conductores con ubicación válida</p>
        </div>
      </div>
    );
  }

  // Mapa principal
  return (
    <div className="relative">
      {/* Estadísticas del mapa */}
      <div className="absolute top-2 left-2 z-[1000] bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Activos: {conductoresValidos.filter(c => c.estado === 'ACTIVO').length}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mr-1"></div>
            <span>Inactivos: {conductoresValidos.filter(c => c.estado === 'INACTIVO').length}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Suspendidos: {conductoresValidos.filter(c => c.estado === 'SUSPENDIDO').length}</span>
          </div>
        </div>
      </div>

      {/* Mapa de Leaflet */}
      <div style={{ height: altura, width: '100%' }}>
        <MapContainer {...({} as any)}
          center={centroInicial}
          zoom={zoomInicial}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {conductoresValidos.map((conductor) => (
            <Marker
              key={conductor.id}
              position={[conductor.latitud, conductor.longitud]}
              eventHandlers={{
                click: () => handleConductorClick(conductor),
              }}
            >
              <Popup>
                <div className="text-center min-w-[200px]">
                  <h3 className="font-bold text-gray-900">{conductor.nombre}</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Estado:</span>{' '}
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          conductor.estado === 'ACTIVO' 
                            ? 'bg-green-100 text-green-800'
                            : conductor.estado === 'SUSPENDIDO'
                            ? 'bg-red-100 text-red-800'  
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {conductor.estado}
                      </span>
                    </p>
                    <p><span className="font-medium">Teléfono:</span> {conductor.telefono}</p>
                    <p><span className="font-medium">Vehículo:</span> {conductor.vehiculo}</p>
                    <p className="text-gray-500">
                      📍 {conductor.latitud.toFixed(4)}, {conductor.longitud.toFixed(4)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

// Exportar componente con manejo de errores
export default function MapaConductoresNEMTWrapper(props: MapaConductoresNEMTProps) {
  return (
    <React.Suspense 
      fallback={
        <div 
          className="bg-gray-100 rounded-lg flex items-center justify-center"
          style={{ height: props.altura || '400px' }}
        >
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      }
    >
      <MapaConductoresNEMT {...props} />
    </React.Suspense>
  );
}