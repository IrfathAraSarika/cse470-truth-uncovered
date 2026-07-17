import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { createReport, listReports, listReportsByUser } from '../models/reportModel.js';

const allowedCategories = new Set([
  'corruption', 'bribery', 'dowry', 'harassment', 'extortion',
  'land_grabbing', 'hazard', 'antisocial_activity', 'other',
]);

export async function submitReport(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const { title, description, category, incidentDateTime, isAnonymous, district, address } = request.body;
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim() || typeof category !== 'string') {
    response.status(400).json({ error: 'Title, description, and category are required.' });
    return;
  }
  if (!allowedCategories.has(category)) {
    response.status(400).json({ error: 'Invalid report category.' });
    return;
  }

  try {
    const report = await createReport(request.auth.userId, {
      title: title.trim(),
      description: description.trim(),
      category,
      incidentDateTime: typeof incidentDateTime === 'string' ? incidentDateTime : null,
      isAnonymous: Boolean(isAnonymous),
      district: typeof district === 'string' && district.trim() ? district.trim() : null,
      address: typeof address === 'string' && address.trim() ? address.trim() : null,
    });
    response.status(201).json({ report });
  } catch (error) {
    next(error);
  }
}

export async function getReports(_request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    response.json({ reports: await listReports() });
  } catch (error) {
    next(error);
  }
}

export async function getMyReports(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    response.json({ reports: await listReportsByUser(request.auth.userId) });
  } catch (error) {
    next(error);
  }
}
