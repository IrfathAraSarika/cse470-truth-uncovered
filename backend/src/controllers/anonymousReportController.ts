import type { NextFunction, Request, Response } from 'express';
import {
  createAnonymousReport,
  findAnonymousReportByTrackingCode,
  listAnonymousReports,
} from '../models/anonymousReportModel.js';
import { findDuplicateCandidates } from '../models/reportModel.js';
import { screenReport } from '../services/reportScreeningService.js';

const allowedCategories = [
  'corruption',
  'bribery',
  'dowry',
  'harassment',
  'extortion',
  'land_grabbing',
  'hazard',
  'antisocial_activity',
  'other',
];

// Public endpoint: accepts the report, runs screening, returns a tracking code.
// No auth, no user id, no email, no IP is stored.
export async function submitAnonymousReportController(request: Request, response: Response, next: NextFunction) {
  try {
    const body = request.body as Record<string, unknown>;
    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();
    const category = String(body.category ?? 'other');
    const incidentDateTime = body.incidentDateTime
      ? new Date(String(body.incidentDateTime)).toISOString()
      : null;
    const district = body.district ? String(body.district).trim().slice(0, 100) : null;
    const address = body.address ? String(body.address).trim() : null;

    if (!title || !description) {
      return response.status(400).json({ message: 'Title and description are required.' });
    }
    if (!allowedCategories.includes(category)) {
      return response.status(400).json({ message: 'Invalid category.' });
    }

    const candidates = await findDuplicateCandidates(category, district);
    const screening = screenReport({ title, description, category, district }, candidates);

    const report = await createAnonymousReport(
      { title, description, category, incidentDateTime, district, address },
      screening,
    );

    return response.status(201).json({ report, screening });
  } catch (error) {
    next(error);
  }
}

// Public status lookup via tracking code — lets anonymous reporters follow
// their case without an account.
export async function trackAnonymousReportController(request: Request, response: Response, next: NextFunction) {
  try {
    const trackingCode = String(request.params.trackingCode ?? '').trim().toUpperCase();
    if (!trackingCode) {
      return response.status(400).json({ message: 'Tracking code is required.' });
    }

    const report = await findAnonymousReportByTrackingCode(trackingCode);
    if (!report) {
      return response.status(404).json({ message: 'No report found for that tracking code.' });
    }

    return response.status(200).json({ report });
  } catch (error) {
    next(error);
  }
}

// Admin: browse anonymous submissions alongside regular verification work.
export async function getAnonymousReportsController(_request: Request, response: Response, next: NextFunction) {
  try {
    const reports = await listAnonymousReports();
    return response.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
}
