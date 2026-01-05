"use client";

// src/components/MapaGPSConductores.tsx
// MAPA GPS EN TIEMPO REAL PARA TRACKING DE CONDUCTORES NEMT
// VERSIÓN ADAPTADA A TABLA CONDUCTORES ZURI - BASADO EN MapaConductores.tsx

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Car, Navigation, Users, Clock, RefreshCw } from 'lucide-react';

// ===================================================================
// INTERFACES ADAPTADAS A TABLA CONDUCTORES ZURI (40 CAMPOS)
// ===================================================================

// Interface que coincide EXACTAMENTE con la tabla conductores de la BD
interface Conductor {
  id?: number;
  dni: string;
  nombres: string;                      // ✅ Campo real BD
  apellidos: string;                    // ✅ Campo real BD
  fechaNacimiento?: string;
  sexo?: string;
  email?: string;
  domicilio: string;                    // ✅ Campo real BD (era direccionCompleta)
  ubicacionActualLatitud?: number;      // ✅ Campo real BD (era latitud)
  ubicacionActualLongitud?: number;     // ✅ Campo real BD (era longitud)
  celular1: string;
  celular2?: string;
  estado?: string;
  numeroPlaca?: string;                 // ✅ Campo real BD
  foto?: string;                        // ✅ Campo agregado recientemente
  createdAt?: string;
  updatedAt?: string;
  // Campos GPS adicionales para tracking
  precisionGPS?: number;
  ultimaActualizacionGPS?: string;
  velocidadActual?: number;
  nivelBateria?: number;
  estaConectado?: boolean;
}

// Interface interna optimizada para el mapa (mantiene la lógica robusta original)
interface ConductorMapa {
  id: number;
  nombreCompleto: string;                // Generado desde nombres + apellidos
  ubicacionActualLatitud?: number;       // Mantiene nombres BD
  ubicacionActualLongitud?: number;      // Mantiene nombres BD
  estado: string;
  placaVehiculo?: string;
  celular1: string;
  ultimaConexion?: string;
  domicilio?: string;
  foto?: string;
  precisionGPS?: number;
  velocidadActual?: number;
  nivelBateria?: number;
  estaConectado?: boolean;
}

interface MapaGPSConductoresProps {
  conductores: Conductor[]; // ✅ Compatible directo con useConductores
  onConductorClick: (conductor: Conductor) => void; // ✅ Compatible
}

// ===================================================================
// FUNCIÓN MAPPER - ADAPTADA A CAMPOS REALES DE BD
// ===================================================================
const mapearConductorAMapa = (conductor: Conductor): ConductorMapa => ({
  id: conductor.id || 0,
  nombreCompleto: `${conductor.nombres} ${conductor.apellidos}`.trim(), // ✅ Generado desde BD
  ubicacionActualLatitud: conductor.ubicacionActualLatitud,              // ✅ Campo real BD
  ubicacionActualLongitud: conductor.ubicacionActualLongitud,            // ✅ Campo real BD
  estado: conductor.estado || 'ACTIVO',
  placaVehiculo: conductor.numeroPlaca,                                  // ✅ Campo real BD
  celular1: conductor.celular1,
  ultimaConexion: conductor.ultimaActualizacionGPS || conductor.updatedAt || conductor.createdAt || new Date().toISOString(),
  domicilio: conductor.domicilio,                                        // ✅ Campo real BD
  foto: conductor.foto,                                                  // ✅ Campo agregado
  precisionGPS: conductor.precisionGPS,
  velocidadActual: conductor.velocidadActual,
  nivelBateria: conductor.nivelBateria,
  estaConectado: conductor.estaConectado
});

// ===================================================================
// CONFIGURACIÓN DEL MAPA - MANTIENE TODA LA LÓGICA ROBUSTA
// ===================================================================
const LIMA_CENTER = { lat: -12.0464, lng: -77.0428 };
const ZOOM_DEFAULT = 11;

export default function MapaGPSConductores({ conductores, onConductorClick }: MapaGPSConductoresProps) {
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

  // Mapear datos de entrada con nueva función
  const conductoresMapeados = conductores.map(mapearConductorAMapa);

  // Inicializar mapa OpenStreetMap con Leaflet - LÓGICA ORIGINAL INTACTA
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    cargarLeaflet();
  }, []);

  const cargarLeaflet = async () => {
    try {
      setCargandoMapa(true);
      // Cargar Leaflet dinámicamente
      const L = await import('leaflet');
      
      // Configurar iconos de Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Crear mapa centrado en Lima
      const mapInstance = (L as any).map(mapContainer.current!).setView([LIMA_CENTER.lat, LIMA_CENTER.lng], ZOOM_DEFAULT);

      // Agregar capa de OpenStreetMap
      (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | ZURI Platform GPS Tracking',
        maxZoom: 18,
      }).addTo(mapInstance);

      map.current = mapInstance;
      setMapaListo(true);
      setCargandoMapa(false);

      console.log('✅ [MapaGPS] OpenStreetMap inicializado correctamente');

    } catch (err) {
      console.error('❌ [MapaGPS] Error al cargar Leaflet:', err);
      setError('Error al cargar el mapa');
      setCargandoMapa(false);
    }
  };

  // Actualizar marcadores de conductores - LÓGICA ROBUSTA ORIGINAL
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

      // Filtrar conductores según criterios - ADAPTADO A CAMPOS BD
      const conductoresFiltrados = conductoresMapeados.filter(conductor => {
        const cumpleFiltroEstado = filtroEstado === 'todos' || conductor.estado === filtroEstado;
        const tieneUbicacion = conductor.ubicacionActualLatitud && conductor.ubicacionActualLongitud;
        const cumpleFiltroUbicacion = !mostrarSoloConUbicacion || tieneUbicacion;

        return cumpleFiltroEstado && cumpleFiltroUbicacion;
      });

      // Crear marcadores para conductores filtrados
      conductoresFiltrados.forEach(conductor => {
        if (!conductor.ubicacionActualLatitud || !conductor.ubicacionActualLongitud) return;

        const iconoColor = obtenerColorEstado(conductor.estado);
        const iconoHtml = crearIconoPersonalizado(conductor, iconoColor);

        const marcador = (L as any).marker([conductor.ubicacionActualLatitud, conductor.ubicacionActualLongitud], {
          icon: (L as any).divIcon({
            html: iconoHtml,
            className: 'custom-conductor-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          })
        });

        // Popup con información del conductor - MEJORADO CON FOTO
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

      console.log(`✅ [MapaGPS] ${conductoresFiltrados.length} marcadores actualizados`);

    } catch (err) {
      console.error('❌ [MapaGPS] Error al actualizar marcadores:', err);
    }
  };

  // Obtener color según estado del conductor - LÓGICA ORIGINAL INTACTA
  const obtenerColorEstado = (estado: string): string => {
    const colores = {
      'ACTIVO': '#10B981',        // Verde
      'activo': '#10B981',        // Verde
      'DISPONIBLE': '#34D399',    // Verde claro
      'disponible': '#34D399',    // Verde claro
      'EN_SERVICIO': '#3B82F6',   // Azul
      'en_servicio': '#3B82F6',   // Azul
      'EN_RUTA': '#8B5CF6',       // Violeta - NEMT específico
      'en_ruta': '#8B5CF6',       // Violeta
      'INACTIVO': '#6B7280',      // Gris
      'inactivo': '#6B7280',      // Gris
      'MANTENIMIENTO': '#F59E0B', // Amarillo
      'mantenimiento': '#F59E0B', // Amarillo
      'EN_PERMISO': '#F59E0B',    // Amarillo
      'en_permiso': '#F59E0B',    // Amarillo
      'DESCONECTADO': '#EF4444',  // Rojo - Para tracking GPS
      'desconectado': '#EF4444'   // Rojo
    };
    return colores[estado as keyof typeof colores] || '#6B7280';
  };

  // Crear icono personalizado para conductor - MEJORADO CON FOTO
  const crearIconoPersonalizado = (conductor: ConductorMapa, color: string): string => {
    // Si tiene foto, mostrar foto en lugar de iniciales
    if (conductor.foto) {
      return `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid ${color};
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          position: relative;
        ">
          <img src="${conductor.foto}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          " />
          ${conductor.estaConectado ? '<div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #10B981; border: 2px solid white; border-radius: 50%;"></div>' : ''}
        </div>
      `;
    }

    // Fallback a iniciales si no tiene foto
    const iniciales = conductor.nombreCompleto
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
      ">
        ${iniciales}
        ${conductor.estaConectado ? '<div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #10B981; border: 2px solid white; border-radius: 50%;"></div>' : ''}
      </div>
    `;
  };

  // Crear contenido del popup - MEJORADO CON CAMPOS ADICIONALES
  const crearPopupContent = (conductor: ConductorMapa): string => {
    const estadoLabel = {
      'ACTIVO': '✅ Activo',
      'activo': '✅ Activo',
      'DISPONIBLE': '🟢 Disponible',
      'disponible': '🟢 Disponible',
      'EN_SERVICIO': '🔵 En Servicio',
      'en_servicio': '🔵 En Servicio',
      'EN_RUTA': '🟣 En Ruta',
      'en_ruta': '🟣 En Ruta',
      'INACTIVO': '❌ Inactivo',
      'inactivo': '❌ Inactivo',
      'MANTENIMIENTO': '🔧 Mantenimiento',
      'mantenimiento': '🔧 Mantenimiento',
      'EN_PERMISO': '🟡 En Permiso',
      'en_permiso': '🟡 En Permiso',
      'DESCONECTADO': '🔴 Desconectado',
      'desconectado': '🔴 Desconectado'
    };

    return `
      <div style="min-width: 200px; font-family: system-ui;">
        ${conductor.foto ? `
          <div style="text-align: center; margin-bottom: 8px;">
            <img src="${conductor.foto}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd;" />
          </div>
        ` : ''}
        
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
          ${conductor.domicilio ? `
            <div style="margin-bottom: 4px;">
              📍 ${conductor.domicilio.substring(0, 30)}${conductor.domicilio.length > 30 ? '...' : ''}
            </div>
          ` : ''}
          <div style="margin-bottom: 4px;">
            ${estadoLabel[conductor.estado as keyof typeof estadoLabel] || conductor.estado}
          </div>
          ${conductor.velocidadActual ? `
            <div style="margin-bottom: 4px;">
              🚀 ${Math.round(conductor.velocidadActual)} km/h
            </div>
          ` : ''}
          ${conductor.nivelBateria ? `
            <div style="margin-bottom: 4px;">
              🔋 ${conductor.nivelBateria}%
            </div>
          ` : ''}
          ${conductor.precisionGPS ? `
            <div style="margin-bottom: 4px;">
              📡 Precisión: ${Math.round(conductor.precisionGPS)}m
            </div>
          ` : ''}
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

  // Función para ajustar vista a todos los conductores - LÓGICA ORIGINAL INTACTA
  const ajustarVista = async () => {
    if (!map.current) return;

    const L = await import('leaflet');
    const conductoresConUbicacion = conductoresMapeados.filter(c => c.ubicacionActualLatitud && c.ubicacionActualLongitud);

    if (conductoresConUbicacion.length === 0) {
      map.current.setView([LIMA_CENTER.lat, LIMA_CENTER.lng], ZOOM_DEFAULT);
      return;
    }

    if (conductoresConUbicacion.length === 1) {
      const conductor = conductoresConUbicacion[0];
      map.current.setView([conductor.ubicacionActualLatitud!, conductor.ubicacionActualLongitud!], 15);
      return;
    }

    const group = new (L as any).FeatureGroup(Array.from(markers.current.values()));
    map.current.fitBounds(group.getBounds().pad(0.1));
  };

  // Auto-refresh cada 30 segundos - PREPARADO PARA INTEGRACIÓN IA
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('🔄 [MapaGPS] Auto-refresh activado - Preparado para Agente IA');
      // Aquí se integrará con refetch de useConductores y Agente IA
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Estadísticas dinámicas - MEJORADAS PARA NEMT
  const estadisticas = {
    total: conductoresMapeados.length,
    conUbicacion: conductoresMapeados.filter(c => c.ubicacionActualLatitud && c.ubicacionActualLongitud).length,
    activos: conductoresMapeados.filter(c => c.estado === 'ACTIVO' || c.estado === 'activo').length,
    enServicio: conductoresMapeados.filter(c => c.estado === 'EN_SERVICIO' || c.estado === 'en_servicio').length,
    enRuta: conductoresMapeados.filter(c => c.estado === 'EN_RUTA' || c.estado === 'en_ruta').length,
    conectados: conductoresMapeados.filter(c => c.estaConectado).length,
    bateriaBaja: conductoresMapeados.filter(c => c.nivelBateria && c.nivelBateria < 20).length
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error en el Mapa GPS</h3>
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
      
      {/* Controles del mapa - LÓGICA ORIGINAL + NEMT */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Controles GPS</span>
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
            <option value="EN_RUTA">En Ruta</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="EN_PERMISO">En Permiso</option>
            <option value="DESCONECTADO">Desconectados</option>
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

      {/* Estadísticas mejoradas para NEMT */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Flota GPS</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          {estadisticas.conUbicacion}
        </div>
        <div className="text-xs text-gray-500">
          de {estadisticas.total} total
        </div>
        <div className="space-y-1 mt-2 text-xs">
          <div className="text-green-600">✅ {estadisticas.activos} activos</div>
          <div className="text-blue-600">🔵 {estadisticas.enServicio} en servicio</div>
          <div className="text-purple-600">🟣 {estadisticas.enRuta} en ruta</div>
          <div className="text-green-500">📡 {estadisticas.conectados} conectados</div>
          {estadisticas.bateriaBaja > 0 && (
            <div className="text-red-600">🔋 {estadisticas.bateriaBaja} batería baja</div>
          )}
        </div>
      </div>

      {/* Loading del mapa */}
      {cargandoMapa && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando mapa GPS...</p>
            <p className="text-sm text-gray-500 mt-1">Conectando con OpenStreetMap</p>
            <p className="text-xs text-gray-400 mt-2">Preparado para Agente IA 🤖</p>
          </div>
        </div>
      )}

      {/* Contenedor del mapa */}
      <div 
        ref={mapContainer}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />

      {/* Leyenda mejorada para NEMT */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Estados NEMT</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Activo/Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>En Servicio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>En Ruta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Inactivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>En Permiso/Mantto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Desconectado</span>
          </div>
        </div>
      </div>

      {/* Estilos CSS para los marcadores - LÓGICA ORIGINAL INTACTA */}
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

// Hook global para abrir detalles desde popup - PREPARADO PARA AGENTE IA
declare global {
  interface Window {
    openConductorDetails?: (id: number) => void;
    aiAgent?: {
      getConductorLocation: (id: number) => Promise<any>;
      getFleetStatus: () => Promise<any>;
      voiceQuery: (query: string) => Promise<string>;
    };
  }
}