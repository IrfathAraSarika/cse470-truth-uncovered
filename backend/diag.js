import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Manually read .env.development
const envPath = path.resolve(__dirname, '.env.development');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
}

const pg = require('pg');
const pool = new pg.Pool({ connectionString: envVars['DATABASE_URL'] });

Promise.all([
  pool.query("select column_name from information_schema.columns where table_name = 'citizens' and column_name = 'anonymous_leaderboard'"),
  pool.query("select column_name from information_schema.columns where table_name = 'badges' and column_name = 'point_cost'"),
  pool.query("select badge_type, point_cost, is_active from badges order by point_cost nulls last"),
  pool.query("select citizen_id, user_id::text, civic_points from citizens where civic_points > 0 limit 5"),
]).then(([col1, col2, bdg, cts]) => {
  console.log('anonymous_leaderboard col exists:', col1.rows.length > 0);
  console.log('point_cost col exists:', col2.rows.length > 0);
  console.log('badges:', JSON.stringify(bdg.rows));
  console.log('citizens with points:', JSON.stringify(cts.rows));
  pool.end();
}).catch(e => { console.error('DB ERROR:', e.message); pool.end(); process.exit(1); });
