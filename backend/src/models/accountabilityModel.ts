import { pool } from './database.js';

export async function getCitizenId(userId: string) {
  return (await pool.query('select citizen_id from citizens where user_id = $1', [userId])).rows[0]?.citizen_id as string | undefined;
}

export async function resolveOwnedCase(reference: string, userId: string) {
  return (await pool.query(
    `select c.case_id, c.reference_no, c.status::text, r.report_id, r.reference_no as report_reference
       from cases c join reports r on r.report_id = c.report_id join citizens z on z.citizen_id = r.citizen_id
      where z.user_id = $2 and (c.case_id::text = $1 or c.reference_no = upper($1) or r.report_id::text = $1 or r.reference_no = upper($1))`,
    [reference, userId],
  )).rows[0] ?? null;
}

export async function listMySafetyCheckIns(userId: string) {
  return (await pool.query(
    `select s.check_in_id, s.scheduled_for, s.status, s.private_message, s.emergency_requested,
            s.resolution_note, s.responded_at, s.resolved_at, c.reference_no as case_reference
       from safety_check_ins s join citizens z on z.citizen_id = s.citizen_id
       left join cases c on c.case_id = s.case_id where z.user_id = $1 order by s.scheduled_for desc`, [userId],
  )).rows;
}

export async function createSafetyCheckIn(userId: string, caseId: string | null, scheduledFor: Date, privateMessage: string) {
  const citizenId = await getCitizenId(userId); if (!citizenId) throw new Error('CITIZEN_REQUIRED');
  return (await pool.query(
    `insert into safety_check_ins (citizen_id, case_id, scheduled_for, private_message) values ($1, $2, $3, $4)
     returning check_in_id, scheduled_for, status`, [citizenId, caseId, scheduledFor, privateMessage || null],
  )).rows[0];
}

export async function respondSafetyCheckIn(userId: string, checkInId: string, status: 'safe' | 'needs_help', privateMessage: string) {
  return (await pool.query(
    `update safety_check_ins s set status = $3::varchar, private_message = $4, emergency_requested = ($3::varchar = 'needs_help'), responded_at = now(), updated_at = now()
      from citizens z where s.citizen_id = z.citizen_id and z.user_id = $1 and s.check_in_id = $2 and s.status in ('scheduled', 'missed', 'needs_help')
      returning s.check_in_id, s.status, s.emergency_requested`, [userId, checkInId, status, privateMessage || null],
  )).rows[0] ?? null;
}

export async function listAdminSafetyCheckIns() {
  await pool.query(`update safety_check_ins set status = 'missed', updated_at = now() where status = 'scheduled' and scheduled_for < now()`);
  return (await pool.query(
    `select s.check_in_id, s.scheduled_for, s.status, s.private_message, s.emergency_requested, s.created_at,
            c.reference_no as case_reference, u.full_name as citizen_name
       from safety_check_ins s join citizens z on z.citizen_id = s.citizen_id join app_users u on u.user_id = z.user_id
       left join cases c on c.case_id = s.case_id order by s.emergency_requested desc, (s.status = 'missed') desc, s.scheduled_for`,
  )).rows;
}

export async function resolveSafetyCheckIn(adminUserId: string, checkInId: string, resolutionNote: string) {
  return (await pool.query(
    `update safety_check_ins s set status = 'resolved', emergency_requested = false, resolution_note = $3,
            resolved_by_admin_id = a.admin_id, resolved_at = now(), updated_at = now()
       from admins a where a.user_id = $1 and s.check_in_id = $2 returning s.check_in_id, s.status`,
    [adminUserId, checkInId, resolutionNote],
  )).rows[0] ?? null;
}

export async function listMyAppeals(userId: string) {
  return (await pool.query(
    `select a.reference_no, a.reason, a.requested_outcome, a.status, a.admin_notes, a.created_at, a.reviewed_at,
            c.reference_no as case_reference from case_appeals a join citizens z on z.citizen_id = a.citizen_id
       join cases c on c.case_id = a.case_id where z.user_id = $1 order by a.created_at desc`, [userId],
  )).rows;
}

export async function createAppeal(userId: string, caseId: string, reason: string, requestedOutcome: string) {
  const citizenId = await getCitizenId(userId); if (!citizenId) throw new Error('CITIZEN_REQUIRED');
  return (await pool.query(
    `insert into case_appeals (case_id, citizen_id, reason, requested_outcome) values ($1, $2, $3, $4)
     returning appeal_id, reference_no, status, created_at`, [caseId, citizenId, reason, requestedOutcome],
  )).rows[0];
}

export async function listAdminAppeals() {
  return (await pool.query(
    `select a.appeal_id, a.reference_no, a.reason, a.requested_outcome, a.status, a.admin_notes, a.created_at,
            c.reference_no as case_reference, r.reference_no as report_reference, u.full_name as citizen_name
       from case_appeals a join cases c on c.case_id = a.case_id join reports r on r.report_id = c.report_id
       join citizens z on z.citizen_id = a.citizen_id join app_users u on u.user_id = z.user_id
      order by (a.status = 'submitted') desc, a.created_at desc`,
  )).rows;
}

export async function reviewAppeal(adminUserId: string, appealId: string, status: string, adminNotes: string) {
  return (await pool.query(
    `update case_appeals a set status = $3, admin_notes = $4, reviewed_by_admin_id = ad.admin_id,
            reviewed_at = now(), updated_at = now() from admins ad
      where ad.user_id = $1 and a.appeal_id = $2 and a.status in ('submitted', 'under_review')
      returning a.appeal_id, a.reference_no, a.status`, [adminUserId, appealId, status, adminNotes],
  )).rows[0] ?? null;
}

export async function listSubscriptions(userId: string) {
  return (await pool.query(`select subscription_id, district, category::text, channel::text, frequency, is_active from regional_alert_subscriptions where user_id = $1 order by created_at desc`, [userId])).rows;
}

export async function createSubscription(userId: string, district: string, category: string | null, channel: string, frequency: string) {
  return (await pool.query(
    `insert into regional_alert_subscriptions (user_id, district, category, channel, frequency) values ($1, $2, $3::report_category, $4::notification_channel, $5)
     on conflict (user_id, district, category, channel) do update set frequency = excluded.frequency, is_active = true, updated_at = now()
     returning subscription_id, district, category::text, channel::text, frequency, is_active`,
    [userId, district, category, channel, frequency],
  )).rows[0];
}

export async function deleteSubscription(userId: string, subscriptionId: string) {
  return Boolean((await pool.query('delete from regional_alert_subscriptions where user_id = $1 and subscription_id = $2 returning subscription_id', [userId, subscriptionId])).rows[0]);
}

export async function listMyRegionalNotifications(userId: string) {
  return (await pool.query(`select notification_id, message, is_read, created_at from notifications where user_id = $1 and type = 'regional_alert' order by created_at desc limit 100`, [userId])).rows;
}

export async function markRegionalNotificationRead(userId: string, notificationId: string) {
  return Boolean((await pool.query(`update notifications set is_read = true where user_id = $1 and notification_id = $2 and type = 'regional_alert' returning notification_id`, [userId, notificationId])).rows[0]);
}

export async function resolveWitnessReport(reference: string) {
  return (await pool.query(`select report_id, reference_no from reports where status in ('verified', 'closed') and (report_id::text = $1 or reference_no = upper($1))`, [reference])).rows[0] ?? null;
}

export async function createWitnessContribution(userId: string, reportId: string, relationship: string, statement: string, evidenceUrl: string | null, consent: boolean) {
  const citizenId = await getCitizenId(userId); if (!citizenId) throw new Error('CITIZEN_REQUIRED');
  const ownReport = await pool.query('select 1 from reports where report_id = $1 and citizen_id = $2', [reportId, citizenId]);
  if (ownReport.rows[0]) throw new Error('OWNER_CANNOT_WITNESS');
  return (await pool.query(
    `insert into witness_contributions (report_id, citizen_id, relationship_to_incident, statement, evidence_url, consent_to_contact)
     values ($1, $2, $3, $4, $5, $6) returning contribution_id, reference_no, status, created_at`,
    [reportId, citizenId, relationship, statement, evidenceUrl, consent],
  )).rows[0];
}

export async function listMyWitnessContributions(userId: string) {
  return (await pool.query(
    `select w.reference_no, w.relationship_to_incident, w.status, w.admin_notes, w.created_at, r.reference_no as report_reference
       from witness_contributions w join citizens z on z.citizen_id = w.citizen_id join reports r on r.report_id = w.report_id
      where z.user_id = $1 order by w.created_at desc`, [userId],
  )).rows;
}

export async function listAdminWitnessContributions() {
  return (await pool.query(
    `select w.contribution_id, w.reference_no, w.relationship_to_incident, w.statement, w.evidence_url,
            w.consent_to_contact, w.status, w.created_at, r.reference_no as report_reference, u.full_name as witness_name
       from witness_contributions w join reports r on r.report_id = w.report_id
       join citizens z on z.citizen_id = w.citizen_id join app_users u on u.user_id = z.user_id
      order by (w.status = 'submitted') desc, w.created_at desc`,
  )).rows;
}

export async function reviewWitnessContribution(adminUserId: string, contributionId: string, status: string, adminNotes: string) {
  return (await pool.query(
    `update witness_contributions w set status = $3, admin_notes = $4, reviewed_by_admin_id = a.admin_id, reviewed_at = now()
       from admins a where a.user_id = $1 and w.contribution_id = $2 returning w.contribution_id, w.reference_no, w.status`,
    [adminUserId, contributionId, status, adminNotes],
  )).rows[0] ?? null;
}

export async function publishReportMetadata(reportReference: string, summary: string, victimContext: string, keywords: string[], isPublic: boolean) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const report = (await client.query(
      `update reports set public_summary = $2, victim_context = $3, public_keywords = $4, is_public = $5, updated_at = now()
        where report_id::text = $1 or reference_no = upper($1)
        returning report_id, reference_no, category::text`, [reportReference, summary, victimContext || null, keywords, isPublic],
    )).rows[0];
    if (!report) { await client.query('rollback'); return null; }
    if (isPublic) {
      await client.query(
        `insert into notifications (user_id, report_id, type, channel, message)
         select s.user_id, r.report_id, 'regional_alert', 'in_app',
                'Verified ' || replace(r.category::text, '_', ' ') || ' alert in ' || l.district || ': ' || r.reference_no
           from reports r join locations l on l.location_id = r.location_id
           join regional_alert_subscriptions s on s.is_active and lower(s.district) = lower(l.district)
                and (s.category is null or s.category = r.category)
          where r.report_id = $1 and not exists (
            select 1 from notifications n where n.user_id = s.user_id and n.report_id = r.report_id and n.type = 'regional_alert'
          )`, [report.report_id],
      );
    }
    await client.query('commit'); return report;
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}

export async function listInstitutionNotifications() {
  return (await pool.query(
    `select n.*, r.reference_no as report_reference, c.reference_no as case_reference, i.name as institution_name
       from institution_notifications n left join reports r on r.report_id = n.report_id
       left join cases c on c.case_id = n.case_id left join institutions i on i.institution_id = n.institution_id
      order by n.created_at desc`,
  )).rows;
}

export async function createInstitutionNotification(adminUserId: string, reference: string, data: Record<string, string | null>) {
  const target = (await pool.query(
    `select r.report_id, c.case_id, r.institution_id from reports r left join cases c on c.report_id = r.report_id
      where r.report_id::text = $1 or r.reference_no = upper($1) or c.case_id::text = $1 or c.reference_no = upper($1)`, [reference],
  )).rows[0];
  if (!target) return null;
  return (await pool.query(
    `insert into institution_notifications (institution_id, report_id, case_id, office_name, website_url, contact_email, subject, public_message, method, sent_by_admin_id)
     select $2, $3, $4, $5, $6, $7, $8, $9, $10, a.admin_id from admins a where a.user_id = $1 returning *`,
    [adminUserId, target.institution_id, target.report_id, target.case_id, data.officeName, data.websiteUrl, data.contactEmail, data.subject, data.publicMessage, data.method],
  )).rows[0] ?? null;
}

export async function updateInstitutionNotification(adminUserId: string, notificationId: string, status: string, externalReference: string | null) {
  return (await pool.query(
    `update institution_notifications n set status = $3::varchar, external_reference = $4,
            sent_at = case when $3::varchar in ('sent', 'acknowledged') then coalesce(n.sent_at, now()) else n.sent_at end, updated_at = now()
       from admins a where a.user_id = $1 and n.notification_id = $2 returning n.*`,
    [adminUserId, notificationId, status, externalReference],
  )).rows[0] ?? null;
}
