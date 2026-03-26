# Documentación Técnica Zuri Platform v2.0

## 1. Visión General
**Zuri Platform** es un sistema de gestión de transporte médico no emergente (NEMT) construido con arquitectura Clean Architecture y Modular Monolith.

### Stack Tecnológico
- **Frontend/Backend**: Next.js 14 (App Router)
- **Base de Datos**: PostgreSQL 14+
- **Servidor Web**: Nginx (Reverse Proxy)
- **Process Manager**: PM2
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS

---

## 2. Arquitectura del Sistema

### Estructura de Directorios
```
/home/zuri/zuri-platform/
├── src/                    # Código fuente
│   ├── app/                # Rutas Next.js (Backend & Frontend)
│   ├── domain/             # Entidades y Lógica de Negocio (Clean Arch)
│   ├── components/         # Componentes UI
│   └── hooks/              # Lógica de React
├── public/                 # Archivos estáticos
│   └── uploads/            # Fotos subidas por usuarios
├── script_backup/          # Scripts de mantenimiento
└── zuri_backups/           # Archivos de respaldo generados
```

### Flujo de Datos (Fotos)
El sistema usa una API route personalizada para servir imágenes de manera segura y eficiente:
1. Upload → `POST/PUT /api/conductores`
2. Almacenamiento → `/home/zuri/zuri-platform/public/uploads/`
3. Base de Datos → Guarda ruta `/api/uploads/...`
4. Visualización → Browser pide `/api/uploads/...` → Next.js lee archivo → Respuesta HTTP 200

---

## 3. Gestión y Operaciones

### Comandos Comunes
```bash
# Ver estado del sistema
pm2 status

# Ver logs en tiempo real
pm2 logs zuri-platform

# Reiniciar sistema
pm2 restart zuri-platform

# Detener sistema
pm2 stop zuri-platform
```

### Copias de Seguridad (Backup)
El sistema incluye un script automatizado para generar backups completos:
```bash
./scripts/create_backup_package.sh
```
Esto genera un archivo `.tar.gz` en `/home/zuri/zuri-platform/public/downloads/` que contiene:
- Base de datos completa
- Código fuente
- Archivos subidos (fotos)
- Configuraciones de servidor

---

## 4. Guía de Migración / Restauración

Para mover el sistema a un nuevo servidor (VPS Ubuntu 22.04+ recomendado):

### Paso 1: Preparar el Nuevo Servidor
Instalar dependencias básicas:
```bash
sudo apt update && sudo apt install -y curl git nginx postgresql postgresql-contrib
```

### Paso 2: Instalar Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Paso 3: Restaurar Backup
1. Subir el archivo `zuri_full_backup_YYYYMMDD.tar.gz` al nuevo servidor.
2. Extraer el archivo.
3. Ejecutar el script de restauración incluido:
   ```bash
   chmod +x restore_system.sh
   ./restore_system.sh
   ```
   *Este script automáticamente restaurará la base de datos, instalará dependencias y configurará el proyecto.*

### Paso 4: Configurar Nginx y Dominio
1. Copiar la configuración de Nginx incluida en el backup a `/etc/nginx/sites-available/`.
2. Actualizar el dominio si es necesario.
3. Obtener certificado SSL con Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d tudominio.com
   ```

---

## 5. Solución de Problemas Frecuentes

### Fotos no se muestran
- Verificar que existan en `public/uploads/`
- Verificar permisos: `chmod 755 public/uploads`
- Verificar que la API `/api/uploads` responda

### Error 502 Bad Gateway
- Significa que Next.js no está corriendo.
- Revisar: `pm2 status`
- Ver logs: `pm2 logs`

### Error de Base de Datos
- Verificar credenciales en `.env`
- Verificar servicio Postgres: `sudo systemctl status postgresql`
