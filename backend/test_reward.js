import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Manually load .env.development
const envPath = path.resolve(__dirname, '.env.development');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
}

// Ensure the process uses the test env
import { pool } from './src/models/database.js';
import { getCitizenRewardProfile, getRedeemableBadges } from './src/models/rewardModel.js';

async function test() {
  try {
    const { rows } = await pool.query('select user_id from citizens where civic_points > 0 limit 1');
    if (!rows.length) {
      console.log('No citizens with points found.');
      process.exit(0);
    }
    const userId = rows[0].user_id;
    console.log('Found citizen with points. User ID:', userId);

    console.log('Fetching reward profile...');
    const profile = await getCitizenRewardProfile(userId);
    console.log('Profile:', profile);

    console.log('Fetching redeemable badges...');
    const redeemable = await getRedeemableBadges(userId);
    console.log('Redeemable:', redeemable.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

test();
