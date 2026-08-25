import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import * as model from '../models/accountabilityModel.js';
import { normalizePublicKeywords, redactPublicText } from '../services/publicRedactionService.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reference = /^TU-[RCAW]-[A-Z0-9]{10}$/i;
const validReference = (value: string) => uuid.test(value) || reference.test(value);
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const databaseCode = (error: unknown) => (error as { code?: string }).code;

export async function getMySafety(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try { response.json({ checkIns: await model.listMySafetyCheckIns(request.auth!.userId) }); } catch (error) { next(error); }
}
export async function postSafety(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const caseReference = text(request.body.caseReference); const scheduledFor = new Date(request.body.scheduledFor); const message = text(request.body.privateMessage);
  if (caseReference && !validReference(caseReference)) { response.status(400).json({ error: 'Enter a valid case or report reference.' }); return; }
  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() < Date.now() - 60_000) { response.status(400).json({ error: 'Choose a future check-in time.' }); return; }
  if (message.length > 1000) { response.status(400).json({ error: 'Private message is too long.' }); return; }
  try {
    const ownedCase = caseReference ? await model.resolveOwnedCase(caseReference, request.auth!.userId) : null;
    if (caseReference && !ownedCase) { response.status(404).json({ error: 'Case not found or not owned by this account.' }); return; }
    response.status(201).json({ checkIn: await model.createSafetyCheckIn(request.auth!.userId, ownedCase?.case_id ?? null, scheduledFor, message) });
  } catch (error) { if ((error as Error).message === 'CITIZEN_REQUIRED') response.status(403).json({ error: 'A citizen account is required.' }); else next(error); }
}
export async function patchSafetyResponse(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const id = String(request.params.id); const status = request.body.status; const message = text(request.body.privateMessage);
  if (!uuid.test(id) || !['safe', 'needs_help'].includes(status) || message.length > 1000) { response.status(400).json({ error: 'Provide a valid safety response.' }); return; }
  try { const item = await model.respondSafetyCheckIn(request.auth!.userId, id, status, message); if (!item) response.status(404).json({ error: 'Check-in not found.' }); else response.json({ checkIn: item }); } catch (error) { next(error); }
}
export async function getAdminSafety(_request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.json({ checkIns: await model.listAdminSafetyCheckIns() }); } catch (error) { next(error); } }
export async function patchAdminSafety(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const id = String(request.params.id); const note = text(request.body.resolutionNote);
  if (!uuid.test(id) || note.length < 10 || note.length > 1000) { response.status(400).json({ error: 'A resolution note of 10 to 1000 characters is required.' }); return; }
  try { const item = await model.resolveSafetyCheckIn(request.auth!.userId, id, note); if (!item) response.status(404).json({ error: 'Check-in not found.' }); else response.json({ checkIn: item }); } catch (error) { next(error); }
}

export async function getMyAppeals(request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.json({ appeals: await model.listMyAppeals(request.auth!.userId) }); } catch (error) { next(error); } }
export async function postAppeal(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const caseReference = text(request.body.caseReference); const reason = text(request.body.reason); const requested = text(request.body.requestedOutcome);
  if (!validReference(caseReference) || reason.length < 30 || reason.length > 3000 || requested.length < 10 || requested.length > 300) { response.status(400).json({ error: 'Provide a valid reference, detailed reason, and requested outcome.' }); return; }
  try {
    const ownedCase = await model.resolveOwnedCase(caseReference, request.auth!.userId);
    if (!ownedCase) { response.status(404).json({ error: 'Case not found or not owned by this account.' }); return; }
    if (!['action_taken', 'closed'].includes(ownedCase.status)) { response.status(409).json({ error: 'Appeals become available after action is recorded or the case is closed.' }); return; }
    response.status(201).json({ appeal: await model.createAppeal(request.auth!.userId, ownedCase.case_id, reason, requested) });
  } catch (error) { if (databaseCode(error) === '23505') response.status(409).json({ error: 'An active appeal already exists for this case.' }); else next(error); }
}
export async function getAdminAppeals(_request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.json({ appeals: await model.listAdminAppeals() }); } catch (error) { next(error); } }
export async function patchAdminAppeal(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const id = String(request.params.id); const status = request.body.status; const notes = text(request.body.adminNotes);
  if (!uuid.test(id) || !['under_review', 'approved', 'rejected'].includes(status) || notes.length < 10 || notes.length > 2000) { response.status(400).json({ error: 'Provide a valid decision and review notes.' }); return; }
  try { const item = await model.reviewAppeal(request.auth!.userId, id, status, notes); if (!item) response.status(404).json({ error: 'Appeal not found or already finalized.' }); else response.json({ appeal: item }); } catch (error) { next(error); }
}

export async function getSubscriptions(request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.json({ subscriptions: await model.listSubscriptions(request.auth!.userId) }); } catch (error) { next(error); } }
export async function postSubscription(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const district = text(request.body.district); const category = text(request.body.category) || null; const channel = request.body.channel ?? 'in_app'; const frequency = request.body.frequency ?? 'instant';
  const categories = ['corruption', 'bribery', 'dowry', 'harassment', 'extortion', 'land_grabbing', 'hazard', 'antisocial_activity', 'other'];
  if (district.length < 2 || district.length > 100 || (category && !categories.includes(category)) || channel !== 'in_app' || frequency !== 'instant') { response.status(400).json({ error: 'Provide valid instant in-app regional alert settings.' }); return; }
  try { response.status(201).json({ subscription: await model.createSubscription(request.auth!.userId, district, category, channel, frequency) }); } catch (error) { next(error); }
}
export async function removeSubscription(request: AuthenticatedRequest, response: Response, next: NextFunction) { const id = String(request.params.id); if (!uuid.test(id)) { response.status(400).json({ error: 'Invalid subscription.' }); return; } try { if (!await model.deleteSubscription(request.auth!.userId, id)) response.status(404).json({ error: 'Subscription not found.' }); else response.status(204).end(); } catch (error) { next(error); } }
export async function getRegionalNotifications(request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.json({ notifications: await model.listMyRegionalNotifications(request.auth!.userId) }); } catch (error) { next(error); } }
export async function readRegionalNotification(request: AuthenticatedRequest, response: Response, next: NextFunction) { const id = String(request.params.id); try { if (!uuid.test(id) || !await model.markRegionalNotificationRead(request.auth!.userId, id)) response.status(404).json({ error: 'Notification not found.' }); else response.status(204).end(); } catch (error) { next(error); } }

export async function getMyWitnesses(request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.json({ contributions: await model.listMyWitnessContributions(request.auth!.userId) }); } catch (error) { next(error); } }
export async function postWitness(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const reportReference = text(request.body.reportReference); const relationship = text(request.body.relationship); const statement = text(request.body.statement); const evidenceUrl = text(request.body.evidenceUrl) || null;
  if (!validReference(reportReference) || relationship.length < 3 || relationship.length > 120 || statement.length < 30 || statement.length > 5000 || (evidenceUrl && !/^https:\/\//i.test(evidenceUrl))) { response.status(400).json({ error: 'Provide a valid report reference, relationship, statement, and optional HTTPS evidence link.' }); return; }
  try {
    const report = await model.resolveWitnessReport(reportReference); if (!report) { response.status(404).json({ error: 'Verified report not found.' }); return; }
    response.status(201).json({ contribution: await model.createWitnessContribution(request.auth!.userId, report.report_id, relationship, statement, evidenceUrl, Boolean(request.body.consentToContact)) });
  } catch (error) {
    if ((error as Error).message === 'OWNER_CANNOT_WITNESS') response.status(409).json({ error: 'Use case follow-ups for your own report.' });
    else if (databaseCode(error) === '23505') response.status(409).json({ error: 'You already contributed to this report.' }); else next(error);
  }
}
export async function getAdminWitnesses(_request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.json({ contributions: await model.listAdminWitnessContributions() }); } catch (error) { next(error); } }
export async function patchAdminWitness(request: AuthenticatedRequest, response: Response, next: NextFunction) { const id = String(request.params.id); const status = request.body.status; const notes = text(request.body.adminNotes); if (!uuid.test(id) || !['under_review', 'accepted', 'rejected'].includes(status) || notes.length < 5 || notes.length > 2000) { response.status(400).json({ error: 'Provide a valid witness review.' }); return; } try { const item = await model.reviewWitnessContribution(request.auth!.userId, id, status, notes); if (!item) response.status(404).json({ error: 'Contribution not found.' }); else response.json({ contribution: item }); } catch (error) { next(error); } }

export async function patchPublication(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const reportReference = String(request.params.reference); const summary = redactPublicText(request.body.summary); const victimContext = redactPublicText(request.body.victimContext, 300); const keywords = normalizePublicKeywords(request.body.keywords);
  if (!validReference(reportReference) || summary.length < 30 || summary.length > 1200) { response.status(400).json({ error: 'A valid report reference and public summary of 30 to 1200 characters are required.' }); return; }
  try { const report = await model.publishReportMetadata(reportReference, summary, victimContext, keywords, Boolean(request.body.isPublic)); if (!report) response.status(404).json({ error: 'Report not found.' }); else response.json({ report }); } catch (error) { next(error); }
}

export async function getInstitutionNotices(_request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.json({ notices: await model.listInstitutionNotifications() }); } catch (error) { next(error); } }
export async function postInstitutionNotice(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const ref = text(request.body.reference); const officeName = text(request.body.officeName); const websiteUrl = text(request.body.websiteUrl) || null; const contactEmail = text(request.body.contactEmail) || null; const subject = redactPublicText(request.body.subject, 200); const publicMessage = redactPublicText(request.body.publicMessage, 2000); const method = request.body.method;
  if (!validReference(ref) || officeName.length < 3 || subject.length < 5 || publicMessage.length < 30 || !['website', 'email', 'letter', 'phone'].includes(method) || (websiteUrl && !/^https:\/\//i.test(websiteUrl)) || (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))) { response.status(400).json({ error: 'Provide valid office notification details. Messages must contain no confidential identities.' }); return; }
  try { const notice = await model.createInstitutionNotification(request.auth!.userId, ref, { officeName, websiteUrl, contactEmail, subject, publicMessage, method }); if (!notice) response.status(404).json({ error: 'Report or case not found.' }); else response.status(201).json({ notice }); } catch (error) { next(error); }
}
export async function patchInstitutionNotice(request: AuthenticatedRequest, response: Response, next: NextFunction) { const id = String(request.params.id); const status = request.body.status; const externalReference = text(request.body.externalReference) || null; if (!uuid.test(id) || !['draft', 'sent', 'acknowledged', 'failed', 'closed'].includes(status)) { response.status(400).json({ error: 'Provide a valid notice status.' }); return; } try { const notice = await model.updateInstitutionNotification(request.auth!.userId, id, status, externalReference); if (!notice) response.status(404).json({ error: 'Notice not found.' }); else response.json({ notice }); } catch (error) { next(error); } }
