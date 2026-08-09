import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { findCase } from '../models/caseModel.js';

export async function getCase(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const caseId = String(request.params.id ?? '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(caseId)) {
    response.status(400).json({ error: 'Enter a valid case ID.' });
    return;
  }
  try {
    const result = await findCase(caseId, request.auth!.userId, request.auth!.role);
    if (!result) { response.status(404).json({ error: 'Case not found or access denied.' }); return; }
    response.json({ case: result });
  } catch (error) {
    next(error);
  }
}
