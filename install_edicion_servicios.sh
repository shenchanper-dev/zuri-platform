#!/bin/bash
echo "🔧 Instalando Sistema de Edición de Servicios"

# 1. Crear API para actualizar servicios
mkdir -p src/app/api/solicitudes-servicios/[id]
cat > src/app/api/solicitudes-servicios/[id]/route.ts << 'EOFAPI1'
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
    
    const camposPermitidos = ['fecha', 'hora_inicio', 'hora_fin', 'turno', 'clasificacion', 'descripcion', 'conductor_id', 'conductor_asignado', 'estado', 'observaciones'];
    
    for (const campo of camposPermitidos) {
      if (body[campo] !== undefined) {
        updates.push(\`\${campo} = $\${paramIndex}\`);
        values.push(body[campo]);
        paramIndex++;
      }
    }
    
    if (updates.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 });
    }
    
    values.push(id);
    const query = \`UPDATE solicitudes_servicios SET \${updates.join(', ')}, updated_at = NOW() WHERE id = $\${paramIndex} RETURNING *\`;
    const result = await client.query(query, values);
    
    await client.end();
    return NextResponse.json({ success: true, servicio: result.rows[0] });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI1

# 2. Crear API para conductores disponibles
mkdir -p src/app/api/conductores-disponibles
cat > src/app/api/conductores-disponibles/route.ts << 'EOFAPI2'
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function GET(request: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    
    let query = \`SELECT c.id, c.dni, c."nombreCompleto" as nombre_completo, c.celular1, c."marcaAuto" as marca_auto, c.modelo, c.placa, d.nombre as distrito
      FROM conductores c LEFT JOIN distritos d ON c."distritoId" = d.id WHERE c.estado = 'ACTIVO'\`;
    
    const params: any[] = [];
    if (fecha) {
      params.push(fecha);
      query += \` AND c.id NOT IN (SELECT DISTINCT conductor_id FROM solicitudes_servicios WHERE fecha = $1 AND conductor_id IS NOT NULL AND estado NOT IN ('CANCELADO', 'COMPLETADO'))\`;
    }
    
    query += \` ORDER BY c."nombreCompleto" ASC\`;
    const result = await client.query(query, params);
    
    await client.end();
    
    const conductores = result.rows.map(c => ({
      id: c.id, nombre_completo: c.nombre_completo, dni: c.dni, celular: c.celular1,
      vehiculo: \`\${c.marca_auto} \${c.modelo} - \${c.placa || 'Sin placa'}\`,
      distrito: c.distrito || 'No especificado', disponible: true
    }));
    
    return NextResponse.json({ conductores, total: conductores.length });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI2

# 3. Crear componente Modal
cat > src/components/ModalEditarServicios.tsx << 'EOFMODAL'
// Ver artifact 'modal_editar_servicios' para el código completo
// (Demasiado largo para incluir aquí, copiar manualmente desde el artifact)
EOFMODAL

echo "✓ APIs creadas"
echo "⚠️  IMPORTANTE: Copia manualmente el componente ModalEditarServicios.tsx desde el artifact"
echo ""
echo "Ahora compila el proyecto:"
echo "npm run build && pm2 restart zuri-dev"
