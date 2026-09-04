import { Router } from 'express';
import {
  adminAssignInstitution,
  adminCreateFameShame,
  adminCreateInstitution,
  adminGetFameShame,
  adminRecalculateScores,
  adminReviewFameShame,
  adminUpdateCaseOutcome,
  getFameShame,
  getHeatmap,
  getRankings,
} from '../controllers/transparencyController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';

export const publicTransparencyRoutes = Router();
publicTransparencyRoutes.get('/heatmap', getHeatmap);
publicTransparencyRoutes.get('/institutions/rankings', getRankings);
publicTransparencyRoutes.get('/fame-shame', getFameShame);

export const adminTransparencyRoutes = Router();
adminTransparencyRoutes.use(requireAdmin);
adminTransparencyRoutes.post('/institutions', adminCreateInstitution);
adminTransparencyRoutes.post('/reports/:reportId/institution', adminAssignInstitution);
adminTransparencyRoutes.post('/institutions/recalculate', adminRecalculateScores);
adminTransparencyRoutes.patch('/cases/:caseOrReportId/outcome', adminUpdateCaseOutcome);
adminTransparencyRoutes.get('/fame-shame', adminGetFameShame);
adminTransparencyRoutes.post('/fame-shame', adminCreateFameShame);
adminTransparencyRoutes.post('/fame-shame/:recordId/review', adminReviewFameShame);
