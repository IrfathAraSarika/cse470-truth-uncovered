import { apiRequest } from './apiClient';

export interface ReportSubmission {
  citizenId: string;
  title: string;
  description: string;
  category: string;
  incidentDateTime: string | null;
  isAnonymous: boolean;
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

export const submitReport = (report: ReportSubmission) =>
  apiRequest<{ report: { report_id: string } }>('/reports', { method: 'POST', body: JSON.stringify(report) });

export const getMyReports = (citizenId: string) =>
  apiRequest<{ reports: Report[] }>(`/reports/my?citizenId=${encodeURIComponent(citizenId)}`);

