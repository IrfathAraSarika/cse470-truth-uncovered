import { submitReport, type ReportSubmission, type ReportSubmissionResult } from './reportApi';

const QUEUE_KEY = 'truth_uncovered_report_queue';

export interface QueuedReport {
  queueId: string;
  createdAt: string;
  attempts: number;
  payload: ReportSubmission;
}

export function getQueuedReports(): QueuedReport[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed as QueuedReport[] : [];
  } catch {
    localStorage.removeItem(QUEUE_KEY);
    return [];
  }
}

function writeQueue(queue: QueuedReport[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('truth-report-queue-change'));
}

export function queueReport(payload: ReportSubmission) {
  const queued: QueuedReport = {
    queueId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    payload,
  };
  writeQueue([...getQueuedReports(), queued]);
  return queued;
}

export function removeQueuedReport(queueId: string) {
  writeQueue(getQueuedReports().filter((item) => item.queueId !== queueId));
}

export async function syncQueuedReports(): Promise<{ synced: ReportSubmissionResult[]; remaining: number }> {
  if (!navigator.onLine) return { synced: [], remaining: getQueuedReports().length };

  const queue = getQueuedReports();
  const remaining: QueuedReport[] = [];
  const synced: ReportSubmissionResult[] = [];

  for (const item of queue) {
    try {
      synced.push(await submitReport(item.payload));
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  writeQueue(remaining);
  return { synced, remaining: remaining.length };
}
