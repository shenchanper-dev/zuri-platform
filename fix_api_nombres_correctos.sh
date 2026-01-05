#!/bin/bash
echo "Arreglando API con nombres de columnas correctos..."

cat > src/app/api/programaciones/\[id\]/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    const { id } = params;
    await client.connect();
    
    const progResult = await client.query(
      'SELECT * FROM programaciones WHERE id = $1',
      [id]
    );
    
    if (progResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 });
    }
    
    // Query con nombres de columnas CORRECTOS
    const detallesResult = await client.query(`
      SELECT 
        pd.*,
        ts.nombre as tipo_servicio_nombre,
        ce.nombre as cliente_especial_nombre,
        ar.nombre as area_nombre,
        c."nombreCompleto" as conductor_nombre_completo_bd,
        c."marcaAuto" as conductor_marca,
        c.modelo as conductor_modelo,
        c.placa as conductor_placa,
        cal.descripcion as calificacion_descripcion,
        cal.color as calificacion_color
      FROM programacion_detalles pd
      LEFT JOIN tipos_servicio ts ON pd.tipo_servicio_id = ts.id
      LEFT JOIN clientes_especiales ce ON pd.cliente_especial_id = ce.id
      LEFT JOIN areas_servicio ar ON pd.area_servicio_id = ar.id
      LEFT JOIN conductores c ON pd.conductor_id = c.id
      LEFT JOIN calificaciones cal ON pd.calificacion_id = cal.id
      WHERE pd.programacion_id = $1
      ORDER BY pd.fecha, pd.hora_inicio
    `, [id]);
    
    await client.end();
    
    return NextResponse.json({
      programacion: progResult.rows[0],
      detalles: detallesResult.rows
    });
  } catch (error: any) {
    await client.end();
    console.error('Error en GET /api/programaciones/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    const body = await request.json();
    const { id } = params;
    
    await client.connect();
    
    // Solo actualizar estado por ahora (funcionalidad básica)
    const result = await client.query(
      'UPDATE programaciones SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [body.estado, id]
    );
    
    await client.end();
    
    return NextResponse.json({ programacion: result.rows[0] });
  } catch (error: any) {
    await client.end();
    console.error('Error en PUT /api/programaciones/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

# Probar la query directamente
echo -e "\n=== PROBANDO QUERY CORREGIDA ==="
sudo -u postgres psql -d zuri_db << 'EOFTEST'
SELECT 
  pd.id,
  pd.doctor_nombre,
  ts.nombre as tipo_servicio_nombre,
  ce.nombre as cliente_especial_nombre,
  ar.nombre as area_nombre,
  c."nombreCompleto" as conductor_nombre_completo_bd,
  c."marcaAuto" as conductor_marca,
  c.placa as conductor_placa
FROM programacion_detalles pd
LEFT JOIN tipos_servicio ts ON pd.tipo_servicio_id = ts.id
LEFT JOIN clientes_especiales ce ON pd.cliente_especial_id = ce.id
LEFT JOIN areas_servicio ar ON pd.area_servicio_id = ar.id
LEFT JOIN conductores c ON pd.conductor_id = c.id
LEFT JOIN calificaciones cal ON pd.calificacion_id = cal.id
WHERE pd.programacion_id = 1
LIMIT 3;
EOFTEST

if [ $? -eq 0 ]; then
    echo -e "\n✅ Query funciona correctamente"
    pm2 restart zuri-dev
    echo ""
    echo "Ahora prueba: https://admin.zuri.pe/dashboard/programacion"
    echo "El botón Abrir debe funcionar"
else
    echo -e "\n❌ Todavía hay error en la query"
fi
