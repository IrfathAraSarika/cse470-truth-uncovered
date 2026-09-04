import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import {
  assignReportToInstitution,
  createFameShameRecord,
  createInstitution,
  getHeatmapAggregates,
  getInstitutionMetrics,
  listFameShame,
  persistInstitutionMetrics,
  reviewFameShameRecord,
  updateCaseOutcome,
} from '../models/transparencyModel.js';
import { buildHeatmapPoints } from '../services/heatmapService.js';

const categories = new Set(['corruption', 'bribery', 'dowry', 'harassment', 'extortion', 'land_grabbing', 'hazard', 'antisocial_activity', 'other']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reportReferencePattern = /^TU-R-[A-Z0-9]{10}$/i;
const caseOrReportReferencePattern = /^TU-[CR]-[A-Z0-9]{10}$/i;

export async function getHeatmap(request: Request, response: Response, next: NextFunction) {
  const category = typeof request.query.category === 'string' && request.query.category !== 'all' ? request.query.category : null;
  const region = typeof request.query.region === 'string' && request.query.region !== 'all' ? request.query.region.trim() : null;
  const months = Number(request.query.months ?? 12);
  if (category && !categories.has(category)) { response.status(400).json({ error: 'Invalid report category.' }); return; }
  if (!Number.isInteger(months) || months < 1 || months > 60) { response.status(400).json({ error: 'Time range must be between 1 and 60 months.' }); return; }
  try {
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - months);
    const points = buildHeatmapPoints(await getHeatmapAggregates(category, region, since));
    response.json({ points, summary: { reports: points.reduce((sum, point) => sum + point.reportCount, 0), regions: new Set(points.map((point) => point.district)).size } });
  } catch (error) { next(error); }
}

export async function getRankings(_request: Request, response: Response, next: NextFunction) {
  try {
    const institutions = await getInstitutionMetrics();
    response.json({ institutions: institutions.sort((left, right) => right.redFlagScore - left.redFlagScore || right.verifiedReports - left.verifiedReports) });
  } catch (error) { next(error); }
}

export async function getFameShame(request: Request, response: Response, next: NextFunction) {
  const type = typeof request.query.type === 'string' && request.query.type !== 'all' ? request.query.type : null;
  if (type && !['fame', 'shame'].includes(type)) { response.status(400).json({ error: 'Invalid wall type.' }); return; }
  try { response.json({ records: await listFameShame(type) }); } catch (error) { next(error); }
}

export async function adminGetFameShame(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try { response.json({ records: await listFameShame(null, true) }); } catch (error) { next(error); }
}

export async function adminCreateInstitution(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const name = typeof request.body.name === 'string' ? request.body.name.trim() : '';
  const type = typeof request.body.type === 'string' && request.body.type.trim() ? request.body.type.trim() : null;
  const address = typeof request.body.address === 'string' && request.body.address.trim() ? request.body.address.trim() : null;
  if (name.length < 3 || name.length > 180) { response.status(400).json({ error: 'Institution name must contain 3 to 180 characters.' }); return; }
  try { response.status(201).json({ institution: await createInstitution(name, type, address) }); } catch (error) { next(error); }
}

export async function adminAssignInstitution(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const reportId = String(request.params.reportId ?? '');
  const institutionId = String(request.body.institutionId ?? '');
  if ((!uuidPattern.test(reportId) && !reportReferencePattern.test(reportId)) || !uuidPattern.test(institutionId)) { response.status(400).json({ error: 'A valid report reference and institution ID are required.' }); return; }
  try {
    const assignment = await assignReportToInstitution(reportId, institutionId);
    if (!assignment) { response.status(404).json({ error: 'Report not found.' }); return; }
    response.json({ assignment });
  } catch (error) { next(error); }
}

export async function adminRecalculateScores(_request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const metrics = await getInstitutionMetrics();
    response.json({ updated: await persistInstitutionMetrics(metrics), institutions: metrics });
  } catch (error) { next(error); }
}

export async function adminUpdateCaseOutcome(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const caseOrReportId = String(request.params.caseOrReportId ?? '');
  const status = String(request.body.status ?? '');
  const resolutionNotes = typeof request.body.resolutionNotes === 'string' ? request.body.resolutionNotes.trim() : '';
  const closedAtText = typeof request.body.closedAt === 'string' ? request.body.closedAt : '';
  const closedAt = closedAtText ? new Date(closedAtText) : null;
  if (!uuidPattern.test(caseOrReportId) && !caseOrReportReferencePattern.test(caseOrReportId)) { response.status(400).json({ error: 'A valid case or report reference is required.' }); return; }
  if (!['received', 'verified', 'under_investigation', 'action_taken', 'closed'].includes(status)) { response.status(400).json({ error: 'Select a valid case status.' }); return; }
  if (resolutionNotes.length < 10 || resolutionNotes.length > 2000) { response.status(400).json({ error: 'Resolution notes must contain 10 to 2000 characters.' }); return; }
  if (status === 'closed' && (!closedAt || Number.isNaN(closedAt.getTime()))) { response.status(400).json({ error: 'A valid closure date and time is required when closing a case.' }); return; }
  try {
    const caseRecord = await updateCaseOutcome(caseOrReportId, status, resolutionNotes, status === 'closed' ? closedAt : null);
    if (!caseRecord) { response.status(404).json({ error: 'Case not found for that case or report ID.' }); return; }
    const metrics = await getInstitutionMetrics();
    response.json({ case: caseRecord, updated: await persistInstitutionMetrics(metrics), institutions: metrics });
  } catch (error) {
    if ((error as { code?: string }).code === '23514') { response.status(400).json({ error: 'Closure time cannot be earlier than the case opening time.' }); return; }
    next(error);
  }
}

export async function adminCreateFameShame(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const type = request.body.type;
  const name = typeof request.body.name === 'string' ? request.body.name.trim() : '';
  const description = typeof request.body.description === 'string' ? request.body.description.trim() : '';
  const institutionId = request.body.institutionId ? String(request.body.institutionId) : null;
  const caseId = request.body.caseId ? String(request.body.caseId) : null;
  if (!['fame', 'shame'].includes(type)) { response.status(400).json({ error: 'Type must be fame or shame.' }); return; }
  if (name.length < 3 || name.length > 180 || description.length < 20 || description.length > 2000) { response.status(400).json({ error: 'Provide a valid name and a description between 20 and 2000 characters.' }); return; }
  if ((institutionId && !uuidPattern.test(institutionId)) || (caseId && !uuidPattern.test(caseId) && !/^TU-C-[A-Z0-9]{10}$/i.test(caseId))) { response.status(400).json({ error: 'Invalid institution ID or case reference.' }); return; }
  try { response.status(201).json({ record: await createFameShameRecord(type, name, description, institutionId, caseId) }); } catch (error) { next(error); }
}

export async function adminReviewFameShame(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const recordId = String(request.params.recordId ?? '');
  if (!uuidPattern.test(recordId) || typeof request.body.approved !== 'boolean') { response.status(400).json({ error: 'Valid record ID and approval decision are required.' }); return; }
  try {
    const record = await reviewFameShameRecord(recordId, request.auth!.userId, request.body.approved);
    if (!record) { response.status(404).json({ error: 'Record or administrator profile not found.' }); return; }
    response.json({ record });
  } catch (error) { next(error); }
}
