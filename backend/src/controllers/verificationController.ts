import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import {
  getVerificationRequest,
  getVerificationStatus,
  listVerificationRequests,
  reviewVerification,
  submitVerification,
} from '../models/verificationModel.js';

const MAX_PHOTO_LENGTH = 8_000_000; // ~8 MB of base64 data.

// Citizen: read their own verification status.
export async function getMyVerification(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) { response.status(401).json({ error: 'Authentication required.' }); return; }
  try {
    const status = await getVerificationStatus(request.auth.userId);
    if (!status) { response.status(404).json({ error: 'A citizen profile is required.' }); return; }
    response.json(status);
  } catch (error) { next(error); }
}

// Citizen: submit or re-submit an NID photo for verification.
export async function submitMyVerification(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.auth) { response.status(401).json({ error: 'Authentication required.' }); return; }
  const { nidNumber, nidPhoto } = request.body ?? {};
  if (typeof nidNumber !== 'string' || nidNumber.trim().length < 6) {
    response.status(400).json({ error: 'A valid NID number is required.' });
    return;
  }
  if (typeof nidPhoto !== 'string' || !nidPhoto.startsWith('data:image/')) {
    response.status(400).json({ error: 'A photo of your NID is required.' });
    return;
  }
  if (nidPhoto.length > MAX_PHOTO_LENGTH) {
    response.status(400).json({ error: 'The NID photo is too large. Please upload an image under 5 MB.' });
    return;
  }
  try {
    const current = await getVerificationStatus(request.auth.userId);
    if (!current) { response.status(404).json({ error: 'A citizen profile is required.' }); return; }
    if (current.status === 'pending') {
      response.status(409).json({ error: 'Your verification request is already under review.' });
      return;
    }
    if (current.status === 'verified') {
      response.status(409).json({ error: 'Your account is already verified.' });
      return;
    }
    await submitVerification(request.auth.userId, nidNumber.trim(), nidPhoto);
    response.status(201).json({ success: true, status: 'pending' });
  } catch (error) { next(error); }
}

// Admin: list verification requests.
export async function getVerificationRequests(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const status = typeof request.query.status === 'string' ? request.query.status : 'all';
  if (!['all', 'pending', 'verified', 'rejected'].includes(status)) {
    response.status(400).json({ error: 'Invalid status filter.' });
    return;
  }
  try { response.json({ requests: await listVerificationRequests(status) }); } catch (error) { next(error); }
}

// Admin: view a single request (with photo).
export async function getVerificationRequestDetail(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const citizenId = String(request.params.id ?? '');
  try {
    const detail = await getVerificationRequest(citizenId);
    if (!detail) { response.status(404).json({ error: 'Verification request not found.' }); return; }
    response.json(detail);
  } catch (error) { next(error); }
}

// Admin: approve or reject a request.
export async function reviewVerificationRequest(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const citizenId = String(request.params.id ?? '');
  const { decision, notes } = request.body ?? {};
  if (!['verified', 'rejected'].includes(decision)) {
    response.status(400).json({ error: 'A valid decision (verified or rejected) is required.' });
    return;
  }
  if (decision === 'rejected' && (typeof notes !== 'string' || notes.trim().length < 3)) {
    response.status(400).json({ error: 'Please provide a reason when rejecting a request.' });
    return;
  }
  const trimmedNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;
  try {
    await reviewVerification(citizenId, request.auth!.userId, decision, trimmedNotes);
    response.status(201).json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_NOT_PENDING') {
      response.status(409).json({ error: 'This request is no longer pending review.' });
      return;
    }
    next(error);
  }
}
