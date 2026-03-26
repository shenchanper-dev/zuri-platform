-- ============================================================================
-- MIGRACIÓN COMPLETA: Doctores + Pacientes + ZURI Assistant
-- ============================================================================
-- Autor: Sistema Zuri Platform
-- Fecha: 2026-02-10
-- Descripción: Expansión completa de módulos médicos y asistente AI

-- ============================================================================
-- PARTE 1: EXPANSIÓN DE DOCTORES
-- ============================================================================

-- 1.1 Catálogo de Especialidades Médicas
CREATE TABLE IF NOT EXISTS especialidades_medicas (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  tipo VARCHAR(50) DEFAULT 'CLINICA' CHECK (tipo IN 
    ('CLINICA', 'QUIRURGICA', 'DIAGNOSTICA', 'REHABILITACION')),
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Data maestro de especialidades
INSERT INTO especialidades_medicas (codigo, nombre, tipo, orden) VALUES
('GEN', 'Medicina General', 'CLINICA', 1),
('CAR', 'Cardiología', 'CLINICA', 2),
('PED', 'Pediatría', 'CLINICA', 3),
('GIN', 'Ginecología y Obstetricia', 'CLINICA', 4),
('NEU', 'Neurología', 'CLINICA', 5),
('ONC', 'Oncología', 'CLINICA', 6),
('OFT', 'Oftalmología', 'CLINICA', 7),
('TRA', 'Traumatología', 'QUIRURGICA', 8),
('CIR', 'Cirugía General', 'QUIRURGICA', 9),
('DER', 'Dermatología', 'CLINICA', 10),
('PSI', 'Psiquiatría', 'CLINICA', 11),
('GER', 'Geriatría', 'CLINICA', 12),
('END', 'Endocrinología', 'CLINICA', 13),
('NEF', 'Nefrología', 'CLINICA', 14),
('GAE', 'Gastroenterología', 'CLINICA', 15)
ON CONFLICT (codigo) DO NOTHING;

-- 1.2 Refactorizar tabla doctores (RECREAR si es necesario)
-- Primero, respaldar datos existentes si hay
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'doctores') THEN
    CREATE TEMP TABLE doctores_backup AS SELECT * FROM doctores;
  END IF;
END $$;

-- Eliminar tabla vieja y recrear
DROP TABLE IF EXISTS doctores CASCADE;

CREATE TABLE doctores (
  id SERIAL PRIMARY KEY,
  
  -- Identificación
  dni VARCHAR(20) UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  nombre_completo VARCHAR(300) GENERATED ALWAYS AS 
    (apellido_paterno || ' ' || COALESCE(apellido_materno || ', ', ', ') || nombres) STORED,
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  
  -- Profesional
  cmp VARCHAR(50) UNIQUE NOT NULL,
  rne VARCHAR(50) UNIQUE,
  especialidad_principal_id INT REFERENCES especialidades_medicas(id),
  universidad VARCHAR(255),
  anos_experiencia INT,
  
  -- Contacto
  celular VARCHAR(20),
  email_profesional VARCHAR(255),
  idiomas JSONB DEFAULT '["Español"]'::jsonb,
  
  -- Consulta
  acepta_teleconsulta BOOLEAN DEFAULT false,
  duracion_consulta_min INT DEFAULT 30,
  precio_consulta_promedio DECIMAL(10,2),
  
  -- Media
  foto_url VARCHAR(500),
  firma_url VARCHAR(500),
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN 
    ('ACTIVO', 'INACTIVO', 'VACACIONES', 'LICENCIA', 'SUSPENDIDO')),
  
  -- Observaciones
  observaciones_doctores TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  
  CONSTRAINT valid_cmp CHECK (cmp ~ '^[0-9]+$'),
  CONSTRAINT valid_rne CHECK (rne IS NULL OR rne ~ '^[0-9]+$')
);

CREATE INDEX idx_doctores_cmp ON doctores(cmp);
CREATE INDEX idx_doctores_dni ON doctores(dni);
CREATE INDEX idx_doctores_estado ON doctores(estado);
CREATE INDEX idx_doctores_especialidad ON doctores(especialidad_principal_id);
CREATE INDEX idx_doctores_nombre ON doctores(nombre_completo);

-- Restaurar datos si existen
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'doctores_backup' AND schemaname = 'pg_temp') THEN
    INSERT INTO doctores (id, cmp, nombre_completo, nombres, apellido_paterno)
    SELECT 
      id,
      cmp,
      nombre_completo,
      SPLIT_PART(nombre_completo, ', ', 2) as nombres,
      SPLIT_PART(SPLIT_PART(nombre_completo, ', ', 1), ' ', 1) as apellido_paterno
    FROM pg_temp.doctores_backup
    ON CONFLICT (cmp) DO NOTHING;
    
    -- Reset sequence
    PERFORM setval('doctores_id_seq', COALESCE((SELECT MAX(id) FROM doctores), 1));
  END IF;
END $$;

-- 1.3 Subespecialidades (relación N:M)
CREATE TABLE IF NOT EXISTS doctor_subespecialidades (
  id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctores(id) ON DELETE CASCADE,
  especialidad_id INT NOT NULL REFERENCES especialidades_medicas(id),
  certificacion_url VARCHAR(500),
  fecha_certificacion DATE,
  vigente BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(doctor_id, especialidad_id)
);

CREATE INDEX idx_doctor_subesp_doctor ON doctor_subespecialidades(doctor_id);
CREATE INDEX idx_doctor_subesp_especialidad ON doctor_subespecialidades(especialidad_id);

-- 1.4 Doctor-Clínicas (relación N:M)
CREATE TABLE IF NOT EXISTS doctor_clinicas (
  id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctores(id) ON DELETE CASCADE,
  clinica_id INT NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  consultorio VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(doctor_id, clinica_id)
);

CREATE INDEX idx_doctor_clinicas_doctor ON doctor_clinicas(doctor_id);
CREATE INDEX idx_doctor_clinicas_clinica ON doctor_clinicas(clinica_id);

-- 1.5 Horarios por clínica
CREATE TABLE IF NOT EXISTS doctor_horarios (
  id SERIAL PRIMARY KEY,
  doctor_clinica_id INT NOT NULL REFERENCES doctor_clinicas(id) ON DELETE CASCADE,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  turno VARCHAR(20) CHECK (turno IN ('MAÑANA', 'TARDE', 'NOCHE')),
  intervalo_citas_min INT DEFAULT 30,
  descanso_inicio TIME,
  descanso_fin TIME,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_horario CHECK (hora_fin > hora_inicio),
  CONSTRAINT valid_descanso CHECK (
    descanso_inicio IS NULL OR 
    (descanso_fin > descanso_inicio AND 
     descanso_inicio >= hora_inicio AND 
     descanso_fin <= hora_fin)
  )
);

CREATE INDEX idx_horarios_doctor_clinica ON doctor_horarios(doctor_clinica_id);
CREATE INDEX idx_horarios_dia ON doctor_horarios(dia_semana);

-- 1.6 Certificaciones adicionales
CREATE TABLE IF NOT EXISTS doctor_certificaciones (
  id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctores(id) ON DELETE CASCADE,
  tipo VARCHAR(100),
  institucion VARCHAR(255),
  numero VARCHAR(100),
  fecha_emision DATE,
  fecha_vencimiento DATE,
  documento_url VARCHAR(500),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doctor_cert_doctor ON doctor_certificaciones(doctor_id);
CREATE INDEX idx_doctor_cert_tipo ON doctor_certificaciones(tipo);

-- ============================================================================
-- PARTE 2: CREACIÓN DE PACIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  
  -- Identificación Personal
  dni VARCHAR(20) UNIQUE NOT NULL,
  tipo_documento VARCHAR(20) DEFAULT 'DNI' CHECK (tipo_documento IN 
    ('DNI', 'CE', 'PASAPORTE', 'RUC')),
  nombres VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  nombre_completo VARCHAR(300) GENERATED ALWAYS AS 
    (apellido_paterno || ' ' || COALESCE(apellido_materno || ', ', ', ') || nombres) STORED,
  fecha_nacimiento DATE NOT NULL,
  edad INT GENERATED ALWAYS AS 
    (EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))::INT) STORED,
  genero VARCHAR(20) CHECK (genero IN ('M', 'F', 'OTRO', 'PREFIERO_NO_DECIR')),
  
  -- Contacto
  celular VARCHAR(20),
  telefono_fijo VARCHAR(20),
  email VARCHAR(255),
  idioma_preferido VARCHAR(50) DEFAULT 'Español',
  
  -- Ubicación
  direccion TEXT NOT NULL,
  distrito_id INT REFERENCES distritos(id),
  referencia TEXT,
  coordenadas JSONB,
  
  -- Contacto de Emergencia
  emergencia_nombre VARCHAR(200) NOT NULL,
  emergencia_parentesco VARCHAR(50),
  emergencia_telefono VARCHAR(20) NOT NULL,
  emergencia_telefono_2 VARCHAR(20),
  
  -- Seguro Médico
  seguro_compania VARCHAR(200),
  seguro_numero_poliza VARCHAR(100),
  seguro_vigencia_hasta DATE,
  seguro_plan VARCHAR(100),
  seguro_cobertura_nemt BOOLEAN DEFAULT false,
  
  -- MOVILIDAD (crítico para NEMT)
  movilidad_tipo VARCHAR(50) DEFAULT 'AMBULATORIO' CHECK (movilidad_tipo IN (
    'AMBULATORIO',
    'ASISTENCIA_LEVE',
    'SILLA_RUEDAS',
    'SILLA_RUEDAS_ELECTRICA',
    'CAMILLA',
    'BARIATRICO'
  )),
  requiere_oxigeno BOOLEAN DEFAULT false,
  requiere_acompanante BOOLEAN DEFAULT false,
  tipo_silla_ruedas VARCHAR(50) CHECK (tipo_silla_ruedas IN (
    NULL, 'MANUAL_ESTANDAR', 'MANUAL_PLEGABLE', 'ELECTRICA', 'RECLINABLE'
  )),
  peso_aproximado_kg DECIMAL(5,2),
  altura_cm INT,
  
  -- Condiciones Médicas
  condiciones_cronicas TEXT[],
  alergias TEXT[],
  medicamentos_actuales TEXT[],
  restricciones_dieteticas TEXT[],
  observaciones_medicas TEXT,
  
  -- Documentos
  dni_foto_url VARCHAR(500),
  carnet_seguro_url VARCHAR(500),
  receta_medica_url VARCHAR(500),
  
  -- Estado y Estadísticas
  estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN 
    ('ACTIVO', 'INACTIVO', 'FALLECIDO')),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  numero_servicios_realizados INT DEFAULT 0,
  ultima_visita_medica DATE,
  proxima_cita_programada DATE,
  calificacion_promedio DECIMAL(3,2) DEFAULT 5.0,
  
  -- Observaciones
  observaciones_pacientes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  
  CONSTRAINT valid_edad CHECK (edad >= 0 AND edad <= 120),
  CONSTRAINT valid_peso CHECK (peso_aproximado_kg IS NULL OR 
    (peso_aproximado_kg > 0 AND peso_aproximado_kg < 500)),
  CONSTRAINT valid_calificacion CHECK (calificacion_promedio BETWEEN 1.0 AND 5.0)
);

CREATE INDEX idx_pacientes_dni ON pacientes(dni);
CREATE INDEX idx_pacientes_distrito ON pacientes(distrito_id);
CREATE INDEX idx_pacientes_estado ON pacientes(estado);
CREATE INDEX idx_pacientes_movilidad ON pacientes(movilidad_tipo);
CREATE INDEX idx_pacientes_nombre ON pacientes(nombre_completo);
CREATE INDEX idx_pacientes_search ON pacientes USING gin(to_tsvector('spanish', 
  nombre_completo || ' ' || COALESCE(dni, '')));

-- ============================================================================
-- PARTE 3: RELACIONES MÉDICAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS paciente_doctor_asignaciones (
  id SERIAL PRIMARY KEY,
  paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id INT NOT NULL REFERENCES doctores(id) ON DELETE CASCADE,
  tipo_relacion VARCHAR(50) DEFAULT 'TRATAMIENTO' CHECK (tipo_relacion IN (
    'TRATAMIENTO_PRIMARIO', 'TRATAMIENTO_ESPECIALIZADO', 'CONSULTA_UNICA', 'SEGUIMIENTO'
  )),
  fecha_asignacion DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paciente_doctor_paciente ON paciente_doctor_asignaciones(paciente_id);
CREATE INDEX idx_paciente_doctor_doctor ON paciente_doctor_asignaciones(doctor_id);

-- ============================================================================
-- PARTE 4: CERTIFICACIONES CONDUCTORES NEMT
-- ============================================================================

CREATE TABLE IF NOT EXISTS conductor_certificaciones_nemt (
  id SERIAL PRIMARY KEY,
  conductor_id INT NOT NULL REFERENCES conductores(id) ON DELETE CASCADE,
  tipo VARCHAR(50) CHECK (tipo IN (
    'HIPAA_TRAINING', 'CPR_CERTIFIED', 'ADA_COMPLIANT', 
    'WHEELCHAIR_TRANSPORT', 'BARIATRIC_CERTIFIED', 'OXYGEN_HANDLING'
  )),
  fecha_certificacion DATE NOT NULL,
  fecha_vencimiento DATE,
  certificado_url VARCHAR(500),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conductor_cert_conductor ON conductor_certificaciones_nemt(conductor_id);
CREATE INDEX idx_conductor_cert_tipo ON conductor_certificaciones_nemt(tipo);

-- ============================================================================
-- PARTE 5: ASISTENTE AI ZURI
-- ============================================================================

-- 5.1 Conversaciones
CREATE TABLE IF NOT EXISTS zuri_conversaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INT,
  session_id UUID DEFAULT gen_random_uuid(),
  canal VARCHAR(20) DEFAULT 'WEB' CHECK (canal IN ('WEB', 'VOICE', 'WHATSAPP', 'TELEGRAM')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zuri_conv_session ON zuri_conversaciones(session_id);
CREATE INDEX idx_zuri_conv_usuario ON zuri_conversaciones(usuario_id);

-- 5.2 Mensajes
CREATE TABLE IF NOT EXISTS zuri_mensajes (
  id SERIAL PRIMARY KEY,
  conversacion_id INT NOT NULL REFERENCES zuri_conversaciones(id) ON DELETE CASCADE,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('USER', 'ASSISTANT', 'SYSTEM')),
  contenido TEXT NOT NULL,
  metadata JSONB,
  audio_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zuri_mensajes_conversacion ON zuri_mensajes(conversacion_id);
CREATE INDEX idx_zuri_mensajes_created ON zuri_mensajes(created_at DESC);

-- 5.3 Log de intenciones
CREATE TABLE IF NOT EXISTS zuri_intents_log (
  id SERIAL PRIMARY KEY,
  mensaje_id INT REFERENCES zuri_mensajes(id),
  intent VARCHAR(100) NOT NULL,
  entities JSONB,
  confidence DECIMAL(3,2),
  respuesta_exitosa BOOLEAN DEFAULT true,
  tiempo_respuesta_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zuri_intents_intent ON zuri_intents_log(intent);
CREATE INDEX idx_zuri_intents_created ON zuri_intents_log(created_at DESC);

-- 5.4 Knowledge Base (preparado para pgvector futuro)
CREATE TABLE IF NOT EXISTS zuri_knowledge_base (
  id SERIAL PRIMARY KEY,
  contenido TEXT NOT NULL,
  tipo VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zuri_kb_tipo ON zuri_knowledge_base(tipo);

-- ============================================================================
-- PARTE 6: INTEGRACIÓN CON MÓDULOS EXISTENTES
-- ============================================================================

-- Agregar campos a solicitudes_servicios para preview y pacientes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='solicitudes_servicios' AND column_name='confirmado') THEN
    ALTER TABLE solicitudes_servicios ADD COLUMN confirmado BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='solicitudes_servicios' AND column_name='revisado_por') THEN
    ALTER TABLE solicitudes_servicios ADD COLUMN revisado_por VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='solicitudes_servicios' AND column_name='fecha_confirmacion') THEN
    ALTER TABLE solicitudes_servicios ADD COLUMN fecha_confirmacion TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='solicitudes_servicios' AND column_name='paciente_id') THEN
    ALTER TABLE solicitudes_servicios ADD COLUMN paciente_id INT REFERENCES pacientes(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='solicitudes_servicios' AND column_name='paciente_movilidad') THEN
    ALTER TABLE solicitudes_servicios ADD COLUMN paciente_movilidad VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='solicitudes_servicios' AND column_name='requiere_oxigeno') THEN
    ALTER TABLE solicitudes_servicios ADD COLUMN requiere_oxigeno BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='solicitudes_servicios' AND column_name='peso_paciente_kg') THEN
    ALTER TABLE solicitudes_servicios ADD COLUMN peso_paciente_kg DECIMAL(5,2);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_solicitudes_confirmado ON solicitudes_servicios(confirmado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_paciente ON solicitudes_servicios(paciente_id);

-- Agregar campos a programacion_detalles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='programacion_detalles' AND column_name='paciente_id') THEN
    ALTER TABLE programacion_detalles ADD COLUMN paciente_id INT REFERENCES pacientes(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='programacion_detalles' AND column_name='doctor_clinica_id') THEN
    ALTER TABLE programacion_detalles ADD COLUMN doctor_clinica_id INT REFERENCES doctor_clinicas(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prog_detalles_paciente ON programacion_detalles(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prog_detalles_doctor_clinica ON programacion_detalles(doctor_clinica_id);

-- ============================================================================
-- PARTE 7: TRIGGERS Y FUNCIONES
-- ============================================================================

-- Trigger para actualizar updated_at en doctores
CREATE OR REPLACE FUNCTION update_doctores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_doctores_timestamp ON doctores;
CREATE TRIGGER trigger_update_doctores_timestamp
  BEFORE UPDATE ON doctores
  FOR EACH ROW
  EXECUTE FUNCTION update_doctores_timestamp();

-- Trigger para actualizar updated_at en pacientes
CREATE OR REPLACE FUNCTION update_pacientes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pacientes_timestamp ON pacientes;
CREATE TRIGGER trigger_update_pacientes_timestamp
  BEFORE UPDATE ON pacientes
  FOR EACH ROW
  EXECUTE FUNCTION update_pacientes_timestamp();

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================

-- Verificación de tablas creadas
DO $$
DECLARE
  tabla_count INT;
BEGIN
  SELECT COUNT(*) INTO tabla_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'especialidades_medicas', 'doctores', 'doctor_subespecialidades',
    'doctor_clinicas', 'doctor_horarios', 'doctor_certificaciones',
    'pacientes', 'paciente_doctor_asignaciones',
    'conductor_certificaciones_nemt',
    'zuri_conversaciones', 'zuri_mensajes', 'zuri_intents_log', 'zuri_knowledge_base'
  );
  
  RAISE NOTICE 'Migración completada. Tablas verificadas: %/13', tabla_count;
END $$;
