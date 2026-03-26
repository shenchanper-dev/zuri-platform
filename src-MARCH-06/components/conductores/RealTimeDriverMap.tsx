/**
 * ZURI NEMT Platform - Real-Time Driver Map
 * 
 * Mapa interactivo premium para visualización de conductores en tiempo real.
 * Estilo: Uber/Cabify con OpenStreetMap + Leaflet
 * 
 * Features:
 * - Marcadores personalizados con foto de conductor
 * - Animación de movimiento suave
 * - Panel de estadísticas en tiempo real
 * - Filtros por estado
 * - Historial de rutas
 * - Modo oscuro/claro
 * 
 * Principios: SOLID, Clean Architecture, Premium UI/UX
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MapPin,
  Car,
  Navigation2,
  Users,
  Clock,
  RefreshCw,
  Battery,
  BatteryLow,
  Wifi,
  WifiOff,
  Filter,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  Zap,
  AlertCircle,
  CheckCircle2,
  Route,
  History,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useGPSTracking, type ConductorGPS } from '@/hooks/useGPSTracking';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

interface RealTimeDriverMapProps {
  conductoresBase?: any[];            // Conductores desde useConductores (fallback)
  onConductorClick?: (conductor: ConductorGPS) => void;
  selectedConductorId?: number;
  altura?: string;
  mostrarControles?: boolean;
  mostrarEstadisticas?: boolean;
  mostrarLeyenda?: boolean;
  modoOscuroInicial?: boolean;
}

interface DriverMarkerData extends ConductorGPS {
  animando?: boolean;
  prevLat?: number;
  prevLng?: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];
const ZOOM_DEFAULT = 12;
const ZOOM_CONDUCTOR = 15;

const ESTADO_COLORES: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVO: { bg: '#22c55e', text: '#ffffff', border: '#16a34a' },
  EN_RUTA: { bg: '#8b5cf6', text: '#ffffff', border: '#7c3aed' },
  EN_SERVICIO: { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' },
  DISPONIBLE: { bg: '#10b981', text: '#ffffff', border: '#059669' },
  INACTIVO: { bg: '#6b7280', text: '#ffffff', border: '#4b5563' },
  SUSPENDIDO: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
};

const CONEXION_COLORES: Record<string, { bg: string; icon: string }> = {
  ONLINE: { bg: '#22c55e', icon: '🟢' },
  RECENT: { bg: '#f59e0b', icon: '🟡' },
  OFFLINE: { bg: '#6b7280', icon: '🔴' },
};

// Tiles para modo claro y oscuro
const TILE_LAYERS = {
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors | ZURI GPS',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB | ZURI GPS',
  },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function RealTimeDriverMap({
  conductoresBase = [],
  onConductorClick,
  selectedConductorId,
  altura = '600px',
  mostrarControles = true,
  mostrarEstadisticas = true,
  mostrarLeyenda = true,
  modoOscuroInicial = false,
}: RealTimeDriverMapProps) {
  // ============================================
  // REFS
  // ============================================

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const leafletRef = useRef<any>(null);

  // ============================================
  // ESTADO LOCAL
  // ============================================

  const [mapaListo, setMapaListo] = useState(false);
  const [cargandoMapa, setCargandoMapa] = useState(true);
  const [modoOscuro, setModoOscuro] = useState(modoOscuroInicial);
  const [fullscreen, setFullscreen] = useState(false);
  const [conductorSeleccionado, setConductorSeleccionado] = useState<ConductorGPS | null>(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroConexion, setFiltroConexion] = useState<string>('todos');

  // ============================================
  // HOOK GPS TRACKING
  // ============================================

  const {
    conductores: conductoresGPS,
    conductoresOnline,
    conductoresRecent,
    conductoresOffline,
    estadisticas,
    loading: loadingGPS,
    error: errorGPS,
    ultimaActualizacion,
    polling,
    refetch,
    iniciarPolling,
    pausarPolling,
    configurarIntervalo,
  } = useGPSTracking({
    intervaloPolling: 10000,
    autoStart: true,
  });

  // Combinar conductores GPS con base (para demo sin GPS real)
  const conductoresCombinados = useMemo(() => {
    if (conductoresGPS.length > 0) return conductoresGPS;

    // Fallback: usar conductores base con ubicación simulada
    return conductoresBase
      .filter(c => c.ubicacionActualLatitud && c.ubicacionActualLongitud)
      .map(c => ({
        id: c.id,
        dni: c.dni || '',
        nombreCompleto: c.nombreCompleto || `${c.nombres || ''} ${c.apellidos || ''}`.trim(),
        latitud: c.ubicacionActualLatitud || c.latitud || LIMA_CENTER[0] + (Math.random() - 0.5) * 0.1,
        longitud: c.ubicacionActualLongitud || c.longitud || LIMA_CENTER[1] + (Math.random() - 0.5) * 0.1,
        ultimaActualizacion: c.ultimaActualizacionGPS || c.updatedAt || new Date().toISOString(),
        velocidad: c.velocidadActual,
        rumbo: c.rumboActual,
        nivelBateria: c.nivelBateria,
        estaConectado: c.estaConectado ?? true,
        estado: c.estado || 'ACTIVO',
        estadoConexion: c.estadoConexion || 'ONLINE',
        vehiculo: {
          marca: c.marcaVehiculo,
          modelo: c.modeloVehiculo,
          placa: c.placaVehiculo || c.placa,
        },
        foto: c.foto,
      })) as ConductorGPS[];
  }, [conductoresGPS, conductoresBase]);

  // Filtrar conductores según búsqueda y filtros
  const conductoresFiltrados = useMemo(() => {
    return conductoresCombinados.filter(c => {
      // Filtro de búsqueda
      if (busqueda) {
        const term = busqueda.toLowerCase();
        const matchNombre = c.nombreCompleto?.toLowerCase().includes(term);
        const matchPlaca = c.vehiculo?.placa?.toLowerCase().includes(term);
        const matchDni = c.dni?.toLowerCase().includes(term);
        if (!matchNombre && !matchPlaca && !matchDni) return false;
      }

      // Filtro estado
      if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false;

      // Filtro conexión
      if (filtroConexion !== 'todos' && c.estadoConexion !== filtroConexion) return false;

      return true;
    });
  }, [conductoresCombinados, busqueda, filtroEstado, filtroConexion]);

  // ============================================
  // INICIALIZACIÓN DEL MAPA
  // ============================================

  const inicializarMapa = useCallback(async () => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      setCargandoMapa(true);

      // Cargar Leaflet dinámicamente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leafletModule = await import('leaflet') as any;
      const L = leafletModule.default || leafletModule;
      // CSS de Leaflet se carga via CDN en los estilos del componente

      leafletRef.current = L;

      // Configurar iconos de Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Crear mapa
      const map = L.map(mapContainerRef.current, {
        center: LIMA_CENTER,
        zoom: ZOOM_DEFAULT,
        zoomControl: false, // Lo agregaremos personalizado
      });

      // Agregar tiles según modo
      const tileConfig = modoOscuro ? TILE_LAYERS.dark : TILE_LAYERS.light;
      L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(map);

      // Agregar control de zoom personalizado
      L.control.zoom({
        position: 'bottomright',
      }).addTo(map);

      mapRef.current = map;
      setMapaListo(true);
      setCargandoMapa(false);

      console.log('✅ [RealTimeMap] Mapa inicializado correctamente');

    } catch (error) {
      console.error('❌ [RealTimeMap] Error al inicializar mapa:', error);
      setCargandoMapa(false);
    }
  }, [modoOscuro]);

  // Inicializar mapa al montar
  useEffect(() => {
    inicializarMapa();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Cambiar tiles cuando cambia modo oscuro
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const L = leafletRef.current;
    const map = mapRef.current;

    // Remover tiles existentes
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Agregar nuevos tiles
    const tileConfig = modoOscuro ? TILE_LAYERS.dark : TILE_LAYERS.light;
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

  }, [modoOscuro]);

  // ============================================
  // CREAR ICONO PERSONALIZADO DE CONDUCTOR
  // ============================================

  const crearIconoConductor = useCallback((conductor: ConductorGPS): any => {
    if (!leafletRef.current) return null;

    const L = leafletRef.current;
    const colorConexion = CONEXION_COLORES[conductor.estadoConexion] || CONEXION_COLORES.OFFLINE;
    const isOnline = conductor.estadoConexion === 'ONLINE';
    const bateriaBaja = conductor.nivelBateria !== undefined && conductor.nivelBateria < 20;
    const heading = conductor.rumbo || 0;

    // SVG de auto profesional negro estilo Uber/Cabify/InDrive
    // El auto siempre es NEGRO con detalles visibles
    // Rotación se aplica al SVG completo basado en GPS heading
    const html = `
      <div class="driver-car-marker ${isOnline ? 'car-online' : ''} ${bateriaBaja ? 'car-battery-low' : ''}">
        <div class="car-svg-wrapper" style="transform: rotate(${heading}deg);">
          <svg width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Sombra del auto -->
            <ellipse cx="20" cy="50" rx="12" ry="4" fill="rgba(0,0,0,0.2)" />
            <!-- Flecha de dirección (frente del auto = arriba) -->
            <polygon points="20,0 26,8 14,8" fill="#1a1a1a" stroke="white" stroke-width="1.2" />
            <!-- Carrocería principal del auto (vista top-down) -->
            <rect x="10" y="8" width="20" height="38" rx="6" ry="6" fill="#1a1a1a" stroke="white" stroke-width="1.5" />
            <!-- Parabrisas delantero (azul claro) -->
            <rect x="13" y="13" width="14" height="8" rx="2" fill="#93c5fd" opacity="0.85" stroke="#60a5fa" stroke-width="0.5" />
            <!-- Parabrisas trasero (azul más oscuro) -->
            <rect x="13" y="33" width="14" height="6" rx="2" fill="#60a5fa" opacity="0.6" stroke="#3b82f6" stroke-width="0.5" />
            <!-- Faros delanteros (amarillos brillantes) -->
            <rect x="11" y="9" width="4" height="2.5" rx="1" fill="#fde047" stroke="#facc15" stroke-width="0.3" />
            <rect x="25" y="9" width="4" height="2.5" rx="1" fill="#fde047" stroke="#facc15" stroke-width="0.3" />
            <!-- Luces traseras (rojas) -->
            <rect x="11" y="43" width="4" height="2" rx="0.8" fill="#ef4444" stroke="#dc2626" stroke-width="0.3" />
            <rect x="25" y="43" width="4" height="2" rx="0.8" fill="#ef4444" stroke="#dc2626" stroke-width="0.3" />
            <!-- Espejos retrovisores -->
            <rect x="7" y="16" width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="white" stroke-width="0.8" />
            <rect x="30" y="16" width="3" height="5" rx="1.5" fill="#1a1a1a" stroke="white" stroke-width="0.8" />
            <!-- Techo / cabina -->
            <rect x="14" y="22" width="12" height="10" rx="2" fill="#2d2d2d" stroke="#404040" stroke-width="0.5" />
          </svg>
        </div>
        <!-- Indicador de estado de conexión -->
        <div class="car-status-dot" style="background: ${colorConexion.bg}"></div>
        ${bateriaBaja ? '<div class="car-battery-icon">🔋</div>' : ''}
        ${conductor.velocidad && conductor.velocidad > 5 ? `
          <div class="car-speed-badge">${Math.round(conductor.velocidad)} km/h</div>
        ` : ''}
      </div>
    `;

    return L.divIcon({
      className: 'custom-driver-icon',
      html,
      iconSize: [40, 56],
      iconAnchor: [20, 28],
      popupAnchor: [0, -30],
    });
  }, []);

  // ============================================
  // CREAR POPUP DE CONDUCTOR
  // ============================================

  const crearPopupConductor = useCallback((conductor: ConductorGPS): string => {
    const colorEstado = ESTADO_COLORES[conductor.estado] || ESTADO_COLORES.INACTIVO;
    const ultimaAct = new Date(conductor.ultimaActualizacion);
    const tiempoDesde = Math.floor((Date.now() - ultimaAct.getTime()) / 60000); // minutos

    return `
      <div class="popup-conductor">
        <div class="popup-header">
          ${conductor.foto ? `
            <img src="${conductor.foto}" alt="${conductor.nombreCompleto}" class="popup-avatar" />
          ` : `
            <div class="popup-avatar-placeholder">
              ${conductor.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
          `}
          <div class="popup-info">
            <h3 class="popup-name">${conductor.nombreCompleto}</h3>
            <div class="popup-badge" style="background: ${colorEstado.bg}">
              ${conductor.estado}
            </div>
          </div>
        </div>
        
        <div class="popup-details">
          ${conductor.vehiculo?.placa ? `
            <div class="popup-row">
              <span class="popup-icon">🚗</span>
              <span>${conductor.vehiculo.marca || ''} ${conductor.vehiculo.modelo || ''}</span>
              <span class="popup-plate">${conductor.vehiculo.placa}</span>
            </div>
          ` : ''}
          
          ${conductor.velocidad !== undefined ? `
            <div class="popup-row">
              <span class="popup-icon">🚀</span>
              <span>Velocidad: <strong>${Math.round(conductor.velocidad)} km/h</strong></span>
            </div>
          ` : ''}
          
          ${conductor.nivelBateria !== undefined ? `
            <div class="popup-row">
              <span class="popup-icon">${conductor.nivelBateria < 20 ? '🪫' : '🔋'}</span>
              <span>Batería: <strong>${conductor.nivelBateria}%</strong></span>
            </div>
          ` : ''}
          
          <div class="popup-row">
            <span class="popup-icon">🕐</span>
            <span>Última act: <strong>${tiempoDesde < 1 ? 'Ahora' : `hace ${tiempoDesde} min`}</strong></span>
          </div>
          
          <div class="popup-row">
            <span class="popup-icon">📍</span>
            <span class="popup-coords">${conductor.latitud.toFixed(5)}, ${conductor.longitud.toFixed(5)}</span>
          </div>
        </div>
        
        <div class="popup-actions">
          <button class="popup-btn popup-btn-primary" onclick="window.zuriGPS?.verHistorial(${conductor.id})">
            📊 Ver Historial
          </button>
          <button class="popup-btn popup-btn-secondary" onclick="window.zuriGPS?.contactar(${conductor.id})">
            📞 Contactar
          </button>
        </div>
      </div>
    `;
  }, []);

  // ============================================
  // ACTUALIZAR MARCADORES
  // ============================================

  const actualizarMarcadores = useCallback(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const L = leafletRef.current;
    const map = mapRef.current;

    // Remover marcadores que ya no existen
    markersRef.current.forEach((marker, id) => {
      if (!conductoresFiltrados.find(c => c.id === id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Actualizar/crear marcadores
    conductoresFiltrados.forEach(conductor => {
      const existingMarker = markersRef.current.get(conductor.id);

      if (existingMarker) {
        // Actualizar posición con animación suave
        const newLatLng = L.latLng(conductor.latitud, conductor.longitud);
        const currentLatLng = existingMarker.getLatLng();

        // Solo animar si hay cambio significativo
        if (currentLatLng.distanceTo(newLatLng) > 10) {
          existingMarker.setLatLng(newLatLng);
        }

        // Actualizar icono
        existingMarker.setIcon(crearIconoConductor(conductor));
        existingMarker.setPopupContent(crearPopupConductor(conductor));

      } else {
        // Crear nuevo marcador
        const icon = crearIconoConductor(conductor);
        const marker = L.marker([conductor.latitud, conductor.longitud], { icon })
          .bindPopup(crearPopupConductor(conductor), {
            className: 'driver-popup',
            maxWidth: 320,
          })
          .addTo(map);

        // Evento click
        marker.on('click', () => {
          setConductorSeleccionado(conductor);
          onConductorClick?.(conductor);
        });

        markersRef.current.set(conductor.id, marker);
      }
    });

  }, [conductoresFiltrados, crearIconoConductor, crearPopupConductor, onConductorClick]);

  // Actualizar marcadores cuando cambian los datos
  useEffect(() => {
    if (mapaListo) {
      actualizarMarcadores();
    }
  }, [mapaListo, actualizarMarcadores]);

  // ============================================
  // CENTRAR EN CONDUCTOR
  // ============================================

  const centrarEnConductor = useCallback((conductor: ConductorGPS) => {
    if (!mapRef.current) return;

    mapRef.current.setView([conductor.latitud, conductor.longitud], ZOOM_CONDUCTOR, {
      animate: true,
      duration: 0.5,
    });

    // Abrir popup
    const marker = markersRef.current.get(conductor.id);
    if (marker) {
      marker.openPopup();
    }

    setConductorSeleccionado(conductor);
  }, []);

  // Centrar cuando hay conductor seleccionado desde props
  useEffect(() => {
    if (selectedConductorId && mapaListo) {
      const conductor = conductoresFiltrados.find(c => c.id === selectedConductorId);
      if (conductor) {
        centrarEnConductor(conductor);
      }
    }
  }, [selectedConductorId, mapaListo, conductoresFiltrados, centrarEnConductor]);

  // ============================================
  // AJUSTAR VISTA A TODOS
  // ============================================

  const ajustarVistaATodos = useCallback(() => {
    if (!mapRef.current || !leafletRef.current || conductoresFiltrados.length === 0) return;

    const L = leafletRef.current;
    const bounds = L.latLngBounds(
      conductoresFiltrados.map(c => [c.latitud, c.longitud])
    );

    mapRef.current.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14,
    });
  }, [conductoresFiltrados]);

  // ============================================
  // GLOBAL HANDLERS PARA POPUP
  // ============================================

  useEffect(() => {
    (window as any).zuriGPS = {
      verHistorial: (id: number) => {
        const conductor = conductoresFiltrados.find(c => c.id === id);
        if (conductor) {
          setConductorSeleccionado(conductor);
          setMostrarHistorial(true);
        }
      },
      contactar: (id: number) => {
        const conductor = conductoresFiltrados.find(c => c.id === id);
        if (conductor) {
          // TODO: Implementar contacto
          console.log('Contactando a:', conductor.nombreCompleto);
        }
      },
    };

    return () => {
      delete (window as any).zuriGPS;
    };
  }, [conductoresFiltrados]);

  // ============================================
  // RENDERIZADO
  // ============================================

  return (
    <div
      className={`real-time-map-container ${fullscreen ? 'fullscreen' : ''} ${modoOscuro ? 'dark-mode' : ''}`}
      style={{ height: fullscreen ? '100vh' : altura }}
    >
      {/* Leaflet CSS via CDN */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      {/* Estilos CSS */}
      <style jsx global>{`
        .real-time-map-container {
          position: relative;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }
        
        .real-time-map-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          border-radius: 0;
        }
        
        .map-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1e3a5f 0%, #0c1929 100%);
          z-index: 1000;
        }
        
        .map-loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .map-loading-text {
          margin-top: 16px;
          color: #94a3b8;
          font-size: 14px;
        }
        
        /* Panel de estadísticas */
        .stats-panel {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          min-width: 200px;
        }
        
        .dark-mode .stats-panel {
          background: rgba(30, 41, 59, 0.95);
          color: #f1f5f9;
        }
        
        .stats-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .dark-mode .stats-header {
          border-color: rgba(255, 255, 255, 0.08);
        }
        
        .stats-title {
          font-weight: 600;
          font-size: 14px;
          color: #1e293b;
        }
        
        .dark-mode .stats-title {
          color: #f1f5f9;
        }
        
        .stats-time {
          font-size: 11px;
          color: #64748b;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stat-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .dark-mode .stat-value {
          color: #f1f5f9;
        }
        
        .stat-label {
          font-size: 11px;
          color: #64748b;
        }
        
        /* Panel de control */
        .control-panel {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .control-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          transition: all 0.2s ease;
        }
        
        .dark-mode .control-btn {
          background: rgba(30, 41, 59, 0.95);
          color: #94a3b8;
        }
        
        .control-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          color: #3b82f6;
        }
        
        .control-btn.active {
          background: #3b82f6;
          color: white;
        }
        
        /* Panel de filtros */
        .filter-panel {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .dark-mode .filter-panel {
          background: rgba(30, 41, 59, 0.95);
        }
        
        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 8px;
          padding: 8px 12px;
        }
        
        .dark-mode .search-box {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .search-box input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          color: #1e293b;
        }
        
        .dark-mode .search-box input {
          color: #f1f5f9;
        }
        
        .search-box input::placeholder {
          color: #94a3b8;
        }
        
        .filter-select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: white;
          font-size: 13px;
          color: #475569;
          cursor: pointer;
        }
        
        .dark-mode .filter-select {
          background: rgba(51, 65, 85, 0.8);
          border-color: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
        }
        
        /* Leyenda */
        .legend-panel {
          position: absolute;
          bottom: 80px;
          left: 16px;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 10px;
          padding: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }
        
        .dark-mode .legend-panel {
          background: rgba(30, 41, 59, 0.95);
        }
        
        .legend-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #475569;
        }
        
        .dark-mode .legend-item {
          color: #94a3b8;
        }
        
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        /* ============================================ */
        /* MARCADOR DE AUTO PROFESIONAL (Uber/Cabify)  */
        /* ============================================ */
        .custom-driver-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .driver-car-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }
        
        .car-svg-wrapper {
          transition: transform 0.5s ease-out;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
        }
        
        .driver-car-marker:hover .car-svg-wrapper {
          transform: scale(1.15);
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
        }
        
        /* Pulso de conexión activa */
        .car-online .car-status-dot {
          animation: car-pulse 2s ease-in-out infinite;
        }
        
        @keyframes car-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
        }
        
        .car-status-dot {
          position: absolute;
          bottom: 4px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid white;
          z-index: 2;
        }
        
        .car-battery-icon {
          position: absolute;
          top: -2px;
          right: -6px;
          font-size: 11px;
          animation: car-blink 1s ease-in-out infinite;
          z-index: 2;
        }
        
        @keyframes car-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        .car-speed-badge {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e40af;
          color: white;
          font-size: 8px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 3px;
          white-space: nowrap;
          z-index: 2;
          border: 1px solid rgba(255,255,255,0.5);
        }
        
        /* Popup del conductor */
        .driver-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
          padding: 0;
          overflow: hidden;
        }
        
        .driver-popup .leaflet-popup-content {
          margin: 0;
          width: 280px !important;
        }
        
        .driver-popup .leaflet-popup-tip {
          background: white;
        }
        
        .popup-conductor {
          padding: 16px;
        }
        
        .popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .popup-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .popup-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          font-weight: 700;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .popup-info {
          flex: 1;
        }
        
        .popup-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        
        .popup-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: white;
        }
        
        .popup-details {
          background: #f8fafc;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 12px;
        }
        
        .popup-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #475569;
          padding: 4px 0;
        }
        
        .popup-row:not(:last-child) {
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          padding-bottom: 8px;
          margin-bottom: 4px;
        }
        
        .popup-icon {
          font-size: 14px;
        }
        
        .popup-plate {
          margin-left: auto;
          background: #1e293b;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
        }
        
        .popup-coords {
          font-family: monospace;
          font-size: 11px;
          color: #94a3b8;
        }
        
        .popup-actions {
          display: flex;
          gap: 8px;
        }
        
        .popup-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .popup-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }
        
        .popup-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .popup-btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        
        .popup-btn-secondary:hover {
          background: #e2e8f0;
        }
        /* Responsiveness */
        @media (max-width: 768px) {
          .stats-panel {
            min-width: unset;
            width: auto;
            max-width: 180px;
            padding: 10px;
            font-size: 0.9em;
          }
          
          .stats-grid {
            gap: 8px;
          }
          
          .stat-value {
            font-size: 16px;
          }
          
          .filter-panel {
            flex-direction: column;
            gap: 10px;
            padding: 12px;
            bottom: 12px;
            left: 12px;
            right: 12px;
            align-items: stretch;
          }
          
          .search-box {
            width: 100%;
          }
          
          .filter-group {
            width: 100%;
            justify-content: space-between;
            display: flex;
            gap: 8px;
          }
          
          .control-panel {
            top: 70px; /* Move down below stats if needed */
          }
        }
      `}</style>

      {/* Loading */}
      {cargandoMapa && (
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <p className="map-loading-text">Cargando mapa en tiempo real...</p>
        </div>
      )}

      {/* Contenedor del mapa */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Panel de estadísticas */}
      {mostrarEstadisticas && mapaListo && (
        <div className="stats-panel">
          <div className="stats-header">
            <Users size={18} className="text-blue-500" />
            <div>
              <div className="stats-title">Flota GPS en Vivo</div>
              <div className="stats-time">
                {ultimaActualizacion
                  ? `Actualizado: ${ultimaActualizacion.toLocaleTimeString()}`
                  : 'Conectando...'
                }
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-dot" style={{ background: '#22c55e' }} />
              <div>
                <div className="stat-value">{estadisticas.online}</div>
                <div className="stat-label">En línea</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-dot" style={{ background: '#f59e0b' }} />
              <div>
                <div className="stat-value">{estadisticas.recent}</div>
                <div className="stat-label">Recientes</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-dot" style={{ background: '#6b7280' }} />
              <div>
                <div className="stat-value">{estadisticas.offline}</div>
                <div className="stat-label">Offline</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-dot" style={{ background: '#8b5cf6' }} />
              <div>
                <div className="stat-value">{estadisticas.enRuta}</div>
                <div className="stat-label">En ruta</div>
              </div>
            </div>
          </div>

          {estadisticas.bateriaBaja > 0 && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
              <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                ⚠️ {estadisticas.bateriaBaja} con batería baja
              </span>
            </div>
          )}
        </div>
      )}

      {/* Panel de control */}
      {mostrarControles && mapaListo && (
        <div className="control-panel">
          <button
            className={`control-btn ${polling ? 'active' : ''}`}
            onClick={() => polling ? pausarPolling() : iniciarPolling()}
            title={polling ? 'Pausar actualización' : 'Reanudar actualización'}
          >
            {polling ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            className="control-btn"
            onClick={refetch}
            title="Actualizar ahora"
          >
            <RefreshCw size={18} className={loadingGPS ? 'animate-spin' : ''} />
          </button>

          <button
            className="control-btn"
            onClick={ajustarVistaATodos}
            title="Ver todos"
          >
            <Maximize2 size={18} />
          </button>

          <button
            className={`control-btn ${modoOscuro ? 'active' : ''}`}
            onClick={() => setModoOscuro(!modoOscuro)}
            title={modoOscuro ? 'Modo claro' : 'Modo oscuro'}
          >
            {modoOscuro ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="control-btn"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      )}

      {/* Leyenda */}
      {mostrarLeyenda && mapaListo && (
        <div className="legend-panel">
          <div className="legend-title">Estado de Conexión</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#22c55e' }} />
              <span>En línea (&lt;5 min)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#f59e0b' }} />
              <span>Reciente (5-30 min)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#6b7280' }} />
              <span>Offline (&gt;30 min)</span>
            </div>
          </div>
        </div>
      )}

      {/* Panel de filtros */}
      {mapaListo && (
        <div className="filter-panel">
          <div className="search-box">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, placa o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')}>
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>

          <select
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="EN_RUTA">En ruta</option>
            <option value="EN_SERVICIO">En servicio</option>
            <option value="INACTIVO">Inactivos</option>
          </select>

          <select
            className="filter-select"
            value={filtroConexion}
            onChange={(e) => setFiltroConexion(e.target.value)}
          >
            <option value="todos">Todas conexiones</option>
            <option value="ONLINE">En línea</option>
            <option value="RECENT">Recientes</option>
            <option value="OFFLINE">Offline</option>
          </select>

          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {conductoresFiltrados.length} de {conductoresCombinados.length}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {errorGPS && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[2000]">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertCircle size={24} />
              <h3 className="font-semibold text-lg">Error de conexión GPS</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{errorGPS}</p>
            <button
              onClick={refetch}
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
