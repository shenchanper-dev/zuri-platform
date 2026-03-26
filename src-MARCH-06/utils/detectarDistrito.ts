/**
 * Archivo de compatibilidad que redirige a la nueva estructura modular
 * Este archivo mantiene compatibilidad con el código existente mientras
 * usamos la nueva arquitectura
 */
import {
  detectarDistritoPorCoordenadas,
  obtenerTodosLosDistritos,
  obtenerDistritosPorProvincia,
  esDistritoValido,
  DISTRITOS
} from './geo/distritos';

// Re-exportar todo para mantener compatibilidad
export {
  detectarDistritoPorCoordenadas,
  obtenerTodosLosDistritos,
  obtenerDistritosPorProvincia,
  esDistritoValido
};

// Compatibilidad con default export
export default {
  detectarDistritoPorCoordenadas,
  obtenerTodosLosDistritos,
  obtenerDistritosPorProvincia,
  esDistritoValido,
  DISTRITOS_LIMA: DISTRITOS.reduce((acc, d) => ({
    ...acc,
    [d.nombre]: {
      nombre: d.nombre,
      provincia: d.provincia,
      coordenadas: {
        lat: d.centro.lat,
        lng: d.centro.lng,
        radio: d.radio
      }
    }
  }), {})
};
