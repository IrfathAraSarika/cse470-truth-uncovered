import type { NextFunction, Request, Response } from 'express';
import { createAccount } from '../models/signupModel.js';

export async function signup(request: Request, response: Response, next: NextFunction) {
  const { name, email, password } = request.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (typeof name !== 'string' || name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { response.status(400).json({ error: 'Enter a valid name and email.' }); return; }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) { response.status(400).json({ error: 'Password must contain between 8 and 72 characters.' }); return; }
  try { response.status(201).json({ userId: await createAccount(name.trim(), normalizedEmail, password) }); }
  catch (error) { if ((error as { code?: string }).code === '23505') { response.status(409).json({ error: 'An account with that email already exists.' }); return; } next(error); }
}
