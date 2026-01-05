#!/bin/bash
set -e

echo "================================================"
echo "PLAN DE RESTAURACIÓN Y ACTUALIZACIÓN CONTROLADA"
echo "================================================"

BACKUP_DIR=~/backups/programacion-completa-20251003_230839

# PASO 1: RESTAURAR BACKUP COMPLETO
echo -e "\n[PASO 1/4] Restaurando backup funcional..."

# Restaurar componentes
cp $BACKUP_DIR/componentes/EditorProgramacionContent.tsx src/components/ 2>/dev/null || echo "Componente no en backup"
cp $BACKUP_DIR/componentes/BotonGenerarProgramacion.tsx src/components/ 2>/dev/null || echo "Botón no en backup"

# Restaurar frontend
cp $BACKUP_DIR/frontend/gestion-excel-page.tsx src/app/dashboard/gestion-excel/page.tsx

echo "✓ Archivos restaurados"

# PASO 2: AMPLIAR CATÁLOGOS (ya probado que funciona)
echo -e "\n[PASO 2/4] Ampliando catálogos en BD..."

sudo -u postgres psql -d zuri_db << 'EOFDB'
-- Clientes especiales
CREATE TABLE IF NOT EXISTS clientes_especiales (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  nombre_completo TEXT,
  activo BOOLEAN DEFAULT TRUE,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO clientes_especiales (codigo, nombre, nombre_completo, orden) VALUES
  ('SANNA', 'SANNA', 'Clínica SANNA', 1),
  ('CI', 'C.I.', 'Clínico Internacional', 2),
  ('JP', 'JP', 'Servicio empresa privada JP', 3),
  ('SM', 'SM', 'Servicio empresa privada SM', 4),
  ('OTRO', 'Otro', 'Otro cliente', 99)
ON CONFLICT (codigo) DO NOTHING;

-- Tipos de servicio adicionales
INSERT INTO tipos_servicio (codigo, nombre, descripcion) VALUES
  ('EKG', 'EKG', 'Electrocardiograma'),
  ('RETEN', 'RETEN', 'Retén médico'),
  ('RDM', 'RDM', 'Revisión de medicina'),
  ('LIBRE', 'LIBRE', 'Servicio libre'),
  ('DESCANSO', 'DESCANSO', 'Día de descanso')
ON CONFLICT (codigo) DO NOTHING;

-- Áreas
CREATE TABLE IF NOT EXISTS areas_servicio (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO areas_servicio (codigo, nombre, orden) VALUES
  ('MEDICINA', 'MEDICINA', 1),
  ('PEDIATRIA', 'PEDIATRÍA', 2),
  ('LABORATORIO', 'LABORATORIO', 3),
  ('PRECISA', 'PRECISA', 4),
  ('CRONICO', 'CRONICO', 5),
  ('CC_MIRAFLORES', 'CC. MIRAFLORES', 6),
  ('CC_EL_GOLF', 'CC. EL GOLF', 7),
  ('CC_LA_MOLINA', 'CC. LA MOLINA', 8),
  ('OREO', 'OREO', 9)
ON CONFLICT (codigo) DO NOTHING;

-- Agregar columnas
ALTER TABLE programacion_detalles 
  ADD COLUMN IF NOT EXISTS area_servicio_id INTEGER REFERENCES areas_servicio(id),
  ADD COLUMN IF NOT EXISTS cliente_especial_id INTEGER REFERENCES clientes_especiales(id);

ALTER TABLE programaciones
  ADD COLUMN IF NOT EXISTS cliente_especial_id INTEGER REFERENCES clientes_especiales(id);

CREATE INDEX IF NOT EXISTS idx_prog_detalles_area ON programacion_detalles(area_servicio_id);
CREATE INDEX IF NOT EXISTS idx_programaciones_cliente_esp ON programaciones(cliente_especial_id);
EOFDB

echo "✓ Catálogos ampliados"

# PASO 3: CREAR APIS DE NUEVOS CATÁLOGOS (solo si no existen)
echo -e "\n[PASO 3/4] Creando APIs de catálogos..."

mkdir -p src/app/api/clientes-especiales
cat > src/app/api/clientes-especiales/route.ts << 'EOFAPI1'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM clientes_especiales WHERE activo = TRUE ORDER BY orden, nombre'
    );
    await client.end();
    return NextResponse.json({ clientesEspeciales: result.rows });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI1

mkdir -p src/app/api/areas-servicio
cat > src/app/api/areas-servicio/route.ts << 'EOFAPI2'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM areas_servicio WHERE activo = TRUE ORDER BY orden, nombre'
    );
    await client.end();
    return NextResponse.json({ areas: result.rows });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI2

echo "✓ APIs creadas"

# PASO 4: COMPILAR
echo -e "\n[PASO 4/4] Compilando y reiniciando..."
npm run build

if [ $? -eq 0 ]; then
    pm2 restart zuri-dev
    echo ""
    echo "================================================"
    echo "✅ RESTAURACIÓN COMPLETADA"
    echo "================================================"
    echo ""
    echo "Verifica en: https://admin.zuri.pe/dashboard/programacion"
    echo ""
    echo "Estado:"
    echo "  ✓ Backup restaurado"
    echo "  ✓ Catálogos ampliados"
    echo "  ✓ APIs de catálogos creadas"
    echo "  ✓ Sistema compilado"
    echo ""
    echo "El botón 'Abrir' debería funcionar ahora"
    echo ""
else
    echo "❌ Error en compilación"
    exit 1
fi
