#!/bin/bash
# deep_clean_and_rebuild.sh
# Script para limpiar profundamente el proyecto y reconstruirlo
# Soluciona errores persistentes de ChunkLoadError y cached builds

echo "🛑 Deteniendo procesos Node.js..."
pkill -f "next" || true

echo "🗑️ Limpiando artifacts de build (.next, .swc)..."
rm -rf .next
rm -rf .swc

echo "🗑️ Limpiando cache de node_modules..."
rm -rf node_modules/.cache

echo "✅ Limpieza completada."
echo "📦 Instalando dependencias (por si acaso)..."
npm install

echo "🏗️ Construyendo proyecto (esto asegura que las variables de entorno se apliquen)..."
npm run build

echo "🏁 Listo. Ahora puedes ejecutar 'npm run start'."
