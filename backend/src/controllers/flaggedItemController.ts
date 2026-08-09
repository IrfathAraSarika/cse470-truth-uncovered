import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import {
  fetchFlaggableReports,
  fetchFlaggedItemQueue,
  fetchPublicFlaggedReports,
  fetchReportForFlagging,
  findOpenFlagByUser,
  insertFlaggedItem,
  resolveFlaggedItem,
} from '../models/flaggedItemModel.js';
import { buildFlagReasonText, calculateFlagSeverity, isValidFlagReason } from '../services/flaggedItemService.js';

const MAX_DETAILS_LENGTH = 1000;

// Public: reports citizens can flag.
export async function getFlaggableReportsController(_request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const reports = await fetchFlaggableReports();
    response.json({ reports });
  } catch (error) {
    next(error);
  }
}

// Public: community watch board of currently flagged reports.
export async function getPublicFlaggedReportsController(_request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const items = await fetchPublicFlaggedReports();
    response.json({ items });
  } catch (error) {
    next(error);
  }
}

// Citizen: flag a report for review.
export async function createFlaggedItemController(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) { response.status(401).json({ error: 'Authentication required.' }); return; }
  const { reportId, reason, details } = request.body ?? {};

  if (typeof reportId !== 'string' || !reportId) {
    response.status(400).json({ error: 'A valid reportId is required.' });
    return;
  }
  if (!isValidFlagReason(reason)) {
    response.status(400).json({ error: 'A valid flag reason is required.' });
    return;
  }
  if (details !== undefined && details !== null && (typeof details !== 'string' || details.length > MAX_DETAILS_LENGTH)) {
    response.status(400).json({ error: `Flag details must be text under ${MAX_DETAILS_LENGTH} characters.` });
    return;
  }

  try {
    const report = await fetchReportForFlagging(reportId);
    if (!report) { response.status(404).json({ error: 'Report not found.' }); return; }

    const existing = await findOpenFlagByUser(reportId, request.auth.userId);
    if (existing) {
      response.status(409).json({ error: 'You already flagged this report. It is waiting for admin review.' });
      return;
    }

    const severity = calculateFlagSeverity(reason, report.title as string, report.description as string);
    const trimmedDetails = typeof details === 'string' && details.trim() ? details.trim() : null;
    const flag = await insertFlaggedItem(request.auth.userId, reportId, buildFlagReasonText(reason, trimmedDetails));

    response.status(201).json({
      success: true,
      flagId: flag.flag_id,
      severity: severity.severityScore,
      autoEscalated: severity.autoEscalated,
    });
  } catch (error) {
    next(error);
  }
}

// Admin: unresolved flag queue.
export async function getFlaggedItemQueueController(_request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const queue = await fetchFlaggedItemQueue();
    response.json({ queue });
  } catch (error) {
    next(error);
  }
}

// Admin: dismiss a flag or hide the flagged report.
export async function resolveFlaggedItemController(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const { flagId, decision } = request.body ?? {};
  if (typeof flagId !== 'string' || (decision !== 'dismiss' && decision !== 'hide')) {
    response.status(400).json({ error: 'Valid flagId and decision ("dismiss" | "hide") are required.' });
    return;
  }

  try {
    const result = await resolveFlaggedItem(flagId, decision);
    response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Flagged item record not found.') {
      response.status(404).json({ error: 'Flagged item not found.' });
      return;
    }
    next(error);
  }
}
