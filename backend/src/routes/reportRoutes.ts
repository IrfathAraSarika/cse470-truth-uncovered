import { Router } from 'express';
import { batchSyncReports, getMyReports, getReports, submitReport } from '../controllers/reportController.js';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware.js';

const reportRoutes = Router();
reportRoutes.post('/', requireAuth, submitReport);
reportRoutes.post('/batch-sync', requireAuth, batchSyncReports);
reportRoutes.get('/my', requireAuth, getMyReports);
reportRoutes.get('/', requireAdmin, getReports);

export default reportRoutes;

