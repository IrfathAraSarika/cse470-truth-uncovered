import { Router } from 'express';
import { startHandler, statusHandler, listHandler } from '../controllers/OfflineSyncController';

// Placeholder auth - adapt to your app's auth middleware
function requireAuth(req: any, res: any, next: any) {
  // for real use, ensure req.user exists
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'forbidden' });
  next();
}

const router = Router();

// Start a new offline sync job
router.post('/start', requireAuth, startHandler);

// Get status of a sync by its id
router.get('/status/:id', requireAuth, statusHandler);

// Admin: list recent syncs
router.get('/list', requireAuth, requireAdmin, listHandler);

export default router;
