#!/bin/bash
echo "=== DIAGNÓSTICO COMPLETO SIN ASUMIR NADA ==="

echo "1. ¿Qué tabla de importaciones existe realmente?"
sudo -u postgres psql -d zuri_db -c "\dt" | grep import

echo -e "\n2. ¿Qué estructura tiene?"
sudo -u postgres psql -d zuri_db -c "\d importaciones" 2>/dev/null || echo "Tabla importaciones no existe"
sudo -u postgres psql -d zuri_db -c "\d importaciones_final" 2>/dev/null || echo "Tabla importaciones_final no existe"
sudo -u postgres psql -d zuri_db -c "\d importaciones_excel" 2>/dev/null || echo "Tabla importaciones_excel no existe"

echo -e "\n3. ¿Qué datos existen?"
sudo -u postgres psql -d zuri_db -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_name LIKE '%import%' ORDER BY table_name, ordinal_position;"

echo -e "\n4. ¿Qué APIs existen?"
find src/app/api -name "*.ts" -type f | grep -i import

echo -e "\n5. ¿El servidor está corriendo?"
pm2 status

echo -e "\n6. ¿Qué responde la API actual?"
curl -s http://localhost:3000/api/importaciones 2>/dev/null || echo "API no responde"
