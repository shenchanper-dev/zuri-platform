#!/bin/bash
set -e  # Detener si hay error

echo "================================================"
echo "CREACIÓN ROBUSTA DE INFRAESTRUCTURA PROGRAMACIÓN"
echo "================================================"

# Función para ejecutar SQL y verificar
ejecutar_sql() {
    echo -e "\n>>> $1"
    sudo -u postgres psql -d zuri_db -c "$2"
    if [ $? -eq 0 ]; then
        echo "✓ Éxito"
    else
        echo "✗ Error"
        exit 1
    fi
}

# 1. CREAR SECUENCIAS
echo -e "\n[1/7] Creando secuencias..."
ejecutar_sql "Secuencia códigos ZPROG" "
CREATE SEQUENCE IF NOT EXISTS seq_codigo_programacion START WITH 1;
"

ejecutar_sql "Función generar código" "
CREATE OR REPLACE FUNCTION generar_codigo_programacion()
RETURNS VARCHAR(15) AS \$\$
DECLARE
  nuevo_numero INTEGER;
  nuevo_codigo VARCHAR(15);
BEGIN
  nuevo_numero := nextval('seq_codigo_programacion');
  nuevo_codigo := 'ZPROG' || LPAD(nuevo_numero::TEXT, 6, '0');
  RETURN nuevo_codigo;
END;
\$\$ LANGUAGE plpgsql;
"
# 2. CREAR TABLAS MAESTRAS
echo -e "\n[2/7] Creando tablas maestras..."

ejecutar_sql "Tabla tipos_servicio" "
CREATE TABLE IF NOT EXISTS tipos_servicio (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
"

ejecutar_sql "Tabla calificaciones" "
CREATE TABLE IF NOT EXISTS calificaciones (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('PUNTUAL', 'TARDANZA', 'INCIDENCIA')),
  color VARCHAR(7),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
"

ejecutar_sql "Tabla motivos_no_disponibilidad" "
CREATE TABLE IF NOT EXISTS motivos_no_disponibilidad (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
"

ejecutar_sql "Tabla cobertura_turnos" "
CREATE TABLE IF NOT EXISTS cobertura_turnos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
"
# 3. CREAR TABLAS PRINCIPALES
echo -e "\n[3/7] Creando tablas principales..."

ejecutar_sql "Tabla programaciones" "
CREATE TABLE IF NOT EXISTS programaciones (
  id SERIAL PRIMARY KEY,
  codigo_programacion VARCHAR(15) UNIQUE NOT NULL DEFAULT generar_codigo_programacion(),
  importacion_id INTEGER REFERENCES importaciones_excel(id),
  fecha_programacion DATE NOT NULL,
  cliente_id INTEGER REFERENCES clinicas(id),
  cliente_nombre TEXT,
  tipo_servicio_id INTEGER REFERENCES tipos_servicio(id),
  estado VARCHAR(20) DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'CONFIRMADO', 'EN_EJECUCION', 'COMPLETADO', 'CANCELADO')),
  notas TEXT,
  creado_por TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
"

ejecutar_sql "Tabla programacion_detalles" "
CREATE TABLE IF NOT EXISTS programacion_detalles (
  id SERIAL PRIMARY KEY,
  programacion_id INTEGER REFERENCES programaciones(id) ON DELETE CASCADE,
  solicitud_servicio_id INTEGER REFERENCES solicitudes_servicios(id),
  tipo_servicio_id INTEGER REFERENCES tipos_servicio(id),
  cliente_id INTEGER REFERENCES clinicas(id),
  cliente_nombre TEXT,
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
"

# 4. CREAR ÍNDICES
echo -e "\n[4/7] Creando índices..."

ejecutar_sql "Índices programaciones" "
CREATE INDEX IF NOT EXISTS idx_programaciones_fecha ON programaciones(fecha_programacion);
CREATE INDEX IF NOT EXISTS idx_programaciones_estado ON programaciones(estado);
CREATE INDEX IF NOT EXISTS idx_programacion_detalles_prog ON programacion_detalles(programacion_id);
CREATE INDEX IF NOT EXISTS idx_programacion_detalles_fecha ON programacion_detalles(fecha);
"
# 5. CREAR VISTA
echo -e "\n[5/7] Creando vistas..."

ejecutar_sql "Vista resumen programaciones" "
CREATE OR REPLACE VIEW vista_programaciones_resumen AS
SELECT 
  p.id,
  p.codigo_programacion,
  p.fecha_programacion,
  p.cliente_nombre,
  p.estado,
  COUNT(pd.id) as total_servicios,
  COUNT(CASE WHEN pd.conductor_id IS NOT NULL THEN 1 END) as servicios_asignados,
  COUNT(CASE WHEN pd.calificacion_id IS NOT NULL THEN 1 END) as servicios_calificados,
  p.created_at
FROM programaciones p
LEFT JOIN programacion_detalles pd ON p.id = pd.programacion_id
GROUP BY p.id
ORDER BY p.fecha_programacion DESC, p.created_at DESC;
"
# 6. POBLAR DATOS MAESTROS
echo -e "\n[6/7] Poblando datos maestros..."

ejecutar_sql "Datos tipos_servicio" "
INSERT INTO tipos_servicio (codigo, nombre, descripcion) VALUES
  ('MAD', 'MAD - Médico a Domicilio', 'Servicio médico a domicilio'),
  ('TAD', 'TAD - Traslado Asistido', 'Traslado con asistencia médica'),
  ('MAD-SANNA', 'MAD-SANNA', 'Médico a domicilio para SANNA'),
  ('MAD-CI', 'MAD-CI', 'Médico a domicilio para Clínico Internacional')
ON CONFLICT (codigo) DO NOTHING;
"

ejecutar_sql "Datos calificaciones" "
INSERT INTO calificaciones (codigo, descripcion, tipo, color) VALUES
  ('PUNTUAL', 'PUNTUAL - llega exacto o antes de la hora', 'PUNTUAL', '#10b981'),
  ('PUNTUAL-5', 'PUNTUAL hasta 5 minutos', 'PUNTUAL', '#34d399'),
  ('TL-6-20', 'TL - tardanza leve de 6 a 20 minutos', 'TARDANZA', '#fbbf24'),
  ('TL-21-60', 'TL - tardanza grave de 21 a 60', 'TARDANZA', '#f97316'),
  ('SIN-UBICACION', 'No envió ubicación - LLEGÓ A SERVICIO', 'INCIDENCIA', '#60a5fa'),
  ('QUEJA-CLIENTE', 'QUEJA DEL CLIENTE', 'INCIDENCIA', '#ef4444')
ON CONFLICT (codigo) DO NOTHING;
"

ejecutar_sql "Datos motivos_no_disponibilidad" "
INSERT INTO motivos_no_disponibilidad (codigo, descripcion) VALUES
  ('DESCANSO-FAMILIAR', 'PIDIÓ DESCANSO ASUNTO FAMILIAR'),
  ('LIBRE-TARDE', 'LIBRE DISPONIBLE EN LA TARDE'),
  ('SOLO-FDS', 'SOLO SALE FDS'),
  ('MANTENIMIENTO', 'MANTENIMIENTO DE LA UNIDAD'),
  ('DISPONIBLE-MAÑANA', 'DISPONIBLE SOLO MAÑANA'),
  ('DISPONIBLE-TARDE', 'DISPONIBLE SOLO TARDE')
ON CONFLICT (codigo) DO NOTHING;
"

ejecutar_sql "Datos cobertura_turnos" "
INSERT INTO cobertura_turnos (codigo, descripcion) VALUES
  ('M', 'Mañana'),
  ('T', 'Tarde'),
  ('M+T', 'Mañana + Tarde (Día completo)'),
  ('N', 'Noche')
ON CONFLICT (codigo) DO NOTHING;
"

# 7. VERIFICACIÓN FINAL
echo -e "\n[7/7] Verificación final..."

ejecutar_sql "Contar tablas creadas" "
SELECT COUNT(*) as tablas_creadas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'programaciones',
  'programacion_detalles', 
  'tipos_servicio',
  'calificaciones',
  'motivos_no_disponibilidad',
  'cobertura_turnos'
);
"

ejecutar_sql "Contar datos maestros" "
SELECT 
  (SELECT COUNT(*) FROM tipos_servicio) as tipos_servicio,
  (SELECT COUNT(*) FROM calificaciones) as calificaciones,
  (SELECT COUNT(*) FROM motivos_no_disponibilidad) as motivos;
"

echo -e "\n================================================"
echo "✅ INFRAESTRUCTURA CREADA EXITOSAMENTE"
echo "================================================"
echo ""
echo "Ahora prueba las APIs:"
echo "curl http://localhost:3000/api/tipos-servicio"
echo "curl http://localhost:3000/api/calificaciones"
echo "curl http://localhost:3000/api/programaciones"
echo ""
