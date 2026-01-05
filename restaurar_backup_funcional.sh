#!/bin/bash
echo "=== RESTAURANDO BACKUP FUNCIONAL ==="

BACKUP_DIR=~/backups/programacion-completa-20251003_230839

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup no encontrado en $BACKUP_DIR"
    ls -la ~/backups/
    exit 1
fi

echo "Restaurando desde: $BACKUP_DIR"

# 1. Restaurar componente
echo "[1/2] Restaurando componente EditorProgramacionContent..."
cp $BACKUP_DIR/componentes/EditorProgramacionContent.tsx src/components/
echo "✓ Componente restaurado"

# 2. Verificar que quedó bien
LINEAS=$(wc -l < src/components/EditorProgramacionContent.tsx)
echo "Líneas en componente: $LINEAS"

# 3. Compilar
npm run build

if [ $? -eq 0 ]; then
    pm2 restart zuri-dev
    echo ""
    echo "✅ BACKUP RESTAURADO"
    echo ""
    echo "Verifica en: https://admin.zuri.pe/dashboard/programacion"
    echo ""
    echo "Ahora aplicaremos solo los cambios necesarios de forma controlada"
else
    echo "❌ Error al compilar"
fi
