import { Router } from 'express';
import { getReports, submitReport, getMyReports } from '../controllers/reportController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
const reportRoutes = Router();
reportRoutes.post('/', submitReport);
reportRoutes.get('/', getReports);
reportRoutes.get('/my', requireAuth, getMyReports);
export default reportRoutes;

