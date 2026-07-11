import { apiRequest } from './apiClient';

export interface ReportSubmission {
  citizenId: string;
  title: string;
  description: string;
  category: string;
  incidentDateTime: string | null;
  isAnonymous: boolean;
}

export const submitReport = (report: ReportSubmission) =>
  apiRequest<{ report: { report_id: string } }>('/reports', { method: 'POST', body: JSON.stringify(report) });
