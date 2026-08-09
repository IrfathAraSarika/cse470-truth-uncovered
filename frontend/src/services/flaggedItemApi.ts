import { apiRequest } from './apiClient';

export type FlagReason =
  | 'fraud_or_scam'
  | 'spam'
  | 'duplicate'
  | 'fake_or_misleading'
  | 'inappropriate'
  | 'other';

export const FLAG_REASON_OPTIONS: { value: FlagReason; label: string }[] = [
  { value: 'fraud_or_scam', label: 'Fraud or Scam' },
  { value: 'spam', label: 'Spam' },
  { value: 'duplicate', label: 'Duplicate Report' },
  { value: 'fake_or_misleading', label: 'Fake or Misleading' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'other', label: 'Other' },
];

export interface FlaggableReport {
  report_id: string;
  title: string;
  category: string;
  submission_date: string;
  district: string | null;
}

export interface PublicFlaggedItem {
  report_id: string;
  title: string;
  category: string;
  status: string;
  district: string | null;
  flag_count: number;
  last_flagged_at: string;
}

export interface FlaggedItemQueueEntry {
  flag_id: string;
  report_id: string;
  reason: string;
  flagged_at: string;
  title: string;
  description: string;
  category: string;
  status: string;
  flagged_by: string | null;
}

export const getFlaggableReports = () =>
  apiRequest<{ reports: FlaggableReport[] }>('/flagged-items/reports');

export const getPublicFlaggedReports = () =>
  apiRequest<{ items: PublicFlaggedItem[] }>('/flagged-items/public');

export const createFlaggedItem = (reportId: string, reason: FlagReason, details?: string) =>
  apiRequest<{ success: boolean; flagId: string; severity: number; autoEscalated: boolean }>('/flagged-items', {
    method: 'POST',
    body: JSON.stringify({ reportId, reason, details }),
  });

export const getFlaggedItemQueue = () =>
  apiRequest<{ queue: FlaggedItemQueueEntry[] }>('/flagged-items/queue');

export const resolveFlaggedItem = (flagId: string, decision: 'dismiss' | 'hide') =>
  apiRequest<{ success: boolean; decision: string }>('/flagged-items/resolve', {
    method: 'POST',
    body: JSON.stringify({ flagId, decision }),
  });
