import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbClient = null;
let dbType = 'none';

export async function initDb() {
  if (dbClient) return { dbClient, dbType };

  const databaseUrl = process.env.DATABASE_URL;

  // 1. Try connecting via standard PostgreSQL if DATABASE_URL or host is supplied
  if (databaseUrl || process.env.PGHOST) {
    try {
      const isCloud = Boolean(databaseUrl && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1'));
      const pool = new pg.Pool({
        connectionString: databaseUrl || `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'routeflow'}`,
        connectionTimeoutMillis: 5000,
        ...(isCloud ? { ssl: { rejectUnauthorized: false } } : {}),
      });

      // Test connection
      await pool.query('SELECT 1');
      console.log('✅ Connected to external PostgreSQL database successfully!');
      dbClient = pool;
      dbType = 'pg';
      return { dbClient, dbType };
    } catch (err) {
      console.warn('⚠️ External PostgreSQL connection failed:', err.message);
      console.log('⚡ Switching to embedded high-performance PostgreSQL (PGlite)...');
    }
  }

  // 2. Embedded PostgreSQL engine (PGlite) with persistence to local data directory
  const dataDir = path.resolve(__dirname, '../../data/routeflow_pg');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`📦 Initializing embedded PostgreSQL storage at: ${dataDir}`);
  const pglite = new PGlite(dataDir);
  await pglite.waitReady;
  console.log('✅ Embedded PostgreSQL engine initialized & ready!');
  dbClient = pglite;
  dbType = 'pglite';

  return { dbClient, dbType };
}

export async function query(sql, params = []) {
  if (!dbClient) {
    await initDb();
  }

  if (dbType === 'pg') {
    const res = await dbClient.query(sql, params);
    return res;
  } else {
    // PGlite query
    const res = await dbClient.query(sql, params);
    return {
      rows: res.rows || [],
      rowCount: res.affectedRows ?? (res.rows ? res.rows.length : 0),
    };
  }
}

export async function exec(sql) {
  if (!dbClient) {
    await initDb();
  }

  if (dbType === 'pg') {
    return await dbClient.query(sql);
  } else {
    return await dbClient.exec(sql);
  }
}

export function getDbType() {
  return dbType;
}
