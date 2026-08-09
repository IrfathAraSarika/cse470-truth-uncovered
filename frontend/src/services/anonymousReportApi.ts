import { apiRequest } from './apiClient';
import type { ReportScreening } from './reportApi';

export interface AnonymousReportSubmission {
  title: string;
  description: string;
  category: string;
  incidentDateTime: string | null;
  district: string | null;
  address: string | null;
}

export interface AnonymousReportResult {
  anonymous_report_id: string;
  tracking_code: string;
  title: string;
  category: string;
  status: string;
  district: string | null;
  submission_date: string;
  updated_at: string;
}

export interface AnonymousReportSubmissionResult {
  report: AnonymousReportResult;
  screening: ReportScreening;
}

export const submitAnonymousReport = (report: AnonymousReportSubmission) =>
  apiRequest<AnonymousReportSubmissionResult>('/anonymous-reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });

export const trackAnonymousReport = (trackingCode: string) =>
  apiRequest<{ report: AnonymousReportResult }>(
    `/anonymous-reports/track/${encodeURIComponent(trackingCode.trim())}`,
  );
