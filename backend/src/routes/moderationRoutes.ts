import { Router } from 'express';
import {
  checkHandler,
  reportHandler,
  listFlagsHandler,
  verifyFlagHandler,
} from '../controllers/moderationController.js';

// Placeholder auth middlewares — replace with your actual implementations
function requireAuth(req: any, res: any, next: any) {
  // ensure req.user exists
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  next();
}
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'forbidden' });
  next();
}

const router = Router();

router.post('/check', requireAuth, checkHandler); // check content for duplicates/fraud
router.post('/report', requireAuth, reportHandler); // user reports content
router.get('/flags', requireAuth, requireAdmin, listFlagsHandler); // admin views flags
router.post('/flags/:id/verify', requireAuth, requireAdmin, verifyFlagHandler); // admin verifies

export default router;
