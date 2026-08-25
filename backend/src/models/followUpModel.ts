import type { PoolClient } from 'pg';
import { pool } from './database.js';

interface AccessRow { case_id: string; report_id: string; case_reference: string; report_reference: string; role: string; citizen_id: string | null; ngo_partner_id: string | null; admin_id: string | null }

async function findCaseAccess(client: PoolClient, caseOrReportId: string, userId: string): Promise<AccessRow | null> {
  const result = await client.query<AccessRow>(
    `select c.case_id, r.report_id, c.reference_no as case_reference, r.reference_no as report_reference, u.role::text,
            owner.citizen_id,
            assigned_ngo.ngo_partner_id,
            acting_admin.admin_id
       from cases c
       join reports r on r.report_id = c.report_id
       join app_users u on u.user_id = $2
       left join citizens owner on owner.citizen_id = r.citizen_id and owner.user_id = $2
       left join ngo_partners assigned_ngo on assigned_ngo.ngo_partner_id = c.assigned_ngo_partner_id and assigned_ngo.user_id = $2
       left join government_officers assigned_officer on assigned_officer.officer_id = c.assigned_officer_id and assigned_officer.user_id = $2
       left join admins acting_admin on acting_admin.user_id = $2
      where (c.case_id::text = $1 or c.reference_no = upper($1) or r.report_id::text = $1 or r.reference_no = upper($1))
        and (u.role = 'admin' or owner.citizen_id is not null or assigned_ngo.ngo_partner_id is not null or assigned_officer.officer_id is not null)`,
    [caseOrReportId, userId],
  );
  return result.rows[0] ?? null;
}

export async function listCaseFollowUps(caseOrReportId: string, userId: string) {
  const client = await pool.connect();
  try {
    const access = await findCaseAccess(client, caseOrReportId, userId);
    if (!access) return null;
    const result = await client.query(
      `with recursive thread as (
         select f.follow_up_id, f.parent_follow_up_id, f.case_id, f.details, f.has_new_evidence,
                f.follow_up_date, f.updated_at, 0 as depth,
                array[f.follow_up_id::text] as path
           from follow_up_reports f
          where f.case_id = $1 and f.parent_follow_up_id is null
         union all
         select child.follow_up_id, child.parent_follow_up_id, child.case_id, child.details, child.has_new_evidence,
                child.follow_up_date, child.updated_at, parent.depth + 1,
                parent.path || child.follow_up_id::text
           from follow_up_reports child
           join thread parent on parent.follow_up_id = child.parent_follow_up_id
          where child.case_id = $1
       )
       select t.*, coalesce(cu.full_name, nu.full_name, au.full_name, 'Former participant') as author_name,
              case
                when f.citizen_id is not null then 'citizen'
                when f.ngo_partner_id is not null then 'ngo_partner'
                when f.admin_id is not null then 'admin'
                else 'former_participant'
              end as author_role
         from thread t
         join follow_up_reports f on f.follow_up_id = t.follow_up_id
         left join citizens c on c.citizen_id = f.citizen_id
         left join app_users cu on cu.user_id = c.user_id
         left join ngo_partners n on n.ngo_partner_id = f.ngo_partner_id
         left join app_users nu on nu.user_id = n.user_id
         left join admins a on a.admin_id = f.admin_id
         left join app_users au on au.user_id = a.user_id
        order by t.path`,
      [access.case_id],
    );
    return {
      caseId: access.case_id,
      reportId: access.report_id,
      caseReference: access.case_reference,
      reportReference: access.report_reference,
      access: { role: access.role, canPost: Boolean(access.citizen_id || access.ngo_partner_id || access.admin_id) },
      followUps: result.rows,
    };
  } finally { client.release(); }
}

export async function createCaseFollowUp(userId: string, caseOrReportId: string, details: string, hasNewEvidence: boolean, parentFollowUpId: string | null) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const access = await findCaseAccess(client, caseOrReportId, userId);
    if (!access) throw new Error('CASE_ACCESS_DENIED');
    if (!access.citizen_id && !access.ngo_partner_id && !access.admin_id) throw new Error('FOLLOW_UP_ROLE_DENIED');
    if (parentFollowUpId) {
      const parent = await client.query('select 1 from follow_up_reports where follow_up_id = $1 and case_id = $2', [parentFollowUpId, access.case_id]);
      if (!parent.rows[0]) throw new Error('INVALID_PARENT_FOLLOW_UP');
    }
    const result = await client.query(
      `insert into follow_up_reports (case_id, citizen_id, ngo_partner_id, admin_id, parent_follow_up_id, details, has_new_evidence)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning follow_up_id, parent_follow_up_id, case_id, details, has_new_evidence, follow_up_date, updated_at`,
      [access.case_id, access.citizen_id, access.ngo_partner_id, access.admin_id, parentFollowUpId, details, hasNewEvidence],
    );
    await client.query('commit');
    return result.rows[0];
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally { client.release(); }
}
