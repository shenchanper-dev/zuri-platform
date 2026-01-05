#!/bin/bash
echo "🔧 Arreglando visualización de conflictos"

# 1. Actualizar API PUT para guardar campos de conflicto
cat > src/app/api/solicitudes-servicios/[id]/route.ts << 'EOFAPI'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;
    
    // Campos permitidos para actualizar
    const camposPermitidos = [
      'fecha', 
      'hora_inicio', 
      'hora_fin', 
      'turno', 
      'clasificacion', 
      'descripcion', 
      'conductor_id', 
      'estado', 
      'observaciones',
      'tiene_conflicto',      // <- AÑADIDO
      'conflicto_detalle'     // <- AÑADIDO
    ];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) { 
        updates.push(`${campo} = $${i}`); 
        values.push(body[campo]); 
        i++; 
      }
    });
    
    if (!updates.length) {
      await client.end();
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
    }
    
    values.push(parseInt(params.id));
    const result = await client.query(
      `UPDATE solicitudes_servicios 
       SET ${updates.join(', ')}, updated_at = NOW() 
       WHERE id = $${i} 
       RETURNING *`,
      values
    );
    
    await client.end();
    
    console.log('✓ Servicio actualizado:', {
      id: result.rows[0].id,
      estado: result.rows[0].estado,
      tiene_conflicto: result.rows[0].tiene_conflicto,
      conflicto_detalle: result.rows[0].conflicto_detalle
    });
    
    return NextResponse.json({ success: true, servicio: result.rows[0] });
  } catch (error: any) {
    await client.end();
    console.error('Error en PUT:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

echo "✓ API actualizada"

# 2. Verificar que la vista devuelve los campos de conflicto
sudo -u postgres psql -d zuri_db << 'EOFDB'

-- Recrear vista incluyendo campos de conflicto
CREATE OR REPLACE VIEW vista_servicios_completos AS
SELECT
  s.id,
  s.codigo_zuri,
  i.nombre_archivo,
  i.fecha_importacion,
  s.fecha as fecha_servicio,
  s.hora_inicio,
  s.hora_fin,
  s.turno,
  s.clasificacion,
  s.doctor_nombre,
  d.id as doctor_db_id,
  d.nombre_completo as doctor_nombre_completo_bd,
  s.doctor_es_nuevo,
  s.doctor_similaridad_score,
  s.descripcion,
  s.conductor_asignado,
  c.id as conductor_db_id,
  c."nombreCompleto" as conductor_nombre_completo,
  s.estado,
  s.requiere_revision,
  s.motivo_revision,
  s.observaciones,
  s.tiene_conflicto,        -- <- AÑADIDO
  s.conflicto_detalle,      -- <- AÑADIDO
  s.created_at
FROM solicitudes_servicios s
LEFT JOIN importaciones_excel i ON s.importacion_id = i.id
LEFT JOIN doctores d ON s.doctor_id = d.id
LEFT JOIN conductores c ON s.conductor_id = c.id
ORDER BY s.created_at DESC;

-- Verificar que los campos existen
\d solicitudes_servicios | grep conflicto

EOFDB

echo "✓ Vista actualizada"

# 3. Actualizar API GET de importaciones para incluir campos de conflicto
cat > src/app/api/importaciones/[id]/route.ts << 'EOFAPI2'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    const id = parseInt(params.id);
    
    // Obtener datos de la importación
    const importacionResult = await client.query(
      'SELECT * FROM importaciones_excel WHERE id = $1',
      [id]
    );
    
    if (importacionResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }
    
    // Obtener servicios con TODOS los campos incluyendo conflictos
    const serviciosResult = await client.query(`
      SELECT 
        s.id,
        s.fecha as fecha_servicio,
        s.hora_inicio,
        s.hora_fin,
        s.turno,
        s.clasificacion,
        s.doctor_nombre,
        s.doctor_es_nuevo,
        s.doctor_similaridad_score,
        s.descripcion,
        s.conductor_id as conductor_db_id,
        c."nombreCompleto" as conductor_nombre_completo,
        s.estado,
        s.observaciones,
        s.tiene_conflicto,
        s.conflicto_detalle
      FROM solicitudes_servicios s
      LEFT JOIN conductores c ON s.conductor_id = c.id
      WHERE s.importacion_id = $1
      ORDER BY s.fecha, s.hora_inicio
    `, [id]);
    
    await client.end();
    
    return NextResponse.json({
      importacion: importacionResult.rows[0],
      servicios: serviciosResult.rows,
      totalServicios: serviciosResult.rows.length
    });
    
  } catch (error: any) {
    await client.end();
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI2

echo "✓ API GET actualizada"

npm run build && pm2 restart zuri-dev

echo ""
echo "==================== DIAGNÓSTICO ===================="
echo "Verifica los servicios con conflicto en la BD:"
sudo -u postgres psql -d zuri_db -c "
SELECT 
  id, 
  doctor_nombre, 
  hora_inicio, 
  hora_fin, 
  estado, 
  tiene_conflicto,
  conflicto_detalle
FROM solicitudes_servicios 
WHERE conductor_id IS NOT NULL
ORDER BY fecha, hora_inicio;
"
echo "===================================================="
