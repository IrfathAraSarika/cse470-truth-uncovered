import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.development' });

const migrationName = process.argv[2];
if (!migrationName || !/^\d{4}_[a-z0-9_]+\.sql$/i.test(migrationName)) {
  console.error('Usage: npm run db:migrate -- 0007_migration_name.sql');
  process.exit(1);
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(scriptDirectory, '../../supabase/migrations', migrationName);
const migrationsRoot = path.resolve(scriptDirectory, '../../supabase/migrations');
if (path.dirname(migrationPath) !== migrationsRoot) throw new Error('Invalid migration path.');

const sql = await fs.readFile(migrationPath, 'utf8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied ${migrationName}.`);
} finally {
  await client.end().catch(() => undefined);
}
