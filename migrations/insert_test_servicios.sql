-- Insertar servicios de prueba para demostración del sistema NEMT automático
-- Fecha: 2026-02-17

INSERT INTO servicios (
  paciente_id,
  paciente_nombre,
  origen,
  origen_lat,
  origen_lng,
  destino,
  destino_lat,
  destino_lng,
  fecha_servicio,
  hora_recojo,
  hora_fin,
  tipo_servicio,
  distancia_km,
  tarifa_calculada,
  estado,
  notas_especiales,
  created_at
) VALUES
-- Servicio 1: Pendiente (Miraflores → Clínica Ricardo Palma)
(
  1,
  'Sr. García Pérez',
  'Av. Arequipa 1234, Miraflores',
  -12.1234,
  -77.0234,
  'Clínica Ricardo Palma, San Isidro',
  -12.0897,
  -77.0501,
  '2026-02-17',
  '08:00',
  '09:00',
  'wheelchair',
  5.2,
  20.00,
  'PENDIENTE',
  'Paciente requiere silla de ruedas. Cita médica a las 8:30am.',
  NOW()
),

-- Servicio 2: Buscando Conductor (San Miguel → Hospital Rebagliati)
(
  2,
  'Sra. Martínez López',
  'Av. La Marina 2500, San Miguel',
  -12.0771,
  -77.0865,
  'Hospital Rebagliati, Jesús María',
  -12.0897,
  -77.0501,
  '2026-02-17',
  '09:30',
  '10:30',
  'ambulatory',
  4.8,
  12.50,
  'BUSCANDO_CONDUCTOR',
  'Paciente ambulatorio. Control de rutina.',
  NOW()
),

-- Servicio 3: Asignado (Surco → Clínica San Felipe)
(
  3,
  'Sr. Rodríguez Sánchez',
  'Av. Primavera 1200, Surco',
  -12.1456,
  -76.9987,
  'Clínica San Felipe, Jesús María',
  -12.0897,
  -77.0501,
  '2026-02-17',
  '10:00',
  '11:00',
  'stretcher',
  8.3,
  35.00,
  'ASIGNADO',
  'Paciente en camilla. Requiere asistencia médica.',
  NOW()
),

-- Servicio 4: En Curso (Lince → Hospital Almenara)
(
  4,
  'Sra. Flores Díaz',
  'Av. Arenales 1800, Lince',
  -12.0897,
  -77.0365,
  'Hospital Almenara, La Victoria',
  -12.0567,
  -77.0234,
  '2026-02-17',
  '11:00',
  '12:00',
  'wheelchair',
  3.2,
  16.00,
  'EN_CURSO',
  'En tránsito. Terapia física.',
  NOW()
),

-- Servicio 5: Completado (Pueblo Libre → Clínica Internacional)
(
  5,
  'Sr. Torres Vega',
  'Av. La Mar 1500, Pueblo Libre',
  -12.0734,
  -77.0623,
  'Clínica Internacional, San Borja',
  -12.0897,
  -76.9987,
  '2026-02-17',
  '07:00',
  '08:00',
  'ambulatory',
  6.5,
  14.00,
  'COMPLETADO',
  'Servicio completado exitosamente.',
  NOW()
);

-- Actualizar conductor para servicio 3 (Asignado)
UPDATE servicios 
SET conductor_id = 1, conductor_nombre = 'Juan Pérez'
WHERE paciente_nombre = 'Sr. Rodríguez Sánchez';

-- Actualizar conductor para servicio 4 (En Curso)
UPDATE servicios 
SET conductor_id = 2, conductor_nombre = 'María González'
WHERE paciente_nombre = 'Sra. Flores Díaz';

-- Actualizar conductor para servicio 5 (Completado)
UPDATE servicios 
SET conductor_id = 3, conductor_nombre = 'Carlos Ramírez'
WHERE paciente_nombre = 'Sr. Torres Vega';

-- Marcar algunos conductores como online
UPDATE conductores 
SET online = true 
WHERE id IN (1, 2, 3, 4, 5)
LIMIT 5;
