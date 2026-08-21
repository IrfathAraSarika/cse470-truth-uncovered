import { apiRequest } from './apiClient';

export interface ModerationRiskBreakdown {
  capsScore: number;
  linkSpamScore: number;
  gibberishScore: number;
  fraudScamScore: number;
  totalRiskScore: number;
  isAutoHidden: boolean;
  reasons: string[];
}

export interface ModerationQueueItem {
  flag_id: string;
  target_type: string;
  target_id: string;
  report_id: string;
  reason: string;
  flagged_at: string;
  is_resolved: boolean;
  title: string;
  description: string;
  category: string;
  status: string;
  duplicate_score: number;
}

export const getModerationQueue = () =>
  apiRequest<{ queue: ModerationQueueItem[] }>('/moderation/queue');

export const scanReportForFraud = (title: string, description: string, category?: string) =>
  apiRequest<{ risk: ModerationRiskBreakdown }>('/moderation/scan', { method: 'POST', body: JSON.stringify({ title, description, category }) });

export const resolveModerationFlag = (flagId: string, decision: 'approve' | 'reject_spam') =>
  apiRequest<{ success: boolean; status: string }>('/moderation/resolve', { method: 'POST', body: JSON.stringify({ flagId, decision }) });
