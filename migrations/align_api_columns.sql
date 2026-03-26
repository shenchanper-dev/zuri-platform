-- ============================================
-- ZURI Platform - Alinear BD con API existente
-- Renombra columnas de snake_case a camelCase
-- como la API de conductores espera
-- ============================================

-- Personal
ALTER TABLE conductores RENAME COLUMN fecha_nacimiento TO "fechaNacimiento";

-- Domicilio
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "domicilioCompleto" TEXT;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "domicilioDistrito" VARCHAR(100);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "domicilioLatitud" DECIMAL(10,8);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "domicilioLongitud" DECIMAL(11,8);

-- Estado civil e hijos (si no existen)
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "estadoCivil" VARCHAR(20);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "numeroHijos" INT DEFAULT 0;

-- Contacto emergencia
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "nombreContactoEmergencia" VARCHAR(100);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "celularContactoEmergencia" VARCHAR(15);

-- Licencia
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "fechaVencimientoBrevete" DATE;

-- Vehículo (camelCase)
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "marcaVehiculo" VARCHAR(50);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "modeloVehiculo" VARCHAR(50);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "añoVehiculo" INT;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "tipoVehiculo" VARCHAR(30) DEFAULT 'SEDAN';
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "capacidadPasajeros" INT DEFAULT 4;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "colorVehiculo" VARCHAR(30);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "fotoVehiculo" TEXT;

-- GPS Tracking (camelCase para API)
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "ubicacionActualLatitud" DECIMAL(10,8);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "ubicacionActualLongitud" DECIMAL(11,8);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "ultimaActualizacionGPS" TIMESTAMP;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "precisionGPS" FLOAT;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "velocidadActual" FLOAT DEFAULT 0;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "rumboActual" FLOAT;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "nivelBateria" INT DEFAULT 100;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "estaConectado" BOOLEAN DEFAULT false;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "ultimaConexion" TIMESTAMP;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "modoTracking" VARCHAR(20) DEFAULT 'MANUAL';

-- Foto del conductor
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS foto TEXT;

-- Estado del servicio
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "estadoServicio" VARCHAR(30) DEFAULT 'DISPONIBLE';
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "fechaIngreso" DATE;

-- Campos para app móvil (nuevos, no rompen nada)
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS biometria_enabled BOOLEAN DEFAULT false;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS device_token VARCHAR(255);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS device_platform VARCHAR(20);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS app_version VARCHAR(20);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS intentos_fallidos INT DEFAULT 0;
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP;

-- Ensure marcaAuto exists (some APIs use this name)
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "marcaAuto" VARCHAR(50);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS modelo VARCHAR(50);
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS "colorAuto" VARCHAR(30);

-- Observaciones
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS observaciones TEXT;

COMMIT;
