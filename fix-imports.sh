#!/bin/bash

echo "Corrigiendo imports problemáticos..."

# Buscar y corregir todas las importaciones de leaflet
find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "leaflet" | while read file; do
    echo "Corrigiendo $file"
    # Comentar import de leaflet
    sed -i "s/import.*from 'leaflet';/\/\/ import leaflet comentado temporalmente/" "$file"
    sed -i "s/import.*from \"leaflet\";/\/\/ import leaflet comentado temporalmente/" "$file"
    sed -i "s/import type.*from 'leaflet';/\/\/ import leaflet comentado temporalmente/" "$file"
    sed -i "s/import type.*from \"leaflet\";/\/\/ import leaflet comentado temporalmente/" "$file"
    
    # Agregar tipos básicos al inicio del archivo si no existen
    if ! grep -q "type LatLngExpression" "$file"; then
        sed -i '1i // Tipos básicos para leaflet\ntype LatLngExpression = [number, number];\ntype Map = any;\ntype Marker = any;\ntype LatLng = any;\n' "$file"
    fi
done

echo "Correcciones aplicadas"
