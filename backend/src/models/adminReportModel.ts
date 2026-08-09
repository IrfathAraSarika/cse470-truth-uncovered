import { pool } from './database.js';

export async function listAdminReports(status: string) {
  const result = await pool.query(
    `select r.report_id, r.title, r.description, r.category, r.status, r.is_anonymous, r.submission_date,
            coalesce(r.duplicate_score, 0)::float as duplicate_score,
            count(distinct e.evidence_id)::int as evidence_count,
            count(distinct ar.review_id)::int as review_count,
            count(distinct f.flag_id) filter (where not f.is_resolved)::int as flag_count
     from reports r left join evidence_files e on e.report_id = r.report_id
     left join admin_report_reviews ar on ar.report_id = r.report_id
     left join flagged_contents f on f.report_id = r.report_id
     where ($1 = 'all' or r.status::text = $1)
     group by r.report_id order by r.submission_date desc`, [status]);
  return result.rows;
}

export async function getAdminReport(reportId: string) {
  const report = await pool.query('select * from reports where report_id = $1', [reportId]);
  if (!report.rows[0]) return null;
  const [evidence, reviews, flags, duplicates] = await Promise.all([
    pool.query('select evidence_id, file_path, file_type, file_size_bytes, uploaded_at from evidence_files where report_id = $1 order by uploaded_at desc', [reportId]),
    pool.query(`select ar.review_id, ar.decision, ar.notes, ar.created_at, u.full_name as admin_name
                from admin_report_reviews ar join admins a on a.admin_id = ar.admin_id
                join app_users u on u.user_id = a.user_id where ar.report_id = $1 order by ar.created_at desc`, [reportId]),
    pool.query(`select flag_id, reason, flagged_at, is_resolved
                from flagged_contents where report_id = $1 order by flagged_at desc`, [reportId]),
    pool.query(`select d.detection_id, d.similarity_score::float, d.detected_at,
                       r.report_id, r.title
                from duplicate_detections d
                join reports r on r.report_id = d.possible_duplicate_report_id
                where d.report_id = $1 order by d.similarity_score desc`, [reportId]),
  ]);
  return { report: report.rows[0], evidence: evidence.rows, reviews: reviews.rows, flags: flags.rows, duplicates: duplicates.rows };
}

export async function saveReview(reportId: string, userId: string, decision: string, notes: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const admin = await client.query<{ admin_id: string }>('select admin_id from admins where user_id = $1', [userId]);
    if (!admin.rows[0]) throw new Error('ADMIN_PROFILE_MISSING');
    const status = decision === 'request_evidence' ? 'pending_verification' : decision;
    const updated = await client.query('update reports set status = $1::report_status, updated_at = now() where report_id = $2 returning report_id', [status, reportId]);
    if (!updated.rows[0]) throw new Error('REPORT_NOT_FOUND');
    await client.query(`insert into admin_report_reviews (report_id, admin_id, decision, notes) values ($1, $2, $3::admin_review_decision, $4)`, [reportId, admin.rows[0].admin_id, decision, notes]);
    await client.query('update flagged_contents set is_resolved = true where report_id = $1', [reportId]);
    if (decision === 'verified') await client.query(`insert into cases (report_id, status) values ($1, 'verified') on conflict (report_id) do update set status = 'verified', updated_at = now()`, [reportId]);
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}
