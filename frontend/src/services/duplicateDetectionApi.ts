import { apiRequest } from './apiClient';

export interface SimilarityBreakdown {
  textSimilarity: number;
  locationProximity: number;
  categoryMatch: boolean;
  timeProximity: number;
  overallScore: number;
  reasons: string[];
}

export interface DuplicateDetectionItem {
  candidateId: string;
  candidateTitle: string;
  breakdown: SimilarityBreakdown;
}

export interface DuplicateAnalyzeResponse {
  targetReportId: string;
  matchesFound: number;
  detections: DuplicateDetectionItem[];
}

export interface DuplicateQueueItem {
  detection_id: string;
  report_id: string;
  possible_duplicate_report_id: string;
  similarity_score: number;
  detected_at: string;
  report_title: string;
  report_category: string;
  report_status: string;
  duplicate_title: string;
  duplicate_category: string;
  duplicate_status: string;
}

export const analyzeReportDuplicates = (payload: { reportId?: string; title?: string; description?: string; category?: string; district?: string }) =>
  apiRequest<DuplicateAnalyzeResponse>('/duplicate-detection/analyze', { method: 'POST', body: JSON.stringify(payload) });

export const getDuplicateQueue = () =>
  apiRequest<{ queue: DuplicateQueueItem[] }>('/duplicate-detection/queue');

export const resolveDuplicate = (detectionId: string, action: 'merge' | 'dismiss') =>
  apiRequest<{ success: boolean; action: string }>('/duplicate-detection/resolve', { method: 'POST', body: JSON.stringify({ detectionId, action }) });
