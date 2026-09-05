import { pool } from './database.js';
import type { PoolClient } from 'pg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RewardProfile {
  civicPoints: number;
  anonymousLeaderboard: boolean;
  badges: EarnedBadge[];
}

export interface EarnedBadge {
  badgeId: string;
  badgeType: string;
  pointCost: number | null;
  awardedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  civicPoints: number;
  badgeCount: number;
  topBadge: string | null;
}

export interface RedeemableBadge {
  badgeId: string;
  badgeType: string;
  pointCost: number;
  owned: boolean;
}

// ---------------------------------------------------------------------------
// Read: citizen reward profile
// ---------------------------------------------------------------------------

export async function getCitizenRewardProfile(userId: string): Promise<RewardProfile | null> {
  const citizenRes = await pool.query(
    `select c.citizen_id, c.civic_points, c.anonymous_leaderboard
     from citizens c
     where c.user_id = $1`,
    [userId],
  );
  const citizen = citizenRes.rows[0];
  if (!citizen) return null;

  const badgesRes = await pool.query(
    `select b.badge_id, b.badge_type, b.point_cost, cb.awarded_at
     from citizen_badges cb
     join badges b on b.badge_id = cb.badge_id
     where cb.citizen_id = $1
     order by cb.awarded_at desc`,
    [citizen.citizen_id as string],
  );

  return {
    civicPoints: citizen.civic_points as number,
    anonymousLeaderboard: citizen.anonymous_leaderboard as boolean,
    badges: badgesRes.rows.map((r) => ({
      badgeId: r.badge_id as string,
      badgeType: r.badge_type as string,
      pointCost: r.point_cost as number | null,
      awardedAt: r.awarded_at as string,
    })),
  };
}

// ---------------------------------------------------------------------------
// Read: all redeemable badges (with ownership flag for this citizen)
// ---------------------------------------------------------------------------

export async function getRedeemableBadges(userId: string): Promise<RedeemableBadge[]> {
  const res = await pool.query(
    `select b.badge_id, b.badge_type, b.point_cost,
            exists(
              select 1 from citizen_badges cb
              join citizens c on c.citizen_id = cb.citizen_id
              where cb.badge_id = b.badge_id and c.user_id = $1
            ) as owned
     from badges b
     where b.point_cost is not null and b.is_active = true
     order by b.point_cost asc`,
    [userId],
  );
  return res.rows.map((r) => ({
    badgeId: r.badge_id as string,
    badgeType: r.badge_type as string,
    pointCost: r.point_cost as number,
    owned: r.owned as boolean,
  }));
}

// ---------------------------------------------------------------------------
// Read: public leaderboard (citizens only)
// ---------------------------------------------------------------------------

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const res = await pool.query(
    `select
       row_number() over (order by c.civic_points desc) as rank,
       case when c.anonymous_leaderboard then 'Anonymous'
            else u.full_name
       end as display_name,
       c.civic_points,
       count(cb.badge_id)::int as badge_count,
       (
         select b2.badge_type
         from citizen_badges cb2
         join badges b2 on b2.badge_id = cb2.badge_id
         where cb2.citizen_id = c.citizen_id
         order by cb2.awarded_at desc
         limit 1
       ) as top_badge
     from citizens c
     join app_users u on u.user_id = c.user_id
     left join citizen_badges cb on cb.citizen_id = c.citizen_id
     where u.role = 'citizen' and u.is_active = true and c.civic_points > 0
     group by c.citizen_id, c.civic_points, c.anonymous_leaderboard, u.full_name
     order by c.civic_points desc
     limit $1`,
    [limit],
  );
  return res.rows.map((r) => ({
    rank: Number(r.rank),
    displayName: r.display_name as string,
    civicPoints: r.civic_points as number,
    badgeCount: r.badge_count as number,
    topBadge: r.top_badge as string | null,
  }));
}

// ---------------------------------------------------------------------------
// Write: award civic points (runs inside caller's transaction if client given)
// ---------------------------------------------------------------------------

export async function awardPoints(
  citizenId: string,
  points: number,
  reason: string,
  client?: PoolClient,
): Promise<void> {
  const db = client ?? pool;
  await db.query(
    `update citizens set civic_points = civic_points + $1 where citizen_id = $2`,
    [points, citizenId],
  );
  await db.query(
    `insert into gamification_records (citizen_id, points_earned, reason) values ($1, $2, $3)`,
    [citizenId, points, reason],
  );
}

// ---------------------------------------------------------------------------
// Write: redeem a badge (atomic — deducts points, inserts badge, logs record)
// ---------------------------------------------------------------------------

export async function redeemBadge(userId: string, badgeType: string): Promise<{ newBalance: number }> {
  const client = await pool.connect();
  try {
    await client.query('begin');

    // Resolve citizen
    const citizenRes = await client.query<{ citizen_id: string; civic_points: number }>(
      `select citizen_id, civic_points from citizens where user_id = $1 for update`,
      [userId],
    );
    if (!citizenRes.rows[0]) throw new Error('CITIZEN_PROFILE_MISSING');
    const { citizen_id: citizenId, civic_points: currentPoints } = citizenRes.rows[0];

    // Resolve badge and its cost
    const badgeRes = await client.query<{ badge_id: string; point_cost: number | null }>(
      `select badge_id, point_cost from badges where badge_type = $1 and is_active = true`,
      [badgeType],
    );
    if (!badgeRes.rows[0]) throw new Error('BADGE_NOT_FOUND');
    const { badge_id: badgeId, point_cost: pointCost } = badgeRes.rows[0];
    if (pointCost === null) throw new Error('BADGE_NOT_REDEEMABLE');

    // Idempotency: check if already owned
    const existingRes = await client.query(
      `select 1 from citizen_badges where citizen_id = $1 and badge_id = $2`,
      [citizenId, badgeId],
    );
    if (existingRes.rows[0]) throw new Error('BADGE_ALREADY_OWNED');

    // Sufficient points?
    if (currentPoints < pointCost) throw new Error('INSUFFICIENT_POINTS');

    // Deduct points and insert badge
    const updatedRes = await client.query<{ civic_points: number }>(
      `update citizens set civic_points = civic_points - $1 where citizen_id = $2 returning civic_points`,
      [pointCost, citizenId],
    );
    await client.query(
      `insert into citizen_badges (citizen_id, badge_id) values ($1, $2)`,
      [citizenId, badgeId],
    );
    await client.query(
      `insert into gamification_records (citizen_id, badge_id, points_earned, reason)
       values ($1, $2, 0, $3)`,
      [citizenId, badgeId, `Redeemed badge: ${badgeType}`],
    );

    await client.query('commit');
    return { newBalance: updatedRes.rows[0]!.civic_points };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Write: toggle leaderboard anonymity
// ---------------------------------------------------------------------------

export async function updateLeaderboardAnonymity(userId: string, anonymous: boolean): Promise<void> {
  await pool.query(
    `update citizens set anonymous_leaderboard = $1 where user_id = $2`,
    [anonymous, userId],
  );
}
