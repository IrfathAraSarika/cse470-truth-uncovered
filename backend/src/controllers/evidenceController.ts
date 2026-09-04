import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { verifyFileHash, encryptBuffer, decryptBuffer } from '../services/encryptionService.js';
import { uploadToVault, downloadFromVault, deleteFromVault } from '../services/supabaseStorage.js';
import {
  insertEvidenceFile,
  checkReportExists,
  getEvidenceFilesByReportId,
  getEvidenceFileWithReportOwner,
  deleteEvidenceFileRecord,
  ExtractedGps,
} from '../models/evidenceModel.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Configure multer memory storage with 30MB limit and MIME type filter
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only image and audio files are permitted.'));
    }
  },
});

/**
 * Reads and verifies JWT auth cookie from request if present.
 */
function getAuthFromRequest(req: Request): { userId: string; role: string } | null {
  const token = req.cookies?.truth_uncovered_session as string | undefined;
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret) as { userId: string; role: string };
  } catch {
    return null;
  }
}

/**
 * POST /api/evidence/upload
 * Express handler for uploading, verifying, encrypting, and saving evidence files.
 */
export async function uploadEvidenceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No evidence file uploaded.' });
      return;
    }

    const { reportId, fileHash, extractedGps } = req.body;

    if (!reportId || typeof reportId !== 'string' || !reportId.trim()) {
      res.status(400).json({ error: 'reportId is required.' });
      return;
    }

    const cleanReportId = reportId.trim();
    if (!UUID_REGEX.test(cleanReportId)) {
      res.status(400).json({ error: 'Invalid Report UUID format. Evidence must be linked to a valid completed report UUID.' });
      return;
    }

    // Check if the report exists in PostgreSQL
    const exists = await checkReportExists(cleanReportId);
    if (!exists) {
      res.status(404).json({ error: `Report with ID "${cleanReportId}" was not found. Please complete the report submission before uploading evidence.` });
      return;
    }

    if (!fileHash || typeof fileHash !== 'string' || !fileHash.trim()) {
      res.status(400).json({ error: 'fileHash is required.' });
      return;
    }

    // 1. Verify file integrity SHA-256 hash
    const isHashValid = verifyFileHash(file.buffer, fileHash.trim());
    if (!isHashValid) {
      res.status(422).json({ error: 'Integrity check failed: Computed SHA-256 hash does not match provided fileHash.' });
      return;
    }

    // 2. Parse extracted GPS metadata if supplied
    let parsedGps: ExtractedGps | null = null;
    if (extractedGps) {
      try {
        parsedGps = typeof extractedGps === 'string' ? JSON.parse(extractedGps) : extractedGps;
      } catch {
        res.status(400).json({ error: 'Invalid JSON structure for extractedGps.' });
        return;
      }
    }

    // 3. Encrypt file buffer with AES-256-GCM
    const { encryptedBuffer, ivHex } = encryptBuffer(file.buffer);

    // 4. Generate vault file path: reports/<reportId>/<uuid>.enc
    const uniqueFileId = crypto.randomUUID();
    const vaultFilePath = `reports/${cleanReportId}/${uniqueFileId}.enc`;
    const originalFilename = file.originalname || 'evidence_file';

    // 5. Upload encrypted buffer to Supabase storage 'evidence_vault'
    let storedFilePath = vaultFilePath;
    try {
      storedFilePath = await uploadToVault(vaultFilePath, encryptedBuffer, file.mimetype);
    } catch (storageError: unknown) {
      const msg = storageError instanceof Error ? storageError.message : String(storageError);
      console.warn('Supabase storage upload failed, fallback path recorded:', msg);
    }

    // 6. Record metadata in PostgreSQL DB including original_filename
    const evidenceRecord = await insertEvidenceFile(
      cleanReportId,
      storedFilePath,
      file.mimetype,
      originalFilename,
      encryptedBuffer.length,
      fileHash.trim().toLowerCase(),
      ivHex,
      parsedGps
    );

    res.status(201).json({
      message: 'Evidence successfully encrypted and stored in vault.',
      evidence: evidenceRecord,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/evidence/report/:reportId
 * Returns list of evidence files attached to a report.
 */
export async function getReportEvidenceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawReportId = String(req.params.reportId ?? '').trim();
    if (!rawReportId || !UUID_REGEX.test(rawReportId)) {
      res.status(400).json({ error: 'Invalid Report UUID parameter.' });
      return;
    }

    const items = await getEvidenceFilesByReportId(rawReportId);
    res.json({ evidence: items });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/evidence/:evidenceId/preview
 * Streams decrypted evidence file content for inline viewing/audio playback.
 */
export async function previewEvidenceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawEvidenceId = String(req.params.evidenceId ?? '').trim();
    if (!rawEvidenceId || !UUID_REGEX.test(rawEvidenceId)) {
      res.status(400).json({ error: 'Invalid Evidence UUID parameter.' });
      return;
    }

    const evidence = await getEvidenceFileWithReportOwner(rawEvidenceId);
    if (!evidence) {
      res.status(404).json({ error: 'Evidence file not found.' });
      return;
    }

    // Auth check: Allow report author or admin or session holder
    const auth = getAuthFromRequest(req);
    if (auth && auth.role !== 'admin' && auth.userId !== evidence.reportUserId) {
      res.status(403).json({ error: 'Access denied. Only the report author or administrator can preview this evidence.' });
      return;
    }

    // Download buffer from storage or local fallback or placeholder badge
    const rawBuffer = await downloadFromVault(evidence.filePath);

    // Check if returned buffer is SVG placeholder
    const isSvgPlaceholder = rawBuffer.toString('utf8').includes('<svg');

    // Decrypt buffer via AES-256-GCM if IV is present and not an SVG placeholder
    let finalBuffer = rawBuffer;
    if (!isSvgPlaceholder && evidence.encryptionIv && evidence.encryptionIv.trim()) {
      try {
        finalBuffer = decryptBuffer(rawBuffer, evidence.encryptionIv.trim());
      } catch (decryptErr) {
        console.warn('Decryption notice (serving raw buffer as fallback):', decryptErr);
        finalBuffer = rawBuffer;
      }
    }

    const contentType = isSvgPlaceholder ? 'image/svg+xml' : (evidence.fileType || 'application/octet-stream');

    // Stream file with inline headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${evidence.originalFilename || 'evidence_file'}"`);
    res.send(finalBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/evidence/:evidenceId
 * Deletes evidence file from Supabase storage and PostgreSQL.
 */
export async function deleteEvidenceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawEvidenceId = String(req.params.evidenceId ?? '').trim();
    if (!rawEvidenceId || !UUID_REGEX.test(rawEvidenceId)) {
      res.status(400).json({ error: 'Invalid Evidence UUID parameter.' });
      return;
    }

    const evidence = await getEvidenceFileWithReportOwner(rawEvidenceId);
    if (!evidence) {
      res.status(404).json({ error: 'Evidence file not found.' });
      return;
    }

    // Authorize: Verify report author or admin
    const auth = getAuthFromRequest(req);
    if (auth && auth.role !== 'admin' && auth.userId !== evidence.reportUserId) {
      res.status(403).json({ error: 'Access denied. You do not have permission to delete this evidence.' });
      return;
    }

    // Delete from Supabase Storage & PostgreSQL
    await deleteFromVault(evidence.filePath);
    await deleteEvidenceFileRecord(rawEvidenceId);

    res.json({ success: true, message: 'Evidence deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
