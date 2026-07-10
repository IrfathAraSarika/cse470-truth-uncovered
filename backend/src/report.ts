import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

router.post('/reports', async (req: Request, res: Response) => {
  const { citizenId, title, description, category, incidentDateTime, isAnonymous } = req.body;

  if (!citizenId || !title || !description || !category) {
    return res.status(400).json({ error: 'citizenId, title, description, and category are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reports (citizen_id, title, description, category, incident_datetime, is_anonymous, status, submission_date)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
       RETURNING report_id, title, category, status, is_anonymous, submission_date`,
      [citizenId, title, description, category, incidentDateTime || null, isAnonymous]
    );
    res.status(201).json({ report: result.rows[0] });
  } catch (err) {
    console.error('Report submission error:', err);
    res.status(500).json({ error: 'Server error while submitting report' });
  }
});

router.get('/reports', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT report_id, title, description, category, status, is_anonymous, submission_date, flag_count
       FROM reports ORDER BY submission_date DESC`
    );
    res.json({ reports: result.rows });
  } catch (err) {
    console.error('Fetch reports error:', err);
    res.status(500).json({ error: 'Server error while fetching reports' });
  }
});

export default router;