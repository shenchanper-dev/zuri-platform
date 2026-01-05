#!/bin/bash
echo "=== DIAGNÓSTICO COMPLETO DEL SISTEMA ==="

echo "1. Verificando estructura de BD..."
sudo -u postgres psql -d zuri_db -c "\d importaciones" | head -20

echo -e "\n2. Verificando secuencias existentes..."
sudo -u postgres psql -d zuri_db -c "SELECT * FROM pg_sequences WHERE schemaname = 'public';"

echo -e "\n3. Verificando datos actuales..."
sudo -u postgres psql -d zuri_db -c "SELECT id, codigo, nombre_archivo, estado FROM importaciones ORDER BY id DESC LIMIT 5;"

echo -e "\n4. Verificando logs del servidor..."
pm2 logs zuri-dev --lines 10

echo -e "\n5. Verificando APIs..."
curl -s http://localhost:3000/api/importaciones | python3 -m json.tool | head -20

echo -e "\n6. Probando subida de archivo..."
ls -la src/app/api/importaciones/upload/route.ts 2>/dev/null || echo "API upload no existe"

echo -e "\n7. Verificando estructura de archivos API..."
find src/app/api/importaciones -name "*.ts" -type f
