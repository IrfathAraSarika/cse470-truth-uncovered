import { Router } from 'express';
import {
  createFlaggedItemController,
  getFlaggableReportsController,
  getFlaggedItemQueueController,
  getPublicFlaggedReportsController,
  resolveFlaggedItemController,
} from '../controllers/flaggedItemController.js';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware.js';

const flaggedItemRoutes = Router();

flaggedItemRoutes.get('/reports', getFlaggableReportsController);
flaggedItemRoutes.get('/public', getPublicFlaggedReportsController);
flaggedItemRoutes.post('/', requireAuth, createFlaggedItemController);
flaggedItemRoutes.get('/queue', requireAdmin, getFlaggedItemQueueController);
flaggedItemRoutes.post('/resolve', requireAdmin, resolveFlaggedItemController);

export default flaggedItemRoutes;
