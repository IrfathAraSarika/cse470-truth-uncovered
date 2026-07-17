import { Router } from 'express';
import { getMyReports, getReports, submitReport } from '../controllers/reportController.js';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware.js';

const reportRoutes = Router();
reportRoutes.post('/', requireAuth, submitReport);
reportRoutes.get('/my', requireAuth, getMyReports);
reportRoutes.get('/', requireAdmin, getReports);

export default reportRoutes;
