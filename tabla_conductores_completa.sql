-- ================================================================
-- TABLA CONDUCTORES PROFESIONAL - 55+ CAMPOS
-- Sistema ZURI Platform - Rediseño Completo
-- ================================================================

-- Eliminar tabla existente si existe (CUIDADO: Hacer backup primero)
-- DROP TABLE IF EXISTS conductores CASCADE;

-- Crear nueva tabla conductores con estructura profesional
CREATE TABLE conductores_nueva (
    -- ========== IDENTIFICACIÓN ==========
    id SERIAL PRIMARY KEY,
    dni VARCHAR(8) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    
    -- ========== DATOS PERSONALES ==========
    fechaNacimiento DATE NOT NULL,
    celular1 VARCHAR(9) NOT NULL CHECK (celular1 ~ '^9[0-9]{8}$'),
    celular2 VARCHAR(9) CHECK (celular2 ~ '^9[0-9]{8}$'),
    domicilio TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    
    -- ========== LICENCIA Y DOCUMENTOS ==========
    numeroBrevete VARCHAR(20) NOT NULL,
    tipoLicencia VARCHAR(10) CHECK (tipoLicencia IN ('A-I', 'A-IIa', 'A-IIb', 'A-III', 'B-I', 'B-IIa', 'B-IIb', 'B-IIc')),
    
    -- ========== VEHÍCULO ==========
    marcaAuto VARCHAR(50) NOT NULL,
    modelo VARCHAR(50),
    numeroPlaca VARCHAR(8),
    
    -- ========== INFORMACIÓN FAMILIAR ==========
    estadoCivil VARCHAR(20) CHECK (estadoCivil IN ('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'CONVIVIENTE')),
    numeroHijos INTEGER DEFAULT 0,
    nombreContacto VARCHAR(200),
    celularContacto VARCHAR(9) CHECK (celularContacto ~ '^9[0-9]{8}$'),
    
    -- ========== DISPONIBILIDAD Y HORARIOS ==========
    disponibilidadHoraria VARCHAR(50) DEFAULT 'TIEMPO_COMPLETO', -- TIEMPO_COMPLETO, MEDIO_TIEMPO, TURNOS
    
    -- ========== DOCUMENTACIÓN Y CERTIFICADOS ==========
    documentoAntecedentes BOOLEAN DEFAULT FALSE,
    documentoExamenMedico BOOLEAN DEFAULT FALSE,
    puntajeEvaluacion DECIMAL(4,2) DEFAULT 0,
    fechaUltimaEvaluacion DATE,
    
    -- ========== MÉTRICAS DE RENDIMIENTO ==========
    calificacionPromedio DECIMAL(3,2) DEFAULT 0 CHECK (calificacionPromedio >= 0 AND calificacionPromedio <= 5),
    totalViajes INTEGER DEFAULT 0,
    viajesCompletados INTEGER DEFAULT 0,
    viajesCancelados INTEGER DEFAULT 0,
    
    -- ========== CERTIFICACIONES MÉDICAS ==========
    cursoPrimerosAuxilios BOOLEAN DEFAULT FALSE,
    cursoTransporteMedico BOOLEAN DEFAULT FALSE,
    restriccionesMedicas TEXT,
    alergias TEXT,
    grupoSanguineo VARCHAR(5) CHECK (grupoSanguineo IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
    
    -- ========== ESTADO OPERACIONAL ==========
    estadoServicio VARCHAR(20) DEFAULT 'DESCONECTADO' CHECK (estadoServicio IN ('DESCONECTADO', 'DISPONIBLE', 'EN_CAMINO', 'EN_SERVICIO', 'NO_DISPONIBLE', 'EMERGENCIA')),
    
    -- ========== GESTIÓN LABORAL ==========
    fechaIngreso DATE DEFAULT CURRENT_DATE,
    fechaCese DATE,
    motivoCese TEXT,
    tipoContrato VARCHAR(20) DEFAULT 'INDEPENDIENTE' CHECK (tipoContrato IN ('INDEPENDIENTE', 'EMPLEADO', 'FREELANCER')),
    salarioBase DECIMAL(10,2),
    comisionPorViaje DECIMAL(5,2),
    
    -- ========== LOCALIZACIÓN GPS ==========
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    ultimaUbicacion TIMESTAMP,
    precision DECIMAL(5,2), -- Precisión del GPS en metros
    velocidad DECIMAL(5,2), -- Velocidad actual en km/h
    rumbo INTEGER CHECK (rumbo >= 0 AND rumbo <= 360), -- Dirección en grados
    senalGPS INTEGER CHECK (senalGPS >= 0 AND senalGPS <= 100), -- Intensidad de señal GPS %
    
    -- ========== INFORMACIÓN ADICIONAL ==========
    observaciones TEXT,
    codigoInterno VARCHAR(20) UNIQUE,
    supervisorAsignado VARCHAR(100),
    zonaOperacion VARCHAR(100),
    
    -- ========== MÉTRICAS AVANZADAS ==========
    promedioCalificacion DECIMAL(3,2) DEFAULT 0,
    totalKilometraje DECIMAL(10,2) DEFAULT 0,
    horasTrabajadasMes INTEGER DEFAULT 0,
    ingresosMesActual DECIMAL(10,2) DEFAULT 0,
    
    -- ========== CONTROL DE SISTEMA ==========
    ultimaActividad TIMESTAMP DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================================

-- Índices básicos
CREATE INDEX idx_conductores_dni ON conductores_nueva(dni);
CREATE INDEX idx_conductores_activo ON conductores_nueva(activo);
CREATE INDEX idx_conductores_estado ON conductores_nueva(estadoServicio);

-- Índices geoespaciales
CREATE INDEX idx_conductores_coords ON conductores_nueva(latitud, longitud);
CREATE INDEX idx_conductores_zona ON conductores_nueva(zonaOperacion);

-- Índices de búsqueda
CREATE INDEX idx_conductores_nombres ON conductores_nueva(nombres, apellidos);
CREATE INDEX idx_conductores_celular ON conductores_nueva(celular1);
CREATE INDEX idx_conductores_placa ON conductores_nueva(numeroPlaca);

-- Índices de fechas
CREATE INDEX idx_conductores_fecha_ingreso ON conductores_nueva(fechaIngreso);
CREATE INDEX idx_conductores_ultima_actividad ON conductores_nueva(ultimaActividad);

-- ================================================================
-- TRIGGERS AUTOMÁTICOS
-- ================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_conductores_updated_at
    BEFORE UPDATE ON conductores_nueva
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Función para generar código interno automático
CREATE OR REPLACE FUNCTION generar_codigo_interno()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigoInterno IS NULL THEN
        NEW.codigoInterno = 'CON' || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para código interno
CREATE TRIGGER trigger_codigo_interno
    BEFORE INSERT ON conductores_nueva
    FOR EACH ROW
    EXECUTE FUNCTION generar_codigo_interno();

-- ================================================================
-- DATOS DE EJEMPLO
-- ================================================================

INSERT INTO conductores_nueva (
    dni, nombres, apellidos, fechaNacimiento, celular1, domicilio, 
    email, numeroBrevete, marcaAuto, modelo, numeroPlaca,
    estadoCivil, disponibilidadHoraria, documentoAntecedentes,
    documentoExamenMedico, cursoPrimerosAuxilios, tipoContrato,
    zonaOperacion, activo
) VALUES
(
    '07362537', 'ELISAIAS', 'ALVAREZ LANDA', '1985-03-15', 
    '943210900', 'Av. Lima 123, San Isidro', 'eli.alvarez@zuri.pe',
    'Q12345678', 'Toyota', 'Corolla', 'ABC123',
    'SOLTERO', 'TIEMPO_COMPLETO', TRUE,
    TRUE, TRUE, 'INDEPENDIENTE',
    'LIMA_CENTRO', TRUE
),
(
    '44516227', 'JHONNY', 'ALVAREZ MONTES', '1990-08-22',
    '987654321', 'Jr. Junín 456, Lince', 'jhonny.alvarez@zuri.pe',
    'Q87654321', 'Nissan', 'Sentra', 'XYZ789',
    'CASADO', 'TIEMPO_COMPLETO', TRUE,
    TRUE, FALSE, 'EMPLEADO',
    'LIMA_SUR', TRUE
),
(
    '08583412', 'MARCO', 'HORNOS VALENCIA', '1988-12-05',
    '956789123', 'Av. Brasil 789, Magdalena', 'marco.hornos@zuri.pe',
    'Q11223344', 'Hyundai', 'Accent', 'DEF456',
    'CONVIVIENTE', 'MEDIO_TIEMPO', TRUE,
    FALSE, TRUE, 'FREELANCER',
    'LIMA_NORTE', TRUE
);

-- ================================================================
-- VISTAS ÚTILES
-- ================================================================

-- Vista de conductores activos con información básica
CREATE OR REPLACE VIEW vista_conductores_activos AS
SELECT 
    id, dni, nombres, apellidos,
    CONCAT(nombres, ' ', apellidos) as nombre_completo,
    celular1, email, estadoServicio,
    calificacionPromedio, totalViajes,
    CONCAT(marcaAuto, ' ', modelo, ' - ', numeroPlaca) as vehiculo_info,
    zonaOperacion, created_at
FROM conductores_nueva 
WHERE activo = TRUE;

-- Vista de estadísticas de conductores
CREATE OR REPLACE VIEW vista_estadisticas_conductores AS
SELECT 
    COUNT(*) as total_conductores,
    COUNT(CASE WHEN activo = TRUE THEN 1 END) as conductores_activos,
    COUNT(CASE WHEN estadoServicio = 'DISPONIBLE' THEN 1 END) as disponibles,
    COUNT(CASE WHEN estadoServicio = 'EN_SERVICIO' THEN 1 END) as en_servicio,
    COUNT(CASE WHEN estadoServicio = 'DESCONECTADO' THEN 1 END) as desconectados,
    AVG(calificacionPromedio) as calificacion_promedio_general,
    SUM(totalViajes) as total_viajes_sistema,
    SUM(viajesCompletados) as total_viajes_completados
FROM conductores_nueva;

-- ================================================================
-- VERIFICACIÓN
-- ================================================================

-- Ver estructura de la tabla
\d conductores_nueva

-- Contar campos (debería ser 55+)
SELECT COUNT(*) as total_campos 
FROM information_schema.columns 
WHERE table_name = 'conductores_nueva';

-- Ver datos de ejemplo
SELECT dni, nombres, apellidos, estadoServicio, zonaOperacion, activo 
FROM conductores_nueva;

-- Ver estadísticas
SELECT * FROM vista_estadisticas_conductores;

COMMENT ON TABLE conductores_nueva IS 'Tabla profesional de conductores con 55+ campos para sistema ZURI NEMT';
