import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { getAdminReport, listAdminReports, saveReview } from '../models/adminReportModel.js';

export async function getReports(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const status = typeof request.query.status === 'string' ? request.query.status : 'all';
  if (!['all', 'submitted', 'pending_verification', 'verified', 'rejected'].includes(status)) { response.status(400).json({ error: 'Invalid status.' }); return; }
  try { response.json({ reports: await listAdminReports(status) }); } catch (error) { next(error); }
}

export async function getReport(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const reportId = String(request.params.id ?? '');
  try { const result = await getAdminReport(reportId); if (!result) { response.status(404).json({ error: 'Report not found.' }); return; } response.json(result); } catch (error) { next(error); }
}

export async function reviewReport(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const reportId = String(request.params.id ?? '');
  const { decision, notes } = request.body;
  if (!['verified', 'rejected', 'request_evidence'].includes(decision) || typeof notes !== 'string' || notes.trim().length < 3) { response.status(400).json({ error: 'A valid decision and review notes are required.' }); return; }
  try { await saveReview(reportId, request.auth!.userId, decision, notes.trim()); response.status(201).json({ success: true }); } catch (error) { next(error); }
}
