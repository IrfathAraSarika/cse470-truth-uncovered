import { Router } from 'express';
import { getCase } from '../controllers/caseController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getFollowUps, postFollowUp } from '../controllers/followUpController.js';

const caseRoutes = Router();
caseRoutes.get('/:caseId/follow-ups', requireAuth, getFollowUps);
caseRoutes.post('/:caseId/follow-ups', requireAuth, postFollowUp);
caseRoutes.get('/:id', requireAuth, getCase);
export default caseRoutes;
