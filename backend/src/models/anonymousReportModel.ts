import { pool } from './database.js';
import type { ReportScreeningResult } from '../services/reportScreeningService.js';

export interface NewAnonymousReport {
  title: string;
  description: string;
  category: string;
  incidentDateTime: string | null;
  district: string | null;
  address: string | null;
}

// Unambiguous alphabet (no 0/O, 1/I) so codes can be read aloud safely.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTrackingCode(): string {
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return `ANON-${suffix}`;
}

// Inserts an anonymous report. No user id, email, or IP is ever persisted.
export async function createAnonymousReport(report: NewAnonymousReport, screening: ReportScreeningResult) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    let inserted = null;
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      const result = await client.query(
        `insert into anonymous_reports
           (tracking_code, title, description, category, incident_datetime, district, address, status, duplicate_score)
         values ($1, $2, $3, $4::report_category, $5, $6, $7, $8::report_status, $9)
         on conflict (tracking_code) do nothing
         returning anonymous_report_id, tracking_code, title, category, status, submission_date`,
        [
          generateTrackingCode(),
          report.title,
          report.description,
          report.category,
          report.incidentDateTime,
          report.district,
          report.address,
          screening.status,
          screening.duplicateScore,
        ],
      );
      inserted = result.rows[0] ?? null;
    }
    if (!inserted) throw new Error('Could not generate a unique tracking code.');

    await client.query('commit');
    return inserted;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

// Public status lookup by tracking code (returns no identifying data — none is stored).
export async function findAnonymousReportByTrackingCode(trackingCode: string) {
  const result = await pool.query(
    `select tracking_code, title, category::text, status, district, submission_date, updated_at
     from anonymous_reports
     where tracking_code = $1`,
    [trackingCode],
  );
  return result.rows[0] ?? null;
}

// Admin: list anonymous submissions alongside the moderation workflow.
export async function listAnonymousReports() {
  const result = await pool.query(
    `select anonymous_report_id, tracking_code, title, description, category::text, status,
            district, duplicate_score, submission_date
     from anonymous_reports
     order by submission_date desc
     limit 100`,
  );
  return result.rows;
}
