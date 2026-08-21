import { Router } from 'express';
import {
  analyzeReportDuplicatesController,
  getDuplicateQueueController,
  resolveDuplicateController,
} from '../controllers/duplicateDetectionController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';

const duplicateDetectionRoutes = Router();

duplicateDetectionRoutes.post('/analyze', requireAdmin, analyzeReportDuplicatesController);
duplicateDetectionRoutes.get('/queue', requireAdmin, getDuplicateQueueController);
duplicateDetectionRoutes.post('/resolve', requireAdmin, resolveDuplicateController);

export default duplicateDetectionRoutes;
