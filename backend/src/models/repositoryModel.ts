import { pool } from './database.js';
import { redactPublicText } from '../services/publicRedactionService.js';

export interface PublicReportsFilterOptions { query?: string | undefined; category?: string | undefined; district?: string | undefined; caseStatus?: string | undefined }
export interface PublicReportsSortOptions { sortBy?: string | undefined; sortOrder?: string | undefined }
export interface PublicReportsPaginationOptions { page?: number | undefined; limit?: number | undefined }

export async function getPublicReports(filters: PublicReportsFilterOptions, sort: PublicReportsSortOptions, pagination: PublicReportsPaginationOptions) {
  const where = [`r.is_public = true`, `r.status in ('verified', 'closed')`];
  const params: unknown[] = [];
  const add = (clause: string, value: unknown) => { params.push(value); where.push(clause.replace('?', `$${params.length}`)); };
  if (filters.query?.trim()) {
    params.push(`%${filters.query.trim()}%`);
    const index = params.length;
    where.push(`(r.reference_no ilike $${index} or c.reference_no ilike $${index}
      or coalesce(r.public_summary, '') ilike $${index} or coalesce(r.victim_context, '') ilike $${index}
      or array_to_string(r.public_keywords, ' ') ilike $${index} or r.category::text ilike $${index}
      or coalesce(l.district, '') ilike $${index} or coalesce(l.division, '') ilike $${index}
      or coalesce(i.name, '') ilike $${index})`);
  }
  if (filters.category && filters.category.toLowerCase() !== 'all') add('r.category::text = ?', filters.category.trim().toLowerCase());
  if (filters.district && filters.district.toLowerCase() !== 'all') add('lower(l.district) = lower(?)', filters.district.trim());
  if (filters.caseStatus && filters.caseStatus.toLowerCase() !== 'all') add('c.status::text = ?', filters.caseStatus.trim().toLowerCase());
  const sortColumn = sort.sortBy === 'name' ? 'r.category::text' : 'r.submission_date';
  const direction = sort.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
  const limit = Math.min(50, Math.max(1, pagination.limit ?? 15));
  const page = Math.max(1, pagination.page ?? 1);
  params.push(limit, (page - 1) * limit);
  const result = await pool.query(
    `select r.reference_no as report_reference, c.reference_no as case_reference,
            r.public_summary, r.victim_context, r.public_keywords,
            r.category::text, r.status::text, r.submission_date,
            l.district, l.division, i.name as institution_name, c.status::text as case_status,
            count(w.contribution_id) filter (where w.status = 'accepted')::int as corroborating_witnesses,
            count(*) over()::int as full_count
       from reports r
       left join cases c on c.report_id = r.report_id
       left join locations l on l.location_id = r.location_id
       left join institutions i on i.institution_id = r.institution_id
       left join witness_contributions w on w.report_id = r.report_id
      where ${where.join(' and ')}
      group by r.report_id, c.case_id, l.location_id, i.institution_id
      order by ${sortColumn} ${direction}
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );
  return {
    totalCount: result.rows[0]?.full_count ?? 0,
    reports: result.rows.map((row) => ({
      report_reference: row.report_reference,
      case_reference: row.case_reference,
      title: `${String(row.category).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())} Incident Alert`,
      summary: redactPublicText(row.public_summary || 'A verified incident has been published for community awareness.'),
      victim_context: redactPublicText(row.victim_context, 300),
      keywords: row.public_keywords,
      category: row.category,
      status: row.status,
      submission_date: row.submission_date,
      district: row.district,
      division: row.division,
      institution_name: row.institution_name,
      case_status: row.case_status,
      corroborating_witnesses: row.corroborating_witnesses,
    })),
  };
}
