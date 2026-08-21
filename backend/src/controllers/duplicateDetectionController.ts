import type { NextFunction, Request, Response } from 'express';
import {
  fetchDuplicateCandidatesPool,
  fetchTargetReport,
  getDuplicateDetectionQueue,
  resolveDuplicatePair,
  saveDuplicateDetectionRecord,
} from '../models/duplicateDetectionModel.js';
import { detectDuplicatesForReport } from '../services/duplicateDetectionService.js';

export async function analyzeReportDuplicatesController(request: Request, response: Response, next: NextFunction) {
  const { reportId, title, description, category, district, latitude, longitude } = request.body;

  try {
    let target = null;
    if (typeof reportId === 'string' && reportId) {
      target = await fetchTargetReport(reportId);
    }

    if (!target) {
      if (typeof title !== 'string' || !title || typeof description !== 'string' || !description || typeof category !== 'string') {
        response.status(400).json({ error: 'Valid reportId or title, description, and category are required.' });
        return;
      }
      target = {
        reportId: reportId || 'temp',
        title: title.trim(),
        description: description.trim(),
        category,
        district: typeof district === 'string' ? district : null,
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
      };
    }

    const candidates = await fetchDuplicateCandidatesPool(target.category, target.district);
    const detections = detectDuplicatesForReport(target, candidates);

    if (target.reportId && target.reportId !== 'temp') {
      for (const item of detections) {
        await saveDuplicateDetectionRecord(target.reportId, item.candidateId, item.breakdown.overallScore);
      }
    }

    response.json({
      targetReportId: target.reportId,
      matchesFound: detections.length,
      detections,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDuplicateQueueController(_request: Request, response: Response, next: NextFunction) {
  try {
    const queue = await getDuplicateDetectionQueue();
    response.json({ queue });
  } catch (error) {
    next(error);
  }
}

export async function resolveDuplicateController(request: Request, response: Response, next: NextFunction) {
  const { detectionId, action } = request.body;
  if (typeof detectionId !== 'string' || (action !== 'merge' && action !== 'dismiss')) {
    response.status(400).json({ error: 'Valid detectionId and action ("merge" | "dismiss") are required.' });
    return;
  }

  try {
    const result = await resolveDuplicatePair(detectionId, action);
    response.json(result);
  } catch (error) {
    next(error);
  }
}
