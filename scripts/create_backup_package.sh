#!/bin/bash
# scripts/create_backup_package.sh

# Configuración
PROJECT_DIR="/home/zuri/zuri-platform"
BACKUP_DIR="${PROJECT_DIR}/public/downloads"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="zuri_full_backup_${TIMESTAMP}"
TEMP_DIR="/tmp/${BACKUP_NAME}"

echo "📦 Iniciando Backup Completo del Sistema..."

# 1. Crear directorio temporal
mkdir -p "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}/db"
mkdir -p "${TEMP_DIR}/config"
mkdir -p "${TEMP_DIR}/code"

# 2. Backup de Base de Datos
echo "🗄️ Respaldando Base de Datos..."
pg_dump -U zuri zuri_db > "${TEMP_DIR}/db/zuri_db.sql"

# 3. Copiar Código Fuente (excluyendo node_modules, .next, .git)
echo "💻 Copiando Código Fuente..."
rsync -av --exclude 'node_modules' \
          --exclude '.next' \
          --exclude '.git' \
          --exclude 'zuri_backups' \
          --exclude 'public/downloads' \
          "${PROJECT_DIR}/" "${TEMP_DIR}/code/"

# 4. Copiar Configuraciones
echo "⚙️ Copiando Configuraciones..."
# Nginx
cp /etc/nginx/sites-available/admin.zuri.pe "${TEMP_DIR}/config/admin.zuri.pe.nginx"
# PM2 Ecosystem (si existe, sino generamos uno simple)
if [ -f "${PROJECT_DIR}/ecosystem.config.js" ]; then
    cp "${PROJECT_DIR}/ecosystem.config.js" "${TEMP_DIR}/config/"
else
    # Generar script de arranque simple
    echo "module.exports = { apps: [{ name: 'zuri-platform', script: 'npm', args: 'start' }] }" > "${TEMP_DIR}/config/ecosystem.config.js"
fi

# 5. Agregar documentación
cp "${PROJECT_DIR}/SYSTEM_MANUAL.md" "${TEMP_DIR}/SYSTEM_MANUAL.md"

# 6. Agregar Script de Restore
cat > "${TEMP_DIR}/restore_system.sh" << 'EOF'
#!/bin/bash
# Script de Restauración Automática Zuri Platform

echo "🚀 Iniciando Restauración del Sistema..."

# Verificar si se ejecuta como root (para instalaciones) o usuario normal
if [ "$EUID" -eq 0 ]; then 
  echo "⚠️  Por favor no ejecute este script como root. Ejecútelo como el usuario que manejará la aplicación (ej: ubuntu)."
  exit 1
fi

PROJECT_ROOT=$(pwd)

# 1. Restaurar Código
echo "📂 Restaurando código fuente..."
rsync -av code/ ./zuri-platform/

# 2. Restaurar DB
echo "🗄️ Restaurando base de datos..."
# Preguntar credenciales si es necesario
read -p "Ingrese nombre de usuario de base de datos (default: zuri): " DB_USER
DB_USER=${DB_USER:-zuri}
read -p "Ingrese nombre de base de datos (default: zuri_db): " DB_NAME
DB_NAME=${DB_NAME:-zuri_db}

# Crear DB si no existe
createdb -U postgres $DB_NAME 2>/dev/null || echo "La DB ya existe o requiere password de postgres"
psql -U $DB_USER -d $DB_NAME < db/zuri_db.sql

# 3. Instalar Dependencias y Build
echo "📦 Instalando dependencias..."
cd zuri-platform
npm install
echo "🏗️ Construyendo aplicación..."
npm run build

# 4. Configurar Nginx
echo "🌍 Configuración de Nginx disponible en config/"
echo "   Copie config/admin.zuri.pe.nginx a /etc/nginx/sites-available/"
echo "   y cree el enlace simbólico."

echo "✅ Restauración completada."
echo "   Para iniciar: cd zuri-platform && pm2 start npm --name zuri-platform -- start"
EOF

chmod +x "${TEMP_DIR}/restore_system.sh"

# 7. Comprimir todo
echo "🗜️ Comprimiendo archivo..."
cd /tmp
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"

# Limpieza
rm -rf "${TEMP_DIR}"

echo "✅ Backup completado: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "🌐 URL de descarga (si el servidor es accesible): https://admin.zuri.pe/downloads/${BACKUP_NAME}.tar.gz"
