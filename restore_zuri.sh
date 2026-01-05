#!/bin/bash
set -e

echo "🔁 === INICIANDO RESTAURACIÓN DEL SISTEMA ZURI ==="

# --- CONFIGURACIÓN ---
APP_DIR=~/zuri-platform
BACKUP_DIR=~/backups
DB_NAME=zuri_db
LATEST_SQL=$(find $APP_DIR -name "zuri_db_backup_*.sql" -printf "%T@ %p\n" 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2)
LATEST_ZPRO=$(find $BACKUP_DIR -maxdepth 1 -type d -name "ZPROGRAVER3*" | sort | tail -1)
LATEST_PROG=$(find $BACKUP_DIR -maxdepth 1 -type d -name "programacion-completa*" | sort | tail -1)

echo ""
echo "🗂 Backups detectados:"
echo "   - Último ZPROGRAVER3: $LATEST_ZPRO"
echo "   - Último programacion-completa: $LATEST_PROG"
echo "   - Último dump SQL: $LATEST_SQL"
echo ""

# --- CONFIRMAR ---
read -p "¿Deseas continuar con la restauración (y/n)? " confirm
[[ $confirm != "y" ]] && { echo "❌ Cancelado."; exit 1; }

# --- RESPALDO ESTADO ACTUAL ---
TS=$(date +%Y%m%d_%H%M%S)
BACKUP_ACTUAL=~/estado_actual_$TS
echo "📦 Guardando estado actual en: $BACKUP_ACTUAL"
mkdir -p $BACKUP_ACTUAL
cp -r $APP_DIR/src $BACKUP_ACTUAL/ 2>/dev/null || true
cp $APP_DIR/package.json $BACKUP_ACTUAL/ 2>/dev/null || true
cp $APP_DIR/next.config.js $BACKUP_ACTUAL/ 2>/dev/null || true

# --- LIMPIAR Y PREPARAR ---
echo "🧹 Limpiando estructura actual..."
rm -rf $APP_DIR/src
mkdir -p $APP_DIR/src/{app,components,hooks,lib}

# --- RESTAURAR DESDE BACKUPS ---
if [ -d "$LATEST_PROG" ]; then
  echo "🔁 Restaurando desde $LATEST_PROG"
  cp -r $LATEST_PROG/apis/* $APP_DIR/src/app/api/ 2>/dev/null || true
  cp -r $LATEST_PROG/componentes/* $APP_DIR/src/components/ 2>/dev/null || true
  cp -r $LATEST_PROG/frontend/* $APP_DIR/src/app/ 2>/dev/null || true
fi

if [ -d "$LATEST_ZPRO" ]; then
  echo "🔁 Restaurando módulos ZPROGRAVER3..."
  cp -r $LATEST_ZPRO/programaciones $APP_DIR/src/app/api/ 2>/dev/null || true
  cp -r $LATEST_ZPRO/programacion-detalles $APP_DIR/src/app/api/ 2>/dev/null || true
  cp -r $LATEST_ZPRO/clientes-especiales $APP_DIR/src/app/api/ 2>/dev/null || true
  cp -r $LATEST_ZPRO/areas-servicio $APP_DIR/src/app/api/ 2>/dev/null || true
  cp $LATEST_ZPRO/*.tsx $APP_DIR/src/components/ 2>/dev/null || true
  mkdir -p $APP_DIR/src/app/dashboard/programacion
  cp $LATEST_ZPRO/page.tsx $APP_DIR/src/app/dashboard/programacion/ 2>/dev/null || true
fi

# --- COPIAR LAYOUTS BASE ---
if [ -d "$APP_DIR/emergency_broken_20251007_053427" ]; then
  echo "📁 Restaurando layouts globales..."
  cp $APP_DIR/emergency_broken_20251007_053427/src/app/layout.tsx $APP_DIR/src/app/
  cp $APP_DIR/emergency_broken_20251007_053427/src/app/dashboard/layout.tsx $APP_DIR/src/app/dashboard/
  cp $APP_DIR/emergency_broken_20251007_053427/src/app/\(auth\)/layout.tsx $APP_DIR/src/app/\(auth\)/ 2>/dev/null || true
fi

# --- REPARAR PERMISOS ---
find $APP_DIR/src -type d -exec chmod 755 {} \;
find $APP_DIR/src -type f -exec chmod 644 {} \;

# --- RESTAURAR BASE DE DATOS ---
echo "💾 Restaurando base de datos PostgreSQL..."
if [ -n "$LATEST_SQL" ]; then
  sudo -u postgres psql -d $DB_NAME < $LATEST_SQL
elif [ -f "$LATEST_ZPRO/bd_zprograver3.sql" ]; then
  sudo -u postgres psql -d $DB_NAME < $LATEST_ZPRO/bd_zprograver3.sql
else
  echo "⚠️ No se encontró archivo SQL para restaurar."
fi

# --- RECONSTRUIR SISTEMA ---
cd $APP_DIR
echo "⚙️ Instalando dependencias..."
npm install --legacy-peer-deps

echo "🏗 Construyendo proyecto..."
npm run build || { echo "❌ Error al compilar"; exit 1; }

# --- REINICIAR SERVIDOR PM2 ---
if command -v pm2 >/dev/null 2>&1; then
  echo "🚀 Reiniciando servicio PM2..."
  pm2 restart zuri-dev || pm2 start npm --name "zuri-dev" -- run start
else
  echo "⚠️ PM2 no encontrado. Ejecuta manualmente: npm run start"
fi

echo ""
echo "✅ Restauración completa."
echo "Verifica en https://admin.zuri.pe/"
