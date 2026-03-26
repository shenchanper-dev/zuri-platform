-- SQL Test Suite for Zuri Platform
-- Comprehensive database integrity and performance tests

-- ========================================
-- TEST 1: Schema Integrity
-- ========================================
SELECT '=== TEST 1: Schema Integrity ===' as test_section;

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN (
  'doctores', 'pacientes', 'especialidades_medicas',
  'doctor_subespecialidades', 'doctor_clinicas', 'doctor_horarios', 
  'doctor_certificaciones', 'paciente_doctor_asignaciones',
  'conductor_certificaciones_nemt',
  'zuri_conversaciones', 'zuri_mensajes', 'zuri_intents_log', 'zuri_knowledge_base'
)
ORDER BY table_name;

-- ========================================
-- TEST 2: Data Integrity - Foreign Keys
-- ========================================
SELECT '=== TEST 2: Foreign Key Constraints ===' as test_section;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('doctores', 'pacientes', 'doctor_clinicas', 'paciente_doctor_asignaciones')
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- TEST 3: Especialidades Pre-cargadas
-- ======================================== 
SELECT '=== TEST 3: Especialidades Data ===' as test_section;

SELECT codigo, nombre, tipo
FROM especialidades_medicas
WHERE activo = true
ORDER BY orden, nombre
LIMIT 10;

-- ========================================
-- TEST 4: Tarifa Fields in Doctores
-- ========================================
SELECT '=== TEST 4: Doctor Tarifa Fields ===' as test_section;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'doctores'
  AND column_name IN ('tarifa_consulta', 'tarifa_hora', 'tarifa_turno', 'moneda')
ORDER BY column_name;

-- ========================================
-- TEST 5: NEMT Fields in Pacientes
-- ========================================
SELECT '=== TEST 5: Pacientes NEMT Fields ===' as test_section;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pacientes'
  AND column_name IN (
    'movilidad_tipo', 'tipo_silla_ruedas', 'requiere_oxigeno',
    'requiere_acompanante', 'peso_aproximado_kg', 'altura_cm',
    'condiciones_cronicas', 'alergias', 'medicamentos_actuales'
  )
ORDER BY column_name;

-- ========================================
-- TEST 6: ZURI Tables Structure
-- ========================================
SELECT '=== TEST 6: ZURI AI Tables ===' as test_section;

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns,
  (SELECT pg_size_pretty(pg_total_relation_size(table_name::regclass))) as size
FROM information_schema.tables t
WHERE table_name LIKE 'zuri_%'
ORDER BY table_name;

-- ========================================
-- TEST 7: Trigger Functions
-- ========================================
SELECT '=== TEST 7: Update Timestamp Triggers ===' as test_section;

SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%update_timestamp%'
ORDER BY event_object_table;

-- ========================================
-- TEST 8: Index Performance
-- ========================================
SELECT '=== TEST 8: Important Indexes ===' as test_section;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('doctores', 'pacientes', 'zuri_mensajes')
  AND indexname NOT LIKE '%pkey%'
ORDER BY tablename, indexname;

-- ========================================
-- TEST 9: Sample Data Counts
-- ========================================
SELECT '=== TEST 9: Data Counts ===' as test_section;

SELECT 'doctores' as tabla, COUNT(*) as registros FROM doctores
UNION ALL
SELECT 'pacientes', COUNT(*) FROM pacientes
UNION ALL
SELECT 'especialidades_medicas', COUNT(*) FROM especialidades_medicas
UNION ALL  
SELECT 'zuri_conversaciones', COUNT(*) FROM zuri_conversaciones
UNION ALL
SELECT 'zuri_mensajes', COUNT(*) FROM zuri_mensajes
UNION ALL
SELECT 'zuri_intents_log', COUNT(*) FROM zuri_intents_log;

-- ========================================
-- TEST 10: Observaciones Fields
-- ========================================
SELECT '=== TEST 10: Observaciones Fields ===' as test_section;

SELECT  
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name IN ('observaciones_doctores', 'observaciones_pacientes', 'observaciones_medicas')
ORDER BY table_name, column_name;

SELECT '=== ✅ ALL TESTS COMPLETED ===' as final_message;
