import { pool } from './database.js';

export async function findCase(caseId: string, userId: string, role: string) {
  const result = await pool.query(
    `select c.case_id, c.report_id, c.status, c.opened_at, c.closed_at, c.resolution_notes, c.updated_at,
            r.title as report_title
     from cases c
     join reports r on r.report_id = c.report_id
     join citizens citizen on citizen.citizen_id = r.citizen_id
     where c.case_id = $1 and ($2 = 'admin' or citizen.user_id = $3)`,
    [caseId, role, userId],
  );
  return result.rows[0] ?? null;
}
