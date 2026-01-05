#!/bin/bash

# ====================================================
# ZURI CONDUCTORES - INSTALACIÓN RÁPIDA
# Reemplaza mock data por PostgreSQL real con 24 campos
# ====================================================

echo "🚀 INICIANDO INSTALACIÓN ZURI CONDUCTORES..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto ZURI."
    exit 1
fi

log_info "Directorio del proyecto verificado"

# 1. Hacer backup de archivos existentes
echo ""
echo "🔄 PASO 1: Creando backups..."

# Backup de API principal
if [ -f "src/app/api/conductores/route.ts" ]; then
    cp "src/app/api/conductores/route.ts" "src/app/api/conductores/route.ts.backup"
    log_info "Backup creado: route.ts.backup"
else
    log_warning "No se encontró route.ts existente"
fi

# Backup de API individual (si existe)
if [ -f "src/app/api/conductores/[id]/route.ts" ]; then
    cp "src/app/api/conductores/[id]/route.ts" "src/app/api/conductores/[id]/route.ts.backup"
    log_info "Backup creado: [id]/route.ts.backup"
fi

# 2. Crear directorios si no existen
echo ""
echo "📁 PASO 2: Verificando directorios..."

mkdir -p "src/app/api/conductores/[id]"
log_info "Directorios verificados"

# 3. Aplicar archivos nuevos
echo ""
echo "🔄 PASO 3: Aplicando archivos nuevos..."

# Nota: Los archivos deben copiarse manualmente desde /mnt/user-data/outputs/
echo ""
log_warning "ACCIÓN REQUERIDA:"
echo "Copia manualmente estos archivos desde VS Code:"
echo ""
echo "1. conductores_route.ts → src/app/api/conductores/route.ts"
echo "2. conductores_id_route.ts → src/app/api/conductores/[id]/route.ts"
echo ""

# 4. Verificar estructura de base de datos
echo ""
echo "🗄️ PASO 4: Verificando base de datos..."

# Verificar conexión a PostgreSQL
if command -v psql &> /dev/null; then
    echo "Verificando tabla conductores..."
    
    # Verificar que la tabla existe
    TABLE_EXISTS=$(sudo -u postgres psql -d zuri_db -t -c "SELECT to_regclass('public.conductores');" 2>/dev/null || echo "null")
    
    if [[ "$TABLE_EXISTS" == *"conductores"* ]]; then
        log_info "Tabla conductores encontrada"
        
        # Verificar campos importantes
        COLUMN_COUNT=$(sudo -u postgres psql -d zuri_db -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'conductores';" 2>/dev/null || echo "0")
        
        if [ "$COLUMN_COUNT" -ge 20 ]; then
            log_info "Tabla tiene $COLUMN_COUNT campos (✅ Suficientes para 24 campos)"
        else
            log_warning "Tabla solo tiene $COLUMN_COUNT campos. Podrían faltar campos."
        fi
        
    else
        log_error "Tabla conductores no encontrada"
        echo ""
        echo "Ejecuta estos comandos para crear la tabla:"
        echo "sudo -u postgres psql -d zuri_db"
        echo "Luego crea la tabla con todos los campos necesarios"
    fi
else
    log_warning "psql no encontrado. No se puede verificar la base de datos."
fi

# 5. Instrucciones finales
echo ""
echo "🎯 PASO 5: Instrucciones finales..."
echo ""
echo "Para completar la instalación:"
echo ""
echo "1. Copia los archivos desde outputs/ a tu proyecto:"
echo "   - conductores_route.ts → src/app/api/conductores/route.ts"
echo "   - conductores_id_route.ts → src/app/api/conductores/[id]/route.ts"
echo ""
echo "2. Reinicia el servidor:"
echo "   pm2 restart zuri-app"
echo ""
echo "3. Verifica que funciona:"
echo "   curl http://localhost:3000/api/conductores"
echo ""
echo "4. Si hay errores, revisa los logs:"
echo "   pm2 logs zuri-app --lines 20"
echo ""

log_info "Script completado. Revisa las instrucciones arriba."
echo ""

# Verificar si PM2 está corriendo
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 status zuri-app 2>/dev/null | grep "zuri-app" | awk '{print $10}' || echo "not_found")
    
    if [[ "$PM2_STATUS" == "online" ]]; then
        log_info "PM2 zuri-app está corriendo"
    else
        log_warning "PM2 zuri-app no está corriendo o no existe"
        echo "Inicia con: pm2 start 'npm run dev' --name 'zuri-app'"
    fi
fi

echo "🎉 ¡Instalación preparada! Sigue las instrucciones de arriba."
