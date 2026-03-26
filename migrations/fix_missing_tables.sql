-- ============================================================================
-- MIGRACIÓN COMPLEMENTARIA: Tablas faltantes
-- ============================================================================

-- CREAR TABLA PACIENTES
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

CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes(dni);
CREATE INDEX IF NOT EXISTS idx_pacientes_distrito ON pacientes(distrito_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_estado ON pacientes(estado);
CREATE INDEX IF NOT EXISTS idx_pacientes_movilidad ON pacientes(movilidad_tipo);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_pacientes_search ON pacientes USING gin(to_tsvector('spanish', 
  nombre_completo || ' ' || COALESCE(dni, '')));

-- CREAR TABLA DOCTOR_CLINICAS
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

CREATE INDEX IF NOT EXISTS idx_doctor_clinicas_doctor ON doctor_clinicas(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_clinicas_clinica ON doctor_clinicas(clinica_id);

-- CREAR TABLA DOCTOR_HORARIOS
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

CREATE INDEX IF NOT EXISTS idx_horarios_doctor_clinica ON doctor_horarios(doctor_clinica_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia ON doctor_horarios(dia_semana);

-- CREAR TABLA DOCTOR_CERTIFICACIONES
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

CREATE INDEX IF NOT EXISTS idx_doctor_cert_doctor ON doctor_certificaciones(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_cert_tipo ON doctor_certificaciones(tipo);

-- CREAR TABLA PACIENTE_DOCTOR_ASIGNACIONES
CREATE TABLE IF NOT EXISTS paciente_doctor_asignaciones (
  id SERIAL PRIMARY KEY,
  paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id INT NOT EXISTS REFERENCES doctores(id) ON DELETE CASCADE,
  tipo_relacion VARCHAR(50) DEFAULT 'TRATAMIENTO' CHECK (tipo_relacion IN (
    'TRATAMIENTO_PRIMARIO', 'TRATAMIENTO_ESPECIALIZADO', 'CONSULTA_UNICA', 'SEGUIMIENTO'
  )),
  fecha_asignacion DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paciente_doctor_paciente ON paciente_doctor_asignaciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_paciente_doctor_doctor ON paciente_doctor_asignaciones(doctor_id);

-- INTEGRACIÓN CON MÓDULOS EXISTENTES
ALTER TABLE solicitudes_servicios ADD COLUMN IF NOT EXISTS confirmado BOOLEAN DEFAULT false;
ALTER TABLE solicitudes_servicios ADD COLUMN IF NOT EXISTS revisado_por VARCHAR(100);
ALTER TABLE solicitudes_servicios ADD COLUMN IF NOT EXISTS fecha_confirmacion TIMESTAMP;
ALTER TABLE solicitudes_servicios ADD COLUMN IF NOT EXISTS paciente_id INT REFERENCES pacientes(id);
ALTER TABLE solicitudes_servicios ADD COLUMN IF NOT EXISTS paciente_movilidad VARCHAR(50);
ALTER TABLE solicitudes_servicios ADD COLUMN IF NOT EXISTS requiere_oxigeno BOOLEAN DEFAULT false;
ALTER TABLE solicitudes_servicios ADD COLUMN IF NOT EXISTS peso_paciente_kg DECIMAL(5,2);

CREATE INDEX IF NOT EXISTS idx_solicitudes_confirmado ON solicitudes_servicios(confirmado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_paciente ON solicitudes_servicios(paciente_id);

ALTER TABLE programacion_detalles ADD COLUMN IF NOT EXISTS paciente_id INT REFERENCES pacientes(id);
ALTER TABLE programacion_detalles ADD COLUMN IF NOT EXISTS doctor_clinica_id INT REFERENCES doctor_clinicas(id);

CREATE INDEX IF NOT EXISTS idx_prog_detalles_paciente ON programacion_detalles(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prog_detalles_doctor_clinica ON programacion_detalles(doctor_clinica_id);

-- TRIGGERS
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

-- VERIFICACIÓN
SELECT 
  'especialidades_medicas' as tabla, COUNT(*) as registros FROM especialidades_medicas
UNION ALL
SELECT 'doctores', COUNT(*) FROM doctores
UNION ALL
SELECT 'doctor_subespecialidades', COUNT(*) FROM doctor_subespecialidades
UNION ALL
SELECT 'doctor_clinicas', COUNT(*) FROM doctor_clinicas
UNION ALL
SELECT 'doctor_horarios', COUNT(*) FROM doctor_horarios
UNION ALL
SELECT 'doctor_certificaciones', COUNT(*) FROM doctor_certificaciones
UNION ALL
SELECT 'pacientes', COUNT(*) FROM pacientes
UNION ALL
SELECT 'paciente_doctor_asignaciones', COUNT(*) FROM paciente_doctor_asignaciones
UNION ALL
SELECT 'conductor_certificaciones_nemt', COUNT(*) FROM conductor_certificaciones_nemt
UNION ALL
SELECT 'zuri_conversaciones', COUNT(*) FROM zuri_conversaciones
UNION ALL
SELECT 'zuri_mensajes', COUNT(*) FROM zuri_mensajes
UNION ALL
SELECT 'zuri_intents_log', COUNT(*) FROM zuri_intents_log
UNION ALL
SELECT 'zuri_knowledge_base', COUNT(*) FROM zuri_knowledge_base;
