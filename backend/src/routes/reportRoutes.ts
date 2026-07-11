import { Router } from 'express';
import { getReports, submitReport } from '../controllers/reportController.js';
const reportRoutes = Router();
reportRoutes.post('/', submitReport);
reportRoutes.get('/', getReports);
export default reportRoutes;
