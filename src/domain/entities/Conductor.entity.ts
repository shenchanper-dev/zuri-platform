/**
 * ZURI NEMT PLATFORM - DOMAIN LAYER
 * Entity: Conductor (Driver) - Central Source of Truth
 * Standards: SOLID, Clean Architecture, Modular Monolith
 * 
 * This entity represents a medical transport driver in the NEMT system
 * following Domain-Driven Design principles for healthcare transportation.
 */

// ============================================================================
// 1. DOMAIN VALUE OBJECTS & ENUMS
// ============================================================================

export const EstadoConductor = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  SUSPENDIDO: 'SUSPENDIDO',
  PENDIENTE: 'PENDIENTE'
} as const;

export type EstadoConductor = typeof EstadoConductor[keyof typeof EstadoConductor];

export type TipoServicio = 'MEDICINA_GENERAL' | 'PEDIATRIA' | 'LABORATORIO' | 'PHD' | 'PRECISA' | 'CRONICO' | 'OTROS';

// ============================================================================
// 2. MAIN DOMAIN ENTITY - CONDUCTOR (Complete NEMT Profile)
// ============================================================================

export interface Conductor {
  // Core Identity
  id: number;
  dni: string;
  nombreCompleto: string;
  nombres?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  sexo?: string;
  email?: string;
  
  // Visual Identity (Required for NEMT Safety)
  foto?: string;
  fotoUrl?: string;
  
  // Location & GPS (Critical for NEMT Dispatching)
  direccionCompleta: string;
  distrito_id: number;
  distrito_nombre?: string;
  latitud?: number;
  longitud?: number;
  referenciaUbicacion?: string;
  
  // Communication (Emergency Contact Requirements)
  celular1: string;
  celular2?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  contactoEmergencia?: string;
  celularEmergencia?: string;
  
  // Legal Documentation & Medical Certifications
  numeroBrevete?: string;
  licencia_numero?: string;           // DB field name compatibility
  licencia_categoria?: string;        // DB field name compatibility
  licenciaCategoria?: string;         // UI field name compatibility
  fechaVencimientoBrevete?: string;
  certificacionMedica?: boolean;
  fechaCertificacionMedica?: string;
  antecedentesPenales?: boolean;
  fechaAntecedentes?: string;
  
  // Vehicle Information (Fleet Management)
  placaVehiculo?: string;
  capacidadPasajeros?: number;        // Vehicle passenger capacity for NEMT transport
 numeroPlaca?: string;                // UI compatibility alias for placaVehiculo
  marcaAuto?: string;                 // ⭐ CRITICAL: Required by ConductorList.tsx:70
  modeloAuto?: string;
  añoAuto?: number;
  colorAuto?: string;
  soatVencimiento?: string;
  revisionTecnicaVencimiento?: string;
  
  // Operational State (NEMT Service Management)
  estado: EstadoConductor;
  servicios: string[];               // Services this driver can provide
  serviciosAsignados?: string[];     // Currently assigned services
  motivoInactividad?: string;
  puntosLicencia?: number;
  
  // Performance Metrics (KPIs)
  calificacionPromedio?: number;
  totalViajes?: number;
  totalKilometros?: number;
  
  // Audit Trail
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// 3. APPLICATION LAYER - DTOs & USE CASE INTERFACES
// ============================================================================

export interface CrearConductorDTO extends Omit<Conductor, 'id' | 'createdAt' | 'updatedAt'> {
  // Ensure required fields for creation
  dni: string;
  nombreCompleto: string;
  direccionCompleta: string;
  distrito_id: number;
  celular1: string;
  estado: EstadoConductor;
  servicios: string[];
}

export interface ActualizarConductorDTO extends Partial<CrearConductorDTO> {
  id: number; // Required for updates
}

// Comprehensive Statistics Interface (for Dashboard KPIs)
export interface EstadisticasConductores {
  // Basic Counts
  total: number;
  activos: number;
  inactivos: number;
  suspendidos: number;
  disponibles: number;
  en_servicio: number;
  
  // Quality Metrics
  con_foto: number;
  calificacion_promedio: number;
  
  // Geographic Distribution
  total_distritos: number;
  
  // Performance Metrics
  total_viajes: number;
  total_kilometros: number;
  promedio_viajes_conductor: number;
  
  // Calculated Percentages
  porcentajeActivos: number;
}

// Pagination Support (for Large Driver Lists)
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  estado?: string;
  distrito?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================================================
// 4. PRESENTATION LAYER - UI COMPONENT INTERFACES
// ============================================================================

// Filtering Interface (for ConductorList component)
export interface ConductorFilters {
  search: string;
  estado?: string;
  servicios: string[];
  marcaAuto?: string;                 // ⭐ Matches ConductorList.tsx:70 requirement
  distrito?: string;
  añoDesde?: number;
  añoHasta?: number;
}

// Component Props Interfaces
export interface ConductorListProps {
  conductores: Conductor[];
  loading: boolean;
  error?: string;
  onEdit: (conductor: Conductor) => void;
  onDelete: (id: number) => void;
  onToggleStatus?: (id: number, estado: EstadoConductor) => void;
  onView?: (conductor: Conductor) => void;
  onFilter?: (filters: ConductorFilters) => void;
}

export interface ServiciosSelectorProps {
  selectedServicios?: string[];
  selected?: string[];                    // Backward compatibility
  onChange: (servicios: string[]) => void;
  disabled?: boolean;
  error?: string;
  multiple?: boolean;
  maxSelections?: number;
}

export interface FotoUploadProps {
  currentFoto?: string;
  fotoUrl?: string;                    // Backward compatibility
  onChange?: (file: File, url?: string) => Promise<void> | void;
  onUpload?: (file: File) => Promise<void> | void;   // Backward compatibility
  nombre?: string;
  apellidos?: string;
  loading?: boolean;
  error?: string;
  maxSize?: number;
  acceptedTypes?: string[];
}

// ============================================================================
// 5. DOMAIN CONSTANTS & CONFIGURATION
// ============================================================================

export const SERVICIOS_DISPONIBLES = [
  { value: 'MEDICINA_GENERAL', label: 'Medicina General', icon: '🩺', color: '#10B981' },
  { value: 'PEDIATRIA', label: 'Pediatría', icon: '👶', color: '#3B82F6' },
  { value: 'LABORATORIO', label: 'Laboratorio', icon: '🧪', color: '#EF4444' },
  { value: 'PHD', label: 'Programa Hospitalización Domiciliaria', icon: '🏠', color: '#F59E0B' },
  { value: 'PRECISA', label: 'Atención Médica Especializada', icon: '⚕️', color: '#8B5CF6' },
  { value: 'CRONICO', label: 'Pacientes Crónicos', icon: '💊', color: '#EC4899' },
  { value: 'OTROS', label: 'Otros Servicios', icon: '🏥', color: '#6B7280' }
] as const;

export const ESTADOS_CONDUCTOR = [
  { value: EstadoConductor.ACTIVO, label: 'Activo', color: 'green' },
  { value: EstadoConductor.INACTIVO, label: 'Inactivo', color: 'gray' },
  { value: EstadoConductor.SUSPENDIDO, label: 'Suspendido', color: 'red' },
  { value: EstadoConductor.PENDIENTE, label: 'Pendiente', color: 'yellow' }
] as const;

// NEMT Compliance Constants
export const NEMT_REQUIREMENTS = {
  MIN_EXPERIENCE_MONTHS: 12,
  MAX_POINTS_LICENCIA: 8,
  REQUIRED_CERTIFICATIONS: ['certificacionMedica', 'antecedentesPenales'],
  VEHICLE_MAX_AGE_YEARS: 8,
  MIN_CALIFICACION: 4.0
} as const;

// ============================================================================
// 6. DOMAIN HELPERS & UTILITY FUNCTIONS
// ============================================================================

// Field Formatting Functions
export const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return '-';
  // Format: +51 999 999 999
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `+51 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatDni = (dni?: string): string => {
  if (!dni) return '-';
  // Format: 12345678
  return dni.replace(/\D/g, '').slice(0, 8);
};

export const formatPlaca = (placa?: string): string => {
  if (!placa) return '-';
  // Format: ABC-123 (Peru format)
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
};

// Name Processing Functions  
export const getInitials = (nombres: string = "", apellidos: string = ""): string => {
  const n = (nombres || "").trim().charAt(0).toUpperCase();
  const a = (apellidos || "").trim().charAt(0).toUpperCase();
  const initials = n + a;
  return initials || "??";
};

export const getFullName = (conductor: Conductor): string => {
  if (conductor.nombreCompleto) return conductor.nombreCompleto;
  return `${conductor.nombres || ''} ${conductor.apellidos || ''}`.trim() || 'Sin nombre';
};

// Business Logic Validators
export const isConductorElegible = (conductor: Conductor): boolean => {
  return conductor.estado === EstadoConductor.ACTIVO &&
         conductor.certificacionMedica === true &&
         conductor.antecedentesPenales !== true &&
         (conductor.puntosLicencia || 0) <= NEMT_REQUIREMENTS.MAX_POINTS_LICENCIA;
};

export const getVehicleAge = (añoAuto?: number): number => {
  if (!añoAuto) return 0;
  return new Date().getFullYear() - añoAuto;
};

export const isVehicleCompliant = (conductor: Conductor): boolean => {
  const vehicleAge = getVehicleAge(conductor.añoAuto);
  return vehicleAge <= NEMT_REQUIREMENTS.VEHICLE_MAX_AGE_YEARS &&
         !!conductor.placaVehiculo &&
         !!conductor.soatVencimiento &&
         new Date(conductor.soatVencimiento) > new Date();
};

// Status Badge Helper
export const getEstadoBadge = (estado: EstadoConductor) => {
  return ESTADOS_CONDUCTOR.find(e => e.value === estado) || ESTADOS_CONDUCTOR[1];
};

// Service Label Helper
export const getServicioLabel = (servicioId: string): string => {
  const servicio = SERVICIOS_DISPONIBLES.find(s => s.value === servicioId);
  return servicio?.label || servicioId;
};

// ============================================================================
// 7. TYPE GUARDS & VALIDATION
// ============================================================================

export const isConductor = (obj: any): obj is Conductor => {
  return obj &&
         typeof obj.id === 'number' &&
         typeof obj.dni === 'string' &&
         typeof obj.nombreCompleto === 'string' &&
         typeof obj.direccionCompleta === 'string' &&
         typeof obj.distrito_id === 'number' &&
         typeof obj.celular1 === 'string' &&
         Array.isArray(obj.servicios);
};

export const isValidEstado = (estado: any): estado is EstadoConductor => {
  return Object.values(EstadoConductor).includes(estado);
};

// ============================================================================
// 8. ERROR TYPES & EXCEPTIONS
// ============================================================================

export class ConductorValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation error in field '${field}': ${message}`);
    this.name = 'ConductorValidationError';
  }
}

export class ConductorNotFoundError extends Error {
  constructor(id: number) {
    super(`Conductor with ID ${id} not found`);
    this.name = 'ConductorNotFoundError';
  }
}

// Export default object for easier imports
export default {
  EstadoConductor,
  SERVICIOS_DISPONIBLES,
  ESTADOS_CONDUCTOR,
  NEMT_REQUIREMENTS,
  formatPhoneNumber,
  formatDni,
  formatPlaca,
  getInitials,
  getFullName,
  isConductorElegible,
  isVehicleCompliant,
  getEstadoBadge,
  getServicioLabel,
  isConductor,
  isValidEstado
};