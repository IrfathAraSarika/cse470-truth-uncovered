import { Router } from 'express';
import {
  getAnonymousReportsController,
  submitAnonymousReportController,
  trackAnonymousReportController,
} from '../controllers/anonymousReportController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';

export const anonymousReportRoutes = Router();

// Public: submit without an account, track status via code.
anonymousReportRoutes.post('/', submitAnonymousReportController);
anonymousReportRoutes.get('/track/:trackingCode', trackAnonymousReportController);

// Admin only: browse anonymous submissions.
anonymousReportRoutes.get('/', requireAdmin, getAnonymousReportsController);
