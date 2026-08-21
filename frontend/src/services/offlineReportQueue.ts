import { batchSubmitReports, submitReport, type ReportSubmission, type ReportSubmissionResult } from './reportApi';

const QUEUE_KEY = 'truth_uncovered_report_queue';

export type QueueItemStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface QueuedReport {
  queueId: string;
  clientDraftId: string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  status: QueueItemStatus;
  errorMessage?: string;
  syncedReportId?: string;
  payload: ReportSubmission;
}

export function getQueuedReports(): QueuedReport[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      queueId: item.queueId || crypto.randomUUID(),
      clientDraftId: item.clientDraftId || item.queueId || crypto.randomUUID(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      attempts: typeof item.attempts === 'number' ? item.attempts : 0,
      status: item.status || 'pending',
      errorMessage: item.errorMessage,
      syncedReportId: item.syncedReportId,
      payload: item.payload,
    }));
  } catch {
    localStorage.removeItem(QUEUE_KEY);
    return [];
  }
}

function writeQueue(queue: QueuedReport[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('truth-report-queue-change'));
}

export function queueReport(payload: ReportSubmission): QueuedReport {
  const id = crypto.randomUUID();
  const queued: QueuedReport = {
    queueId: id,
    clientDraftId: id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
    payload,
  };
  const current = getQueuedReports();
  writeQueue([...current, queued]);
  return queued;
}

export function updateQueuedReport(queueId: string, updatedFields: Partial<ReportSubmission>): QueuedReport | null {
  const queue = getQueuedReports();
  let updatedItem: QueuedReport | null = null;

  const nextQueue = queue.map((item) => {
    if (item.queueId === queueId) {
      updatedItem = {
        ...item,
        updatedAt: new Date().toISOString(),
        status: 'pending',
        errorMessage: undefined,
        payload: {
          ...item.payload,
          ...updatedFields,
        },
      };
      return updatedItem;
    }
    return item;
  });

  if (updatedItem) {
    writeQueue(nextQueue);
  }
  return updatedItem;
}

export function removeQueuedReport(queueId: string) {
  writeQueue(getQueuedReports().filter((item) => item.queueId !== queueId));
}

export function clearSyncedReports() {
  writeQueue(getQueuedReports().filter((item) => item.status !== 'synced'));
}

export async function syncSingleQueuedReport(queueId: string): Promise<{ success: boolean; error?: string }> {
  if (!navigator.onLine) {
    return { success: false, error: 'Device is offline.' };
  }

  const queue = getQueuedReports();
  const item = queue.find((q) => q.queueId === queueId);
  if (!item) return { success: false, error: 'Draft not found.' };

  // Update status to syncing
  writeQueue(
    queue.map((q) => (q.queueId === queueId ? { ...q, status: 'syncing' as QueueItemStatus } : q)),
  );

  try {
    await submitReport(item.payload);
    const updatedQueue = getQueuedReports().filter((q) => q.queueId !== queueId);
    writeQueue(updatedQueue);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Synchronization failed';
    const nextQueue = getQueuedReports().map((q) =>
      q.queueId === queueId
        ? {
            ...q,
            attempts: q.attempts + 1,
            status: 'failed' as QueueItemStatus,
            errorMessage,
          }
        : q,
    );
    writeQueue(nextQueue);
    return { success: false, error: errorMessage };
  }
}

export async function syncQueuedReports(): Promise<{ synced: ReportSubmissionResult[]; remaining: number }> {
  if (!navigator.onLine) return { synced: [], remaining: getQueuedReports().length };

  const queue = getQueuedReports().filter((q) => q.status !== 'synced');
  if (queue.length === 0) return { synced: [], remaining: 0 };

  // Mark all pending/failed items as syncing
  const syncingQueue = getQueuedReports().map((q) => ({
    ...q,
    status: (q.status === 'synced' ? 'synced' : 'syncing') as QueueItemStatus,
  }));
  writeQueue(syncingQueue);

  try {
    const payloadForBatch = queue.map((item) => ({
      ...item.payload,
      clientDraftId: item.queueId,
    }));
    const batchResponse = await batchSubmitReports(payloadForBatch);

    const currentQueue = getQueuedReports();
    const syncedResults: ReportSubmissionResult[] = [];
    const remainingQueue: QueuedReport[] = [];

    for (const item of currentQueue) {
      const batchResult = batchResponse.results.find((r) => r.clientDraftId === item.queueId);
      if (batchResult && (batchResult.status === 'synced' || batchResult.status === 'duplicate_prevented')) {
        if (batchResult.report) {
          syncedResults.push({
            report: batchResult.report,
            screening: batchResult.screening ?? { duplicateScore: 0, moderationScore: 0, reasons: [], possibleDuplicates: [] },
          });
        }
      } else {
        remainingQueue.push({
          ...item,
          attempts: item.attempts + 1,
          status: 'failed' as QueueItemStatus,
          errorMessage: batchResult?.error || 'Sync failed on server',
        });
      }
    }

    writeQueue(remainingQueue);
    return { synced: syncedResults, remaining: remainingQueue.length };
  } catch {
    // Fallback to individual sync if batch fails
    const currentQueue = getQueuedReports();
    const remaining: QueuedReport[] = [];
    const synced: ReportSubmissionResult[] = [];

    for (const item of currentQueue) {
      if (item.status === 'synced') continue;
      try {
        const res = await submitReport(item.payload);
        synced.push(res);
      } catch (err) {
        remaining.push({
          ...item,
          attempts: item.attempts + 1,
          status: 'failed' as QueueItemStatus,
          errorMessage: err instanceof Error ? err.message : 'Individual sync failed',
        });
      }
    }

    writeQueue(remaining);
    return { synced, remaining: remaining.length };
  }
}
