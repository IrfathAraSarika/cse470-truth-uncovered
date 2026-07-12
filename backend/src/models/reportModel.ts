import { pool } from './database.js';

export interface NewReport { citizenId: string; title: string; description: string; category: string; incidentDateTime: string | null; isAnonymous: boolean }

export async function createReport(report: NewReport) {
  const result = await pool.query(
    `insert into reports (citizen_id, title, description, category, incident_datetime, is_anonymous, status)
     values ($1, $2, $3, $4::report_category, $5, $6, 'submitted')
     returning report_id, title, category, status, is_anonymous, submission_date`,
    [report.citizenId, report.title, report.description, report.category, report.incidentDateTime, report.isAnonymous],
  );
  return result.rows[0];
}

export async function listReports() {
  const result = await pool.query(`select report_id, title, description, category, status, is_anonymous, submission_date from reports order by submission_date desc`);
  return result.rows;
}

export async function listReportsByCitizen(citizenId: string) {
  const result = await pool.query(
    `select report_id, title, description, category, status, is_anonymous, incident_datetime, submission_date, updated_at
     from reports
     where citizen_id = $1
     order by submission_date desc`,
    [citizenId],
  );
  return result.rows;
}
