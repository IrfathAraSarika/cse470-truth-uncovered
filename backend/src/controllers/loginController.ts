import type { NextFunction, Request, Response } from 'express';
import { authenticate } from '../models/loginModel.js';
import { createSession } from '../middlewares/authMiddleware.js';

export async function login(request: Request, response: Response, next: NextFunction) {
  const { email, password } = request.body;
  if (typeof email !== 'string' || typeof password !== 'string') { response.status(400).json({ error: 'Email and password are required.' }); return; }
  try {
    const account = await authenticate(email.trim().toLowerCase(), password);
    if (!account) { response.status(401).json({ error: 'Invalid email or password.' }); return; }
    createSession(response, account.user_id, account.role);
    response.json({ user: { user_id: account.user_id, name: account.full_name, email: account.email, role: account.role }, citizen: account.citizen_id ? { citizen_id: account.citizen_id, name: account.full_name, email: account.email } : null });
  } catch (error) { next(error); }
}
