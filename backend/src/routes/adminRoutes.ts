import { Router } from 'express';
import { getReport, getReports, reviewReport } from '../controllers/adminReportController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';
const adminRoutes = Router();
adminRoutes.use(requireAdmin);
adminRoutes.get('/reports', getReports);
adminRoutes.get('/reports/:id', getReport);
adminRoutes.post('/reports/:id/reviews', reviewReport);
export default adminRoutes;
