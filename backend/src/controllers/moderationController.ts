import { Request, Response } from 'express';
import * as moderationService from '../services/moderationService.js';
import { FlaggedItemStore } from '../models/FlaggedItem.js';

export async function checkHandler(req: Request, res: Response) {
  try {
    const { contentId, authorId, text, metadata } = req.body;
    const reporterIp = req.ip;
    const result = await moderationService.analyzeAndFlag({
      contentId,
      authorId,
      text,
      metadata,
      reporterIp,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}

export async function reportHandler(req: Request, res: Response) {
  try {
    const { contentId, authorId, text, reason } = req.body;
    const reporterIp = req.ip;
    const result = await moderationService.analyzeAndFlag({
      contentId,
      authorId,
      text,
      reason,
      reporterIp,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}

// admin-only
export async function listFlagsHandler(req: Request, res: Response) {
  try {
    const flags = FlaggedItemStore.recent(200);
    res.json(flags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}

export async function verifyFlagHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id ?? '');
    const { verified, note } = req.body;
    const updated = await moderationService.adminVerify(id, Boolean(verified), note);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
}
