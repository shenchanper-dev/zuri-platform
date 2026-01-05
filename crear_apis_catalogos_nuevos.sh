#!/bin/bash

# API Clientes Especiales
mkdir -p src/app/api/clientes-especiales
cat > src/app/api/clientes-especiales/route.ts << 'EOF1'
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
EOF1

# API Áreas
mkdir -p src/app/api/areas-servicio
cat > src/app/api/areas-servicio/route.ts << 'EOF2'
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
EOF2

echo "✓ APIs de catálogos creadas"
npm run build && pm2 restart zuri-dev

echo ""
echo "Verifica las nuevas APIs:"
echo "curl http://localhost:3000/api/clientes-especiales"
echo "curl http://localhost:3000/api/areas-servicio"
