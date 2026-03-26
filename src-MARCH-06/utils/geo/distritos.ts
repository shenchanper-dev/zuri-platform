/**
 * Módulo de geolocalización para distritos de Lima
 */

// Tipos
export interface Coordenada {
  lat: number;
  lng: number;
}

export interface Distrito {
  id: string;
  nombre: string;
  provincia: 'Lima' | 'Callao';
  centro: Coordenada;
  radio: number;
}

// Datos
export const DISTRITOS: Distrito[] = [
  // Lima Centro
  { id: 'lima-cercado', nombre: 'Lima Cercado', provincia: 'Lima', centro: { lat: -12.0464, lng: -77.0428 }, radio: 0.015 },
  { id: 'brena', nombre: 'Breña', provincia: 'Lima', centro: { lat: -12.0578, lng: -77.0525 }, radio: 0.008 },
  { id: 'la-victoria', nombre: 'La Victoria', provincia: 'Lima', centro: { lat: -12.0650, lng: -77.0257 }, radio: 0.012 },
  { id: 'san-luis', nombre: 'San Luis', provincia: 'Lima', centro: { lat: -12.0758, lng: -77.0106 }, radio: 0.009 },
  { id: 'rimac', nombre: 'Rímac', provincia: 'Lima', centro: { lat: -12.0301, lng: -77.0347 }, radio: 0.011 },
  
  // Lima Moderna
  { id: 'san-isidro', nombre: 'San Isidro', provincia: 'Lima', centro: { lat: -12.0965, lng: -77.0338 }, radio: 0.012 },
  { id: 'miraflores', nombre: 'Miraflores', provincia: 'Lima', centro: { lat: -12.1183, lng: -77.0306 }, radio: 0.013 },
  { id: 'san-borja', nombre: 'San Borja', provincia: 'Lima', centro: { lat: -12.1086, lng: -76.9969 }, radio: 0.012 },
  { id: 'surco', nombre: 'Surco', provincia: 'Lima', centro: { lat: -12.1367, lng: -76.9899 }, radio: 0.025 },
  { id: 'barranco', nombre: 'Barranco', provincia: 'Lima', centro: { lat: -12.1367, lng: -77.0222 }, radio: 0.008 },
  { id: 'jesus-maria', nombre: 'Jesús María', provincia: 'Lima', centro: { lat: -12.0777, lng: -77.0501 }, radio: 0.009 },
  { id: 'lince', nombre: 'Lince', provincia: 'Lima', centro: { lat: -12.0808, lng: -77.0364 }, radio: 0.007 },
  { id: 'magdalena', nombre: 'Magdalena del Mar', provincia: 'Lima', centro: { lat: -12.0978, lng: -77.0728 }, radio: 0.009 },
  { id: 'pueblo-libre', nombre: 'Pueblo Libre', provincia: 'Lima', centro: { lat: -12.0775, lng: -77.0628 }, radio: 0.010 },
  { id: 'san-miguel', nombre: 'San Miguel', provincia: 'Lima', centro: { lat: -12.0775, lng: -77.0899 }, radio: 0.015 },
  { id: 'surquillo', nombre: 'Surquillo', provincia: 'Lima', centro: { lat: -12.1113, lng: -77.0147 }, radio: 0.008 },
  
  // Lima Este
  { id: 'ate', nombre: 'Ate', provincia: 'Lima', centro: { lat: -12.0258, lng: -76.8692 }, radio: 0.035 },
  { id: 'chaclacayo', nombre: 'Chaclacayo', provincia: 'Lima', centro: { lat: -11.9792, lng: -76.7639 }, radio: 0.015 },
  { id: 'cieneguilla', nombre: 'Cieneguilla', provincia: 'Lima', centro: { lat: -12.0744, lng: -76.8128 }, radio: 0.022 },
  { id: 'el-agustino', nombre: 'El Agustino', provincia: 'Lima', centro: { lat: -12.0344, lng: -76.9939 }, radio: 0.013 },
  { id: 'la-molina', nombre: 'La Molina', provincia: 'Lima', centro: { lat: -12.0819, lng: -76.9167 }, radio: 0.023 },
  { id: 'lurigancho', nombre: 'Lurigancho-Chosica', provincia: 'Lima', centro: { lat: -11.9392, lng: -76.7044 }, radio: 0.035 },
  { id: 'sjl', nombre: 'San Juan de Lurigancho', provincia: 'Lima', centro: { lat: -11.9761, lng: -77.0061 }, radio: 0.040 },
  { id: 'santa-anita', nombre: 'Santa Anita', provincia: 'Lima', centro: { lat: -12.0431, lng: -76.9708 }, radio: 0.012 },
  
  // Lima Norte
  { id: 'ancon', nombre: 'Ancón', provincia: 'Lima', centro: { lat: -11.7767, lng: -77.1708 }, radio: 0.020 },
  { id: 'carabayllo', nombre: 'Carabayllo', provincia: 'Lima', centro: { lat: -11.8278, lng: -77.0389 }, radio: 0.035 },
  { id: 'comas', nombre: 'Comas', provincia: 'Lima', centro: { lat: -11.9486, lng: -77.0603 }, radio: 0.025 },
  { id: 'independencia', nombre: 'Independencia', provincia: 'Lima', centro: { lat: -11.9922, lng: -77.0556 }, radio: 0.015 },
  { id: 'los-olivos', nombre: 'Los Olivos', provincia: 'Lima', centro: { lat: -11.9778, lng: -77.0708 }, radio: 0.018 },
  { id: 'puente-piedra', nombre: 'Puente Piedra', provincia: 'Lima', centro: { lat: -11.8756, lng: -77.0789 }, radio: 0.025 },
  { id: 'smp', nombre: 'San Martín de Porres', provincia: 'Lima', centro: { lat: -12.0167, lng: -77.0833 }, radio: 0.028 },
  { id: 'santa-rosa', nombre: 'Santa Rosa', provincia: 'Lima', centro: { lat: -11.8086, lng: -77.1786 }, radio: 0.015 },
  
  // Lima Sur
  { id: 'chorrillos', nombre: 'Chorrillos', provincia: 'Lima', centro: { lat: -12.1733, lng: -77.0186 }, radio: 0.022 },
  { id: 'lurin', nombre: 'Lurín', provincia: 'Lima', centro: { lat: -12.2569, lng: -76.8894 }, radio: 0.025 },
  { id: 'pachacamac', nombre: 'Pachacámac', provincia: 'Lima', centro: { lat: -12.2278, lng: -76.8569 }, radio: 0.030 },
  { id: 'pucusana', nombre: 'Pucusana', provincia: 'Lima', centro: { lat: -12.4828, lng: -76.7983 }, radio: 0.015 },
  { id: 'punta-hermosa', nombre: 'Punta Hermosa', provincia: 'Lima', centro: { lat: -12.3392, lng: -76.8306 }, radio: 0.015 },
  { id: 'punta-negra', nombre: 'Punta Negra', provincia: 'Lima', centro: { lat: -12.3661, lng: -76.7967 }, radio: 0.015 },
  { id: 'san-bartolo', nombre: 'San Bartolo', provincia: 'Lima', centro: { lat: -12.3881, lng: -76.7828 }, radio: 0.015 },
  { id: 'sjm', nombre: 'San Juan de Miraflores', provincia: 'Lima', centro: { lat: -12.1556, lng: -76.9611 }, radio: 0.020 },
  { id: 'santa-maria', nombre: 'Santa María del Mar', provincia: 'Lima', centro: { lat: -12.4117, lng: -76.7736 }, radio: 0.010 },
  { id: 'ves', nombre: 'Villa El Salvador', provincia: 'Lima', centro: { lat: -12.2164, lng: -76.9439 }, radio: 0.022 },
  { id: 'vmt', nombre: 'Villa María del Triunfo', provincia: 'Lima', centro: { lat: -12.1575, lng: -76.9358 }, radio: 0.025 },
  
  // Callao
  { id: 'callao', nombre: 'Callao Cercado', provincia: 'Callao', centro: { lat: -12.0611, lng: -77.1417 }, radio: 0.020 },
  { id: 'bellavista', nombre: 'Bellavista', provincia: 'Callao', centro: { lat: -12.0636, lng: -77.1189 }, radio: 0.012 },
  { id: 'carmen-legua', nombre: 'Carmen de La Legua-Reynoso', provincia: 'Callao', centro: { lat: -12.0467, lng: -77.1053 }, radio: 0.008 },
  { id: 'la-perla', nombre: 'La Perla', provincia: 'Callao', centro: { lat: -12.0739, lng: -77.1264 }, radio: 0.010 },
  { id: 'la-punta', nombre: 'La Punta', provincia: 'Callao', centro: { lat: -12.0711, lng: -77.1658 }, radio: 0.005 },
  { id: 'mi-peru', nombre: 'Mi Perú', provincia: 'Callao', centro: { lat: -11.8525, lng: -77.1167 }, radio: 0.012 },
  { id: 'ventanilla', nombre: 'Ventanilla', provincia: 'Callao', centro: { lat: -11.8789, lng: -77.1364 }, radio: 0.025 }
];

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine
 * @param coord1 - Primera coordenada
 * @param coord2 - Segunda coordenada
 * @returns Distancia en kilómetros
 */
export function calcularDistancia(coord1: Coordenada, coord2: Coordenada): number {
  const toRad = (valor: number) => valor * Math.PI / 180;
  const R = 6371; // Radio de la Tierra en km
  
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Detecta el distrito más cercano a las coordenadas proporcionadas
 * @param lat - Latitud
 * @param lng - Longitud
 * @returns Nombre del distrito o "Lima" si no se encuentra
 */
export function detectarDistritoPorCoordenadas(lat: number, lng: number): string {
  try {
    // Validación de entrada
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      console.warn('detectarDistritoPorCoordenadas: Coordenadas inválidas:', {lat, lng});
      return 'Lima';
    }
    
    // Crear objeto coordenada
    const punto: Coordenada = { lat, lng };
    
    // Detectar por radio (más preciso)
    for (const distrito of DISTRITOS) {
      const distancia = calcularDistancia(punto, distrito.centro);
      // Convertimos el radio a kilómetros (aproximado)
      const radioKm = distrito.radio * 111.32; // 1 grado ≈ 111.32 km en el ecuador
      
      if (distancia <= radioKm) {
        return distrito.nombre;
      }
    }
    
    // Si no encontramos por radio, buscamos el más cercano
    let distritoMasCercano = DISTRITOS[0];
    let distanciaMinima = calcularDistancia(punto, DISTRITOS[0].centro);
    
    for (let i = 1; i < DISTRITOS.length; i++) {
      const distancia = calcularDistancia(punto, DISTRITOS[i].centro);
      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        distritoMasCercano = DISTRITOS[i];
      }
    }
    
    return distritoMasCercano.nombre;
  } catch (error) {
    console.error('Error en detectarDistritoPorCoordenadas:', error);
    return 'Lima';
  }
}

/**
 * Obtiene todos los nombres de distritos
 * @returns Array con nombres de todos los distritos
 */
export function obtenerTodosLosDistritos(): string[] {
  return DISTRITOS.map(d => d.nombre);
}

/**
 * Obtiene todos los distritos de una provincia
 * @param provincia - 'Lima' o 'Callao'
 * @returns Array con nombres de distritos
 */
export function obtenerDistritosPorProvincia(provincia: 'Lima' | 'Callao'): string[] {
  return DISTRITOS
    .filter(d => d.provincia === provincia)
    .map(d => d.nombre);
}

/**
 * Valida si un nombre corresponde a un distrito válido
 * @param nombre - Nombre del distrito a validar
 * @returns boolean - true si es un distrito válido
 */
export function esDistritoValido(nombre: string): boolean {
  if (!nombre) return false;
  const nombreNormalizado = nombre.trim().toLowerCase();
  return DISTRITOS.some(d => d.nombre.toLowerCase() === nombreNormalizado);
}
