'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useMap } from 'react-leaflet/hooks';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapUpdaterProps {
    center: [number, number];
}

// Component to update map center when coordinates change
function MapUpdater({ center }: MapUpdaterProps) {
    const map = useMap() as any;

    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);

    return null;
}

interface OpenStreetMapProps {
    latitude: number | null;
    longitude: number | null;
    address?: string;
    nombre?: string;
    className?: string;
}

export default function OpenStreetMap({
    latitude,
    longitude,
    address,
    nombre,
    className = "w-full h-64 rounded-lg border-2 border-slate-200"
}: OpenStreetMapProps) {
    // Default to Lima, Peru if no coordinates
    const defaultLat = -12.046374;
    const defaultLon = -77.042793;

    const lat = latitude ?? defaultLat;
    const lon = longitude ?? defaultLon;
    const position: [number, number] = [lat, lon];

    return (
        <div className={className}>
            <MapContainer
                center={position}
                zoom={latitude && longitude ? 15 : 11}
                style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {latitude && longitude && (
                    <Marker position={position}>
                        <Popup>
                            <div className="text-sm">
                                {nombre && <div className="font-bold text-slate-800">{nombre}</div>}
                                {address && <div className="text-slate-600 mt-1">{address}</div>}
                                <div className="text-xs text-slate-400 mt-2">
                                    📍 {lat.toFixed(6)}, {lon.toFixed(6)}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                <MapUpdater center={position} />
            </MapContainer>
        </div>
    );
}
