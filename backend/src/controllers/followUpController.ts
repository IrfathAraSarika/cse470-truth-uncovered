import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { createCaseFollowUp, listCaseFollowUps } from '../models/followUpModel.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const referencePattern = /^TU-[RC]-[A-Z0-9]{10}$/i;

export async function getFollowUps(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const caseId = String(request.params.caseId ?? '');
  if (!uuidPattern.test(caseId) && !referencePattern.test(caseId)) { response.status(400).json({ error: 'Enter a valid case or report reference.' }); return; }
  try {
    const result = await listCaseFollowUps(caseId, request.auth!.userId);
    if (!result) { response.status(404).json({ error: 'Case not found or access denied.' }); return; }
    response.json(result);
  } catch (error) { next(error); }
}

export async function postFollowUp(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const caseId = String(request.params.caseId ?? '');
  const details = typeof request.body.details === 'string' ? request.body.details.trim() : '';
  const parentFollowUpId = request.body.parentFollowUpId === null || request.body.parentFollowUpId === undefined
    ? null
    : String(request.body.parentFollowUpId);
  if (!uuidPattern.test(caseId) && !referencePattern.test(caseId)) { response.status(400).json({ error: 'Enter a valid case or report reference.' }); return; }
  if (details.length < 20 || details.length > 4000) { response.status(400).json({ error: 'Follow-up details must contain 20 to 4000 characters.' }); return; }
  if (parentFollowUpId && !uuidPattern.test(parentFollowUpId)) { response.status(400).json({ error: 'Invalid parent follow-up ID.' }); return; }
  try {
    const followUp = await createCaseFollowUp(request.auth!.userId, caseId, details, Boolean(request.body.hasNewEvidence), parentFollowUpId);
    response.status(201).json({ followUp });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'CASE_ACCESS_DENIED') { response.status(404).json({ error: 'Case not found or access denied.' }); return; }
    if (message === 'FOLLOW_UP_ROLE_DENIED') { response.status(403).json({ error: 'Only administrators, the reporting citizen, or an assigned NGO partner can add follow-ups.' }); return; }
    if (message === 'INVALID_PARENT_FOLLOW_UP') { response.status(400).json({ error: 'The selected parent does not belong to this case.' }); return; }
    next(error);
  }
}
