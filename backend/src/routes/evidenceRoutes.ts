import { Router } from 'express';
import {
  uploadMiddleware,
  uploadEvidenceHandler,
  getReportEvidenceHandler,
  previewEvidenceHandler,
  deleteEvidenceHandler,
} from '../controllers/evidenceController.js';

const evidenceRoutes = Router();

// POST /api/evidence/upload
evidenceRoutes.post('/upload', uploadMiddleware.single('file'), uploadEvidenceHandler);

// GET /api/evidence/report/:reportId
evidenceRoutes.get('/report/:reportId', getReportEvidenceHandler);

// GET /api/evidence/:evidenceId/preview
evidenceRoutes.get('/:evidenceId/preview', previewEvidenceHandler);

// DELETE /api/evidence/:evidenceId
evidenceRoutes.delete('/:evidenceId', deleteEvidenceHandler);

export default evidenceRoutes;
