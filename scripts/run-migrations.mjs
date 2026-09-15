#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.join(__dirname, '..', 'migrations', 'sql');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const files = fs
  .readdirSync(sqlDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

for (const file of files) {
  const id = file;
  const applied = await client.query(
    'SELECT 1 FROM schema_migrations WHERE id = $1',
    [id],
  );
  if (applied.rowCount > 0) {
    console.log(`skip ${id}`);
    continue;
  }

  const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
  console.log(`apply ${id}`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

await client.end();
console.log('migrations complete');
