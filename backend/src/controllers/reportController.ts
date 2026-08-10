import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { createReport, findDuplicateCandidates, findExistingRecentReport, listReports, listReportsByUser } from '../models/reportModel.js';
import { screenReport } from '../services/reportScreeningService.js';

const allowedCategories = new Set([
  'corruption', 'bribery', 'dowry', 'harassment', 'extortion',
  'land_grabbing', 'hazard', 'antisocial_activity', 'other',
]);

export async function submitReport(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const { title, description, category, incidentDateTime, isAnonymous, district, address, locationData } = request.body;
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
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    // Idempotency check: if citizen submitted this exact report in the last 10 minutes, return existing record
    const existing = await findExistingRecentReport(request.auth.userId, normalizedTitle, normalizedDescription);
    if (existing) {
      response.status(200).json({ report: existing, screening: null, isDuplicateSync: true });
      return;
    }

    const parsedLocationData = locationData && typeof locationData === 'object' ? {
      address: typeof locationData.address === 'string' && locationData.address.trim() ? locationData.address.trim() : (typeof address === 'string' ? address.trim() : null),
      latitude: typeof locationData.latitude === 'number' && !isNaN(locationData.latitude) ? locationData.latitude : null,
      longitude: typeof locationData.longitude === 'number' && !isNaN(locationData.longitude) ? locationData.longitude : null,
      district: typeof locationData.district === 'string' && locationData.district.trim() ? locationData.district.trim() : (typeof district === 'string' ? district.trim() : null),
      division: typeof locationData.division === 'string' && locationData.division.trim() ? locationData.division.trim() : null,
    } : null;

    const normalizedReport = {
      title: normalizedTitle,
      description: normalizedDescription,
      category,
      incidentDateTime: typeof incidentDateTime === 'string' ? incidentDateTime : null,
      isAnonymous: Boolean(isAnonymous),
      district: parsedLocationData?.district ?? (typeof district === 'string' && district.trim() ? district.trim() : null),
      address: parsedLocationData?.address ?? (typeof address === 'string' && address.trim() ? address.trim() : null),
      locationData: parsedLocationData,
    };
    const candidates = await findDuplicateCandidates(normalizedReport.category, normalizedReport.district);
    const screening = screenReport(normalizedReport, candidates);
    const report = await createReport(request.auth.userId, normalizedReport, screening);
    response.status(201).json({ report, screening });
  } catch (error) {
    next(error);
  }
}

export async function batchSyncReports(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const { reports } = request.body;
  if (!Array.isArray(reports)) {
    response.status(400).json({ error: 'Reports array is required for batch sync.' });
    return;
  }

  const results = [];
  for (const item of reports) {
    const clientDraftId = typeof item.clientDraftId === 'string' ? item.clientDraftId : item.queueId;
    try {
      const { title, description, category, incidentDateTime, isAnonymous, district, address, locationData } = item;
      if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim() || typeof category !== 'string' || !allowedCategories.has(category)) {
        results.push({ clientDraftId, status: 'failed', error: 'Invalid report data payload.' });
        continue;
      }

      const normalizedTitle = title.trim();
      const normalizedDescription = description.trim();
      const existing = await findExistingRecentReport(request.auth.userId, normalizedTitle, normalizedDescription);

      if (existing) {
        results.push({ clientDraftId, status: 'duplicate_prevented', report: existing, screening: null });
        continue;
      }

      const parsedLocationData = locationData && typeof locationData === 'object' ? {
        address: typeof locationData.address === 'string' && locationData.address.trim() ? locationData.address.trim() : (typeof address === 'string' ? address.trim() : null),
        latitude: typeof locationData.latitude === 'number' && !isNaN(locationData.latitude) ? locationData.latitude : null,
        longitude: typeof locationData.longitude === 'number' && !isNaN(locationData.longitude) ? locationData.longitude : null,
        district: typeof locationData.district === 'string' && locationData.district.trim() ? locationData.district.trim() : (typeof district === 'string' ? district.trim() : null),
        division: typeof locationData.division === 'string' && locationData.division.trim() ? locationData.division.trim() : null,
      } : null;

      const normalizedReport = {
        title: normalizedTitle,
        description: normalizedDescription,
        category,
        incidentDateTime: typeof incidentDateTime === 'string' ? incidentDateTime : null,
        isAnonymous: Boolean(isAnonymous),
        district: parsedLocationData?.district ?? (typeof district === 'string' && district.trim() ? district.trim() : null),
        address: parsedLocationData?.address ?? (typeof address === 'string' && address.trim() ? address.trim() : null),
        locationData: parsedLocationData,
      };

      const candidates = await findDuplicateCandidates(normalizedReport.category, normalizedReport.district);
      const screening = screenReport(normalizedReport, candidates);
      const report = await createReport(request.auth.userId, normalizedReport, screening);
      results.push({ clientDraftId, status: 'synced', report, screening });
    } catch (err) {
      results.push({ clientDraftId, status: 'failed', error: err instanceof Error ? err.message : 'Sync failed.' });
    }
  }

  response.json({ results });
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

