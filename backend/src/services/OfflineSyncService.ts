import { OfflineSyncStore } from '../models/OfflineSync.js';

export async function startSync(sourceId: string) {
  // create record
  const record = OfflineSyncStore.create({ sourceId, status: 'running', startedAt: new Date() });

  try {
    // TODO: replace this placeholder with actual sync logic
    // Example: fetch data from offline source, normalize, store, run duplicate detection, etc.
    // await doActualSyncWork(sourceId);

    // mark success
    record.status = 'done';
    record.finishedAt = new Date();
    return record;
  } catch (err: any) {
    record.status = 'failed';
    record.error = err?.message ?? String(err);
    record.finishedAt = new Date();
    throw err;
  }
}

export async function getSyncStatus(id: string) {
  return OfflineSyncStore.findById(id);
}

export async function listRecentSyncs(limit = 50) {
  return OfflineSyncStore.recent(limit);
}
