import { pool } from './database.js';
import type { DuplicateCandidate, ReportScreeningResult } from '../services/reportScreeningService.js';

export interface NewReport {
  title: string;
  description: string;
  category: string;
  incidentDateTime: string | null;
  isAnonymous: boolean;
  district: string | null;
  address: string | null;
}

export async function findDuplicateCandidates(category: string, district: string | null): Promise<DuplicateCandidate[]> {
  const result = await pool.query(
    `select r.report_id, r.title, r.description, r.category::text, l.district
     from reports r
     left join locations l on l.location_id = r.location_id
     where r.status not in ('rejected', 'closed')
       and (r.category::text = $1 or ($2::text is not null and lower(l.district) = lower($2)))
     order by r.submission_date desc
     limit 100`,
    [category, district],
  );
  return result.rows.map((row) => ({
    reportId: row.report_id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    district: row.district as string | null,
  }));
}

export async function createReport(userId: string, report: NewReport, screening: ReportScreeningResult) {
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
      `insert into reports (citizen_id, location_id, title, description, category, incident_datetime, is_anonymous, status, duplicate_score)
       values ($1, $2, $3, $4, $5::report_category, $6, $7, $8::report_status, $9)
       returning report_id, title, category, status, is_anonymous, submission_date`,
      [citizenResult.rows[0].citizen_id, locationId, report.title, report.description, report.category, report.incidentDateTime, report.isAnonymous, screening.status, screening.duplicateScore],
    );

    const createdReportId = result.rows[0].report_id as string;
    for (const duplicate of screening.possibleDuplicates) {
      await client.query(
        `insert into duplicate_detections (report_id, possible_duplicate_report_id, similarity_score)
         values ($1, $2, $3)`,
        [createdReportId, duplicate.reportId, duplicate.score],
      );
    }
    for (const reason of screening.reasons) {
      await client.query(
        `insert into flagged_contents (target_type, target_id, report_id, reason)
         values ('report', $1, $1, $2)`,
        [createdReportId, reason],
      );
    }

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
