import { pool } from './database.js';
import { awardPoints } from './rewardModel.js';

// Public: active reports that citizens can flag for review.
export async function fetchFlaggableReports() {
  const result = await pool.query(
    `select r.report_id, r.title, r.category::text as category, r.submission_date,
            l.district
     from reports r
     left join locations l on l.location_id = r.location_id
     where r.status in ('submitted', 'pending_verification', 'verified')
     order by r.submission_date desc
     limit 50`,
  );
  return result.rows;
}

export async function fetchReportForFlagging(reportId: string) {
  const result = await pool.query(
    'select report_id, title, description from reports where report_id = $1',
    [reportId],
  );
  return result.rows[0] ?? null;
}

export async function findOpenFlagByUser(reportId: string, userId: string) {
  const result = await pool.query(
    `select flag_id from flagged_contents
     where report_id = $1 and flagged_by_user_id = $2 and is_resolved = false
     limit 1`,
    [reportId, userId],
  );
  return result.rows[0] ?? null;
}

export async function insertFlaggedItem(userId: string, reportId: string, reasonText: string) {
  const result = await pool.query(
    `insert into flagged_contents (flagged_by_user_id, target_type, target_id, report_id, reason)
     values ($1, 'report', $2, $2, $3)
     returning flag_id, flagged_at`,
    [userId, reportId, reasonText],
  );
  return result.rows[0];
}

// Public: unresolved flags aggregated per report for the community watch board.
export async function fetchPublicFlaggedReports() {
  const result = await pool.query(
    `select r.report_id, r.title, r.category::text as category, r.status, l.district,
            count(f.flag_id)::int as flag_count, max(f.flagged_at) as last_flagged_at
     from flagged_contents f
     join reports r on r.report_id = f.report_id
     left join locations l on l.location_id = r.location_id
     where f.is_resolved = false
     group by r.report_id, r.title, r.category, r.status, l.district
     order by flag_count desc, last_flagged_at desc
     limit 20`,
  );
  return result.rows;
}

// Admin: full unresolved flag queue with report content and flagger identity.
export async function fetchFlaggedItemQueue() {
  const result = await pool.query(
    `select f.flag_id, f.report_id, f.reason, f.flagged_at,
            r.title, r.description, r.category::text as category, r.status,
            u.full_name as flagged_by
     from flagged_contents f
     join reports r on r.report_id = f.report_id
     left join app_users u on u.user_id = f.flagged_by_user_id
     where f.is_resolved = false
     order by f.flagged_at desc
     limit 100`,
  );
  return result.rows;
}

export async function resolveFlaggedItem(flagId: string, decision: 'dismiss' | 'hide') {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const flagRes = await client.query<{ report_id: string; flagged_by_user_id: string | null }>(
      'select report_id, flagged_by_user_id from flagged_contents where flag_id = $1',
      [flagId],
    );
    if (!flagRes.rows[0]) {
      throw new Error('Flagged item record not found.');
    }

    const reportId = flagRes.rows[0].report_id as string;

    if (decision === 'hide') {
      await client.query("update reports set status = 'hidden', updated_at = now() where report_id = $1", [reportId]);

      // Award 15 pts to the flagger for a confirmed community flag
      const flaggerUserId = flagRes.rows[0].flagged_by_user_id;
      if (flaggerUserId) {
        const citizenRes = await client.query<{ citizen_id: string }>(
          `select citizen_id from citizens where user_id = $1`,
          [flaggerUserId],
        );
        const citizenId = citizenRes.rows[0]?.citizen_id;
        if (citizenId) {
          await awardPoints(citizenId, 15, 'Community flag confirmed — fake report identified', client);
        }
      }
    }
    await client.query('update flagged_contents set is_resolved = true where flag_id = $1', [flagId]);

    await client.query('commit');
    return { success: true, flagId, reportId, decision };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
