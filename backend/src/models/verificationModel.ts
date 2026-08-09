import { pool } from './database.js';

export interface VerificationStatus {
  status: string;
  nid_number: string | null;
  has_photo: boolean;
  notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  is_verified: boolean;
}

export interface PendingVerification {
  citizen_id: string;
  full_name: string;
  email: string;
  nid_number: string | null;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

// Fetch the verification state for the logged-in citizen.
export async function getVerificationStatus(userId: string): Promise<VerificationStatus | null> {
  const result = await pool.query(
    `select verification_status, nid_number, nid_photo_path, verification_notes,
            verification_submitted_at, verification_reviewed_at, is_verified
     from citizens where user_id = $1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    status: row.verification_status,
    nid_number: row.nid_number,
    has_photo: Boolean(row.nid_photo_path),
    notes: row.verification_notes,
    submitted_at: row.verification_submitted_at,
    reviewed_at: row.verification_reviewed_at,
    is_verified: row.is_verified,
  };
}

// Submit (or re-submit after rejection) an NID photo for review.
export async function submitVerification(userId: string, nidNumber: string, nidPhoto: string) {
  const result = await pool.query(
    `update citizens
        set nid_number = $2,
            nid_photo_path = $3,
            verification_status = 'pending',
            verification_notes = null,
            verification_submitted_at = now(),
            verification_reviewed_at = null,
            verification_reviewed_by = null,
            is_verified = false
      where user_id = $1
      returning verification_status`,
    [userId, nidNumber, nidPhoto],
  );
  if (!result.rows[0]) throw new Error('CITIZEN_PROFILE_MISSING');
  return result.rows[0];
}

// Admin list of citizens who submitted an NID for verification.
export async function listVerificationRequests(status: string): Promise<PendingVerification[]> {
  const result = await pool.query(
    `select c.citizen_id, u.full_name, u.email, c.nid_number,
            c.verification_status as status,
            c.verification_submitted_at as submitted_at,
            c.verification_reviewed_at as reviewed_at,
            c.verification_notes as notes
       from citizens c
       join app_users u on u.user_id = c.user_id
      where ($1 = 'all' or c.verification_status::text = $1)
        and c.verification_status <> 'not_submitted'
      order by (c.verification_status = 'pending') desc, c.verification_submitted_at desc nulls last`,
    [status],
  );
  return result.rows;
}

// Admin view of a single verification request including the NID photo.
export async function getVerificationRequest(citizenId: string) {
  const result = await pool.query(
    `select c.citizen_id, u.full_name, u.email, c.nid_number, c.nid_photo_path,
            c.verification_status as status,
            c.verification_submitted_at as submitted_at,
            c.verification_reviewed_at as reviewed_at,
            c.verification_notes as notes
       from citizens c
       join app_users u on u.user_id = c.user_id
      where c.citizen_id = $1`,
    [citizenId],
  );
  return result.rows[0] ?? null;
}

// Admin approve/reject a submitted NID.
export async function reviewVerification(citizenId: string, adminUserId: string, decision: 'verified' | 'rejected', notes: string | null) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const admin = await client.query<{ admin_id: string }>('select admin_id from admins where user_id = $1', [adminUserId]);
    if (!admin.rows[0]) throw new Error('ADMIN_PROFILE_MISSING');
    const updated = await client.query(
      `update citizens
          set verification_status = $2::citizen_verification_status,
              is_verified = ($2 = 'verified'),
              verification_notes = $3,
              verification_reviewed_at = now(),
              verification_reviewed_by = $4
        where citizen_id = $1
          and verification_status = 'pending'
        returning citizen_id`,
      [citizenId, decision, notes, admin.rows[0].admin_id],
    );
    if (!updated.rows[0]) throw new Error('REQUEST_NOT_PENDING');
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
