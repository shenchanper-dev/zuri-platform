#!/bin/bash
echo "=== CREANDO PUNTO DE RESTAURACIÓN ==="

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/backups/punto-funcional-$TIMESTAMP

# Backup de archivos críticos
cp src/app/api/programaciones/\[id\]/route.ts ~/backups/punto-funcional-$TIMESTAMP/
cp src/components/EditorProgramacionContent.tsx ~/backups/punto-funcional-$TIMESTAMP/
cp src/app/dashboard/programacion/page.tsx ~/backups/punto-funcional-$TIMESTAMP/

echo "✅ Backup guardado en: ~/backups/punto-funcional-$TIMESTAMP"
echo ""
echo "Para restaurar este punto:"
echo "cp ~/backups/punto-funcional-$TIMESTAMP/* [destinos]"
