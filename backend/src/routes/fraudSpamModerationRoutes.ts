import { Router } from 'express';
import {
  getModerationQueueController,
  resolveModerationFlagController,
  scanReportForFraudController,
} from '../controllers/fraudSpamModerationController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';

const fraudSpamModerationRoutes = Router();

fraudSpamModerationRoutes.get('/queue', requireAdmin, getModerationQueueController);
fraudSpamModerationRoutes.post('/scan', requireAdmin, scanReportForFraudController);
fraudSpamModerationRoutes.post('/resolve', requireAdmin, resolveModerationFlagController);

export default fraudSpamModerationRoutes;
