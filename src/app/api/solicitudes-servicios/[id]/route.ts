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
