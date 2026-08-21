import { pool } from './database.js';

export interface PublicReportItem {
  report_id: string;
  title: string;
  category: string;
  status: string;
  submission_date: string;
  district: string | null;
  division: string | null;
  institution_name: string | null;
  case_id: string | null;
  case_status: string | null;
  description: string;
}

export interface PublicReportsFilterOptions {
  category?: string | undefined;
  district?: string | undefined;
  caseStatus?: string | undefined;
}

export interface PublicReportsSortOptions {
  sortBy?: string | undefined; // 'time' | 'name'
  sortOrder?: string | undefined; // 'asc' | 'desc'
}

export interface PublicReportsPaginationOptions {
  page?: number | undefined;
  limit?: number | undefined;
}

export interface PublicReportsResult {
  reports: PublicReportItem[];
  totalCount: number;
}

export async function getPublicReports(
  filters: PublicReportsFilterOptions,
  sort: PublicReportsSortOptions,
  pagination: PublicReportsPaginationOptions
): Promise<PublicReportsResult> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.category && filters.category.trim() && filters.category.toLowerCase() !== 'all') {
    whereClauses.push(`prd.category::text ILIKE $${paramIndex}`);
    params.push(filters.category.trim());
    paramIndex++;
  }

  if (filters.district && filters.district.trim() && filters.district.toLowerCase() !== 'all') {
    whereClauses.push(`prd.district ILIKE $${paramIndex}`);
    params.push(`%${filters.district.trim()}%`);
    paramIndex++;
  }

  if (filters.caseStatus && filters.caseStatus.trim() && filters.caseStatus.toLowerCase() !== 'all') {
    whereClauses.push(`prd.case_status::text ILIKE $${paramIndex}`);
    params.push(filters.caseStatus.trim());
    paramIndex++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Validate sort column and direction to avoid SQL injection
  let sortColumn = 'prd.submission_date';
  if (sort.sortBy === 'name') {
    sortColumn = 'prd.title';
  }

  const sortDirection = sort.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const limit = pagination.limit && pagination.limit > 0 ? pagination.limit : 15;
  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const offset = (page - 1) * limit;

  // Query matching records and total count using COUNT(*) OVER()
  const query = `
    SELECT 
      prd.report_id,
      prd.title,
      prd.category::text AS category,
      prd.status::text AS status,
      prd.submission_date,
      prd.district,
      prd.division,
      prd.institution_name,
      prd.case_id,
      prd.case_status::text AS case_status,
      r.description,
      COUNT(*) OVER()::int AS full_count
    FROM public_report_directory prd
    JOIN reports r ON prd.report_id = r.report_id
    ${whereSql}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const result = await pool.query(query, params);

  const totalCount = result.rows.length > 0 ? result.rows[0].full_count : 0;
  const reports: PublicReportItem[] = result.rows.map((row) => ({
    report_id: row.report_id,
    title: row.title,
    category: row.category,
    status: row.status,
    submission_date: row.submission_date,
    district: row.district,
    division: row.division,
    institution_name: row.institution_name,
    case_id: row.case_id,
    case_status: row.case_status,
    description: row.description,
  }));

  return { reports, totalCount };
}
