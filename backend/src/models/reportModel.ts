import { pool } from './database.js';

export interface NewReport {
  title: string;
  description: string;
  category: string;
  incidentDateTime: string | null;
  isAnonymous: boolean;
  district: string | null;
  address: string | null;
}

export async function createReport(userId: string, report: NewReport) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const citizenResult = await client.query(
      'select citizen_id from citizens where user_id = $1',
      [userId],
    );
    if (!citizenResult.rows[0]) throw new Error('A citizen profile is required to submit reports.');

    let locationId: string | null = null;
    if (report.address || report.district) {
      const locationResult = await client.query(
        `insert into locations (address, district)
         values ($1, $2)
         returning location_id`,
        [report.address, report.district],
      );
      locationId = locationResult.rows[0].location_id as string;
    }

    const result = await client.query(
      `insert into reports (citizen_id, location_id, title, description, category, incident_datetime, is_anonymous, status)
       values ($1, $2, $3, $4, $5::report_category, $6, $7, 'submitted')
       returning report_id, title, category, status, is_anonymous, submission_date`,
      [citizenResult.rows[0].citizen_id, locationId, report.title, report.description, report.category, report.incidentDateTime, report.isAnonymous],
    );

    await client.query('commit');
    return result.rows[0];
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function listReports() {
  const result = await pool.query(
    `select report_id, title, description, category, status, is_anonymous, submission_date
     from reports
     order by submission_date desc`,
  );
  return result.rows;
}

export async function listReportsByUser(userId: string) {
  const result = await pool.query(
    `select r.report_id, r.title, r.description, r.category, r.status, r.is_anonymous,
            r.incident_datetime, r.submission_date, r.updated_at
     from reports r
     join citizens c on c.citizen_id = r.citizen_id
     where c.user_id = $1
     order by r.submission_date desc`,
    [userId],
  );
  return result.rows;
}
