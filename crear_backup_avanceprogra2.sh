#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="AVANCEPROGRA2-$TIMESTAMP"

mkdir -p ~/backups/$BACKUP_NAME

echo "=== BACKUP AVANCEPROGRA2 ==="
echo "Guardando punto de restauración exitoso..."

# Backup completo
cp -r src/app/api/programaciones ~/backups/$BACKUP_NAME/
cp -r src/app/api/programacion-detalles ~/backups/$BACKUP_NAME/
cp -r src/app/api/clientes-especiales ~/backups/$BACKUP_NAME/
cp -r src/app/api/areas-servicio ~/backups/$BACKUP_NAME/
cp src/components/EditorProgramacionContent.tsx ~/backups/$BACKUP_NAME/
cp src/components/BotonGenerarProgramacion.tsx ~/backups/$BACKUP_NAME/
cp src/app/dashboard/programacion/page.tsx ~/backups/$BACKUP_NAME/

# Base de datos
sudo -u postgres pg_dump -d zuri_db \
  -t programaciones -t programacion_detalles \
  -t clientes_especiales -t areas_servicio \
  > ~/backups/$BACKUP_NAME/bd_completa.sql

echo "✅ Backup guardado: ~/backups/$BACKUP_NAME"
echo "Para restaurar: cp ~/backups/$BACKUP_NAME/* [destinos]"
