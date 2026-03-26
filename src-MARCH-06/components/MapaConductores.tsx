"use client";

// src/components/MapaConductores.tsx
// MAPA GPS EN TIEMPO REAL PARA TRACKING DE CONDUCTORES NEMT
// VERSIÓN COMPATIBLE CON useConductores

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Car, Navigation, Users, Clock, RefreshCw } from 'lucide-react';
import { getCarIconHTML } from './icons/CarIcon';

// ===================================================================
// INTERFACES COMPATIBLES CON SISTEMA ZURI
// ===================================================================

// Interface que coincide con ConductorData de useConductores
interface ConductorData {
  id?: number;
  dni: string;
  nombreCompleto: string;
  fechaNacimiento?: string;
  sexo?: string;
  email?: string;
  direccionCompleta: string;
  distritoId: number;
  distrito_nombre?: string;
  latitud?: number;
  longitud?: number;
  referenciaUbicacion?: string;
  celular1: string;
  celular2?: string;
  telefonoFijo?: string;
  contactoEmergencia?: string;
  estado?: string;
  vehiculo?: any;
  numeroPlaca?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface interna del mapa (adaptada)
interface ConductorMapa {
  id: number;
  nombreCompleto: string;
  latitud?: number;
  longitud?: number;
  estado: string;
  placaVehiculo?: string;
  celular1: string;
  ultimaConexion?: string;
  distrito_nombre?: string;
  direccionCompleta?: string;
}

interface MapaConductoresProps {
  conductores: ConductorData[]; // ✅ Compatible con useConductores
  onConductorClick: (conductor: ConductorData) => void; // ✅ Compatible
}

// ===================================================================
// FUNCIÓN MAPPER - CONVIERTE ConductorData A ConductorMapa
// ===================================================================
const mapearConductorData = (conductor: ConductorData): ConductorMapa => ({
  id: conductor.id || 0,
  nombreCompleto: conductor.nombreCompleto,
  latitud: conductor.latitud,
  longitud: conductor.longitud,
  estado: conductor.estado || 'ACTIVO', // Default si no existe
  placaVehiculo: conductor.numeroPlaca || conductor.vehiculo?.placa || undefined,
  celular1: conductor.celular1,
  ultimaConexion: conductor.updatedAt || conductor.createdAt || new Date().toISOString(),
  distrito_nombre: conductor.distrito_nombre,
  direccionCompleta: conductor.direccionCompleta
});

// ===================================================================
// CONFIGURACIÓN DEL MAPA
// ===================================================================
const LIMA_CENTER = { lat: -12.0464, lng: -77.0428 };
const ZOOM_DEFAULT = 11;

export default function MapaConductores({ conductores, onConductorClick }: MapaConductoresProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<Map<number, any>>(new Map());
  const [mapaListo, setMapaListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargandoMapa, setCargandoMapa] = useState(false);

  // Estados para filtros y controles
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [mostrarSoloConUbicacion, setMostrarSoloConUbicacion] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mapear datos de entrada
  const conductoresMapeados = conductores.map(mapearConductorData);

  // Inicializar mapa OpenStreetMap con Leaflet
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    cargarLeaflet();
  }, []);

  const cargarLeaflet = async () => {
    try {
      // Cargar Leaflet dinámicamente
      const L = await import('leaflet');

      // Configurar iconos de Leaflet
      delete ((L as any).Icon.Default.prototype as any)._getIconUrl;
      ((L as any).Icon.Default.mergeOptions)({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Crear mapa centrado en Lima
      const mapInstance = (L as any).map(mapContainer.current!).setView([LIMA_CENTER.lat, LIMA_CENTER.lng], ZOOM_DEFAULT);

      // Agregar capa de OpenStreetMap
      (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | ZURI Platform',
        maxZoom: 18,
      }).addTo(mapInstance);

      map.current = mapInstance;
      setMapaListo(true);
      setCargandoMapa(false);

      console.log('✅ [Mapa] OpenStreetMap inicializado correctamente');

    } catch (err) {
      console.error('❌ [Mapa] Error al cargar Leaflet:', err);
      setError('Error al cargar el mapa');
      setCargandoMapa(false);
    }
  };

  // Actualizar marcadores de conductores
  useEffect(() => {
    if (!mapaListo || !map.current) return;

    actualizarMarcadores();
  }, [mapaListo, conductoresMapeados, filtroEstado, mostrarSoloConUbicacion]);

  const actualizarMarcadores = async () => {
    if (!map.current) return;

    try {
      const L = await import('leaflet');

      // Limpiar marcadores existentes
      markers.current.forEach(marker => {
        map.current.removeLayer(marker);
      });
      markers.current.clear();

      // Filtrar conductores según criterios
      const conductoresFiltrados = conductoresMapeados.filter(conductor => {
        const cumpleFiltroEstado = filtroEstado === 'todos' || conductor.estado === filtroEstado;
        const tieneUbicacion = conductor.latitud && conductor.longitud;
        const cumpleFiltroUbicacion = !mostrarSoloConUbicacion || tieneUbicacion;

        return cumpleFiltroEstado && cumpleFiltroUbicacion;
      });

      // Crear marcadores para conductores filtrados
      conductoresFiltrados.forEach(conductor => {
        if (!conductor.latitud || !conductor.longitud) return;

        const iconoColor = obtenerColorEstado(conductor.estado);
        const iconoHtml = crearIconoPersonalizado(conductor, iconoColor);

        const marcador = (L as any).marker([conductor.latitud, conductor.longitud], {
          icon: (L as any).divIcon({
            html: iconoHtml,
            className: 'custom-conductor-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          })
        });

        // Popup con información del conductor
        const popupContent = crearPopupContent(conductor);
        marcador.bindPopup(popupContent);

        // Evento click - pasar el conductor original
        marcador.on('click', () => {
          const conductorOriginal = conductores.find(c => c.id === conductor.id);
          if (conductorOriginal) {
            onConductorClick(conductorOriginal);
          }
        });

        marcador.addTo(map.current);
        markers.current.set(conductor.id, marcador);
      });

      console.log(`✅ [Mapa] ${conductoresFiltrados.length} marcadores actualizados`);

    } catch (err) {
      console.error('❌ [Mapa] Error al actualizar marcadores:', err);
    }
  };

  // Obtener color según estado del conductor
  const obtenerColorEstado = (estado: string): string => {
    const colores = {
      'ACTIVO': '#10B981',        // Verde
      'activo': '#10B981',        // Verde
      'DISPONIBLE': '#34D399',    // Verde claro
      'disponible': '#34D399',    // Verde claro
      'EN_SERVICIO': '#3B82F6',   // Azul
      'en_servicio': '#3B82F6',   // Azul
      'INACTIVO': '#6B7280',      // Gris
      'inactivo': '#6B7280',      // Gris
      'MANTENIMIENTO': '#F59E0B', // Amarillo
      'mantenimiento': '#F59E0B', // Amarillo
      'EN_PERMISO': '#F59E0B',    // Amarillo
      'en_permiso': '#F59E0B'     // Amarillo
    };
    return colores[estado as keyof typeof colores] || '#6B7280';
  };

  // Crear icono personalizado de auto para conductor
  const crearIconoPersonalizado = (conductor: ConductorMapa, color: string): string => {
    // Obtener heading del conductor (si existe en los datos originales)
    const conductorOriginal = conductores.find(c => c.id === conductor.id);
    const heading = (conductorOriginal as any)?.rumboActual || 0;

    // Usar ícono de auto SVG profesional
    return getCarIconHTML(heading, color, 40);
  };

  // Crear contenido del popup
  const crearPopupContent = (conductor: ConductorMapa): string => {
    const estadoLabel = {
      'ACTIVO': '✅ Activo',
      'activo': '✅ Activo',
      'DISPONIBLE': '🟢 Disponible',
      'disponible': '🟢 Disponible',
      'EN_SERVICIO': '🔵 En Servicio',
      'en_servicio': '🔵 En Servicio',
      'INACTIVO': '❌ Inactivo',
      'inactivo': '❌ Inactivo',
      'MANTENIMIENTO': '🔧 Mantenimiento',
      'mantenimiento': '🔧 Mantenimiento',
      'EN_PERMISO': '🟡 En Permiso',
      'en_permiso': '🟡 En Permiso'
    };

    return `
      <div style="min-width: 200px; font-family: system-ui;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
          ${conductor.nombreCompleto}
        </h3>
        
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          <div style="margin-bottom: 4px;">
            📱 ${conductor.celular1}
          </div>
          ${conductor.placaVehiculo ? `
            <div style="margin-bottom: 4px;">
              🚗 ${conductor.placaVehiculo}
            </div>
          ` : ''}
          ${conductor.distrito_nombre ? `
            <div style="margin-bottom: 4px;">
              📍 ${conductor.distrito_nombre}
            </div>
          ` : ''}
          <div style="margin-bottom: 4px;">
            ${estadoLabel[conductor.estado as keyof typeof estadoLabel] || conductor.estado}
          </div>
          ${conductor.ultimaConexion ? `
            <div style="color: #9ca3af; font-size: 11px;">
              🕐 Última actualización: ${new Date(conductor.ultimaConexion).toLocaleString()}
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 8px;">
          <button 
            onclick="window.openConductorDetails && window.openConductorDetails(${conductor.id})"
            style="
              background: #3b82f6; 
              color: white; 
              border: none; 
              padding: 4px 12px; 
              border-radius: 4px; 
              font-size: 11px;
              cursor: pointer;
            "
          >
            Ver Detalles
          </button>
        </div>
      </div>
    `;
  };

  // Función para ajustar vista a todos los conductores
  const ajustarVista = async () => {
    if (!map.current) return;

    const L = await import('leaflet');
    const conductoresConUbicacion = conductoresMapeados.filter(c => c.latitud && c.longitud);

    if (conductoresConUbicacion.length === 0) {
      map.current.setView([LIMA_CENTER.lat, LIMA_CENTER.lng], ZOOM_DEFAULT);
      return;
    }

    if (conductoresConUbicacion.length === 1) {
      const conductor = conductoresConUbicacion[0];
      map.current.setView([conductor.latitud!, conductor.longitud!], 15);
      return;
    }

    const group = new (L as any).FeatureGroup(Array.from(markers.current.values()));
    map.current.fitBounds(group.getBounds().pad(0.1));
  };

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('🔄 [Mapa] Auto-refresh activado');
      // Aquí se podría integrar con refetch de useConductores
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Estadísticas dinámicas
  const estadisticas = {
    total: conductoresMapeados.length,
    conUbicacion: conductoresMapeados.filter(c => c.latitud && c.longitud).length,
    activos: conductoresMapeados.filter(c => c.estado === 'ACTIVO' || c.estado === 'activo').length,
    enServicio: conductoresMapeados.filter(c => c.estado === 'EN_SERVICIO' || c.estado === 'en_servicio').length
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error en el Mapa</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              cargarLeaflet();
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">

      {/* Controles del mapa */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Controles</span>
        </div>

        <div className="space-y-2">
          <select
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="EN_SERVICIO">En Servicio</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="EN_PERMISO">En Permiso</option>
          </select>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={mostrarSoloConUbicacion}
              onChange={(e) => setMostrarSoloConUbicacion(e.target.checked)}
              className="rounded"
            />
            Solo con GPS
          </label>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
        </div>

        <button
          onClick={ajustarVista}
          className="w-full flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          <Navigation className="h-3 w-3" />
          Ajustar Vista
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">En Mapa</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          {estadisticas.conUbicacion}
        </div>
        <div className="text-xs text-gray-500">
          de {estadisticas.total} total
        </div>
        <div className="text-xs text-green-600 mt-1">
          {estadisticas.activos} activos
        </div>
      </div>

      {/* Loading del mapa */}
      {cargandoMapa && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando mapa GPS...</p>
            <p className="text-sm text-gray-500 mt-1">Conectando con OpenStreetMap</p>
          </div>
        </div>
      )}

      {/* Contenedor del mapa */}
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Estados</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Activo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>En Servicio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Inactivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>En Permiso</span>
          </div>
        </div>
      </div>

      {/* Estilos CSS para los marcadores */}
      <style jsx global>{`
        .custom-conductor-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

// Hook global para abrir detalles desde popup
declare global {
  interface Window {
    openConductorDetails?: (id: number) => void;
  }
}