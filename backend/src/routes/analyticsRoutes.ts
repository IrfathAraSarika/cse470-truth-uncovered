import { Router } from 'express';
import { fetchAnalytics } from '../controllers/analyticsController.js';

const analyticsRoutes = Router();

analyticsRoutes.get('/', fetchAnalytics);

export default analyticsRoutes;
