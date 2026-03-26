import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
    connectionString,
    max: parseInt(process.env.PG_POOL_MAX || '20', 10), // Increased from 10 to 20
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS || '10000', 10), // Increased from 5000 to 10000
    statement_timeout: parseInt(process.env.PG_STATEMENT_TIMEOUT_MS || '30000', 10), // Added statement timeout
  })
  : new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'zuri_db',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    max: parseInt(process.env.PG_POOL_MAX || '20', 10), // Increased from 10 to 20
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS || '10000', 10), // Increased from 5000 to 10000
    statement_timeout: parseInt(process.env.PG_STATEMENT_TIMEOUT_MS || '30000', 10), // Added statement timeout
  });

export default pool;
