import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { getUserProfile, getUserPermissions } from '../models/userModel.js';

export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const userProfile = await getUserProfile(req.auth.userId);
    if (!userProfile) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const permissions = await getUserPermissions(userProfile.role);

    res.json({
      user: userProfile,
      permissions,
      role: userProfile.role,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const userProfile = await getUserProfile(req.auth.userId);
    if (!userProfile) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.json(userProfile);
  } catch (error) {
    next(error);
  }
}
