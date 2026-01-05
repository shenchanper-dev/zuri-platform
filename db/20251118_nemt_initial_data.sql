-- Archivo: db/20251118_nemt_initial_data.sql
-- Propósito: Insertar los datos iniciales y de configuración en las nuevas tablas
-- del sistema NEMT (Non-Emergency Medical Transportation).

-- -----------------------------------------------------------------------------
-- 1. TIPOS DE SERVICIO NEMT
-- -----------------------------------------------------------------------------
-- Estos tipos de servicio se corresponden con las capacidades especializadas
-- añadidas a la tabla 'conductores'.

INSERT INTO tipos_servicio_nemt (nombre, descripcion, activo) VALUES
('BÁSICO ESTÁNDAR', 'Transporte de pasajeros sin requerimientos médicos o de movilidad especializada.', TRUE),
('SILLA DE RUEDAS', 'Transporte para pasajeros que requieren silla de ruedas y vehículo adaptado.', TRUE),
('CAMILLA', 'Transporte para pacientes que requieren ir acostados, mediante camilla.', TRUE),
('DIÁLISIS', 'Servicio recurrente y dedicado para traslado a centros de diálisis.', TRUE),
('PEDIÁTRICO', 'Servicio especializado para el traslado de pacientes menores de edad.', TRUE),
('GERIÁTRICO', 'Servicio especializado para el traslado de pacientes de la tercera edad.', TRUE),
('QUIMIOTERAPIA', 'Transporte para pacientes oncológicos con necesidades especiales de comodidad.', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. CERTIFICACIONES DE CONDUCTORES
-- -----------------------------------------------------------------------------
-- Define las certificaciones y si requieren fecha de vencimiento.
-- NOTA: Se asume que la tabla tiene una columna 'requiere_vencimiento' (boolean)
-- para gestionar la lógica de expiración de credenciales.

INSERT INTO certificaciones (nombre, descripcion, requiere_vencimiento, activo) VALUES
('CPR/RCP', 'Certificación de Reanimación Cardiopulmonar.', TRUE, TRUE),
('PRIMEROS AUXILIOS', 'Certificación básica de Primeros Auxilios.', TRUE, TRUE),
('LICENCIA MEDICAMENTOS', 'Licencia para la administración o supervisión de medicamentos controlados.', TRUE, TRUE),
('MANEJO DEFENSIVO', 'Certificado de curso de manejo defensivo.', FALSE, TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. VERIFICACIÓN DE INSERCIÓN (Opcional, pero útil)
-- -----------------------------------------------------------------------------

SELECT
    'tipos_servicio_nemt' AS tabla, COUNT(*) AS registros
FROM tipos_servicio_nemt
UNION ALL
SELECT
    'certificaciones' AS tabla, COUNT(*) AS registros
FROM certificaciones;