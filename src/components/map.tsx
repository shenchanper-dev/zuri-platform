"use client";

import { useEffect, useRef, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import { Skeleton } from './ui/skeleton';

declare global {
  interface Window {
    L: any;
  }
}

type MarkerData = {
  coords: LatLngExpression;
  popupContent: string;
  icon?: {
    color: string;
  };
};

type MapProps = {
  center: LatLngExpression;
  zoom: number;
  markers?: MarkerData[];
  route?: LatLngExpression[];
  className?: string;
};

const VehicleIcon = (color: string) => `
  <div style="background-color:${color};" class="w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m0-14l-4 4m4-4l4 4" />
    </svg>
  </div>
`;

export function Map({ center, zoom, markers = [], route = [], className }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    cssLink.crossOrigin = '';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      if (isMounted) {
        setIsLeafletLoaded(true);
      }
    };
    document.head.appendChild(script);

    return () => {
      isMounted = false;
      document.head.removeChild(cssLink);
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (isLeafletLoaded && mapContainerRef.current && !mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView(center, zoom);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      window.L.control.zoom({ position: 'topright' }).addTo(map);
      
      mapInstanceRef.current = map;
    }
  }, [isLeafletLoaded, center, zoom]);

  useEffect(() => {
    if (mapInstanceRef.current && markers.length > 0) {
      // Clear existing markers (a more robust solution would track and remove layers)
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof window.L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      markers.forEach((m) => {
        const icon = m.icon
          ? window.L.divIcon({
              className: 'custom-div-icon',
              html: VehicleIcon(m.icon.color),
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })
          : new window.L.Icon.Default();

        window.L.marker(m.coords, { icon }).addTo(mapInstanceRef.current).bindPopup(m.popupContent);
      });
    }
  }, [isLeafletLoaded, markers]);

  useEffect(() => {
     if (mapInstanceRef.current && route.length > 0) {
        mapInstanceRef.current.eachLayer((layer: any) => {
            if (layer instanceof window.L.Polyline) {
                mapInstanceRef.current.removeLayer(layer);
            }
        });
        window.L.polyline(route, { color: 'hsl(var(--primary))', weight: 4, opacity: 0.8 }).addTo(mapInstanceRef.current);
     }
  }, [isLeafletLoaded, route]);

  return (
    <div className={className}>
      {!isLeafletLoaded && <Skeleton className="h-full w-full" />}
      <div ref={mapContainerRef} className="h-full w-full z-10" style={{ display: isLeafletLoaded ? 'block' : 'none' }} />
    </div>
  );
}
