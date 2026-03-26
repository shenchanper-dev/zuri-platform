/**
 * Leaflet Components Wrapper
 * Handles dynamic imports with proper TypeScript types
 */
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Dynamic imports with SSR disabled
export const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
) as ComponentType<any>;

export const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
) as ComponentType<any>;

export const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
) as ComponentType<any>;

export const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
) as ComponentType<any>;
