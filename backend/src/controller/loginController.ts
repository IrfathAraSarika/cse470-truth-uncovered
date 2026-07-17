import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findCitizenByEmail } from '../models/authModel';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const citizen = await findCitizenByEmail(email);
    if (!citizen) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, citizen.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: citizen.userID, email: citizen.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Login.tsx does: const data = await res.json(); localStorage.setItem('citizen', JSON.stringify(data.citizen))
    return res.status(200).json({
      citizen: { id: citizen.userID, name: citizen.fullName, email: citizen.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}