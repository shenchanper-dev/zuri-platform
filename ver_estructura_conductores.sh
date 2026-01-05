#!/bin/bash
echo "=== ESTRUCTURA TABLA CONDUCTORES ==="

sudo -u postgres psql -d zuri_db -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conductores'
ORDER BY ordinal_position;
"

echo -e "\n=== DATOS DE EJEMPLO ==="
sudo -u postgres psql -d zuri_db -c "
SELECT * FROM conductores LIMIT 1;
"
