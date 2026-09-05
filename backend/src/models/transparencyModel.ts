import type { InstitutionMetric, InstitutionMetricInput } from '../services/institutionMetricsService.js';
import { calculateInstitutionMetric } from '../services/institutionMetricsService.js';
import { pool } from './database.js';

export async function getHeatmapAggregates(category: string | null, region: string | null, since: Date | null) {
  const result = await pool.query(
    `select l.district, r.category::text,
            count(*)::int as report_count,
            avg(l.latitude)::float as latitude,
            avg(l.longitude)::float as longitude,
            max(r.submission_date) as latest_report_at
       from reports r
       join locations l on l.location_id = r.location_id
      where r.status in ('verified', 'closed')
        and l.district is not null
        and ($1::text is null or r.category::text = $1)
        and ($2::text is null or lower(l.district) = lower($2))
        and ($3::timestamptz is null or r.submission_date >= $3)
      group by l.district, r.category
      order by report_count desc, l.district`,
    [category, region, since],
  );
  return result.rows.map((row) => ({
    district: row.district as string,
    category: row.category as string,
    reportCount: Number(row.report_count),
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    latestReportAt: new Date(row.latest_report_at).toISOString(),
  }));
}

export async function getInstitutionMetrics(): Promise<InstitutionMetric[]> {
  const result = await pool.query(
    `select i.institution_id, i.name, i.type, i.address,
            count(distinct r.report_id) filter (where r.status in ('verified', 'closed'))::int as verified_reports,
            count(distinct c.case_id)::int as total_cases,
            count(distinct c.case_id) filter (where c.status in ('action_taken', 'closed'))::int as actioned_cases,
            count(distinct c.case_id) filter (where c.status = 'closed')::int as closed_cases,
            avg(extract(epoch from (c.closed_at - c.opened_at)) / 86400.0)
              filter (where c.closed_at is not null)::float as average_resolution_days
       from institutions i
       left join reports r on r.institution_id = i.institution_id
       left join cases c on c.report_id = r.report_id
      group by i.institution_id
      order by i.name`,
  );
  return result.rows.map((row) => calculateInstitutionMetric({
    institutionId: row.institution_id as string,
    name: row.name as string,
    type: row.type as string | null,
    address: row.address as string | null,
    verifiedReports: Number(row.verified_reports),
    totalCases: Number(row.total_cases),
    actionedCases: Number(row.actioned_cases),
    closedCases: Number(row.closed_cases),
    averageResolutionDays: row.average_resolution_days === null ? null : Number(row.average_resolution_days),
  } satisfies InstitutionMetricInput));
}

export async function createInstitution(name: string, type: string | null, address: string | null) {
  const result = await pool.query(
    `insert into institutions (name, type, address) values ($1, $2, $3)
     on conflict (lower(name)) do update set type = excluded.type, address = excluded.address
     returning institution_id, name, type, address`,
    [name, type, address],
  );
  return result.rows[0];
}

export async function assignReportToInstitution(reportId: string, institutionId: string) {
  const result = await pool.query(
    `update reports set institution_id = $2, updated_at = now()
      where report_id::text = $1 or reference_no = upper($1) returning report_id, reference_no, institution_id`,
    [reportId, institutionId],
  );
  return result.rows[0] ?? null;
}

export async function updateCaseOutcome(caseOrReportId: string, status: string, resolutionNotes: string, closedAt: Date | null) {
  const result = await pool.query(
    `update cases c
        set status = $2::case_status,
            resolution_notes = $3,
            closed_at = case when $2 = 'closed' then $4::timestamptz else null end,
            updated_at = now()
       from reports r
      where c.report_id = r.report_id
        and (c.case_id::text = $1 or c.reference_no = upper($1) or r.report_id::text = $1 or r.reference_no = upper($1))
      returning c.case_id, c.report_id, c.status, c.opened_at, c.closed_at, c.resolution_notes, r.institution_id`,
    [caseOrReportId, status, resolutionNotes, closedAt],
  );
  return result.rows[0] ?? null;
}

export async function persistInstitutionMetrics(metrics: InstitutionMetric[]) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const metric of metrics) {
      const notes = JSON.stringify({
        actionTakenRate: metric.actionTakenRate,
        averageResolutionDays: metric.averageResolutionDays,
        verifiedReports: metric.verifiedReports,
        redFlagScore: metric.redFlagScore,
      });
      await client.query('update institutions set trust_score = $2, red_flag_score = $3 where institution_id = $1', [metric.institutionId, metric.trustScore, metric.redFlagScore]);
      await client.query('insert into trust_scores (institution_id, score, metric_notes) values ($1, $2, $3)', [metric.institutionId, metric.trustScore, notes]);
    }
    await client.query('commit');
    return metrics.length;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally { client.release(); }
}

export async function listFameShame(type: string | null, includePending = false) {
  const result = await pool.query(
    `select fs.record_id, fs.type, fs.name, fs.description, fs.date_added, fs.is_approved, fs.review_status,
            fs.institution_id, i.name as institution_name, fs.case_id
       from fame_shame_records fs
       left join institutions i on i.institution_id = fs.institution_id
      where ($1::text is null or fs.type = $1)
        and ($2::boolean or fs.review_status = 'approved')
      order by (fs.review_status = 'pending') desc, fs.date_added desc
      limit 200`,
    [type, includePending],
  );
  return result.rows;
}

export async function createFameShameRecord(type: 'fame' | 'shame', name: string, description: string, institutionId: string | null, caseId: string | null) {
  const result = await pool.query(
    `insert into fame_shame_records (type, name, description, institution_id, case_id)
     values ($1, $2, $3, $4, (select case_id from cases where case_id::text = $5 or reference_no = upper($5)))
     returning record_id, type, name, description, institution_id, case_id, date_added, is_approved`,
    [type, name, description, institutionId, caseId],
  );
  return result.rows[0];
}

export async function reviewFameShameRecord(recordId: string, adminUserId: string, approved: boolean) {
  const result = await pool.query(
    `update fame_shame_records fs
        set is_approved = $2,
            review_status = case when $2 then 'approved' else 'rejected' end,
            reviewed_at = now(), reviewed_by_admin_id = a.admin_id
       from admins a
      where fs.record_id = $1 and a.user_id = $3
      returning fs.record_id, fs.is_approved`,
    [recordId, approved, adminUserId],
  );
  return result.rows[0] ?? null;
}

export async function listImpactStories(outcomeType: string | null, limit = 50) {
  const result = await pool.query(
    `select s.story_id, s.title, s.description, s.date_added, s.outcome_type, s.public_slug, s.share_count,
            case when s.is_anonymous then null else r.reference_no end as report_reference,
            c.reference_no as case_reference,
            i.name as institution_name
       from impact_stories s
       left join reports r on r.report_id = s.report_id
       left join cases c on c.case_id = s.case_id
       left join institutions i on i.institution_id = s.institution_id
      where s.review_status = 'approved'
        and ($1::text is null or s.outcome_type = $1)
      order by s.date_added desc
      limit $2`,
    [outcomeType, limit],
  );
  return result.rows;
}

export async function getImpactStoryBySlug(slug: string) {
  const result = await pool.query(
    `select s.story_id, s.title, s.description, s.date_added, s.outcome_type, s.public_slug, s.share_count,
            case when s.is_anonymous then null else r.reference_no end as report_reference,
            c.reference_no as case_reference,
            i.name as institution_name
       from impact_stories s
       left join reports r on r.report_id = s.report_id
       left join cases c on c.case_id = s.case_id
       left join institutions i on i.institution_id = s.institution_id
      where s.review_status = 'approved' and s.public_slug = $1`,
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function incrementShareCount(slug: string) {
  const result = await pool.query(
    `update impact_stories set share_count = share_count + 1 where public_slug = $1 and review_status = 'approved' returning share_count`,
    [slug],
  );
  return result.rows[0]?.share_count ?? null;
}

export async function listAdminImpactStories() {
  const result = await pool.query(
    `select s.story_id, s.title, s.description, s.date_added, s.outcome_type, s.public_slug, s.share_count, s.review_status, s.is_anonymous,
            r.reference_no as report_reference,
            c.reference_no as case_reference,
            i.name as institution_name
       from impact_stories s
       left join reports r on r.report_id = s.report_id
       left join cases c on c.case_id = s.case_id
       left join institutions i on i.institution_id = s.institution_id
      order by (s.review_status = 'pending') desc, s.date_added desc
      limit 200`,
  );
  return result.rows;
}

export async function createImpactStory(title: string, description: string, outcomeType: string, isAnonymous: boolean, reportId: string | null, caseId: string | null, institutionId: string | null) {
  const slug = Math.random().toString(36).substring(2, 12).toLowerCase();
  
  const result = await pool.query(
    `insert into impact_stories (title, description, outcome_type, is_anonymous, report_id, case_id, institution_id, public_slug)
     values ($1, $2, $3, $4, 
       (select report_id from reports where report_id::text = $5 or reference_no = upper($5)), 
       (select case_id from cases where case_id::text = $6 or reference_no = upper($6)), 
       $7, $8)
     returning story_id, title, public_slug`,
    [title, description, outcomeType, isAnonymous, reportId, caseId, institutionId, slug],
  );
  return result.rows[0];
}

export async function reviewImpactStory(storyId: string, adminUserId: string, approved: boolean) {
  const result = await pool.query(
    `update impact_stories s
        set review_status = case when $2 then 'approved' else 'rejected' end,
            approved_at = case when $2 then now() else null end,
            approved_by_admin_id = a.admin_id
       from admins a
      where s.story_id = $1 and a.user_id = $3
      returning s.story_id, s.review_status`,
    [storyId, approved, adminUserId],
  );
  return result.rows[0] ?? null;
}
