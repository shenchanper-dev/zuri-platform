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
    try { await client.end(); } catch { }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
