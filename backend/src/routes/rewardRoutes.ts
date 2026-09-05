import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  getRewardProfile,
  redeemBadgeController,
  updateAnonymityController,
  getLeaderboardController,
} from '../controllers/rewardController.js';

const router = Router();

// Public — no auth needed
router.get('/leaderboard', getLeaderboardController);

// Authenticated citizen routes
router.get('/profile', requireAuth, getRewardProfile);
router.post('/redeem', requireAuth, redeemBadgeController);
router.patch('/anonymity', requireAuth, updateAnonymityController);

export default router;
