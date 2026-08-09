import type { NextFunction, Request, Response } from 'express';
import { fetchModerationQueue, resolveModerationFlagRecord } from '../models/fraudSpamModerationModel.js';
import { evaluateFraudAndSpamRisk } from '../services/fraudSpamModerationService.js';

export async function getModerationQueueController(_request: Request, response: Response, next: NextFunction) {
  try {
    const queue = await fetchModerationQueue();
    response.json({ queue });
  } catch (error) {
    next(error);
  }
}

export async function scanReportForFraudController(request: Request, response: Response, next: NextFunction) {
  const { title, description, category } = request.body;
  if (typeof title !== 'string' || typeof description !== 'string') {
    response.status(400).json({ error: 'Title and description are required for moderation scanning.' });
    return;
  }

  try {
    const risk = evaluateFraudAndSpamRisk({ title, description, category });
    response.json({ risk });
  } catch (error) {
    next(error);
  }
}

export async function resolveModerationFlagController(request: Request, response: Response, next: NextFunction) {
  const { flagId, decision } = request.body;
  if (typeof flagId !== 'string' || (decision !== 'approve' && decision !== 'reject_spam')) {
    response.status(400).json({ error: 'Valid flagId and decision ("approve" | "reject_spam") are required.' });
    return;
  }

  try {
    const result = await resolveModerationFlagRecord(flagId, decision);
    response.json(result);
  } catch (error) {
    next(error);
  }
}
