const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  const { rows } = await pool.query('select user_id from citizens where civic_points > 0 limit 1');
  if (!rows.length) return console.log('No citizens with points');
  const userId = rows[0].user_id;
  console.log('userId:', userId);

  try {
    const citizenRes = await pool.query(
      `select c.citizen_id, c.civic_points, c.anonymous_leaderboard
       from citizens c
       where c.user_id = $1`,
      [userId]
    );
    console.log('citizenRes:', citizenRes.rows[0]);

    const badgesRes = await pool.query(
      `select b.badge_id, b.badge_type, b.point_cost, cb.awarded_at
       from citizen_badges cb
       join badges b on b.badge_id = cb.badge_id
       where cb.citizen_id = $1
       order by cb.awarded_at desc`,
      [citizenRes.rows[0].citizen_id]
    );
    console.log('badgesRes:', badgesRes.rows);

    const redRes = await pool.query(
      `select b.badge_id, b.badge_type, b.point_cost,
              exists(
                select 1 from citizen_badges cb
                join citizens c on c.citizen_id = cb.citizen_id
                where cb.badge_id = b.badge_id and c.user_id = $1
              ) as owned
       from badges b
       where b.point_cost is not null and b.is_active = true
       order by b.point_cost asc`,
      [userId]
    );
    console.log('redRes length:', redRes.rows.length);
  } catch (e) {
    console.error('FAIL:', e);
  } finally {
    pool.end();
  }
}
test();
