import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthenticatedRequest extends Request { auth?: { userId: string; role: string } }

export function createSession(response: Response, userId: string, role: string) {
  const token = jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: '8h' });
  response.cookie('truth_uncovered_session', token, { httpOnly: true, secure: config.isProduction, sameSite: config.isProduction ? 'none' : 'lax', maxAge: 28_800_000, path: '/' });
}

export function requireAdmin(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const token = request.cookies?.truth_uncovered_session as string | undefined;
  if (!token) { response.status(401).json({ error: 'Authentication required.' }); return; }
  try {
    const auth = jwt.verify(token, config.jwtSecret) as { userId: string; role: string };
    if (auth.role !== 'admin') { response.status(403).json({ error: 'Administrator access required.' }); return; }
    request.auth = auth;
    next();
  } catch { response.status(401).json({ error: 'Session expired or invalid.' }); }
}
