#!/bin/bash
echo "Buscando archivos Excel adjuntos..."

# Buscar en el directorio actual y subdirectorios
find . -name "*.xlsx" -type f 2>/dev/null | head -10

# Si no están aquí, intentar leerlos desde donde Claude los almacena
# Los archivos adjuntos en conversación pueden estar en /tmp o similar
ls -la /tmp/*.xlsx 2>/dev/null || echo "No en /tmp"

# Verificar directorio home
ls -la ~/*.xlsx 2>/dev/null || echo "No en home"

# Listar archivos recientes
echo -e "\nArchivos .xlsx recientes en el sistema:"
find ~ -name "*.xlsx" -mtime -1 -type f 2>/dev/null
