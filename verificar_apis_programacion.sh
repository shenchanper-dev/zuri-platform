#!/bin/bash
echo "=== VERIFICACIÓN DE ARQUITECTURA ==="

# 1. Verificar que todas las tablas existen
echo "1. Verificando tablas de BD..."
sudo -u postgres psql -d zuri_db -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'programaciones',
  'programacion_detalles', 
  'tipos_servicio',
  'calificaciones',
  'motivos_no_disponibilidad'
)
ORDER BY table_name;
"

# 2. Verificar que las APIs existen
echo -e "\n2. Verificando estructura de APIs..."
find src/app/api -type f -name "route.ts" | grep -E "(programacion|tipos-servicio|calificacion)" | sort

# 3. Test de APIs
echo -e "\n3. Test básico de APIs..."
echo "GET /api/programaciones:"
curl -s http://localhost:3000/api/programaciones | head -c 100
echo -e "\n"

echo "GET /api/tipos-servicio:"
curl -s http://localhost:3000/api/tipos-servicio | head -c 100
echo -e "\n"

echo -e "\n=== FIN VERIFICACIÓN ==="
