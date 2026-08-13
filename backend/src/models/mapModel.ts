import { pool } from './database.js';

export interface DBMapIncident {
  reportId: string;
  title: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export async function getMapIncidents(): Promise<DBMapIncident[]> {
  const result = await pool.query(
    `SELECT 
       r.report_id AS "reportId",
       r.title AS "title",
       r.status::text AS "status",
       l.latitude::double precision AS "latitude",
       l.longitude::double precision AS "longitude",
       l.address AS "address"
     FROM reports r
     JOIN locations l ON r.location_id = l.location_id
     WHERE r.status IN ('submitted', 'verified')
     ORDER BY r.submission_date DESC`
  );
  return result.rows;
}
