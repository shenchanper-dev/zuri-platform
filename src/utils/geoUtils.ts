/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param lat1 - Latitud del punto 1
 * @param lng1 - Longitud del punto 1
 * @param lat2 - Latitud del punto 2
 * @param lng2 - Longitud del punto 2
 * @returns Distancia en kilómetros
 */
export function calcularDistancia(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return Number(distancia.toFixed(2));
}

/**
 * Convierte grados a radianes
 */
function toRad(grados: number): number {
    return grados * (Math.PI / 180);
}

/**
 * Encuentra el conductor más cercano a una ubicación dada
 * @param conductores - Array de conductores con ubicación GPS
 * @param origenLat - Latitud del origen
 * @param origenLng - Longitud del origen
 * @returns Conductor más cercano o null si no hay conductores
 */
export function encontrarConductorMasCercano<T extends { ultima_latitud: number | null; ultima_longitud: number | null }>(
    conductores: T[],
    origenLat: number,
    origenLng: number
): (T & { distancia_km: number }) | null {
    if (conductores.length === 0) return null;

    const conductoresConDistancia = conductores
        .filter(c => c.ultima_latitud !== null && c.ultima_longitud !== null)
        .map(c => ({
            ...c,
            distancia_km: calcularDistancia(
                origenLat,
                origenLng,
                c.ultima_latitud!,
                c.ultima_longitud!
            )
        }))
        .sort((a, b) => a.distancia_km - b.distancia_km);

    return conductoresConDistancia[0] || null;
}

/**
 * Estima el tiempo de llegada basado en distancia
 * Asume velocidad promedio de 30 km/h en Lima
 */
export function estimarTiempoLlegada(distanciaKm: number): number {
    const VELOCIDAD_PROMEDIO = 30; // km/h
    return Math.round((distanciaKm / VELOCIDAD_PROMEDIO) * 60); // minutos
}

/**
 * Ordena conductores por distancia a un punto
 */
export function ordenarPorDistancia<T extends { ultima_latitud: number | null; ultima_longitud: number | null }>(
    conductores: T[],
    origenLat: number,
    origenLng: number
): (T & { distancia_km: number; tiempo_llegada_min: number })[] {
    return conductores
        .filter(c => c.ultima_latitud !== null && c.ultima_longitud !== null)
        .map(c => {
            const distancia_km = calcularDistancia(
                origenLat,
                origenLng,
                c.ultima_latitud!,
                c.ultima_longitud!
            );
            return {
                ...c,
                distancia_km,
                tiempo_llegada_min: estimarTiempoLlegada(distancia_km)
            };
        })
        .sort((a, b) => a.distancia_km - b.distancia_km);
}
