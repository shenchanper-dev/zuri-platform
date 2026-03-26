-- Fix FK constraints that block conductor deletion
-- These two columns are nullable but had RESTRICT (default) behavior,
-- causing DELETE to fail even when the app tries to SET NULL first.
-- Changing to ON DELETE SET NULL makes the DB handle cleanup atomically.

-- Fix programacion_detalles: RESTRICT -> SET NULL
ALTER TABLE programacion_detalles
  DROP CONSTRAINT IF EXISTS programacion_detalles_conductor_id_fkey;
ALTER TABLE programacion_detalles
  ADD CONSTRAINT programacion_detalles_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE SET NULL;

-- Fix solicitudes_servicios: RESTRICT -> SET NULL
ALTER TABLE solicitudes_servicios
  DROP CONSTRAINT IF EXISTS solicitudes_servicios_conductor_id_fkey;
ALTER TABLE solicitudes_servicios
  ADD CONSTRAINT solicitudes_servicios_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE SET NULL;
