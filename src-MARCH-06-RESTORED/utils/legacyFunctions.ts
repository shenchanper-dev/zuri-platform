/**
 * Legacy Functions Compatibility Layer
 * Provides functions for existing modules without modifying them
 * Part of: Clean Architecture Migration - Legacy Support
 */

// Función para EditorProgramacionContent.tsx
export const eliminarProgramacion = async (id: number, codigoProgramacion: string) => {
  try {
    console.log('Eliminando programación:', { id, codigoProgramacion });
    
    // TODO: Implementar lógica real de eliminación cuando sea necesario
    // Por ahora, función stub para mantener compilación
    
    const response = await fetch(`/api/programacion/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codigo_programacion: codigoProgramacion })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error eliminando programación:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Agregar más funciones legacy según aparezcan errores
export const legacyUtils = {
  eliminarProgramacion,
  // Espacio para futuras funciones legacy
};

export default legacyUtils;
