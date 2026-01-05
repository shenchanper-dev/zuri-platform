// ================================
// application/usecases/conductor.usecases.ts
// CAPA DE APLICACIÓN - Use Cases con SOLID Principles
// ================================

import { 
  Conductor, 
  CrearConductorDTO, 
  EstadisticasConductores, 
  PaginationParams, 
  PaginatedResponse 
} from '../../domain/entities/Conductor.entity';
import { ConductorRepository, ConductorAPIError } from '../../infrastructure/api/conductor.api';

/**
 * Resultado estándar para todas las operaciones
 * Facilita manejo de errores en UI
 */
export interface UseCase<T> {
  execute(...args: any[]): Promise<UseCaseResult<T>>;
}

export interface UseCaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Use Case: Obtener Conductores con Paginación
 * Optimizado para VPS Hetzner CX21
 */
export class ObtenerConductoresUseCase implements UseCase<PaginatedResponse<Conductor>> {
  constructor(private readonly repository: ConductorRepository) {}

  async execute(params: PaginationParams): Promise<UseCaseResult<PaginatedResponse<Conductor>>> {
    try {
      // Validación de entrada
      if (params.page < 1) params.page = 1;
      if (params.limit < 1 || params.limit > 100) params.limit = 20; // Limitar para VPS
      
      const resultado = await this.repository.obtenerConductores(params);
      
      console.log(`✅ [UseCase] Conductores cargados: ${resultado.data.length}/${resultado.total}`);
      
      return {
        success: true,
        data: resultado
      };
    } catch (error) {
      console.error('❌ [UseCase] Error al obtener conductores:', error);
      
      if (error instanceof ConductorAPIError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
      
      return {
        success: false,
        error: 'Error interno al obtener conductores'
      };
    }
  }
}

/**
 * Use Case: Obtener Estadísticas
 * Calculadas en backend para optimizar VPS
 */
export class ObtenerEstadisticasUseCase implements UseCase<EstadisticasConductores> {
  constructor(private readonly repository: ConductorRepository) {}

  async execute(): Promise<UseCaseResult<EstadisticasConductores>> {
    try {
      const estadisticas = await this.repository.obtenerEstadisticas();
      
      console.log('📊 [UseCase] Estadísticas obtenidas desde backend');
      
      return {
        success: true,
        data: estadisticas
      };
    } catch (error) {
      console.error('❌ [UseCase] Error al obtener estadísticas:', error);
      
      // Estadísticas por defecto en caso de error
      const estadisticasPorDefecto: EstadisticasConductores = {
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
          porcentajeActivos: 0,
      };

      return {
        success: false,
        data: estadisticasPorDefecto,
        error: 'Error al cargar estadísticas - usando valores por defecto'
      };
    }
  }
}

/**
 * Use Case: Crear Conductor
 * Con validaciones de negocio
 */
export class CrearConductorUseCase implements UseCase<Conductor> {
  constructor(private readonly repository: ConductorRepository) {}

  async execute(datos: CrearConductorDTO): Promise<UseCaseResult<Conductor>> {
    try {
      // ✅ Validaciones de negocio ANTES de enviar al backend
      const validacionResult = this.validarDatosConductor(datos);
      if (!validacionResult.success) {
        return validacionResult as UseCaseResult<Conductor>;
      }

      const conductor = await this.repository.crearConductor(datos);
      
      console.log(`✅ [UseCase] Conductor creado: ${datos.dni} - ${datos.nombres} ${datos.apellidos}`);
      
      return {
        success: true,
        data: conductor
      };
    } catch (error) {
      console.error('❌ [UseCase] Error al crear conductor:', error);
      
      if (error instanceof ConductorAPIError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
      
      return {
        success: false,
        error: 'Error interno al crear conductor'
      };
    }
  }

  /**
   * Validaciones de negocio centralizadas
   */
  private validarDatosConductor(datos: CrearConductorDTO): UseCaseResult<null> {
    // DNI debe ser exactamente 8 dígitos
    if (!/^\d{8}$/.test(datos.dni)) {
      return {
        success: false,
        error: 'DNI debe tener exactamente 8 dígitos numéricos',
        code: 'INVALID_DNI'
      };
    }

    // Email básico
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      return {
        success: false,
        error: 'Email inválido',
        code: 'INVALID_EMAIL'
      };
    }

    // Celular peruano (9 dígitos empezando por 9)
    if (!/^9\d{8}$/.test(datos.celular1.replace(/\D/g, ''))) {
      return {
        success: false,
        error: 'Celular debe ser un número peruano válido (9XXXXXXXX)',
        code: 'INVALID_PHONE'
      };
    }

    // Licencia no vacía
    if (!datos.licencia_numero?.trim()) {
      return {
        success: false,
        error: 'Número de licencia es obligatorio',
        code: 'MISSING_LICENSE'
      };
    }

    // Coordenadas válidas para Lima
    if (datos.latitud < -12.5 || datos.latitud > -11.5 ||
        datos.longitud < -77.5 || datos.longitud > -76.5) {
      return {
        success: false,
        error: 'Coordenadas deben estar dentro del área de Lima',
        code: 'INVALID_COORDINATES'
      };
    }

    return { success: true };
  }
}

/**
 * Use Case: Actualizar Conductor
 * Con actualización optimista para UX
 */
export class ActualizarConductorUseCase implements UseCase<Conductor> {
  constructor(private readonly repository: ConductorRepository) {}

  async execute(id: number, datos: Partial<Conductor>): Promise<UseCaseResult<Conductor>> {
    try {
      const conductor = await this.repository.actualizarConductor(id, datos);
      
      console.log(`🔄 [UseCase] Conductor actualizado: ${id}`);
      
      return {
        success: true,
        data: conductor
      };
    } catch (error) {
      console.error('❌ [UseCase] Error al actualizar conductor:', error);
      
      if (error instanceof ConductorAPIError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
      
      return {
        success: false,
        error: 'Error interno al actualizar conductor'
      };
    }
  }
}

/**
 * Use Case: Eliminar Conductor
 * Con confirmación de negocio
 */
export class EliminarConductorUseCase implements UseCase<void> {
  constructor(private readonly repository: ConductorRepository) {}

  async execute(id: number): Promise<UseCaseResult<void>> {
    try {
      await this.repository.eliminarConductor(id);
      
      console.log(`🗑️ [UseCase] Conductor eliminado: ${id}`);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ [UseCase] Error al eliminar conductor:', error);
      
      if (error instanceof ConductorAPIError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
      
      return {
        success: false,
        error: 'Error interno al eliminar conductor'
      };
    }
  }
}

/**
 * Use Case: Activar Conductor
 */
export class ActivarConductorUseCase implements UseCase<Conductor> {
  constructor(private readonly repository: ConductorRepository) {}

  async execute(id: number): Promise<UseCaseResult<Conductor>> {
    try {
      const conductor = await this.repository.activarConductor(id);
      
      console.log(`🟢 [UseCase] Conductor activado: ${id}`);
      
      return {
        success: true,
        data: conductor
      };
    } catch (error) {
      console.error('❌ [UseCase] Error al activar conductor:', error);
      
      if (error instanceof ConductorAPIError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
      
      return {
        success: false,
        error: 'Error interno al activar conductor'
      };
    }
  }
}

/**
 * Use Case: Suspender Conductor
 */
export class SuspenderConductorUseCase implements UseCase<Conductor> {
  constructor(private readonly repository: ConductorRepository) {}

  async execute(id: number, razon: string): Promise<UseCaseResult<Conductor>> {
    try {
      // Validar razón
      if (!razon?.trim()) {
        return {
          success: false,
          error: 'Debe proporcionar una razón para la suspensión',
          code: 'MISSING_REASON'
        };
      }

      const conductor = await this.repository.suspenderConductor(id, razon);
      
      console.log(`🔴 [UseCase] Conductor suspendido: ${id} - ${razon}`);
      
      return {
        success: true,
        data: conductor
      };
    } catch (error) {
      console.error('❌ [UseCase] Error al suspender conductor:', error);
      
      if (error instanceof ConductorAPIError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
      
      return {
        success: false,
        error: 'Error interno al suspender conductor'
      };
    }
  }
}

/**
 * Factory para Use Cases
 * Implementa Dependency Injection
 */
export class ConductorUseCaseFactory {
  constructor(private readonly repository: ConductorRepository) {}

  obtenerConductores(): ObtenerConductoresUseCase {
    return new ObtenerConductoresUseCase(this.repository);
  }

  obtenerEstadisticas(): ObtenerEstadisticasUseCase {
    return new ObtenerEstadisticasUseCase(this.repository);
  }

  crearConductor(): CrearConductorUseCase {
    return new CrearConductorUseCase(this.repository);
  }

  actualizarConductor(): ActualizarConductorUseCase {
    return new ActualizarConductorUseCase(this.repository);
  }

  eliminarConductor(): EliminarConductorUseCase {
    return new EliminarConductorUseCase(this.repository);
  }

  activarConductor(): ActivarConductorUseCase {
    return new ActivarConductorUseCase(this.repository);
  }

  suspenderConductor(): SuspenderConductorUseCase {
    return new SuspenderConductorUseCase(this.repository);
  }
}