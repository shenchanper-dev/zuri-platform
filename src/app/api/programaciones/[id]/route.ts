import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // VALIDACIÓN: Rechazar IDs no numéricos (como ".env")
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({
        error: 'ID inválido'
      }, { status: 400 });
    }

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });

    await client.connect();
    const result = await client.query(
      'SELECT * FROM programaciones WHERE id = $1',
      [id]
    );
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({
        error: 'No encontrado'
      }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error('Error en GET /api/programaciones/[id]:', error.message);
    return NextResponse.json({
      error: 'Error interno'
    }, { status: 500 });
  }
}
