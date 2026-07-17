import { Router } from 'express';
import { getReport, getReports, reviewReport } from '../controllers/adminReportController.js';
import {
  getVerificationRequestDetail,
  getVerificationRequests,
  reviewVerificationRequest,
} from '../controllers/verificationController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';
const adminRoutes = Router();
adminRoutes.use(requireAdmin);
adminRoutes.get('/reports', getReports);
adminRoutes.get('/reports/:id', getReport);
adminRoutes.post('/reports/:id/reviews', reviewReport);
adminRoutes.get('/verifications', getVerificationRequests);
adminRoutes.get('/verifications/:id', getVerificationRequestDetail);
adminRoutes.post('/verifications/:id/review', reviewVerificationRequest);
export default adminRoutes;
