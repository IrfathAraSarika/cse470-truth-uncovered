import { apiRequest } from './apiClient';

export interface ReportSubmission {
  citizenId?: string;
  title: string;
  description: string;
  category: string;
  incidentDateTime: string | null;
  isAnonymous: boolean;
  district?: string;
  address?: string;
}

export interface Report {
  report_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  is_anonymous: boolean;
  incident_datetime: string | null;
  submission_date: string;
  updated_at: string | null;
}

export interface ReportScreening {
  duplicateScore: number;
  moderationScore: number;
  reasons: string[];
  possibleDuplicates: Array<{ reportId: string; title: string; score: number }>;
}

export interface ReportSubmissionResult {
  report: { report_id: string; status: string };
  screening: ReportScreening;
}

export const submitReport = (report: ReportSubmission) =>
  apiRequest<ReportSubmissionResult>('/reports', { method: 'POST', body: JSON.stringify(report) });

export const getMyReports = () =>
  apiRequest<{ reports: Report[] }>('/reports/my');
