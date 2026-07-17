import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { findCitizenByEmail, createCitizen } from '../models/signupModel';

const SALT_ROUNDS = 12;

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await findCitizenByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const citizen = await createCitizen(name, email, passwordHash);

    return res.status(201).json({
      citizen: { id: citizen.userID, name: citizen.fullName, email: citizen.email },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}