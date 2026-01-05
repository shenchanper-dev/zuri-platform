#!/bin/bash
echo "Arreglando guardado de Cliente y Área..."

# 1. Actualizar API de programacion-detalles para aceptar los nuevos campos
cat > src/app/api/programacion-detalles/[id]/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    const body = await request.json();
    const { id } = params;
    
    const campos = [];
    const valores = [];
    let contador = 1;
    
    const camposPermitidos = [
      'tipo_servicio_id', 'cliente_especial_id', 'area_servicio_id',
      'conductor_id', 'fecha', 'hora_inicio', 'hora_fin', 
      'calificacion_id', 'observaciones', 'ubicacion'
    ];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        if (body[campo] === '' || body[campo] === null) {
          campos.push(`${campo} = NULL`);
        } else {
          campos.push(`${campo} = $${contador}`);
          valores.push(body[campo]);
          contador++;
        }
      }
    });
    
    if (campos.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }
    
    campos.push(`updated_at = NOW()`);
    valores.push(id);
    
    const query = `
      UPDATE programacion_detalles 
      SET ${campos.join(', ')}
      WHERE id = $${contador}
      RETURNING *
    `;
    
    await client.connect();
    const result = await client.query(query, valores);
    await client.end();
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Detalle no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ detalle: result.rows[0] });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

# 2. Actualizar API de programaciones para incluir los nuevos campos en las consultas
cat > src/app/api/programaciones/[id]/route.ts << 'EOFAPI2'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    const { id } = params;
    await client.connect();
    
    const progResult = await client.query(`
      SELECT p.*, ce.nombre as cliente_especial_nombre
      FROM programaciones p
      LEFT JOIN clientes_especiales ce ON p.cliente_especial_id = ce.id
      WHERE p.id = $1
    `, [id]);
    
    if (progResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 });
    }
    
    const detallesResult = await client.query(`
      SELECT 
        pd.*,
        ts.nombre as tipo_servicio_nombre,
        ce.nombre as cliente_especial_nombre,
        ar.nombre as area_nombre,
        c.nombre_completo as conductor_nombre_completo_bd,
        c.marca as conductor_marca,
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
      ORDER BY pd.orden, pd.fecha, pd.hora_inicio
    `, [id]);
    
    await client.end();
    
    return NextResponse.json({
      programacion: progResult.rows[0],
      detalles: detallesResult.rows
    });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    const body = await request.json();
    const { id } = params;
    
    const campos = [];
    const valores = [];
    let contador = 1;
    
    const camposPermitidos = ['estado', 'cliente_especial_id', 'notas'];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        if (body[campo] === '' || body[campo] === null) {
          campos.push(`${campo} = NULL`);
        } else {
          campos.push(`${campo} = $${contador}`);
          valores.push(body[campo]);
          contador++;
        }
      }
    });
    
    if (campos.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }
    
    campos.push(`updated_at = NOW()`);
    valores.push(id);
    
    const query = `
      UPDATE programaciones 
      SET ${campos.join(', ')}
      WHERE id = $${contador}
      RETURNING *
    `;
    
    await client.connect();
    const result = await client.query(query, valores);
    await client.end();
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ programacion: result.rows[0] });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    const { id } = params;
    await client.connect();
    
    const result = await client.query(
      'DELETE FROM programaciones WHERE id = $1 RETURNING codigo_programacion',
      [id]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      codigo: result.rows[0].codigo_programacion 
    });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI2

npm run build && pm2 restart zuri-dev

echo "APIs actualizadas para guardar Cliente y Área correctamente"
