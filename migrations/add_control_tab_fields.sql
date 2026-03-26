-- ============================================================================
-- ZURI NEMT Platform - Add Control Tab Fields
-- Migración: add_control_tab_fields.sql
-- Fecha: 2026-01-22
-- Descripción: Agrega campos para persistencia del tab Control (equipamiento NEMT y servicios)
-- ============================================================================

-- Agregar columnas para Control Tab
ALTER TABLE conductores 
  ADD COLUMN IF NOT EXISTS equipamiento_nemt TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS servicios_habilitados TEXT DEFAULT '[]';

-- Comentarios descriptivos
COMMENT ON COLUMN conductores.equipamiento_nemt IS 'JSON array de equipamiento NEMT disponible: ["Silla de Ruedas", "Oxígeno", "Rampa", "Camilla", "Botiquín", "Extintor"]';
COMMENT ON COLUMN conductores.servicios_habilitados IS 'JSON array de servicios habilitados: ["Medicina General", "Pediatría", "Laboratorio", etc]';

-- Verificar que las columnas se crearon correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'conductores' 
  AND column_name IN ('equipamiento_nemt', 'servicios_habilitados');
