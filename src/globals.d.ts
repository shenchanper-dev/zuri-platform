/**
 * Global Declarations for Legacy Components
 * Provides TypeScript declarations for existing functions
 */

declare global {
  function eliminarProgramacion(id: number, codigoProgramacion: string): Promise<{success: boolean, error?: string}>;
}

export {};
