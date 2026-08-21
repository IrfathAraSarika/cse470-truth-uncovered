import type { Request, Response, NextFunction } from 'express';
import { getAnalyticsData } from '../models/analyticsModel.js';

export async function fetchAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const district = typeof req.query.district === 'string' && req.query.district.trim() ? req.query.district.trim() : 'Dhaka';
    const timePeriod = typeof req.query.timePeriod === 'string' && req.query.timePeriod.trim() ? req.query.timePeriod.trim() : 'month';

    const data = await getAnalyticsData(district, timePeriod);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
