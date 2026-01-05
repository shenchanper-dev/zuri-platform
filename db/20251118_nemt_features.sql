-- =======================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS PARA MEJORAS NEMT AVANZADAS
-- Motor de Base de Datos: PostgreSQL
-- Objetivo: Implementar estructura de datos para certificaciones,
--           capacidades especializadas, información de vehículos,
--           y agregar índices de rendimiento.
-- =======================================================================

-- 1. CREACIÓN DE TABLAS DE APOYO PARA NEMT

-- 1.1. Tabla de Tipos de Servicio NEMT (Para la configuración general)
-- Esto reemplaza a los arrays de VARCHAR en la tabla Conductores.
-- Se asume que esta tabla no existía previamente.
CREATE TABLE IF NOT EXISTS tipos_servicio_nemt (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 1.2. Tabla de Certificaciones (Para la configuración general)
-- Esto reemplaza los múltiples campos de fecha_vencimiento_xxx en Conductores.
-- Se asume que esta tabla no existía previamente.
CREATE TABLE IF NOT EXISTS certificaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE, -- Ej: CPR, Primeros Auxilios, Licencia Medicamentos
    descripcion TEXT,
    requiere_vencimiento BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 1.3. Tabla de Relación Conductor-Certificaciones
-- Esta tabla enlaza a los conductores con sus certificaciones, permitiendo
-- múltiples certificaciones y el seguimiento de su estado/vencimiento.
-- Se asume que esta tabla no existía previamente.
CREATE TABLE IF NOT EXISTS conductor_certificaciones (
    id SERIAL PRIMARY KEY,
    conductor_id INTEGER NOT NULL REFERENCES conductores(id) ON DELETE CASCADE,
    certificacion_id INTEGER NOT NULL REFERENCES certificaciones(id) ON DELETE RESTRICT,
    fecha_emision DATE,
    fecha_vencimiento DATE,
    numero_licencia VARCHAR(50), -- Útil para Licencia de Medicamentos Controlados
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE (conductor_id, certificacion_id) -- Un conductor solo debe tener una entrada por tipo de certificación
);

-- 2. ACTUALIZACIÓN DE LA TABLA 'CONDUCTORES'

-- Usaremos ALTER TABLE para añadir los campos que reflejan
-- la capacidad de transporte y la información de vehículo especializado.

ALTER TABLE conductores
    ADD COLUMN IF NOT EXISTS transporte_silla_ruedas BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_camilla BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_equipos_medicos BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_oxigeno BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_dialisis BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_quimioterapia BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_psiquiatrico BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_pediatrico BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transporte_geriatrico BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS vehiculo_modificado BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rampa_acceso BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS espacio_silla_ruedas INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS camillas_disponibles INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS equipo_oxigeno BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS equipo_succiona BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS equipo_monitor_signos BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS climatizacion_especial BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS experiencia_nemt_meses INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS calificacion_promedio NUMERIC(3, 2) DEFAULT 5.00,
    ADD COLUMN IF NOT EXISTS observaciones_nemt TEXT;


-- 3. FUNCIONES DE BASE DE DATOS

-- 3.1. Función para Marcar Certificaciones Vencidas
-- Esta función se puede ejecutar periódicamente o como un trigger.

CREATE OR REPLACE FUNCTION actualizar_certificaciones_vencidas()
RETURNS VOID AS $$
BEGIN
    UPDATE conductor_certificaciones cc
    SET activa = FALSE, updated_at = NOW()
    FROM certificaciones cert
    WHERE cc.certificacion_id = cert.id
      AND cc.fecha_vencimiento < CURRENT_DATE
      AND cc.activa = TRUE
      AND cert.requiere_vencimiento = TRUE; -- Solo aplica a las que lo requieren.
END;
$$ LANGUAGE plpgsql;

-- 4. ÍNDICES DE PERFORMANCE (Se asume que no existen previamente)

-- Índices de ubicación y estado
CREATE INDEX IF NOT EXISTS idx_conductores_ubicacion ON conductores (latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_conductores_estado_servicio ON conductores (estado, estado_servicio);
CREATE INDEX IF NOT EXISTS idx_conductores_calificacion ON conductores (calificacion_promedio DESC);

-- Índices para la nueva tabla de certificaciones
CREATE INDEX IF NOT EXISTS idx_conductor_certificaciones_vencimiento ON conductor_certificaciones(conductor_id, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_conductor_certificaciones_activa ON conductor_certificaciones(activa);

-- 5. VERIFICACIÓN DE INSTALACIÓN (OPCIONAL)

SELECT
    'conductores' as tabla, COUNT(*) as registros
FROM conductores
UNION ALL
SELECT
    'tipos_servicio_nemt' as tabla, COUNT(*) as registros
FROM tipos_servicio_nemt
UNION ALL
SELECT
    'certificaciones' as tabla, COUNT(*) as registros
FROM certificaciones
UNION ALL
SELECT
    'conductor_certificaciones' as tabla, COUNT(*) as registros
FROM conductor_certificaciones;