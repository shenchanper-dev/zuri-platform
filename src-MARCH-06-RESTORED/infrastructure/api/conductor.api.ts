// ================================
// infrastructure/api/conductor.api.ts
// CAPA DE INFRAESTRUCTURA - Optimizada para VPS Hetzner CX21
// ================================

import { Conductor, CrearConductorDTO, EstadisticasConductores, PaginationParams, PaginatedResponse } from '@/domain/entities/Conductor.entity';

/**
 * Configuración de API centralizada
 * Optimizada para producción en VPS
 */
const API_CONFIG = {
  // LEAD DEV FIX: Use relative URL '/api' in browser to avoid CORS/Mixed Content.
  // Fallback to absolute URL only for server-side fetching (SSR).
  BASE_URL: typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'),
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
} as const;

/**
 * Clase de error personalizada para manejo específico
 */
export class ConductorAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ConductorAPIError';
  }
}

/**
 * Utilidad para fetch con timeout y retry
 * Optimizada para VPS con conexiones limitadas
 */
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
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ConductorAPIError) {
      throw error;
    }

    // Manejo de errores de red específicos para VPS
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

/**
 * API Repository para Conductores
 * Implementa patrón Repository con optimizaciones VPS
 */
export class ConductorRepository {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/conductores`;
  }

  /**
   * Obtener conductores con paginación (CRÍTICO para VPS)
   * Evita cargar miles de registros de una vez
   */
  async obtenerConductores(params: PaginationParams): Promise<PaginatedResponse<Conductor>> {
    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    if (params.search) searchParams.append('search', params.search);
    if (params.estado) searchParams.append('estado', params.estado);
    if (params.distrito) searchParams.append('distrito', params.distrito);

    const url = `${this.baseUrl}?${searchParams.toString()}`;

    console.log(`🔍 [ConductorAPI] Cargando página ${params.page}, límite ${params.limit}`);

    const response = await fetchWithTimeout(url, { method: 'GET' });
    const data = await response.json();

    return {
      data: data.conductores || data.data || [],
      total: data.total || 0,
      page: data.page || params.page,
      limit: data.limit || params.limit,
      totalPages: data.totalPages || Math.ceil((data.total || 0) / params.limit),
      hasNextPage: (data.page || params.page) < (data.totalPages || Math.ceil((data.total || 0) / params.limit)),
      hasPrevPage: (data.page || params.page) > 1,
    };
  }

  /**
   * Obtener estadísticas desde backend (optimización VPS)
   * El cálculo se hace en PostgreSQL, no en React
   */
  async obtenerEstadisticas(): Promise<EstadisticasConductores> {
    const url = `${this.baseUrl}/estadisticas`;

    console.log('📊 [ConductorAPI] Cargando estadísticas desde backend');

    const response = await fetchWithTimeout(url, { method: 'GET' });
    const data = await response.json();

    return data.estadisticas || data;
  }

  /**
   * Obtener conductor por ID
   */
  async obtenerConductorPorId(id: number): Promise<Conductor | null> {
    try {
      const url = `${this.baseUrl}/${id}`;
      const response = await fetchWithTimeout(url, { method: 'GET' });
      const data = await response.json();

      return data.conductor || data;
    } catch (error) {
      if (error instanceof ConductorAPIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Crear conductor
   */
  async crearConductor(datos: CrearConductorDTO): Promise<Conductor> {
    const url = this.baseUrl;

    console.log('✅ [ConductorAPI] Creando conductor:', datos.dni);

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      body: JSON.stringify(datos),
    });

    const data = await response.json();
    return data.conductor || data;
  }

  /**
   * Actualizar conductor (optimización: solo campos modificados)
   */
  async actualizarConductor(id: number, datos: Partial<Conductor>): Promise<Conductor> {
    const url = `${this.baseUrl}/${id}`;

    console.log(`🔄 [ConductorAPI] Actualizando conductor ${id}`);

    const response = await fetchWithTimeout(url, {
      method: 'PATCH', // PATCH en lugar de PUT para optimizar
      body: JSON.stringify(datos),
    });

    const data = await response.json();
    return data.conductor || data;
  }

  /**
   * Eliminar conductor
   */
  async eliminarConductor(id: number): Promise<void> {
    const url = `${this.baseUrl}/${id}`;

    console.log(`🗑️ [ConductorAPI] Eliminando conductor ${id}`);

    await fetchWithTimeout(url, { method: 'DELETE' });
  }

  /**
   * Activar conductor (operación específica)
   */
  async activarConductor(id: number): Promise<Conductor> {
    const url = `${this.baseUrl}/${id}/activar`;

    console.log(`🟢 [ConductorAPI] Activando conductor ${id}`);

    const response = await fetchWithTimeout(url, { method: 'POST' });
    const data = await response.json();

    return data.conductor || data;
  }

  /**
   * Suspender conductor con razón
   */
  async suspenderConductor(id: number, razon: string): Promise<Conductor> {
    const url = `${this.baseUrl}/${id}/suspender`;

    console.log(`🔴 [ConductorAPI] Suspendiendo conductor ${id}: ${razon}`);

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      body: JSON.stringify({ razon }),
    });

    const data = await response.json();
    return data.conductor || data;
  }
}

/**
 * Instancia singleton del repository
 * Para evitar múltiples instancias en VPS
 */
export const conductorRepository = new ConductorRepository();