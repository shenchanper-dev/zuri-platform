#!/bin/bash
echo "Creando APIs del módulo Programación..."

# 1. API Principal - Listar y Crear Programaciones
mkdir -p src/app/api/programaciones
cat > src/app/api/programaciones/route.ts << 'EOFAPI1'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const fecha = searchParams.get('fecha');
    
    let query = 'SELECT * FROM vista_programaciones_resumen WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (estado) {
      query += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }
    
    if (fecha) {
      query += ` AND fecha_programacion = $${paramIndex}`;
      params.push(fecha);
      paramIndex++;
    }
    
    query += ' ORDER BY fecha_programacion DESC, created_at DESC LIMIT 100';
    
    const result = await client.query(query, params);
    await client.end();
    
    const estadisticas = {
      total: result.rows.length,
      borradores: result.rows.filter(p => p.estado === 'BORRADOR').length,
      confirmadas: result.rows.filter(p => p.estado === 'CONFIRMADO').length,
      completadas: result.rows.filter(p => p.estado === 'COMPLETADO').length
    };
    
    return NextResponse.json({ 
      programaciones: result.rows,
      estadisticas
    });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const body = await request.json();
    
    const result = await client.query(`
      INSERT INTO programaciones (
        importacion_id, fecha_programacion, cliente_id, cliente_nombre,
        tipo_servicio_id, estado, notas, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      body.importacion_id || null,
      body.fecha_programacion,
      body.cliente_id || null,
      body.cliente_nombre,
      body.tipo_servicio_id || null,
      body.estado || 'BORRADOR',
      body.notas || null,
      body.creado_por || 'Sistema'
    ]);
    
    await client.end();
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI1

# 2. API Detalle de Programación
mkdir -p src/app/api/programaciones/[id]
cat > src/app/api/programaciones/[id]/route.ts << 'EOFAPI2'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const id = parseInt(params.id);
    
    const progResult = await client.query('SELECT * FROM programaciones WHERE id = $1', [id]);
    if (progResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 });
    }
    
    const detallesResult = await client.query(`
      SELECT 
        pd.*,
        ts.nombre as tipo_servicio_nombre,
        cl.nombre as cliente_nombre_bd,
        d.nombre_completo as doctor_nombre_completo_bd,
        c."nombreCompleto" as conductor_nombre_completo_bd,
        c."marcaAuto" as conductor_marca,
        c.modelo as conductor_modelo,
        c.placa as conductor_placa,
        cal.descripcion as calificacion_descripcion,
        cal.color as calificacion_color,
        mnd.descripcion as motivo_no_disponibilidad_desc
      FROM programacion_detalles pd
      LEFT JOIN tipos_servicio ts ON pd.tipo_servicio_id = ts.id
      LEFT JOIN clinicas cl ON pd.cliente_id = cl.id
      LEFT JOIN doctores d ON pd.doctor_id = d.id
      LEFT JOIN conductores c ON pd.conductor_id = c.id
      LEFT JOIN calificaciones cal ON pd.calificacion_id = cal.id
      LEFT JOIN motivos_no_disponibilidad mnd ON pd.motivo_no_disponibilidad_id = mnd.id
      WHERE pd.programacion_id = $1
      ORDER BY pd.orden ASC, pd.hora_inicio ASC
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const id = parseInt(params.id);
    const body = await request.json();
    
    const result = await client.query(`
      UPDATE programaciones SET
        fecha_programacion = COALESCE($2, fecha_programacion),
        cliente_id = COALESCE($3, cliente_id),
        cliente_nombre = COALESCE($4, cliente_nombre),
        tipo_servicio_id = COALESCE($5, tipo_servicio_id),
        estado = COALESCE($6, estado),
        notas = COALESCE($7, notas),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, body.fecha_programacion, body.cliente_id, body.cliente_nombre, 
        body.tipo_servicio_id, body.estado, body.notas]);
    
    await client.end();
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    await client.query('DELETE FROM programaciones WHERE id = $1', [parseInt(params.id)]);
    await client.end();
    return NextResponse.json({ message: 'Programación eliminada' });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI2

# 3. API para crear programación desde importación
mkdir -p src/app/api/programaciones/desde-importacion
cat > src/app/api/programaciones/desde-importacion/route.ts << 'EOFAPI3'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function POST(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const body = await request.json();
    const { importacionId } = body;
    
    await client.query('BEGIN');
    
    const importResult = await client.query(
      'SELECT * FROM importaciones_excel WHERE id = $1',
      [importacionId]
    );
    
    if (importResult.rows.length === 0) {
      await client.query('ROLLBACK');
      await client.end();
      return NextResponse.json({ error: 'Importación no encontrada' }, { status: 404 });
    }
    
    const importacion = importResult.rows[0];
    
    const progResult = await client.query(`
      INSERT INTO programaciones (
        importacion_id, fecha_programacion, cliente_nombre, estado, creado_por
      ) VALUES ($1, $2, $3, 'BORRADOR', 'Sistema')
      RETURNING *
    `, [importacionId, importacion.fecha_archivo, 'SANNA']);
    
    const programacionId = progResult.rows[0].id;
    
    const serviciosResult = await client.query(`
      SELECT * FROM solicitudes_servicios 
      WHERE importacion_id = $1 
      AND estado IN ('PROGRAMADO', 'RESERVADO')
      ORDER BY fecha, hora_inicio
    `, [importacionId]);
    
    for (let i = 0; i < serviciosResult.rows.length; i++) {
      const servicio = serviciosResult.rows[i];
      await client.query(`
        INSERT INTO programacion_detalles (
          programacion_id, solicitud_servicio_id, cliente_nombre,
          doctor_id, doctor_nombre, conductor_id,
          fecha, hora_inicio, hora_fin, turno, ubicacion,
          direccion_completa, estado, observaciones, orden
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        programacionId, servicio.id, 'SANNA',
        servicio.doctor_id, servicio.doctor_nombre, servicio.conductor_id,
        servicio.fecha, servicio.hora_inicio, servicio.hora_fin, 
        servicio.turno, servicio.descripcion, servicio.descripcion,
        'PROGRAMADO', servicio.observaciones, i + 1
      ]);
    }
    
    await client.query('COMMIT');
    await client.end();
    
    return NextResponse.json({
      success: true,
      programacion: progResult.rows[0],
      serviciosImportados: serviciosResult.rows.length
    }, { status: 201 });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI3

# 4. API para actualizar detalles
mkdir -p src/app/api/programacion-detalles/[id]
cat > src/app/api/programacion-detalles/[id]/route.ts << 'EOFAPI4'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const id = parseInt(params.id);
    const body = await request.json();
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    const camposPermitidos = [
      'tipo_servicio_id', 'cliente_id', 'cliente_nombre', 'doctor_id', 
      'doctor_nombre', 'conductor_id', 'conductor_nombre', 'fecha', 
      'hora_inicio', 'hora_fin', 'turno', 'ubicacion', 'direccion_completa',
      'estado', 'calificacion_id', 'calificacion_detalle', 
      'motivo_no_disponibilidad_id', 'observaciones', 'incidencias', 'orden'
    ];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        updates.push(`${campo} = $${paramIndex}`);
        values.push(body[campo]);
        paramIndex++;
      }
    });
    
    if (updates.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
    }
    
    values.push(id);
    const result = await client.query(`
      UPDATE programacion_detalles 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    await client.end();
    return NextResponse.json({ success: true, detalle: result.rows[0] });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI4

# 5. APIs para catálogos
mkdir -p src/app/api/tipos-servicio
cat > src/app/api/tipos-servicio/route.ts << 'EOFAPI5'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM tipos_servicio WHERE activo = TRUE ORDER BY nombre'
    );
    await client.end();
    return NextResponse.json({ tiposServicio: result.rows });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI5

mkdir -p src/app/api/calificaciones
cat > src/app/api/calificaciones/route.ts << 'EOFAPI6'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM calificaciones WHERE activo = TRUE ORDER BY tipo, codigo'
    );
    await client.end();
    return NextResponse.json({ calificaciones: result.rows });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI6

mkdir -p src/app/api/motivos-no-disponibilidad
cat > src/app/api/motivos-no-disponibilidad/route.ts << 'EOFAPI7'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM motivos_no_disponibilidad WHERE activo = TRUE ORDER BY descripcion'
    );
    await client.end();
    return NextResponse.json({ motivos: result.rows });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI7

echo "APIs creadas correctamente"
