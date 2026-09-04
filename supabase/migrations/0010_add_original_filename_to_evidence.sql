-- Migration: 0010_add_original_filename_to_evidence.sql
-- Adds original_filename column to evidence_files table

ALTER TABLE evidence_files ADD COLUMN IF NOT EXISTS original_filename TEXT NOT NULL DEFAULT 'evidence_file';
CREATE INDEX IF NOT EXISTS idx_evidence_files_report_id ON evidence_files(report_id);
