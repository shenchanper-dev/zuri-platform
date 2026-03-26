import { NextResponse } from 'next/server';
import pool from '@/lib/pg-pool';

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbError: string | null = null;

  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      dbOk = true;
    } finally {
      client.release();
    }
  } catch (e: any) {
    dbError = e?.message || 'db_error';
  }

  const status = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      ok: dbOk,
      service: 'zuri-platform',
      env: process.env.NODE_ENV || 'unknown',
      version: process.env.ZURI_VERSION || '2.0.0',
      checks: {
        db: {
          ok: dbOk,
          error: dbError,
        },
      },
      latency_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

