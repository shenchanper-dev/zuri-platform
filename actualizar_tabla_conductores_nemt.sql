-- ==============================================================================
-- SCRIPT DE ACTUALIZACIÓN DE LA TABLA "CONDUCTORES"
-- Añade campos avanzados necesarios para la gestión NEMT (Non-Emergency Medical Transport)
-- Base de datos: PostgreSQL
-- ==============================================================================

-- Usamos un solo comando ALTER TABLE con múltiples ADD COLUMN IF NOT EXISTS
-- para aplicar todos los cambios de manera eficiente.

ALTER TABLE conductores
    -- 1. SECCIÓN: Certificaciones y Licencias
    -- Certificaciones (como array de strings, ej: {'BLS', 'PALS'})
    ADD COLUMN IF NOT EXISTS certificaciones VARCHAR[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS fecha_certificacion_cpr DATE,
    ADD COLUMN IF NOT EXISTS fecha_vencimiento_cpr DATE,
    ADD COLUMN IF NOT EXISTS certificacion_primeros_auxilios BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fecha_vencimiento_primeros_auxilios DATE,
    ADD COLUMN IF NOT EXISTS licencia_medicamentos_controlados BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS numero_licencia_medicamentos VARCHAR(50),
    -- Indicador para el proceso de validación de documentos (del driver)
    ADD COLUMN IF NOT EXISTS documentos_vencidos BOOLEAN DEFAULT FALSE,

    -- 2. SECCIÓN: Capacidades de Transporte Especializado (NEMT)
    ADD COLUMN IF NOT EXISTS transporte_silla_ruedas BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_camilla BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_equipos_medicos BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_oxigeno BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_dialisis BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_quimioterapia BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_psiquiatrico BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_pediatrico BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_geriatrico BOOLEAN DEFAULT FALSE,

    -- 3. SECCIÓN: Información de Vehículo Especializado
    ADD COLUMN IF NOT EXISTS vehiculo_modificado BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rampa_acceso BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS espacio_silla_ruedas INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS camillas_disponibles INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS equipo_oxigeno BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS equipo_succiona BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS equipo_monitor_signos BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS climatizacion_especial BOOLEAN DEFAULT FALSE,

    -- 4. SECCIÓN: Experiencia y Calificaciones
    ADD COLUMN IF NOT EXISTS experiencia_nemt_anios INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS calificacion_promedio NUMERIC(2, 1) DEFAULT 5.0,
    ADD COLUMN IF NOT EXISTS numero_viajes_nemt INTEGER DEFAULT 0
;

-- 5. VERIFICACIÓN (Opcional)
-- Ejecuta esto después de la actualización para confirmar que los campos existen.
-- Esta consulta está adaptada de tu documento para una verificación rápida.
/*
SELECT
    column_name,
    data_type
FROM
    information_schema.columns
WHERE
    table_name = 'conductores'
    AND column_name IN (
        'certificaciones',
        'transporte_silla_ruedas',
        'experiencia_nemt_anios',
        'equipo_oxigeno'
    );
*/
