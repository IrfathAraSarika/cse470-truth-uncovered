import type { Request, Response, NextFunction } from 'express';
import { getPublicReports } from '../models/repositoryModel.js';

export async function fetchPublicReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const district = typeof req.query.district === 'string' ? req.query.district : undefined;
    const caseStatus = typeof req.query.caseStatus === 'string' ? req.query.caseStatus : undefined;
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'time';
    const sortOrder = typeof req.query.sortOrder === 'string' ? req.query.sortOrder : 'desc';

    const limit = 15;
    const { reports, totalCount } = await getPublicReports(
      { category, district, caseStatus },
      { sortBy, sortOrder },
      { page, limit }
    );

    const totalPages = Math.ceil(totalCount / limit) || 1;

    res.json({
      reports,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    next(error);
  }
}
