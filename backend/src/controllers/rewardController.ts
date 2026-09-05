import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import {
  getCitizenRewardProfile,
  getRedeemableBadges,
  getLeaderboard,
  redeemBadge,
  updateLeaderboardAnonymity,
} from '../models/rewardModel.js';

// ---------------------------------------------------------------------------
// GET /api/rewards/profile  (citizen auth required)
// ---------------------------------------------------------------------------
export async function getRewardProfile(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) { response.status(401).json({ error: 'Authentication required.' }); return; }
  try {
    const [profile, redeemable] = await Promise.all([
      getCitizenRewardProfile(request.auth.userId),
      getRedeemableBadges(request.auth.userId),
    ]);
    if (!profile) { response.status(404).json({ error: 'Citizen profile not found.' }); return; }
    response.json({ ...profile, redeemableBadges: redeemable });
  } catch (error) { next(error); }
}

// ---------------------------------------------------------------------------
// POST /api/rewards/redeem  (citizen auth required)
// Body: { badgeType: string }
// ---------------------------------------------------------------------------
export async function redeemBadgeController(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) { response.status(401).json({ error: 'Authentication required.' }); return; }
  const { badgeType } = request.body ?? {};
  if (typeof badgeType !== 'string' || !badgeType.trim()) {
    response.status(400).json({ error: 'A valid badgeType is required.' });
    return;
  }
  try {
    const result = await redeemBadge(request.auth.userId, badgeType.trim());
    response.json({ success: true, newBalance: result.newBalance });
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, [number, string]> = {
        CITIZEN_PROFILE_MISSING: [404, 'Citizen profile not found.'],
        BADGE_NOT_FOUND: [404, 'Badge not found.'],
        BADGE_NOT_REDEEMABLE: [400, 'This badge cannot be redeemed with points.'],
        BADGE_ALREADY_OWNED: [409, 'You already own this badge.'],
        INSUFFICIENT_POINTS: [422, 'You do not have enough civic points to redeem this badge.'],
      };
      const [status, message] = map[error.message] ?? [null, null];
      if (status && message) { response.status(status).json({ error: message }); return; }
    }
    next(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/rewards/anonymity  (citizen auth required)
// Body: { anonymous: boolean }
// ---------------------------------------------------------------------------
export async function updateAnonymityController(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) { response.status(401).json({ error: 'Authentication required.' }); return; }
  const { anonymous } = request.body ?? {};
  if (typeof anonymous !== 'boolean') {
    response.status(400).json({ error: '"anonymous" must be a boolean.' });
    return;
  }
  try {
    await updateLeaderboardAnonymity(request.auth.userId, anonymous);
    response.json({ success: true, anonymous });
  } catch (error) { next(error); }
}

// ---------------------------------------------------------------------------
// GET /api/rewards/leaderboard  (public, no auth)
// ---------------------------------------------------------------------------
export async function getLeaderboardController(_request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const entries = await getLeaderboard(50);
    response.json({ leaderboard: entries });
  } catch (error) { next(error); }
}
