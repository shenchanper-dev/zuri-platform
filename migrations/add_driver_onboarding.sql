-- ============================================================================
-- Migration: Add Driver Onboarding Fields (Fixed)
-- ============================================================================

-- 1. Add registration status tracking
ALTER TABLE conductores 
ADD COLUMN IF NOT EXISTS estado_registro VARCHAR(20) DEFAULT 'EN_PROCESO',
ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_rechazo TIMESTAMP,
ADD COLUMN IF NOT EXISTS razon_rechazo TEXT;

-- 2. Email verification
ALTER TABLE conductores
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS codigo_verificacion_email VARCHAR(6),
ADD COLUMN IF NOT EXISTS expiracion_codigo_email TIMESTAMP;

-- 3. Terms and conditions
ALTER TABLE conductores
ADD COLUMN IF NOT EXISTS terminos_aceptados BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_aceptacion_terminos TIMESTAMP,
ADD COLUMN IF NOT EXISTS version_terminos VARCHAR(10) DEFAULT '1.0';

-- 4. WhatsApp notifications tracking
ALTER TABLE conductores
ADD COLUMN IF NOT EXISTS advertencias_enviadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_advertencia_fecha TIMESTAMP,
ADD COLUMN IF NOT EXISTS ultima_advertencia_tipo VARCHAR(10);

-- 5. Create usuarios table if not exists
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    rol VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 6. Create conductor_documentos table
CREATE TABLE IF NOT EXISTS conductor_documentos (
    id SERIAL PRIMARY KEY,
    conductor_id INTEGER NOT NULL REFERENCES conductores(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL,
    url_archivo VARCHAR(500),
    nombre_archivo VARCHAR(255),
    tamanio_bytes INTEGER,
    tipo_mime VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    motivo_rechazo TEXT,
    fecha_subida TIMESTAMP DEFAULT NOW(),
    fecha_verificacion TIMESTAMP,
    verificado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_conductor_tipo UNIQUE (conductor_id, tipo_documento)
);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_conductores_estado_registro ON conductores(estado_registro);
CREATE INDEX IF NOT EXISTS idx_conductores_fecha_registro ON conductores(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_conductores_email_verificado ON conductores(email_verificado);
CREATE INDEX IF NOT EXISTS idx_conductor_documentos_conductor ON conductor_documentos(conductor_id);
CREATE INDEX IF NOT EXISTS idx_conductor_documentos_estado ON conductor_documentos(estado);
CREATE INDEX IF NOT EXISTS idx_conductor_documentos_tipo ON conductor_documentos(tipo_documento);

-- 8. Update existing conductores to APROBADO
UPDATE conductores 
SET estado_registro = 'APROBADO',
    fecha_aprobacion = NOW(),
    email_verificado = true,
    terminos_aceptados = true
WHERE estado = 'ACTIVO'
  AND (estado_registro IS NULL OR estado_registro = 'EN_PROCESO');
