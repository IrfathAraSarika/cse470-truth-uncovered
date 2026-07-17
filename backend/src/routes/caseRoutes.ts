import { Router } from 'express';
import { getCase } from '../controllers/caseController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const caseRoutes = Router();
caseRoutes.get('/:id', requireAuth, getCase);
export default caseRoutes;
