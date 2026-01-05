#!/bin/bash
echo "🔧 SOLUCIONANDO codigo_ubigeo DEFINITIVAMENTE"

# PASO 1: Añadir columna codigo_ubigeo a tabla distritos
sudo -u postgres psql -d zuri_db << 'EOF'
-- Añadir columna codigo_ubigeo
ALTER TABLE distritos ADD COLUMN IF NOT EXISTS codigo_ubigeo VARCHAR(10) UNIQUE;

-- Poblar con códigos UBIGEO reales de Lima y Callao
UPDATE distritos SET codigo_ubigeo = CASE nombre
  WHEN 'Lima' THEN '150101'
  WHEN 'Ancón' THEN '150102'
  WHEN 'Ate' THEN '150103'
  WHEN 'Barranco' THEN '150104'
  WHEN 'Breña' THEN '150105'
  WHEN 'Carabayllo' THEN '150106'
  WHEN 'Chaclacayo' THEN '150107'
  WHEN 'Chorrillos' THEN '150108'
  WHEN 'Cieneguilla' THEN '150109'
  WHEN 'Comas' THEN '150110'
  WHEN 'El Agustino' THEN '150111'
  WHEN 'Independencia' THEN '150112'
  WHEN 'Jesús María' THEN '150113'
  WHEN 'La Molina' THEN '150114'
  WHEN 'La Victoria' THEN '150115'
  WHEN 'Lince' THEN '150116'
  WHEN 'Los Olivos' THEN '150117'
  WHEN 'Lurigancho' THEN '150118'
  WHEN 'Lurín' THEN '150119'
  WHEN 'Magdalena del Mar' THEN '150120'
  WHEN 'Miraflores' THEN '150122'
  WHEN 'Pachacamac' THEN '150123'
  WHEN 'Pucusana' THEN '150124'
  WHEN 'Pueblo Libre' THEN '150121'
  WHEN 'Puente Piedra' THEN '150125'
  WHEN 'Punta Hermosa' THEN '150126'
  WHEN 'Punta Negra' THEN '150127'
  WHEN 'Rímac' THEN '150128'
  WHEN 'San Bartolo' THEN '150129'
  WHEN 'San Borja' THEN '150130'
  WHEN 'San Isidro' THEN '150131'
  WHEN 'San Juan de Lurigancho' THEN '150132'
  WHEN 'San Juan de Miraflores' THEN '150133'
  WHEN 'San Luis' THEN '150134'
  WHEN 'San Martín de Porres' THEN '150135'
  WHEN 'San Miguel' THEN '150136'
  WHEN 'Santa Anita' THEN '150137'
  WHEN 'Santa María del Mar' THEN '150138'
  WHEN 'Santa Rosa' THEN '150139'
  WHEN 'Santiago de Surco' THEN '150140'
  WHEN 'Surquillo' THEN '150141'
  WHEN 'Villa El Salvador' THEN '150142'
  WHEN 'Villa María del Triunfo' THEN '150143'
  -- Callao
  WHEN 'Callao' THEN '070101'
  WHEN 'Bellavista' THEN '070102'
  WHEN 'Carmen de la Legua Reynoso' THEN '070103'
  WHEN 'La Perla' THEN '070104'
  WHEN 'La Punta' THEN '070105'
  WHEN 'Ventanilla' THEN '070106'
  WHEN 'Mi Perú' THEN '070107'
END;

-- Verificar que se actualizó
SELECT COUNT(*) as distritos_con_ubigeo FROM distritos WHERE codigo_ubigeo IS NOT NULL;
EOF

echo "✅ Códigos UBIGEO añadidos a la tabla distritos"
