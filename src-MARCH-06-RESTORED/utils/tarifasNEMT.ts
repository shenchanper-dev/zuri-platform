// Tarifas base de Uber Lima (actualizadas 2026)
export const TARIFAS_BASE_LIMA = {
    base: 3.50,           // S/ tarifa base
    por_km: 0.73,         // S/ por kilómetro
    por_minuto: 0.15,     // S/ por minuto
    minimo: 7.00,         // S/ tarifa mínima
    cancelacion: 4.00     // S/ cargo por cancelación
};

// Multiplicadores NEMT según tipo de servicio
export const MULTIPLICADORES_NEMT = {
    ambulatory: 1.5,      // +50% - Paciente puede caminar
    wheelchair: 2.0,      // +100% - Silla de ruedas
    stretcher: 2.5        // +150% - Camilla
};

// Velocidad promedio en Lima (km/h)
const VELOCIDAD_PROMEDIO_LIMA = 30;

/**
 * Calcula la tarifa NEMT basada en distancia, tiempo y tipo de servicio
 * @param distanciaKm - Distancia en kilómetros
 * @param tiempoMin - Tiempo estimado en minutos (opcional, se calcula si no se provee)
 * @param tipoServicio - Tipo de servicio NEMT
 * @returns Tarifa total en soles (redondeada a S/ 0.50)
 */
export function calcularTarifaNEMT(
    distanciaKm: number,
    tiempoMin: number | null,
    tipoServicio: 'ambulatory' | 'wheelchair' | 'stretcher'
): number {
    // Si no se provee tiempo, estimarlo basado en distancia
    const tiempo = tiempoMin || (distanciaKm / VELOCIDAD_PROMEDIO_LIMA) * 60;

    // Calcular tarifa base tipo Uber
    const tarifaUber = TARIFAS_BASE_LIMA.base +
        (distanciaKm * TARIFAS_BASE_LIMA.por_km) +
        (tiempo * TARIFAS_BASE_LIMA.por_minuto);

    // Aplicar multiplicador NEMT
    const multiplicador = MULTIPLICADORES_NEMT[tipoServicio];
    const tarifaConPremium = tarifaUber * multiplicador;

    // Aplicar tarifa mínima con multiplicador NEMT
    const tarifaMinima = TARIFAS_BASE_LIMA.minimo * multiplicador;

    // Redondear a S/ 0.50 (ej: 19.80 → 20.00, 19.30 → 19.50)
    const tarifaFinal = Math.max(tarifaConPremium, tarifaMinima);
    return Math.ceil(tarifaFinal * 2) / 2;
}

/**
 * Calcula el desglose detallado de la tarifa
 */
export function calcularDesgloseTarifa(
    distanciaKm: number,
    tiempoMin: number | null,
    tipoServicio: 'ambulatory' | 'wheelchair' | 'stretcher'
) {
    const tiempo = tiempoMin || (distanciaKm / VELOCIDAD_PROMEDIO_LIMA) * 60;

    const tarifaBase = TARIFAS_BASE_LIMA.base;
    const tarifaDistancia = distanciaKm * TARIFAS_BASE_LIMA.por_km;
    const tarifaTiempo = tiempo * TARIFAS_BASE_LIMA.por_minuto;
    const tarifaUberTotal = tarifaBase + tarifaDistancia + tarifaTiempo;

    const multiplicador = MULTIPLICADORES_NEMT[tipoServicio];
    const premiumNEMT = tarifaUberTotal * (multiplicador - 1);
    const tarifaTotal = calcularTarifaNEMT(distanciaKm, tiempo, tipoServicio);

    return {
        tarifa_base: Number(tarifaBase.toFixed(2)),
        tarifa_distancia: Number(tarifaDistancia.toFixed(2)),
        tarifa_tiempo: Number(tarifaTiempo.toFixed(2)),
        tarifa_uber_total: Number(tarifaUberTotal.toFixed(2)),
        multiplicador_nemt: multiplicador,
        premium_nemt: Number(premiumNEMT.toFixed(2)),
        tarifa_total: tarifaTotal,
        distancia_km: Number(distanciaKm.toFixed(2)),
        tiempo_estimado_min: Math.round(tiempo)
    };
}

/**
 * Estima el tiempo de llegada basado en distancia
 */
export function estimarTiempoLlegada(distanciaKm: number): number {
    return Math.round((distanciaKm / VELOCIDAD_PROMEDIO_LIMA) * 60);
}
