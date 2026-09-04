-- Migration: 0010_encrypted_evidence_vault.sql
-- Synchronizes evidence_files table structure for encrypted evidence vault feature

ALTER TABLE evidence_files DROP COLUMN IF EXISTS watermark_id;

ALTER TABLE evidence_files 
  ALTER COLUMN file_type TYPE VARCHAR(100),
  ALTER COLUMN file_size_bytes SET NOT NULL;

ALTER TABLE evidence_files 
  ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS encryption_iv VARCHAR(32) NOT NULL DEFAULT '';

-- Remove default constraints after alter if any
ALTER TABLE evidence_files 
  ALTER COLUMN file_hash DROP DEFAULT,
  ALTER COLUMN encryption_iv DROP DEFAULT;

CREATE INDEX IF NOT EXISTS idx_evidence_files_report_id ON evidence_files(report_id);
