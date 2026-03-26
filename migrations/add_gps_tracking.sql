-- ============================================================================
-- ZURI NEMT Platform - GPS History Table Migration
-- 
-- Tabla para almacenar historial de ubicaciones GPS de conductores.
-- Permite dibujar rutas históricas y analizar patrones de movimiento.
-- 
-- Fecha: 2026-01-17
-- ============================================================================

-- Crear tabla de historial GPS
CREATE TABLE IF NOT EXISTS gps_historial (
  id SERIAL PRIMARY KEY,
  conductor_id INTEGER NOT NULL REFERENCES conductores(id) ON DELETE CASCADE,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  precision INTEGER,                    -- Precisión GPS en metros
  velocidad DECIMAL(5, 2),              -- Velocidad en km/h
  rumbo INTEGER,                        -- Dirección 0-359 grados
  nivel_bateria INTEGER,                -- Batería del dispositivo 0-100
  altitud DECIMAL(8, 2),                -- Altitud en metros (opcional)
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_gps_historial_conductor 
  ON gps_historial(conductor_id);

CREATE INDEX IF NOT EXISTS idx_gps_historial_timestamp 
  ON gps_historial(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_gps_historial_conductor_timestamp 
  ON gps_historial(conductor_id, timestamp DESC);

-- Índice espacial para consultas geográficas (si PostGIS está disponible)
-- CREATE INDEX IF NOT EXISTS idx_gps_historial_location 
--   ON gps_historial USING GIST (ST_MakePoint(longitud, latitud));

-- Comentarios
COMMENT ON TABLE gps_historial IS 'Historial de ubicaciones GPS de conductores para tracking y análisis de rutas';
COMMENT ON COLUMN gps_historial.precision IS 'Precisión del GPS en metros - valores bajos indican mayor precisión';
COMMENT ON COLUMN gps_historial.rumbo IS 'Dirección del movimiento en grados (0=Norte, 90=Este, 180=Sur, 270=Oeste)';

-- ============================================================================
-- Asegurar que conductores tiene los campos GPS necesarios
-- ============================================================================

-- Agregar columnas GPS si no existen (idempotente)
DO $$
BEGIN
  -- Campos de ubicación en tiempo real
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'ubicacionActualLatitud') THEN
    ALTER TABLE conductores ADD COLUMN "ubicacionActualLatitud" DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'ubicacionActualLongitud') THEN
    ALTER TABLE conductores ADD COLUMN "ubicacionActualLongitud" DECIMAL(11, 8);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'ultimaActualizacionGPS') THEN
    ALTER TABLE conductores ADD COLUMN "ultimaActualizacionGPS" TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'precisionGPS') THEN
    ALTER TABLE conductores ADD COLUMN "precisionGPS" INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'velocidadActual') THEN
    ALTER TABLE conductores ADD COLUMN "velocidadActual" DECIMAL(5, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'rumboActual') THEN
    ALTER TABLE conductores ADD COLUMN "rumboActual" INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'nivelBateria') THEN
    ALTER TABLE conductores ADD COLUMN "nivelBateria" INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'estaConectado') THEN
    ALTER TABLE conductores ADD COLUMN "estaConectado" BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'ultimaConexion') THEN
    ALTER TABLE conductores ADD COLUMN "ultimaConexion" TIMESTAMPTZ;
  END IF;

  -- Campos de dispositivo móvil
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'dispositivoModelo') THEN
    ALTER TABLE conductores ADD COLUMN "dispositivoModelo" VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'sistemaOperativo') THEN
    ALTER TABLE conductores ADD COLUMN "sistemaOperativo" VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conductores' AND column_name = 'appVersion') THEN
    ALTER TABLE conductores ADD COLUMN "appVersion" VARCHAR(20);
  END IF;
END $$;

-- ============================================================================
-- Datos de prueba (opcional - descomentar para demo)
-- ============================================================================

/*
-- Insertar ubicaciones de prueba para demo (Lima, Perú)
INSERT INTO gps_historial (conductor_id, latitud, longitud, velocidad, rumbo, nivel_bateria, timestamp)
SELECT 
  c.id,
  -12.0464 + (random() - 0.5) * 0.1,
  -77.0428 + (random() - 0.5) * 0.1,
  30 + random() * 40,
  floor(random() * 360),
  50 + floor(random() * 50),
  NOW() - (interval '1 minute' * floor(random() * 120))
FROM conductores c
CROSS JOIN generate_series(1, 10) -- 10 puntos por conductor
WHERE c.estado = 'ACTIVO'
LIMIT 100;

-- Actualizar ubicación actual de conductores activos
UPDATE conductores 
SET 
  "ubicacionActualLatitud" = -12.0464 + (random() - 0.5) * 0.08,
  "ubicacionActualLongitud" = -77.0428 + (random() - 0.5) * 0.08,
  "ultimaActualizacionGPS" = NOW() - (interval '1 minute' * floor(random() * 30)),
  "velocidadActual" = 20 + random() * 50,
  "rumboActual" = floor(random() * 360),
  "nivelBateria" = 30 + floor(random() * 70),
  "estaConectado" = random() > 0.3
WHERE estado = 'ACTIVO';
*/

-- ============================================================================
-- Verificar estructura
-- ============================================================================

-- SELECT 
--   table_name, 
--   column_name, 
--   data_type, 
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('conductores', 'gps_historial')
--   AND column_name LIKE '%ubicacion%' OR column_name LIKE '%gps%' OR column_name LIKE '%latitud%'
-- ORDER BY table_name, ordinal_position;
