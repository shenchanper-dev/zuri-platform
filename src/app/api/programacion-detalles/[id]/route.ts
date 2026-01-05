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
      'calificacion_id', 'observaciones'
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
    
    campos.push('updated_at = NOW()');
    valores.push(id);
    
    const query = `UPDATE programacion_detalles SET ${campos.join(', ')} WHERE id = $${contador} RETURNING *`;
    
    await client.connect();
    const result = await client.query(query, valores);
    await client.end();
    
    return NextResponse.json({ detalle: result.rows[0] });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
