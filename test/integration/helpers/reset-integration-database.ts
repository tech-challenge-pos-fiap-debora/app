import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { INTEGRATION_DATABASE_URL } from './database-url';

export async function resetIntegrationDatabase(): Promise<void> {
  const client = new pg.Client({ connectionString: INTEGRATION_DATABASE_URL });
  await client.connect();

  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');

    const sqlDir = path.join(__dirname, '../../../migrations/sql');
    const files = fs
      .readdirSync(sqlDir)
      .filter((file) => file.endsWith('.sql') && !file.includes('seed'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
      await client.query(sql);
    }
  } finally {
    await client.end();
  }
}
