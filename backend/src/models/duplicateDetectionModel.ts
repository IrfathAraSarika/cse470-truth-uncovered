import { pool } from './database.js';
import type { ReportCandidate, TargetReport } from '../services/duplicateDetectionService.js';

export async function fetchTargetReport(reportId: string): Promise<TargetReport | null> {
  const result = await pool.query(
    `select r.report_id as "reportId", r.title, r.description, r.category::text, r.incident_datetime as "incidentDateTime",
            l.district, l.latitude, l.longitude
     from reports r
     left join locations l on l.location_id = r.location_id
     where r.report_id = $1`,
    [reportId],
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    reportId: row.reportId as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    district: row.district as string | null,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    incidentDateTime: row.incidentDateTime ? new Date(row.incidentDateTime).toISOString() : null,
  };
}

export async function fetchDuplicateCandidatesPool(category: string, district?: string | null): Promise<ReportCandidate[]> {
  const result = await pool.query(
    `select r.report_id as "reportId", r.title, r.description, r.category::text, r.submission_date as "submissionDate",
            l.district, l.latitude, l.longitude
     from reports r
     left join locations l on l.location_id = r.location_id
     where r.status not in ('rejected', 'closed')
       and (r.category::text = $1 or ($2::text is not null and lower(l.district) = lower($2)))
     order by r.submission_date desc
     limit 200`,
    [category, district || null],
  );

  return result.rows.map((row) => ({
    reportId: row.reportId as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    district: row.district as string | null,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    submissionDate: row.submissionDate ? new Date(row.submissionDate).toISOString() : null,
  }));
}

export async function getDuplicateDetectionQueue() {
  const result = await pool.query(
    `select d.detection_id, d.report_id, d.possible_duplicate_report_id, d.similarity_score, d.detected_at,
            r1.title as report_title, r1.category as report_category, r1.status as report_status,
            r2.title as duplicate_title, r2.category as duplicate_category, r2.status as duplicate_status
     from duplicate_detections d
     join reports r1 on r1.report_id = d.report_id
     join reports r2 on r2.report_id = d.possible_duplicate_report_id
     order by d.similarity_score desc, d.detected_at desc
     limit 100`,
  );
  return result.rows;
}

export async function saveDuplicateDetectionRecord(reportId: string, possibleDuplicateReportId: string, similarityScore: number) {
  await pool.query(
    `insert into duplicate_detections (report_id, possible_duplicate_report_id, similarity_score)
     values ($1, $2, $3)
     on conflict do nothing`,
    [reportId, possibleDuplicateReportId, similarityScore],
  );
}

export async function resolveDuplicatePair(detectionId: string, action: 'merge' | 'dismiss') {
  if (action === 'merge') {
    const det = await pool.query('select report_id from duplicate_detections where detection_id = $1', [detectionId]);
    if (det.rows[0]) {
      await pool.query("update reports set status = 'hidden', updated_at = now() where report_id = $1", [det.rows[0].report_id]);
    }
  }
  await pool.query('delete from duplicate_detections where detection_id = $1', [detectionId]);
  return { success: true, action };
}
