import { Router } from 'express';
import { getDashboard, getUserData } from '../controllers/dashboardController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const dashboardRoutes = Router();

dashboardRoutes.get('/dashboard', requireAuth, getDashboard);
dashboardRoutes.get('/user', requireAuth, getUserData);

export default dashboardRoutes;
