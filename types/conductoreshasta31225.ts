// ============================================================================
// TYPES: Tipos TypeScript para Conductores
// DESCRIPCIÓN: Interfaces y tipos para la estructura de 39 campos
// ACTUALIZADO: Coincide con tabla PostgreSQL actual
// ============================================================================

/**
 * Interface principal del conductor con todos los 39 campos
 */
export interface Conductor {
  // Campos de identificación
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  nombreCompleto?: string; // Campo calculado para compatibilidad
  foto?: string | null;     // ← AGREGAR ESTA LÍNEA

  // Información personal
  fechaNacimiento?: string | null; // ISO date string YYYY-MM-DD
  celular1: string;
  celular2?: string | null;
  email?: string | null;
  estadoCivil?: string | null;
  numeroHijos: number;

  // Información de domicilio
  domicilioCompleto?: string | null;
  domicilioDistrito?: string | null;
  domicilioLatitud?: number | null;
  domicilioLongitud?: number | null;

  // Contacto de emergencia
  nombreContactoEmergencia?: string | null;
  celularContactoEmergencia?: string | null;

  // Información de licencia
  numeroBrevete: string;
  fechaVencimientoBrevete?: string | null; // ISO date string

  // Información del vehículo
  marcaVehiculo?: string | null;
  modeloVehiculo?: string | null;
  placa?: string | null;
  añoVehiculo?: number | null;
  capacidadPasajeros: number;
  tipoVehiculo: TipoVehiculo;

  // Estado general
  estado: EstadoConductor;
  observaciones?: string | null;
  fechaIngreso?: string | null; // ISO date string

  // Sistema GPS y tracking
  ubicacionActualLatitud?: number | null;
  ubicacionActualLongitud?: number | null;
  ultimaActualizacionGPS?: string | null; // ISO datetime string
  precisionGPS?: number | null;
  velocidadActual: number;
  rumboActual: number;
  nivelBateria: number;
  estaConectado: boolean;
  ultimaConexion?: string | null; // ISO datetime string
  modoTracking: ModoTracking;

  // Campos de auditoría
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

/**
 * Interface para datos de GPS tracking agrupados
 */
export interface GPSTracking {
  ubicacionActual?: {
    latitud: number;
    longitud: number;
  } | null;
  ultimaActualizacion?: string | null;
  precision?: number | null;
  velocidadActual: number;
  rumboActual: number;
  nivelBateria: number;
  estaConectado: boolean;
  ultimaConexion?: string | null;
  modoTracking: ModoTracking;
  estadoConexion?: EstadoConexionGPS;
  minutosDesdeActualizacion?: number | null;
}

/**
 * Interface para el conductor con GPS agrupado (para API responses)
 */
export interface ConductorConGPS extends Omit<Conductor, 
  'ubicacionActualLatitud' | 'ubicacionActualLongitud' | 'ultimaActualizacionGPS' | 
  'precisionGPS' | 'velocidadActual' | 'rumboActual' | 'nivelBateria' | 
  'estaConectado' | 'ultimaConexion' | 'modoTracking'> {
  gpsTracking: GPSTracking;
}

/**
 * Interface para estado resumido de GPS (para listados)
 */
export interface GPSStatus {
  estaConectado: boolean;
  estadoConexion?: EstadoConexionGPS;
  minutosUltimaActualizacion?: number | null;
  nivelBateria: number;
  modoTracking: ModoTracking;
  tieneUbicacion: boolean;
}

/**
 * Interface para conductor en listados (versión ligera)
 */
export interface ConductorResumen extends Omit<Conductor,
  'ubicacionActualLatitud' | 'ubicacionActualLongitud' | 'ultimaActualizacionGPS' | 
  'precisionGPS' | 'velocidadActual' | 'rumboActual' | 'nivelBateria' | 
  'estaConectado' | 'ultimaConexion' | 'modoTracking'> {
  gpsStatus: GPSStatus;
}

/**
 * DTO para crear un nuevo conductor
 */
export interface CrearConductorDTO {
  // Obligatorios
  dni: string;
  nombres: string;
  apellidos: string;
  celular1: string;
  numeroBrevete: string;

  // Opcionales pero recomendados
  fechaNacimiento?: string;
  celular2?: string;
  email?: string;
  estadoCivil?: string;
  numeroHijos?: number;

  // Domicilio
  domicilioCompleto?: string;
  domicilioDistrito?: string;
  domicilioLatitud?: number;
  domicilioLongitud?: number;

  // Contacto emergencia
  nombreContactoEmergencia?: string;
  celularContactoEmergencia?: string;

  // Licencia
  fechaVencimientoBrevete?: string;

  // Vehículo
  marcaVehiculo?: string;
  modeloVehiculo?: string;
  placa?: string;
  añoVehiculo?: number;
  capacidadPasajeros?: number;
  tipoVehiculo?: TipoVehiculo;

  // Estado
  estado?: EstadoConductor;
  observaciones?: string;
  fechaIngreso?: string;

  // GPS inicial (opcional)
  ubicacionActualLatitud?: number;
  ubicacionActualLongitud?: number;
  modoTracking?: ModoTracking;

  // Campo de compatibilidad
  nombreCompleto?: string; // Si viene este campo, se dividirá en nombres/apellidos
}

/**
 * DTO para actualizar un conductor
 */
export interface ActualizarConductorDTO extends Partial<CrearConductorDTO> {
  // Todos los campos son opcionales para actualización
}

/**
 * Enums y tipos
 */
export type EstadoConductor = 
  | 'ACTIVO'
  | 'INACTIVO' 
  | 'EN_PERMISO'
  | 'RETIRADO';

export type TipoVehiculo = 
  | 'SEDAN'
  | 'HATCHBACK'
  | 'SUV'
  | 'MINIVAN'
  | 'STATION_WAGON'
  | 'PICKUP'
  | 'OTRO';

export type ModoTracking = 
  | 'MANUAL'
  | 'AUTOMATICO'
  | 'SERVICIO'
  | 'EMERGENCIA';

export type EstadoConexionGPS = 
  | 'ONLINE'
  | 'RECENT'
  | 'OFFLINE';

/**
 * Interface para estadísticas de conductores
 */
export interface EstadisticasConductores {
  total: number;
  activos: number;
  enPermiso: number;
  inactivos: number;
  retirados: number;
  gpsStats: {
    conectados: number;
    online: number;
    porcentajeConexion: string;
  };
  conVehiculo: number;
  mostrados: number;
}

/**
 * Interface para respuesta de API de listado
 */
export interface RespuestaListaConductores {
  conductores: ConductorResumen[];
  stats: EstadisticasConductores;
  filtros: {
    limite: number;
    estado: string;
    busqueda: string;
    conGPS: boolean;
  };
}

/**
 * Interface para respuesta de API de detalle
 */
export interface RespuestaDetalleConductor {
  conductor: ConductorConGPS;
}

/**
 * Interface para respuesta de API de creación/actualización
 */
export interface RespuestaCRUD {
  success: boolean;
  mensaje: string;
  conductor?: {
    id: number;
    dni: string;
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    celular1?: string;
    estado: EstadoConductor;
    fechaCreacion?: string;
  };
  error?: string;
  detalle?: string;
}

/**
 * Interface para parámetros de búsqueda/filtros
 */
export interface FiltrosConductores {
  estado?: EstadoConductor | 'TODOS';
  buscar?: string;
  conGPS?: boolean;
  limit?: number;
  offset?: number;
  distrito?: string;
  tipoVehiculo?: TipoVehiculo;
}

/**
 * Catálogo de marcas de vehículos para formularios
 */
export const MARCAS_VEHICULOS = [
  'Toyota', 'Kia', 'Hyundai', 'Nissan', 'Chevrolet', 'Suzuki', 'Volkswagen',
  'Mitsubishi', 'Ford', 'Renault', 'BMW', 'Mercedes Benz', 'Audi', 'Jeep',
  'Land Rover', 'Volvo', 'BAIC', 'Brilliance', 'BYD', 'Changan', 'Chery',
  'DFSK', 'Dongfeng', 'FAW', 'Foton', 'Geely', 'Great Wall', 'Haval',
  'JAC', 'Jinbei', 'Joylong', 'Kenbo', 'Otro'
] as const;

/**
 * Catálogo de tipos de vehículo
 */
export const TIPOS_VEHICULO: Record<TipoVehiculo, string> = {
  SEDAN: 'Sedán',
  HATCHBACK: 'Hatchback',
  SUV: 'SUV',
  MINIVAN: 'Minivan',
  STATION_WAGON: 'Station Wagon',
  PICKUP: 'Pickup',
  OTRO: 'Otro'
};

/**
 * Catálogo de estados civiles
 */
export const ESTADOS_CIVILES = [
  'SOLTERO(A)',
  'CASADO(A)',
  'DIVORCIADO(A)',
  'VIUDO(A)',
  'CONVIVIENTE'
] as const;

/**
 * Interface para validación de formularios
 */
export interface ErroresValidacion {
  dni?: string;
  nombres?: string;
  apellidos?: string;
  celular1?: string;
  celular2?: string;
  celularContactoEmergencia?: string;
  email?: string;
  numeroBrevete?: string;
  fechaNacimiento?: string;
  fechaVencimientoBrevete?: string;
  general?: string;
}

/**
 * Función utilitaria para validar campos obligatorios
 */
export function validarConductor(data: CrearConductorDTO): ErroresValidacion {
  const errores: ErroresValidacion = {};

  // DNI
  if (!data.dni) {
    errores.dni = 'DNI es obligatorio';
  } else if (!/^\d{8}$/.test(data.dni)) {
    errores.dni = 'DNI debe tener 8 dígitos numéricos';
  }

  // Nombres
  if (!data.nombres?.trim()) {
    errores.nombres = 'Nombres son obligatorios';
  }

  // Apellidos
  if (!data.apellidos?.trim()) {
    errores.apellidos = 'Apellidos son obligatorios';
  }

  // Celular principal
  if (!data.celular1) {
    errores.celular1 = 'Celular principal es obligatorio';
  } else if (!/^9[0-9]{8}$/.test(data.celular1)) {
    errores.celular1 = 'Celular debe tener 9 dígitos y empezar con 9';
  }

  // Celular secundario (opcional pero debe ser válido si se proporciona)
  if (data.celular2 && !/^9[0-9]{8}$/.test(data.celular2)) {
    errores.celular2 = 'Celular debe tener 9 dígitos y empezar con 9';
  }

  // Celular de emergencia (opcional pero debe ser válido si se proporciona)
  if (data.celularContactoEmergencia && !/^9[0-9]{8}$/.test(data.celularContactoEmergencia)) {
    errores.celularContactoEmergencia = 'Celular debe tener 9 dígitos y empezar con 9';
  }

  // Email (opcional pero debe ser válido si se proporciona)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errores.email = 'Formato de email inválido';
  }

  // Brevete
  if (!data.numeroBrevete?.trim()) {
    errores.numeroBrevete = 'Número de brevete es obligatorio';
  }

  return errores;
}

/**
 * Función utilitaria para verificar si hay errores de validación
 */
export function tieneErrores(errores: ErroresValidacion): boolean {
  return Object.keys(errores).length > 0;
}

// ============================================================================
// INTERFACES PARA COMPONENTES UI
// ============================================================================

/**
 * Interface para el componente FotoUpload
 */
export interface FotoUploadProps {
  currentFoto?: string | null;
  onChange: (fotoBase64: string | null) => void;
  nombre?: string;
  apellidos?: string;
}

/**
 * Función utilitaria para generar iniciales de nombres
 */
export function getInitials(nombre: string = '', apellidos: string = ''): string {
  const firstInitial = nombre.trim().charAt(0).toUpperCase();
  const lastInitial = apellidos.trim().charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}` || 'ZU';
}