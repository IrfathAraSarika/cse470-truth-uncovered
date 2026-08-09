import { apiRequest } from './apiClient';

export interface AdminReport { report_id: string; title: string; description: string; category: string; status: string; is_anonymous: boolean; submission_date: string; duplicate_score: number; evidence_count: number; review_count: number; flag_count: number }
export interface AdminReportDetail {
  report: AdminReport;
  evidence: Array<{ evidence_id: string; file_type: string; file_size_bytes: number | null }>;
  reviews: Array<{ review_id: string; decision: string; notes: string; admin_name: string; created_at: string }>;
  flags: Array<{ flag_id: string; reason: string; flagged_at: string; is_resolved: boolean }>;
  duplicates: Array<{ detection_id: string; similarity_score: number; detected_at: string; report_id: string; title: string }>;
}

export const getAdminReports = (status: string) => apiRequest<{ reports: AdminReport[] }>(`/admin/reports?status=${status}`);
export const getAdminReport = (id: string) => apiRequest<AdminReportDetail>(`/admin/reports/${id}`);
export const submitAdminReview = (id: string, decision: string, notes: string) => apiRequest(`/admin/reports/${id}/reviews`, { method: 'POST', body: JSON.stringify({ decision, notes }) });
