import { Request, Response } from 'express';
import * as syncService from '../services/OfflineSyncService.js';

export async function startHandler(req: Request, res: Response) {
  const { sourceId } = req.body;
  if (!sourceId) return res.status(400).json({ error: 'sourceId required' });

  try {
    const record = await syncService.startSync(sourceId);
    return res.status(201).json(record);
  } catch (err: any) {
    console.error('sync start error', err);
    return res.status(500).json({ error: 'sync_failed', details: err?.message });
  }
}

export async function statusHandler(req: Request, res: Response) {
  const id = String(req.params.id ?? '');
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const status = await syncService.getSyncStatus(id);
    if (!status) return res.status(404).json({ error: 'not_found' });
    res.json(status);
  } catch (err: any) {
    console.error('sync status error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}

export async function listHandler(req: Request, res: Response) {
  try {
    const items = await syncService.listRecentSyncs(100);
    res.json(items);
  } catch (err: any) {
    console.error('list syncs error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}
