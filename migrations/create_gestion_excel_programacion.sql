-- =============================================
-- MIGRACIÓN: Módulos Gestión Excel + Programación
-- Fecha: 2026-02-10
-- Base: tablas conductores, clinicas, distritos (existentes)
-- =============================================

BEGIN;

-- 1. DOCTORES
CREATE TABLE IF NOT EXISTS doctores (
  id SERIAL PRIMARY KEY,
  dni VARCHAR(20),
  nombre_completo VARCHAR(255) NOT NULL,
  especialidad VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(255),
  estado VARCHAR(20) DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctores_nombre ON doctores(nombre_completo);

-- 2. TIPOS DE SERVICIO
CREATE TABLE IF NOT EXISTS tipos_servicio (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. ÁREAS DE SERVICIO
CREATE TABLE IF NOT EXISTS areas_servicio (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. CLIENTES ESPECIALES
CREATE TABLE IF NOT EXISTS clientes_especiales (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  nombre_completo TEXT,
  activo BOOLEAN DEFAULT TRUE,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. CALIFICACIONES
CREATE TABLE IF NOT EXISTS calificaciones (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('PUNTUAL','TARDANZA','INCIDENCIA')),
  color VARCHAR(7),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. MOTIVOS NO DISPONIBILIDAD
CREATE TABLE IF NOT EXISTS motivos_no_disponibilidad (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. COBERTURA TURNOS
CREATE TABLE IF NOT EXISTS cobertura_turnos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. IMPORTACIONES EXCEL
CREATE TABLE IF NOT EXISTS importaciones_excel (
  id SERIAL PRIMARY KEY,
  codigo_zuri VARCHAR(50) UNIQUE,
  nombre_archivo TEXT NOT NULL,
  tipo_archivo VARCHAR(50) DEFAULT 'DIARIO_SIMPLE',
  fecha_archivo DATE,
  total_registros INTEGER DEFAULT 0,
  registros_procesados INTEGER DEFAULT 0,
  registros_error INTEGER DEFAULT 0,
  doctores_nuevos INTEGER DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  errores_json JSONB,
  metadatos JSONB,
  usuario_importador VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. SOLICITUDES DE SERVICIOS (importadas del Excel)
CREATE TABLE IF NOT EXISTS solicitudes_servicios (
  id SERIAL PRIMARY KEY,
  importacion_id INTEGER REFERENCES importaciones_excel(id) ON DELETE CASCADE,

  -- Fecha/hora del servicio
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  turno VARCHAR(10),

  -- Doctor
  doctor_id INTEGER REFERENCES doctores(id),
  doctor_nombre TEXT NOT NULL,
  doctor_es_nuevo BOOLEAN DEFAULT FALSE,

  -- Paciente (del Excel)
  paciente_nombre VARCHAR(255),
  paciente_dni VARCHAR(20),
  paciente_telefono VARCHAR(20),

  -- Cliente y ubicación
  cliente_nombre VARCHAR(100),
  tipo_servicio VARCHAR(50),
  area VARCHAR(100),
  descripcion TEXT,
  ubicacion TEXT,
  distrito VARCHAR(100),

  -- Direcciones (parseadas del campo DESTINO "ORIGEN/DESTINO")
  direccion_recojo TEXT,
  distrito_recojo VARCHAR(100),
  direccion_destino TEXT,
  distrito_destino VARCHAR(100),

  -- Conductor asignado
  conductor_id INTEGER REFERENCES conductores(id),
  conductor_nombre TEXT,

  -- Campos adicionales del Excel complejo
  botiquin TEXT,
  celular_ci VARCHAR(15),
  celular_personal VARCHAR(15),
  placa VARCHAR(15),
  procedencia VARCHAR(50),
  especialidad_otro VARCHAR(100),
  cooler_tipo VARCHAR(50),
  cooler_cantidad INTEGER,

  -- Estado
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  observaciones TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_importacion ON solicitudes_servicios(importacion_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_doctor ON solicitudes_servicios(doctor_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_servicios(fecha);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_servicios(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_conductor ON solicitudes_servicios(conductor_id);

-- 10. SECUENCIAS Y FUNCIONES PARA CÓDIGOS
CREATE SEQUENCE IF NOT EXISTS seq_codigo_programacion START WITH 1;
CREATE SEQUENCE IF NOT EXISTS seq_codigo_importacion START WITH 1;

CREATE OR REPLACE FUNCTION generar_codigo_programacion()
RETURNS VARCHAR(15) AS $$
DECLARE nuevo_codigo VARCHAR(15);
BEGIN
  nuevo_codigo := 'ZPROG' || LPAD(nextval('seq_codigo_programacion')::TEXT, 6, '0');
  RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_codigo_importacion()
RETURNS VARCHAR(50) AS $$
DECLARE nuevo_codigo VARCHAR(50);
BEGIN
  nuevo_codigo := 'ZURI-IMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('seq_codigo_importacion')::TEXT, 4, '0');
  RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- 11. PROGRAMACIONES
CREATE TABLE IF NOT EXISTS programaciones (
  id SERIAL PRIMARY KEY,
  codigo_programacion VARCHAR(15) UNIQUE NOT NULL DEFAULT generar_codigo_programacion(),
  importacion_id INTEGER REFERENCES importaciones_excel(id),
  fecha_programacion DATE NOT NULL,
  cliente_id INTEGER REFERENCES clinicas(id),
  cliente_nombre TEXT,
  cliente_especial_id INTEGER REFERENCES clientes_especiales(id),
  tipo_servicio_id INTEGER REFERENCES tipos_servicio(id),
  estado VARCHAR(20) DEFAULT 'BORRADOR'
    CHECK (estado IN ('BORRADOR','CONFIRMADO','EN_EJECUCION','COMPLETADO','CANCELADO')),
  notas TEXT,
  creado_por TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programaciones_fecha ON programaciones(fecha_programacion);
CREATE INDEX IF NOT EXISTS idx_programaciones_estado ON programaciones(estado);

-- 12. PROGRAMACION DETALLES
CREATE TABLE IF NOT EXISTS programacion_detalles (
  id SERIAL PRIMARY KEY,
  programacion_id INTEGER REFERENCES programaciones(id) ON DELETE CASCADE,
  solicitud_servicio_id INTEGER REFERENCES solicitudes_servicios(id),
  tipo_servicio_id INTEGER REFERENCES tipos_servicio(id),
  area_servicio_id INTEGER REFERENCES areas_servicio(id),
  cliente_id INTEGER REFERENCES clinicas(id),
  cliente_nombre TEXT,
  cliente_especial_id INTEGER REFERENCES clientes_especiales(id),
  doctor_id INTEGER REFERENCES doctores(id),
  doctor_nombre TEXT NOT NULL,
  conductor_id INTEGER REFERENCES conductores(id),
  conductor_nombre TEXT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  turno VARCHAR(10),
  ubicacion TEXT,
  direccion_completa TEXT,
  estado VARCHAR(20) DEFAULT 'PROGRAMADO',
  calificacion_id INTEGER REFERENCES calificaciones(id),
  calificacion_detalle TEXT,
  motivo_no_disponibilidad_id INTEGER REFERENCES motivos_no_disponibilidad(id),
  observaciones TEXT,
  incidencias TEXT,
  orden INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prog_detalles_prog ON programacion_detalles(programacion_id);
CREATE INDEX IF NOT EXISTS idx_prog_detalles_fecha ON programacion_detalles(fecha);
CREATE INDEX IF NOT EXISTS idx_prog_detalles_conductor ON programacion_detalles(conductor_id);
CREATE INDEX IF NOT EXISTS idx_prog_detalles_area ON programacion_detalles(area_servicio_id);

-- =============================================
-- VISTAS
-- =============================================

CREATE OR REPLACE VIEW vista_resumen_importaciones AS
SELECT
  ie.id, ie.codigo_zuri, ie.nombre_archivo, ie.tipo_archivo,
  ie.fecha_archivo, ie.estado, ie.total_registros,
  ie.registros_procesados, ie.registros_error, ie.doctores_nuevos,
  ie.created_at as fecha_importacion,
  COUNT(DISTINCT p.id) as programaciones_creadas
FROM importaciones_excel ie
LEFT JOIN programaciones p ON p.importacion_id = ie.id
GROUP BY ie.id;

CREATE OR REPLACE VIEW vista_programaciones_resumen AS
SELECT
  p.id, p.codigo_programacion, p.fecha_programacion,
  p.cliente_nombre, p.estado,
  COUNT(pd.id) as total_servicios,
  COUNT(CASE WHEN pd.conductor_id IS NOT NULL THEN 1 END) as servicios_asignados,
  COUNT(CASE WHEN pd.calificacion_id IS NOT NULL THEN 1 END) as servicios_calificados,
  p.created_at
FROM programaciones p
LEFT JOIN programacion_detalles pd ON p.id = pd.programacion_id
GROUP BY p.id
ORDER BY p.fecha_programacion DESC, p.created_at DESC;

-- =============================================
-- DATOS MAESTROS
-- =============================================

-- Tipos de servicio
INSERT INTO tipos_servicio (codigo, nombre, descripcion) VALUES
  ('MAD', 'MAD', 'Médico a Domicilio'),
  ('TAD', 'TAD', 'Traslado Asistido a Domicilio'),
  ('AMI', 'AMI', 'Atención Médica Integral'),
  ('FAD', 'FAD', 'Farmacia a Domicilio'),
  ('EKG', 'EKG', 'Electrocardiograma'),
  ('TDP', 'TDP', 'Toma de Presión'),
  ('RETEN', 'RETEN', 'Retén médico'),
  ('RDM', 'RDM', 'Revisión de medicina'),
  ('LIBRE', 'LIBRE', 'Servicio libre'),
  ('DESCANSO', 'DESCANSO', 'Día de descanso'),
  ('PERMISO', 'PERMISO', 'Permiso'),
  ('MAD-SANNA', 'MAD-SANNA', 'MAD para SANNA'),
  ('MAD-CI', 'MAD-CI', 'MAD para Clínica Internacional')
ON CONFLICT (codigo) DO NOTHING;

-- Áreas de servicio
INSERT INTO areas_servicio (codigo, nombre, orden) VALUES
  ('MEDICINA', 'MEDICINA', 1),
  ('PEDIATRIA', 'PEDIATRÍA', 2),
  ('MEDICINA_GENERAL', 'MEDICINA GENERAL', 3),
  ('LABORATORIO', 'LABORATORIO', 4),
  ('PHD', 'PHD', 5),
  ('PRECISA', 'PRECISA', 6),
  ('CRONICO', 'CRÓNICO', 7),
  ('C_EL_GOLF', 'C. EL GOLF', 8),
  ('C_SAN_BORJA', 'C. SAN BORJA', 9),
  ('CC_CHACARILLA', 'CC. CHACARILLA', 10),
  ('CC_LA_MOLINA', 'CC. LA MOLINA', 11),
  ('ASEGURABILIDAD', 'ASEGURABILIDAD', 12),
  ('OTROS', 'OTROS', 99)
ON CONFLICT (codigo) DO NOTHING;

-- Clientes especiales
INSERT INTO clientes_especiales (codigo, nombre, nombre_completo, orden) VALUES
  ('SANNA', 'SANNA', 'Clínica SANNA', 1),
  ('CI', 'C.I.', 'Clínica Internacional', 2),
  ('JP', 'JP', 'Servicios JP', 3),
  ('SM', 'SM', 'Servicios SM', 4),
  ('OTRO', 'Otro', 'Otro cliente', 99)
ON CONFLICT (codigo) DO NOTHING;

-- Calificaciones
INSERT INTO calificaciones (codigo, descripcion, tipo, color) VALUES
  ('PUNTUAL', 'PUNTUAL - llega exacto o antes', 'PUNTUAL', '#10b981'),
  ('PUNTUAL-5', 'PUNTUAL hasta 5 minutos', 'PUNTUAL', '#34d399'),
  ('TL-6-20', 'Tardanza leve 6-20 minutos', 'TARDANZA', '#fbbf24'),
  ('TL-21-60', 'Tardanza grave 21-60 minutos', 'TARDANZA', '#f97316'),
  ('SIN-UBICACION', 'No envió ubicación', 'INCIDENCIA', '#60a5fa'),
  ('QUEJA-CLIENTE', 'Queja del cliente', 'INCIDENCIA', '#ef4444')
ON CONFLICT (codigo) DO NOTHING;

-- Motivos no disponibilidad
INSERT INTO motivos_no_disponibilidad (codigo, descripcion) VALUES
  ('DESCANSO-FAMILIAR', 'Pidió descanso asunto familiar'),
  ('LIBRE-TARDE', 'Libre disponible en la tarde'),
  ('SOLO-FDS', 'Solo sale fines de semana'),
  ('MANTENIMIENTO', 'Mantenimiento de la unidad'),
  ('DISPONIBLE-MAÑANA', 'Disponible solo mañana'),
  ('DISPONIBLE-TARDE', 'Disponible solo tarde')
ON CONFLICT (codigo) DO NOTHING;

-- Cobertura turnos
INSERT INTO cobertura_turnos (codigo, descripcion) VALUES
  ('M', 'Mañana'), ('T', 'Tarde'), ('M+T', 'Mañana + Tarde'),
  ('N', 'Noche'), ('M-T', 'Mañana - Tarde'), ('CORRIDO', 'Corrido')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;
