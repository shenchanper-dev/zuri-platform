-- Agregar campo 'online' a conductores para tracking de disponibilidad en tiempo real
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT false;

-- Crear índice para búsquedas rápidas de conductores online
CREATE INDEX IF NOT EXISTS idx_conductores_online ON conductores(online) WHERE online = true;

-- Crear tabla para registrar ofertas rechazadas (para analytics y mejora del algoritmo)
CREATE TABLE IF NOT EXISTS ofertas_rechazadas (
  id SERIAL PRIMARY KEY,
  servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  conductor_id INTEGER NOT NULL REFERENCES conductores(id) ON DELETE CASCADE,
  razon_rechazo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ofertas_rechazadas_servicio ON ofertas_rechazadas(servicio_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_rechazadas_conductor ON ofertas_rechazadas(conductor_id);

-- Actualizar servicios para agregar campos necesarios para NEMT automático
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS tipo_servicio VARCHAR(20) DEFAULT 'ambulatory';
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS distancia_km DECIMAL(10,2);
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS tarifa_calculada DECIMAL(10,2);
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS notas_especiales TEXT;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS hora_fin TIME;

-- Comentarios para documentación
COMMENT ON COLUMN conductores.online IS 'Indica si el conductor está online y disponible para recibir ofertas de servicio';
COMMENT ON TABLE ofertas_rechazadas IS 'Registro de ofertas de servicio rechazadas por conductores para analytics';
COMMENT ON COLUMN servicios.tipo_servicio IS 'Tipo de servicio NEMT: ambulatory, wheelchair, stretcher';
COMMENT ON COLUMN servicios.tarifa_calculada IS 'Tarifa calculada automáticamente basada en distancia y tipo de servicio';
