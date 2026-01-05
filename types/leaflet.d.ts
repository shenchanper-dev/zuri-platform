declare module 'leaflet' {
  export type LatLngExpression = [number, number] | {lat: number, lng: number};
  export type LatLng = {lat: number, lng: number};
  export class Map {
    constructor(element: any, options?: any);
  }
  export class Marker {
    constructor(latlng: any, options?: any);
  }
}

declare module 'react-leaflet' {
  export const MapContainer: any;
  export const TileLayer: any;
  export const Marker: any;
  export const Popup: any;
}
