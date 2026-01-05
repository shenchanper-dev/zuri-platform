-- ================================================================
-- TABLA DISTRITOS COMPLETA - LIMA + CALLAO CON COORDENADAS GPS
-- Para uso en Conductores, Doctores, Pacientes, Clínicas
-- Total: 50 distritos (43 Lima + 7 Callao)
-- ================================================================

-- Crear tabla distritos con estructura completa
DROP TABLE IF EXISTS distritos CASCADE;

CREATE TABLE distritos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    provincia VARCHAR(50) NOT NULL,
    departamento VARCHAR(50) NOT NULL,
    
    -- Coordenadas GPS del centro del distrito
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    
    -- Código postal principal
    codigo_postal VARCHAR(10),
    ubigeo VARCHAR(6), -- Código UBIGEO oficial
    
    -- Metadatos opcionales
    poblacion INTEGER,
    area_km2 DECIMAL(8, 2),
    
    -- Control
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_distritos_nombre ON distritos(nombre);
CREATE INDEX idx_distritos_provincia ON distritos(provincia);
CREATE INDEX idx_distritos_coordenadas ON distritos(latitud, longitud);
CREATE INDEX idx_distritos_ubigeo ON distritos(ubigeo);

-- ====================================================================
-- INSERTAR TODOS LOS DISTRITOS DE LIMA (43) + CALLAO (7)
-- ====================================================================

INSERT INTO distritos (nombre, provincia, departamento, latitud, longitud, codigo_postal, ubigeo) VALUES
-- LIMA METROPOLITANA (43 distritos)
('Ancón', 'Lima', 'Lima', -11.7700, -77.1500, '15000', '150102'),
('Ate', 'Lima', 'Lima', -12.0500, -76.9200, '15012', '150103'),
('Barranco', 'Lima', 'Lima', -12.1400, -77.0200, '15063', '150104'),
('Breña', 'Lima', 'Lima', -12.0600, -77.0500, '15083', '150105'),
('Carabayllo', 'Lima', 'Lima', -11.8600, -77.0300, '15121', '150106'),
('Chaclacayo', 'Lima', 'Lima', -12.0100, -76.7600, '15131', '150107'),
('Chorrillos', 'Lima', 'Lima', -12.1900, -77.0100, '15056', '150108'),
('Cieneguilla', 'Lima', 'Lima', -12.0900, -76.8200, '15012', '150109'),
('Comas', 'Lima', 'Lima', -11.9300, -77.0600, '15311', '150110'),
('El Agustino', 'Lima', 'Lima', -12.0300, -77.0100, '15007', '150111'),
('Independencia', 'Lima', 'Lima', -11.9900, -77.0500, '15332', '150112'),
('Jesús María', 'Lima', 'Lima', -12.0700, -77.0500, '15072', '150113'),
('La Molina', 'Lima', 'Lima', -12.0800, -76.9400, '15024', '150114'),
('La Victoria', 'Lima', 'Lima', -12.0700, -77.0300, '15013', '150115'),
('Lima', 'Lima', 'Lima', -12.0464, -77.0428, '15001', '150101'),
('Lince', 'Lima', 'Lima', -12.0900, -77.0400, '15046', '150116'),
('Los Olivos', 'Lima', 'Lima', -11.9700, -77.0700, '15304', '150117'),
('Lurigancho', 'Lima', 'Lima', -11.9700, -76.8500, '15012', '150118'),
('Lurín', 'Lima', 'Lima', -12.2700, -76.8700, '15056', '150119'),
('Magdalena del Mar', 'Lima', 'Lima', -12.1000, -77.0700, '15076', '150120'),
('Miraflores', 'Lima', 'Lima', -12.1200, -77.0300, '15074', '150122'),
('Pachacamac', 'Lima', 'Lima', -12.2500, -76.8700, '15823', '150123'),
('Pucusana', 'Lima', 'Lima', -12.4700, -76.8000, '15821', '150124'),
('Pueblo Libre', 'Lima', 'Lima', -12.0800, -77.0600, '15084', '150121'),
('Puente Piedra', 'Lima', 'Lima', -11.8600, -77.0700, '15122', '150125'),
('Punta Hermosa', 'Lima', 'Lima', -12.3400, -76.8200, '15856', '150126'),
('Punta Negra', 'Lima', 'Lima', -12.3700, -76.8100, '15857', '150127'),
('Rímac', 'Lima', 'Lima', -12.0200, -77.0300, '15003', '150128'),
('San Bartolo', 'Lima', 'Lima', -12.3900, -76.7800, '15892', '150129'),
('San Borja', 'Lima', 'Lima', -12.1100, -77.0000, '15021', '150130'),
('San Isidro', 'Lima', 'Lima', -12.0971, -77.0361, '15073', '150131'),
('San Juan de Lurigancho', 'Lima', 'Lima', -11.9800, -77.0100, '15400', '150132'),
('San Juan de Miraflores', 'Lima', 'Lima', -12.1600, -76.9700, '15801', '150133'),
('San Luis', 'Lima', 'Lima', -12.0800, -77.0100, '15022', '150134'),
('San Martín de Porres', 'Lima', 'Lima', -12.0100, -77.0800, '15102', '150135'),
('San Miguel', 'Lima', 'Lima', -12.0800, -77.0900, '15087', '150136'),
('Santa Anita', 'Lima', 'Lima', -12.0500, -76.9700, '15011', '150137'),
('Santa María del Mar', 'Lima', 'Lima', -12.3900, -76.7700, '15893', '150138'),
('Santa Rosa', 'Lima', 'Lima', -11.6300, -77.2100, '15149', '150139'),
('Santiago de Surco', 'Lima', 'Lima', -12.1400, -77.0100, '15023', '150140'),
('Surquillo', 'Lima', 'Lima', -12.1100, -77.0200, '15047', '150141'),
('Villa El Salvador', 'Lima', 'Lima', -12.2000, -76.9400, '15842', '150142'),
('Villa María del Triunfo', 'Lima', 'Lima', -12.1700, -76.9300, '15816', '150143'),

-- PROVINCIA CONSTITUCIONAL DEL CALLAO (7 distritos)
('Bellavista', 'Callao', 'Lima', -12.0553, -77.1147, '15011', '070102'),
('Callao', 'Callao', 'Lima', -12.0566, -77.1181, '15001', '070101'),
('Carmen de la Legua Reynoso', 'Callao', 'Lima', -12.0400, -77.1000, '15003', '070103'),
('La Perla', 'Callao', 'Lima', -12.0700, -77.1100, '15006', '070104'),
('La Punta', 'Callao', 'Lima', -12.0722, -77.1639, '15021', '070105'),
('Mi Perú', 'Callao', 'Lima', -11.9900, -77.1700, '15067', '070106'),
('Ventanilla', 'Callao', 'Lima', -11.8775, -77.1542, '15033', '070107');

-- ================================================================
-- FUNCIONES ÚTILES PARA GPS
-- ================================================================

-- Función para calcular distancia entre dos puntos GPS (Haversine)
CREATE OR REPLACE FUNCTION calcular_distancia_gps(
    lat1 DECIMAL, lon1 DECIMAL,
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Radio de la Tierra en km
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dLon/2) * SIN(dLon/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar distrito más cercano por GPS
CREATE OR REPLACE FUNCTION encontrar_distrito_por_gps(
    lat_usuario DECIMAL,
    lon_usuario DECIMAL
) RETURNS TABLE(distrito_id INT, distrito_nombre VARCHAR, distancia_km DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.nombre,
        calcular_distancia_gps(lat_usuario, lon_usuario, d.latitud, d.longitud) as distancia
    FROM distritos d
    WHERE d.activo = TRUE
    ORDER BY distancia
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- VISTAS ÚTILES
-- ================================================================

-- Vista de todos los distritos con información completa
CREATE OR REPLACE VIEW vista_distritos_completos AS
SELECT 
    id,
    nombre,
    provincia,
    departamento,
    latitud,
    longitud,
    codigo_postal,
    ubigeo,
    CASE 
        WHEN provincia = 'Lima' THEN 'LIMA_METROPOLITANA'
        WHEN provincia = 'Callao' THEN 'CALLAO'
        ELSE 'OTRO'
    END as zona,
    activo,
    created_at
FROM distritos
ORDER BY provincia, nombre;

-- Vista solo distritos de Lima
CREATE OR REPLACE VIEW vista_distritos_lima AS
SELECT * FROM distritos 
WHERE provincia = 'Lima' AND activo = TRUE
ORDER BY nombre;

-- Vista solo distritos de Callao
CREATE OR REPLACE VIEW vista_distritos_callao AS
SELECT * FROM distritos 
WHERE provincia = 'Callao' AND activo = TRUE
ORDER BY nombre;

-- ================================================================
-- VERIFICACIÓN
-- ================================================================

-- Contar distritos por provincia
SELECT 
    provincia,
    COUNT(*) as total_distritos
FROM distritos 
GROUP BY provincia;

-- Ver todos los distritos
SELECT id, nombre, provincia, latitud, longitud, ubigeo 
FROM distritos 
ORDER BY provincia, nombre;

-- Ejemplo de uso de función GPS
-- SELECT * FROM encontrar_distrito_por_gps(-12.0464, -77.0428); -- Lima Centro

COMMENT ON TABLE distritos IS 'Tabla completa de 50 distritos: 43 Lima + 7 Callao con coordenadas GPS para autodetección';
