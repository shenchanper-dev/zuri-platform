-- =====================================================
-- OPTIMIZACIÓN DE PERFORMANCE PARA TABLA CONDUCTORES
-- Fecha: 2026-02-01
-- Objetivo: Resolver error 504 Gateway Timeout en dashboard
-- =====================================================
-- BACKUP REALIZADO: backups/conductores_backup_YYYYMMDD_HHMMSS.sql
-- Reversible: Ejecutar DROP INDEX para cada índice creado
-- =====================================================

-- =====================================================
-- ÍNDICES BÁSICOS PARA BÚSQUEDAS Y FILTROS
-- =====================================================

-- Índice para búsquedas por DNI (usado en filtros y búsquedas)
CREATE INDEX IF NOT EXISTS idx_conductores_dni 
ON conductores(dni);

-- Índice para filtros por estado (ACTIVO, INACTIVO, SUSPENDIDO)
CREATE INDEX IF NOT EXISTS idx_conductores_estado 
ON conductores(estado);

-- Índice para JOIN con tabla distritos (mejora LEFT JOIN performance)
CREATE INDEX IF NOT EXISTS idx_conductores_distrito_id 
ON conductores("distritoId");

-- Índice para búsquedas por placa de vehículo
CREATE INDEX IF NOT EXISTS idx_conductores_placa 
ON conductores(placa);

-- Índice para búsquedas por celular
CREATE INDEX IF NOT EXISTS idx_conductores_celular 
ON conductores(celular1);

-- =====================================================
-- ÍNDICES PARA PAGINACIÓN
-- =====================================================

-- Índice para ordenamiento DESC usado en paginación (ORDER BY id DESC)
CREATE INDEX IF NOT EXISTS idx_conductores_id_desc 
ON conductores(id DESC);

-- =====================================================
-- ÍNDICES COMPUESTOS PARA QUERIES COMUNES
-- =====================================================

-- Índice compuesto para paginación con filtro de estado
-- Usado en: WHERE estado = 'ACTIVO' ORDER BY id DESC
CREATE INDEX IF NOT EXISTS idx_conductores_estado_id 
ON conductores(estado, id DESC);

-- Índice compuesto para filtros por distrito y estado
-- Usado en: WHERE distritoId = X AND estado = 'ACTIVO'
CREATE INDEX IF NOT EXISTS idx_conductores_distrito_estado 
ON conductores("distritoId", estado);

-- =====================================================
-- ÍNDICES PARA BÚSQUEDAS DE TEXTO (ILIKE)
-- =====================================================
-- Estos índices mejoran significativamente las búsquedas ILIKE
-- que son muy costosas sin índices

-- Índice para búsquedas insensibles a mayúsculas en nombres
CREATE INDEX IF NOT EXISTS idx_conductores_nombres_lower 
ON conductores(LOWER(nombres));

-- Índice para búsquedas insensibles a mayúsculas en apellidos
CREATE INDEX IF NOT EXISTS idx_conductores_apellidos_lower 
ON conductores(LOWER(apellidos));

-- Índice para búsquedas en nombre completo
CREATE INDEX IF NOT EXISTS idx_conductores_nombre_completo_lower 
ON conductores(LOWER("nombreCompleto"));

-- =====================================================
-- ÍNDICES PARA ESTADÍSTICAS Y AGREGACIONES
-- =====================================================

-- Índice para estado de servicio (usado en estadísticas)
CREATE INDEX IF NOT EXISTS idx_conductores_estado_servicio 
ON conductores("estadoServicio");

-- Índice para verificar si tiene foto (usado en estadísticas)
CREATE INDEX IF NOT EXISTS idx_conductores_foto 
ON conductores(foto) 
WHERE foto IS NOT NULL AND foto != '';

-- =====================================================
-- ANÁLISIS DE LA TABLA DESPUÉS DE CREAR ÍNDICES
-- =====================================================
-- Actualizar estadísticas de la tabla para que el query planner
-- use los nuevos índices de manera óptima
ANALYZE conductores;

-- =====================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- =====================================================
-- Descomentar para verificar índices:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'conductores' 
-- ORDER BY indexname;

-- =====================================================
-- REVERSIÓN (SI ES NECESARIO)
-- =====================================================
-- Para revertir estos cambios, ejecutar:
/*
DROP INDEX IF EXISTS idx_conductores_dni;
DROP INDEX IF EXISTS idx_conductores_estado;
DROP INDEX IF EXISTS idx_conductores_distrito_id;
DROP INDEX IF EXISTS idx_conductores_placa;
DROP INDEX IF EXISTS idx_conductores_celular;
DROP INDEX IF EXISTS idx_conductores_id_desc;
DROP INDEX IF EXISTS idx_conductores_estado_id;
DROP INDEX IF EXISTS idx_conductores_distrito_estado;
DROP INDEX IF EXISTS idx_conductores_nombres_lower;
DROP INDEX IF EXISTS idx_conductores_apellidos_lower;
DROP INDEX IF EXISTS idx_conductores_nombre_completo_lower;
DROP INDEX IF EXISTS idx_conductores_estado_servicio;
DROP INDEX IF EXISTS idx_conductores_foto;
*/
