import { pool } from './database.js';

export async function fetchModerationQueue() {
  const result = await pool.query(
    `select f.flag_id, f.target_type, f.target_id, f.report_id, f.reason, f.flagged_at, f.is_resolved,
            r.title, r.description, r.category, r.status, r.duplicate_score
     from flagged_contents f
     join reports r on r.report_id = f.report_id
     where f.is_resolved = false
     order by f.flagged_at desc
     limit 100`,
  );
  return result.rows;
}

export async function resolveModerationFlagRecord(flagId: string, decision: 'approve' | 'reject_spam') {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const flagRes = await client.query('select report_id from flagged_contents where flag_id = $1', [flagId]);
    if (!flagRes.rows[0]) {
      throw new Error('Flagged item record not found.');
    }

    const reportId = flagRes.rows[0].report_id as string;
    const newStatus = decision === 'approve' ? 'submitted' : 'rejected';

    await client.query('update reports set status = $1::report_status, updated_at = now() where report_id = $2', [newStatus, reportId]);
    await client.query('update flagged_contents set is_resolved = true where flag_id = $1', [flagId]);

    await client.query('commit');
    return { success: true, flagId, reportId, status: newStatus };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
