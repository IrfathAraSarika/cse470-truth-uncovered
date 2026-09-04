import { pool } from './database.js';

export interface ExtractedGps {
  latitude: number;
  longitude: number;
}

export interface EvidenceFileRecord {
  evidenceId: string;
  reportId: string;
  filePath: string;
  fileType: string;
  originalFilename: string;
  fileSizeBytes: number;
  extractedGps: ExtractedGps | null;
  fileHash: string;
  encryptionIv: string;
  uploadedAt: string;
}

export interface EvidenceListItem {
  evidenceId: string;
  reportId: string;
  originalFilename: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface EvidenceWithOwnerRecord extends EvidenceFileRecord {
  reportUserId: string;
}

/**
 * Checks if a report exists in the database by its report_id UUID.
 */
export async function checkReportExists(reportId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM reports WHERE report_id = $1',
    [reportId]
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Inserts metadata record for an encrypted evidence file into PostgreSQL evidence_files table.
 * Uses parameterized SQL queries and returns camelCase aliased columns.
 */
export async function insertEvidenceFile(
  reportId: string,
  filePath: string,
  fileType: string,
  originalFilename: string,
  fileSizeBytes: number,
  fileHash: string,
  encryptionIv: string,
  extractedGps: ExtractedGps | null = null
): Promise<EvidenceFileRecord> {
  const query = `
    INSERT INTO evidence_files (
      report_id, file_path, file_type, original_filename, file_size_bytes, file_hash, encryption_iv, extracted_gps
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      evidence_id AS "evidenceId",
      report_id AS "reportId",
      file_path AS "filePath",
      file_type AS "fileType",
      original_filename AS "originalFilename",
      file_size_bytes AS "fileSizeBytes",
      extracted_gps AS "extractedGps",
      file_hash AS "fileHash",
      encryption_iv AS "encryptionIv",
      uploaded_at AS "uploadedAt"
  `;

  const values = [
    reportId,
    filePath,
    fileType,
    originalFilename || 'evidence_file',
    fileSizeBytes,
    fileHash,
    encryptionIv,
    extractedGps ? JSON.stringify(extractedGps) : null,
  ];

  const result = await pool.query(query, values);
  const row = result.rows[0];

  return {
    evidenceId: row.evidenceId,
    reportId: row.reportId,
    filePath: row.filePath,
    fileType: row.fileType,
    originalFilename: row.originalFilename,
    fileSizeBytes: Number(row.fileSizeBytes),
    extractedGps: typeof row.extractedGps === 'string' ? JSON.parse(row.extractedGps) : row.extractedGps,
    fileHash: row.fileHash,
    encryptionIv: row.encryptionIv,
    uploadedAt: row.uploadedAt,
  };
}

/**
 * Retrieves all evidence metadata items for a given reportId.
 */
export async function getEvidenceFilesByReportId(reportId: string): Promise<EvidenceListItem[]> {
  const query = `
    SELECT
      evidence_id AS "evidenceId",
      report_id AS "reportId",
      original_filename AS "originalFilename",
      file_type AS "fileType",
      file_size_bytes AS "fileSizeBytes",
      uploaded_at AS "uploadedAt"
    FROM evidence_files
    WHERE report_id = $1
    ORDER BY uploaded_at DESC
  `;

  const result = await pool.query(query, [reportId]);
  return result.rows.map((row) => ({
    evidenceId: row.evidenceId,
    reportId: row.reportId,
    originalFilename: row.originalFilename,
    fileType: row.fileType,
    fileSizeBytes: Number(row.fileSizeBytes),
    uploadedAt: row.uploadedAt,
  }));
}

/**
 * Retrieves evidence file record along with report author user_id (reportUserId).
 */
export async function getEvidenceFileWithReportOwner(evidenceId: string): Promise<EvidenceWithOwnerRecord | null> {
  const query = `
    SELECT
      e.evidence_id AS "evidenceId",
      e.report_id AS "reportId",
      e.file_path AS "filePath",
      e.file_type AS "fileType",
      e.original_filename AS "originalFilename",
      e.file_size_bytes AS "fileSizeBytes",
      e.extracted_gps AS "extractedGps",
      e.file_hash AS "fileHash",
      e.encryption_iv AS "encryptionIv",
      e.uploaded_at AS "uploadedAt",
      COALESCE(c.user_id::text, r.citizen_id::text) AS "reportUserId"
    FROM evidence_files e
    JOIN reports r ON r.report_id = e.report_id
    LEFT JOIN citizens c ON c.citizen_id = r.citizen_id
    WHERE e.evidence_id = $1
  `;

  const result = await pool.query(query, [evidenceId]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    evidenceId: row.evidenceId,
    reportId: row.reportId,
    filePath: row.filePath,
    fileType: row.fileType,
    originalFilename: row.originalFilename,
    fileSizeBytes: Number(row.fileSizeBytes),
    extractedGps: typeof row.extractedGps === 'string' ? JSON.parse(row.extractedGps) : row.extractedGps,
    fileHash: row.fileHash,
    encryptionIv: row.encryptionIv,
    uploadedAt: row.uploadedAt,
    reportUserId: row.reportUserId,
  };
}

/**
 * Deletes an evidence file record from PostgreSQL.
 */
export async function deleteEvidenceFileRecord(evidenceId: string): Promise<void> {
  await pool.query('DELETE FROM evidence_files WHERE evidence_id = $1', [evidenceId]);
}
