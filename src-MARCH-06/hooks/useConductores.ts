import type { Conductor, CrearConductorDTO, EstadisticasConductores } from '@/domain/entities/Conductor.entity';
import { useState, useEffect, useCallback, useMemo } from 'react';

// ================================
// src/hooks/useConductores.ts
// IMPLEMENTACIÓN DEFINITIVA - Clean Architecture + SOLID + Optimizaciones VPS
// ================================

// ================================
// DOMAIN LAYER - Entidades y tipos
// ================================

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
}

export interface UseCaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ================================
// INFRASTRUCTURE LAYER - API
// ================================

class ConductorAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ConductorAPIError';
  }
}

const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 30000, // Increased from 10000 to 30000 (30 seconds)
  RETRY_ATTEMPTS: 2, // Reduced from 3 to 2 to avoid cascading timeouts
} as const;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_CONFIG.TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '2.0.0',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ConductorAPIError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ConductorAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ConductorAPIError('Timeout - VPS sobrecargado', 408, 'TIMEOUT');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new ConductorAPIError('Error de conexión al VPS', 503, 'NETWORK_ERROR');
      }
    }

    throw new ConductorAPIError('Error desconocido', 500, 'UNKNOWN');
  }
}

class ConductorRepository {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/conductores`;
  }

  async obtenerConductores(params: PaginationParams): Promise<PaginatedResponse<Conductor>> {
    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    if (params.search) searchParams.append('search', params.search);
    if (params.estado) searchParams.append('estado', params.estado);
    if (params.distrito) searchParams.append('distrito', params.distrito);

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    console.log(`🔍 [API] Cargando página ${params.page}, límite ${params.limit}`);

    const response = await fetchWithTimeout(url, { method: 'GET' });
    const data = await response.json();

    return {
      data: data.conductores || data.data || [],
      total: data.pagination?.total ?? (data.total || 0),
      page: data.pagination?.page ?? (data.page || params.page),
      limit: data.pagination?.limit ?? (data.limit || params.limit),
      totalPages: data.pagination?.totalPages ?? (data.totalPages || Math.ceil((data.total || 0) / params.limit)),
    };
  }

  async obtenerEstadisticas(): Promise<EstadisticasConductores> {
    const url = `${this.baseUrl}/estadisticas`;
    console.log('📊 [API] Cargando estadísticas desde backend');

    const response = await fetchWithTimeout(url, { method: 'GET' });
    const data = await response.json();

    return data.estadisticas || data;
  }

  async crearConductor(datos: CrearConductorDTO): Promise<Conductor> {
    console.log('✅ [API] Creando conductor:', datos.dni);

    const response = await fetchWithTimeout(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(datos),
    });

    const data = await response.json();
    return data.conductor || data;
  }

  async actualizarConductor(id: number, datos: Partial<Conductor>): Promise<Conductor> {
    console.log(`🔄 [API] Actualizando conductor ${id}`);

    // Detectar si hay archivos (fotos)
    const hasFiles = Object.values(datos).some(value => value instanceof File);

    let body: FormData | string;
    let headers: Record<string, string> = {};

    if (hasFiles) {
      // Usar FormData para archivos
      const formData = new FormData();
      Object.entries(datos).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      body = formData;
      console.log('📸 [API] Enviando FormData con archivos');
    } else {
      // Usar JSON para datos sin archivos
      body = JSON.stringify(datos);
      headers = { 'Content-Type': 'application/json' };
    }

    const response = await fetchWithTimeout(`${this.baseUrl}/${id}`, {
      method: 'PUT', // Cambiar de PATCH a PUT para coincidir con el backend
      headers,
      body,
    });

    const data = await response.json();
    return data.conductor || data;
  }

  async eliminarConductor(id: number): Promise<void> {
    console.log(`🗑️ [API] Eliminando conductor ${id}`);
    await fetchWithTimeout(`${this.baseUrl}/${id}`, { method: 'DELETE' });
  }

  async suspenderConductor(id: number, razon: string): Promise<Conductor> {
    console.log(`🔴 [API] Suspendiendo conductor ${id}: ${razon}`);

    const response = await fetchWithTimeout(`${this.baseUrl}/${id}/suspender`, {
      method: 'POST',
      body: JSON.stringify({ razon }),
    });

    const data = await response.json();
    return data.conductor || data;
  }
}

// ================================
// APPLICATION LAYER - Use Cases
// ================================

/**
 * Validaciones de negocio centralizadas (CORREGIDO)
 */
function validarDatosConductor(datos: CrearConductorDTO): UseCaseResult<null> {
  // Validación DNI
  if (!datos.dni?.trim() || datos.dni.trim().length !== 8) {
    return { success: false, error: 'DNI debe tener exactamente 8 dígitos', code: 'INVALID_DNI' };
  }

  // Validación Email
  if (datos.email && !/\S+@\S+\.\S+/.test(datos.email)) {
    return { success: false, error: 'Formato de email inválido', code: 'INVALID_EMAIL' };
  }

  // ✅ CORRECCIÓN CRÍTICA: Chequear ambos nombres de campo (DB + UI)
  const licencia = datos.licencia_numero || datos.numeroBrevete;
  if (!licencia?.trim()) {
    return {
      success: false,
      error: 'Número de licencia es obligatorio',
      code: 'MISSING_LICENSE'
    };
  }

  // Validación nombre completo
  if (!datos.nombreCompleto?.trim()) {
    return { success: false, error: 'Nombre completo es obligatorio', code: 'MISSING_NAME' };
  }

  // Validación dirección
  if (!datos.direccionCompleta?.trim()) {
    return { success: false, error: 'Dirección completa es obligatoria', code: 'MISSING_ADDRESS' };
  }

  // Validación celular
  if (!datos.celular1?.trim()) {
    return { success: false, error: 'Número de celular es obligatorio', code: 'MISSING_PHONE' };
  }

  return { success: true, data: null };
}

// ================================
// PRESENTATION LAYER - Hook Principal
// ================================

export interface UseConductoresReturn {
  readonly conductores: Conductor[];
  readonly estadisticas: EstadisticasConductores;
  readonly loading: boolean;
  readonly error: string | null;
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };

  obtenerConductores: (params?: Partial<PaginationParams>) => Promise<UseCaseResult<PaginatedResponse<Conductor>>>;
  obtenerEstadisticas: () => Promise<UseCaseResult<EstadisticasConductores>>;
  crearConductor: (datos: CrearConductorDTO) => Promise<UseCaseResult<Conductor>>;
  actualizarConductor: (id: number, datos: Partial<Conductor>) => Promise<UseCaseResult<Conductor>>;
  eliminarConductor: (id: number) => Promise<UseCaseResult<void>>;
  activarConductor: (id: number) => Promise<UseCaseResult<Conductor>>;
  suspenderConductor: (id: number, razon: string) => Promise<UseCaseResult<Conductor>>;

  filtrarConductoresLocal: (filtros: { estado?: string; distrito?: string; busqueda?: string }) => Conductor[];
  buscarEnServidor: (termino: string) => Promise<void>;
  limpiarError: () => void;
  cambiarPagina: (nuevaPagina: number) => void;
  cambiarLimite: (nuevoLimite: number) => void;
}

/**
 * HOOK PRINCIPAL - Clean Architecture + SOLID + Optimizaciones VPS
 */
export function useConductores(): UseConductoresReturn {

  // ============================================
  // ESTADO TIPADO ESTRICTAMENTE
  // ============================================

  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasConductores>({
    total: 0,
    activos: 0,
    inactivos: 0,
    suspendidos: 0,
    disponibles: 0,
    en_servicio: 0,
    con_foto: 0,
    calificacion_promedio: 0,
    total_distritos: 0,
    total_viajes: 0,
    total_kilometros: 0,
    promedio_viajes_conductor: 0,
    porcentajeActivos: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20, // Optimizado para VPS
    total: 0,
    totalPages: 0,
  });

  // ============================================
  // DEPENDENCY INJECTION
  // ============================================

  const repository = useMemo(() => new ConductorRepository(), []);

  // ============================================
  // USE CASES IMPLEMENTADOS
  // ============================================

  const obtenerConductores = useCallback(async (
    params: Partial<PaginationParams> = {}
  ): Promise<UseCaseResult<PaginatedResponse<Conductor>>> => {
    setLoading(true);
    setError(null);

    try {
      const paginationParams: PaginationParams = {
        page: params.page ?? pagination.page,
        limit: params.limit ?? pagination.limit,
        search: params.search,
        estado: params.estado,
        distrito: params.distrito,
      };

      // Validación de parámetros
      if (paginationParams.page < 1) paginationParams.page = 1;
      if (paginationParams.limit < 1 || paginationParams.limit > 100) paginationParams.limit = 20;

      const result = await repository.obtenerConductores(paginationParams);

      setConductores(result.data);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });

      console.log(`✅ [Hook] ${result.data.length} conductores cargados (página ${result.page})`);

      return { success: true, data: result };
    } catch (error: unknown) {
      let errorMessage = 'Error al obtener conductores';
      let errorCode: string | undefined;

      if (error instanceof ConductorAPIError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage, code: errorCode };
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, repository]);

  const obtenerEstadisticas = useCallback(async (): Promise<UseCaseResult<EstadisticasConductores>> => {
    try {
      const result = await repository.obtenerEstadisticas();
      setEstadisticas(result);
      console.log('📊 [Hook] Estadísticas cargadas desde backend');

      return { success: true, data: result };
    } catch (error: unknown) {
      let errorMessage = 'Error al obtener estadísticas';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage, data: estadisticas };
    }
  }, [repository, estadisticas]);

  const crearConductor = useCallback(async (datos: CrearConductorDTO): Promise<UseCaseResult<Conductor>> => {
    setLoading(true);
    setError(null);

    try {
      // Validaciones de negocio (Ahora usa la versión corregida)
      const validacion = validarDatosConductor(datos);
      if (!validacion.success) {
        setError(validacion.error || 'Datos inválidos');
        return validacion as UseCaseResult<Conductor>;
      }

      const conductor = await repository.crearConductor(datos);

      // Actualizar lista si estamos en la primera página
      if (pagination.page === 1) {
        await obtenerConductores();
      }
      await obtenerEstadisticas();

      console.log(`✅ [Hook] Conductor creado: ${datos.dni} - ${datos.nombres} ${datos.apellidos}`);

      return { success: true, data: conductor };
    } catch (error: unknown) {
      let errorMessage = 'Error al crear conductor';
      let errorCode: string | undefined;

      if (error instanceof ConductorAPIError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage, code: errorCode };
    } finally {
      setLoading(false);
    }
  }, [pagination.page, repository, obtenerConductores, obtenerEstadisticas]);

  const actualizarConductor = useCallback(async (
    id: number,
    datos: Partial<Conductor>
  ): Promise<UseCaseResult<Conductor>> => {
    // Actualización optimista para UX inmediato
    const conductorOriginal = conductores.find(c => c.id === id);
    if (conductorOriginal) {
      setConductores(prev => prev.map(c => c.id === id ? { ...c, ...datos } : c));
    }

    setError(null);

    try {
      const conductor = await repository.actualizarConductor(id, datos);

      // Confirmar actualización con datos del backend
      setConductores(prev => prev.map(c => c.id === id ? conductor : c));

      console.log(`🔄 [Hook] Conductor ${id} actualizado`);

      return { success: true, data: conductor };
    } catch (error: unknown) {
      // Revertir cambio optimista en caso de error
      if (conductorOriginal) {
        setConductores(prev => prev.map(c => c.id === id ? conductorOriginal : c));
      }

      let errorMessage = 'Error al actualizar conductor';
      let errorCode: string | undefined;

      if (error instanceof ConductorAPIError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage, code: errorCode };
    }
  }, [conductores, repository]);

  const eliminarConductor = useCallback(async (id: number): Promise<UseCaseResult<void>> => {
    setLoading(true);
    setError(null);

    try {
      await repository.eliminarConductor(id);

      // Actualizar estado local inmediatamente
      setConductores(prev => prev.filter(c => c.id !== id));
      await obtenerEstadisticas();

      console.log(`🗑️ [Hook] Conductor ${id} eliminado`);

      return { success: true };
    } catch (error: unknown) {
      let errorMessage = 'Error al eliminar conductor';
      let errorCode: string | undefined;

      if (error instanceof ConductorAPIError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage, code: errorCode };
    } finally {
      setLoading(false);
    }
  }, [repository, obtenerEstadisticas]);

  const activarConductor = useCallback(async (id: number): Promise<UseCaseResult<Conductor>> => {
    return actualizarConductor(id, { estado: 'ACTIVO' });
  }, [actualizarConductor]);

  const suspenderConductor = useCallback(async (id: number, razon: string): Promise<UseCaseResult<Conductor>> => {
    setError(null);

    try {
      // Validar razón
      if (!razon?.trim()) {
        const errorMsg = 'Debe proporcionar una razón para la suspensión';
        setError(errorMsg);
        return { success: false, error: errorMsg, code: 'MISSING_REASON' };
      }

      const conductor = await repository.suspenderConductor(id, razon);

      // Actualizar estado local
      setConductores(prev => prev.map(c => c.id === id ? conductor : c));

      console.log(`🔴 [Hook] Conductor ${id} suspendido: ${razon}`);

      return { success: true, data: conductor };
    } catch (error: unknown) {
      let errorMessage = 'Error al suspender conductor';
      let errorCode: string | undefined;

      if (error instanceof ConductorAPIError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage, code: errorCode };
    }
  }, [repository]);

  // ============================================
  // UTILIDADES DE PRESENTACIÓN (MEJORADAS)
  // ============================================

  const filtrarConductoresLocal = useCallback((filtros: {
    estado?: string;
    distrito?: string;
    busqueda?: string;
  }): Conductor[] => {
    return conductores.filter(conductor => {
      // Filtro Estado
      if (filtros.estado && filtros.estado !== 'todos' && conductor.estado !== filtros.estado) {
        return false;
      }

      // ✅ Filtro Distrito - NULL SAFE
      if (filtros.distrito && filtros.distrito !== 'todos') {
        const distritoActual = conductor.distrito_nombre || '';
        if (distritoActual !== filtros.distrito) {
          return false;
        }
      }

      // ✅ Filtro Búsqueda - COMPLETAMENTE NULL SAFE
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();

        // Helper para búsqueda segura - evita crashes con campos null/undefined
        const match = (val?: string | null) => (val || '').toLowerCase().includes(busqueda);

        return (
          match(conductor.nombreCompleto) ||
          match(conductor.dni) ||
          match(conductor.celular1) ||
          match(conductor.placa) ||
          match(conductor.placaVehiculo) ||
          match(conductor.marcaVehiculo) ||
          match(conductor.marcaAuto) ||
          match(conductor.modeloVehiculo) ||
          match(conductor.modeloAuto) ||
          match(conductor.distrito_nombre) ||
          match(conductor.email)
        );
      }

      return true;
    });
  }, [conductores]);

  // ✅ NUEVO: Búsqueda en servidor integrada
  const buscarEnServidor = useCallback(async (termino: string) => {
    if (!termino.trim()) {
      // Si no hay término, recargar con paginación actual
      await obtenerConductores({ page: 1, limit: pagination.limit });
      return;
    }

    try {
      setLoading(true);

      // ✅ Buscar en TODA la base de datos usando el repositorio instanciado
      const response = await repository.obtenerConductores({
        search: termino,
        page: 1,
        limit: 50 // Límite aumentado para búsquedas
      });

      setConductores(response.data);
      setPagination({
        ...pagination,
        page: 1,
        total: response.total,
        totalPages: Math.ceil(response.total / 50)
      });

    } catch (error) {
      console.error('Error en búsqueda servidor:', error);
      setError('Error al realizar la búsqueda en servidor');
    } finally {
      setLoading(false);
    }
  }, [pagination, repository, obtenerConductores]);

  const limpiarError = useCallback((): void => {
    setError(null);
  }, []);

  const cambiarPagina = useCallback((nuevaPagina: number): void => {
    if (nuevaPagina >= 1 && nuevaPagina <= pagination.totalPages) {
      obtenerConductores({ page: nuevaPagina });
    }
  }, [pagination.totalPages, obtenerConductores]);

  const cambiarLimite = useCallback((nuevoLimite: number): void => {
    if (nuevoLimite >= 10 && nuevoLimite <= 100) {
      obtenerConductores({ page: 1, limit: nuevoLimite });
    }
  }, [obtenerConductores]);

  // ============================================
  // EFECTO INICIAL
  // ============================================

  useEffect(() => {
    const cargarDatosIniciales = async (): Promise<void> => {
      console.log('🚀 [Hook] Iniciando carga de datos...');
      await Promise.all([
        obtenerConductores(),
        obtenerEstadisticas()
      ]);
    };

    cargarDatosIniciales();
  }, []); // Solo al montar

  // ============================================
  // RETURN INTERFACE INMUTABLE
  // ============================================

  return {
    conductores: [...conductores],
    estadisticas: { ...estadisticas },
    loading,
    error,
    pagination: { ...pagination },

    obtenerConductores,
    obtenerEstadisticas,
    crearConductor,
    actualizarConductor,
    eliminarConductor,
    activarConductor,
    suspenderConductor,

    // ✅ Nuevas funcionalidades exportadas
    filtrarConductoresLocal,
    buscarEnServidor,

    limpiarError,
    cambiarPagina,
    cambiarLimite,
  } as const;
}

export default useConductores;