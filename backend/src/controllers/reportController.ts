import type { NextFunction, Request, Response } from 'express';
import { createReport, listReports, listReportsByCitizen } from '../models/reportModel.js';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const categoryMap: Record<string, string> = { bribery: 'bribery', embezzlement: 'corruption', abuse_of_power: 'corruption', fraud: 'corruption', other: 'other' };

export async function submitReport(request: Request, response: Response, next: NextFunction) {
  const { citizenId, title, description, category, incidentDateTime, isAnonymous } = request.body;
  if (!citizenId || typeof title !== 'string' || typeof description !== 'string' || typeof category !== 'string') {
    response.status(400).json({ error: 'Citizen, title, description, and category are required.' }); return;
  }
  try {
    const report = await createReport({ citizenId, title: title.trim(), description: description.trim(), category: categoryMap[category] ?? 'other', incidentDateTime: incidentDateTime || null, isAnonymous: Boolean(isAnonymous) });
    response.status(201).json({ report });
  } catch (error) { next(error); }
}

export async function getReports(_request: Request, response: Response, next: NextFunction) {
  try { response.json({ reports: await listReports() }); } catch (error) { next(error); }
}

export async function getMyReports(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const { citizenId } = request.query;
  if (!citizenId || typeof citizenId !== 'string') {
    response.status(400).json({ error: 'citizenId query parameter is required.' }); return;
  }
  try {
    const reports = await listReportsByCitizen(citizenId);
    response.json({ reports });
  } catch (error) { next(error); }
}

