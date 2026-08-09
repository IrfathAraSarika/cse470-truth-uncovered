import { OfflineSync } from '../models/OfflineSync';

export async function startSync(sourceId: string) {
  // create record
  const record = await OfflineSync.create({ sourceId, status: 'running', startedAt: new Date() });

  try {
    // TODO: replace this placeholder with actual sync logic
    // Example: fetch data from offline source, normalize, store, run duplicate detection, etc.
    // await doActualSyncWork(sourceId);

    // mark success
    record.status = 'done';
    record.finishedAt = new Date();
    await record.save();
    return record;
  } catch (err: any) {
    record.status = 'failed';
    record.error = err?.message ?? String(err);
    record.finishedAt = new Date();
    await record.save();
    throw err;
  }
}

export async function getSyncStatus(id: string) {
  return OfflineSync.findById(id).lean().exec();
}

export async function listRecentSyncs(limit = 50) {
  return OfflineSync.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
}
