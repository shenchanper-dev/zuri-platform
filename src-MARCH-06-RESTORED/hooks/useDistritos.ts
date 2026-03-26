// hooks/useDistritos.ts
// Hook para gestión de distritos con auto-detección GPS
// Clonado del patrón exacto de clínicas que SÍ funciona

import { useState, useEffect } from 'react';
import { DISTRITOS_LIMA_CALLAO, findNearestDistrito, type Distrito } from '../constantes/distritos';

interface UseDistritosReturn {
  distritos: Distrito[];
  loading: boolean;
  selectedDistrito: number | null;
  coordinates: { lat: number; lng: number } | null;
  setSelectedDistrito: (id: number) => void;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
  autoDetectDistrito: () => Promise<void>;
  isDetecting: boolean;
  detectionError: string | null;
  nearestDistrito: Distrito | null;
}

export function useDistritos(): UseDistritosReturn {
  const [distritos] = useState<Distrito[]>(DISTRITOS_LIMA_CALLAO);
  const [loading, setLoading] = useState(false);
  const [selectedDistrito, setSelectedDistrito] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [nearestDistrito, setNearestDistrito] = useState<Distrito | null>(null);

  // Auto-detectar distrito basado en coordenadas actuales
  const autoDetectDistrito = async (): Promise<void> => {
    setIsDetecting(true);
    setDetectionError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocalización no soportada en este navegador');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos de cache
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Actualizar coordenadas
      setCoordinates({ lat: latitude, lng: longitude });
      
      // Encontrar distrito más cercano
      const nearest = findNearestDistrito(latitude, longitude);
      setNearestDistrito(nearest);
      setSelectedDistrito(nearest.id);
      
      console.log('🎯 Auto-detectado:', {
        distrito: nearest.nombre,
        zona: nearest.zona,
        coordinates: { lat: latitude, lng: longitude }
      });

    } catch (error) {
      console.error('Error en auto-detección:', error);
      
      let errorMessage = 'Error desconocido';
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Permite el acceso para auto-detectar tu distrito.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS/WiFi.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
          default:
            errorMessage = 'Error al obtener ubicación';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setDetectionError(errorMessage);
    } finally {
      setIsDetecting(false);
    }
  };

  // Efecto para actualizar distrito más cercano cuando cambian las coordenadas
  useEffect(() => {
    if (coordinates) {
      const nearest = findNearestDistrito(coordinates.lat, coordinates.lng);
      setNearestDistrito(nearest);
    }
  }, [coordinates]);

  return {
    distritos,
    loading,
    selectedDistrito,
    coordinates,
    setSelectedDistrito,
    setCoordinates,
    autoDetectDistrito,
    isDetecting,
    detectionError,
    nearestDistrito
  };
}

// Hook auxiliar para obtener distrito por ID
export function useDistritoById(id: number | null): Distrito | null {
  const [distrito, setDistrito] = useState<Distrito | null>(null);

  useEffect(() => {
    if (id) {
      const found = DISTRITOS_LIMA_CALLAO.find(d => d.id === id);
      setDistrito(found || null);
    } else {
      setDistrito(null);
    }
  }, [id]);

  return distrito;
}

// Hook para agrupar distritos por zona
export function useDistritosByZona() {
  const distritosPorZona = {
    Centro: DISTRITOS_LIMA_CALLAO.filter(d => d.zona === 'Centro'),
    Norte: DISTRITOS_LIMA_CALLAO.filter(d => d.zona === 'Norte'),
    Sur: DISTRITOS_LIMA_CALLAO.filter(d => d.zona === 'Sur'),
    Este: DISTRITOS_LIMA_CALLAO.filter(d => d.zona === 'Este'),
    Oeste: DISTRITOS_LIMA_CALLAO.filter(d => d.zona === 'Oeste')
  };

  return distritosPorZona;
}

export default useDistritos;