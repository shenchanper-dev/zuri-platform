// constantes/distritos.ts
// 50 DISTRITOS: 43 Lima + 7 Callao con coordenadas GPS para auto-detección

export interface Distrito {
  id: number;
  nombre: string;
  provincia: 'Lima' | 'Callao';
  latitud: number;
  longitud: number;
  zona: 'Norte' | 'Sur' | 'Este' | 'Oeste' | 'Centro';
}

export const DISTRITOS_LIMA_CALLAO: Distrito[] = [
  // ========== PROVINCIA DE LIMA (43 distritos) ==========
  
  // ZONA CENTRO
  { id: 1, nombre: 'Lima', provincia: 'Lima', latitud: -12.0464, longitud: -77.0428, zona: 'Centro' },
  { id: 2, nombre: 'Breña', provincia: 'Lima', latitud: -12.0608, longitud: -77.0506, zona: 'Centro' },
  { id: 3, nombre: 'La Victoria', provincia: 'Lima', latitud: -12.0678, longitud: -77.0322, zona: 'Centro' },
  { id: 4, nombre: 'Lince', provincia: 'Lima', latitud: -12.0833, longitud: -77.0406, zona: 'Centro' },
  { id: 5, nombre: 'Jesús María', provincia: 'Lima', latitud: -12.0714, longitud: -77.0522, zona: 'Centro' },
  { id: 6, nombre: 'Magdalena del Mar', provincia: 'Lima', latitud: -12.1006, longitud: -77.0622, zona: 'Centro' },
  { id: 7, nombre: 'Pueblo Libre', provincia: 'Lima', latitud: -12.0781, longitud: -77.0658, zona: 'Centro' },
  { id: 8, nombre: 'San Miguel', provincia: 'Lima', latitud: -12.0769, longitud: -77.0925, zona: 'Centro' },
  { id: 9, nombre: 'Rímac', provincia: 'Lima', latitud: -12.0308, longitud: -77.0228, zona: 'Centro' },
  
  // ZONA NORTE
  { id: 10, nombre: 'Independencia', provincia: 'Lima', latitud: -11.9925, longitud: -77.0531, zona: 'Norte' },
  { id: 11, nombre: 'Los Olivos', provincia: 'Lima', latitud: -11.9706, longitud: -77.0706, zona: 'Norte' },
  { id: 12, nombre: 'San Martin de Porres', provincia: 'Lima', latitud: -12.0019, longitud: -77.0706, zona: 'Norte' },
  { id: 13, nombre: 'Comas', provincia: 'Lima', latitud: -11.9278, longitud: -77.0514, zona: 'Norte' },
  { id: 14, nombre: 'Carabayllo', provincia: 'Lima', latitud: -11.8656, longitud: -77.0394, zona: 'Norte' },
  { id: 15, nombre: 'Puente Piedra', provincia: 'Lima', latitud: -11.8558, longitud: -77.0719, zona: 'Norte' },
  { id: 16, nombre: 'Ancón', provincia: 'Lima', latitud: -11.7764, longitud: -77.1653, zona: 'Norte' },
  { id: 17, nombre: 'Santa Rosa', provincia: 'Lima', latitud: -11.8792, longitud: -77.1572, zona: 'Norte' },
  
  // ZONA SUR
  { id: 18, nombre: 'Barranco', provincia: 'Lima', latitud: -12.1431, longitud: -77.0219, zona: 'Sur' },
  { id: 19, nombre: 'Chorrillos', provincia: 'Lima', latitud: -12.1664, longitud: -77.0122, zona: 'Sur' },
  { id: 20, nombre: 'San Juan de Miraflores', provincia: 'Lima', latitud: -12.1564, longitud: -76.9739, zona: 'Sur' },
  { id: 21, nombre: 'Villa el Salvador', provincia: 'Lima', latitud: -12.2089, longitud: -76.9417, zona: 'Sur' },
  { id: 22, nombre: 'Villa María del Triunfo', provincia: 'Lima', latitud: -12.1594, longitud: -76.9356, zona: 'Sur' },
  { id: 23, nombre: 'Santiago de Surco', provincia: 'Lima', latitud: -12.1356, longitud: -76.9994, zona: 'Sur' },
  { id: 24, nombre: 'San Borja', provincia: 'Lima', latitud: -12.1017, longitud: -77.0061, zona: 'Sur' },
  { id: 25, nombre: 'Surquillo', provincia: 'Lima', latitud: -12.1100, longitud: -77.0156, zona: 'Sur' },
  { id: 26, nombre: 'Miraflores', provincia: 'Lima', latitud: -12.1200, longitud: -77.0283, zona: 'Sur' },
  { id: 27, nombre: 'San Isidro', provincia: 'Lima', latitud: -12.0956, longitud: -77.0367, zona: 'Sur' },
  { id: 28, nombre: 'Lurín', provincia: 'Lima', latitud: -12.2789, longitud: -76.8731, zona: 'Sur' },
  { id: 29, nombre: 'Pachacámac', provincia: 'Lima', latitud: -12.2461, longitud: -76.8283, zona: 'Sur' },
  { id: 30, nombre: 'Cieneguilla', provincia: 'Lima', latitud: -12.0931, longitud: -76.8019, zona: 'Sur' },
  { id: 31, nombre: 'Pucusana', provincia: 'Lima', latitud: -12.4739, longitud: -76.7981, zona: 'Sur' },
  { id: 32, nombre: 'Punta Hermosa', provincia: 'Lima', latitud: -12.3367, longitud: -76.8083, zona: 'Sur' },
  { id: 33, nombre: 'Punta Negra', provincia: 'Lima', latitud: -12.3572, longitud: -76.8047, zona: 'Sur' },
  { id: 34, nombre: 'San Bartolo', provincia: 'Lima', latitud: -12.3892, longitud: -76.7750, zona: 'Sur' },
  { id: 35, nombre: 'Santa María del Mar', provincia: 'Lima', latitud: -12.3892, longitud: -76.7750, zona: 'Sur' },
  
  // ZONA ESTE
  { id: 36, nombre: 'San Juan de Lurigancho', provincia: 'Lima', latitud: -11.9931, longitud: -77.0064, zona: 'Este' },
  { id: 37, nombre: 'El Agustino', provincia: 'Lima', latitud: -12.0431, longitud: -76.9939, zona: 'Este' },
  { id: 38, nombre: 'Santa Anita', provincia: 'Lima', latitud: -12.0433, longitud: -76.9728, zona: 'Este' },
  { id: 39, nombre: 'Ate', provincia: 'Lima', latitud: -12.0506, longitud: -76.9178, zona: 'Este' },
  { id: 40, nombre: 'Chaclacayo', provincia: 'Lima', latitud: -12.0075, longitud: -76.7636, zona: 'Este' },
  { id: 41, nombre: 'Chosica', provincia: 'Lima', latitud: -11.9417, longitud: -76.7069, zona: 'Este' },
  { id: 42, nombre: 'San Luis', provincia: 'Lima', latitud: -12.0769, longitud: -77.0017, zona: 'Este' },
  { id: 43, nombre: 'La Molina', provincia: 'Lima', latitud: -12.0711, longitud: -76.9506, zona: 'Este' },
  
  // ========== PROVINCIA DEL CALLAO (7 distritos) ==========
  { id: 44, nombre: 'Callao', provincia: 'Callao', latitud: -12.0514, longitud: -77.1181, zona: 'Oeste' },
  { id: 45, nombre: 'Bellavista', provincia: 'Callao', latitud: -12.0703, longitud: -77.1106, zona: 'Oeste' },
  { id: 46, nombre: 'Carmen de la Legua Reynoso', provincia: 'Callao', latitud: -12.0553, longitud: -77.1050, zona: 'Oeste' },
  { id: 47, nombre: 'La Perla', provincia: 'Callao', latitud: -12.0689, longitud: -77.1236, zona: 'Oeste' },
  { id: 48, nombre: 'La Punta', provincia: 'Callao', latitud: -12.0717, longitud: -77.1639, zona: 'Oeste' },
  { id: 49, nombre: 'Ventanilla', provincia: 'Callao', latitud: -11.8800, longitud: -77.1550, zona: 'Oeste' },
  { id: 50, nombre: 'Mi Perú', provincia: 'Callao', latitud: -11.9181, longitud: -77.1319, zona: 'Oeste' }
];

// Funciones auxiliares
export const getDistritoById = (id: number): Distrito | undefined => {
  return DISTRITOS_LIMA_CALLAO.find(distrito => distrito.id === id);
};

export const getDistritosByZona = (zona: string): Distrito[] => {
  return DISTRITOS_LIMA_CALLAO.filter(distrito => distrito.zona === zona);
};

export const getDistritosByProvincia = (provincia: 'Lima' | 'Callao'): Distrito[] => {
  return DISTRITOS_LIMA_CALLAO.filter(distrito => distrito.provincia === provincia);
};

export const findNearestDistrito = (lat: number, lng: number): Distrito => {
  let nearest = DISTRITOS_LIMA_CALLAO[0];
  let minDistance = calculateDistance(lat, lng, nearest.latitud, nearest.longitud);
  
  for (const distrito of DISTRITOS_LIMA_CALLAO) {
    const distance = calculateDistance(lat, lng, distrito.latitud, distrito.longitud);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = distrito;
    }
  }
  
  return nearest;
};

// Fórmula de Haversine para calcular distancia
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default DISTRITOS_LIMA_CALLAO;