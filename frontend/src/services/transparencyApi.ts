import { apiRequest } from './apiClient';

export interface HeatmapPoint {
  district: string;
  category: string;
  reportCount: number;
  latitude: number;
  longitude: number;
  severityIndex: number;
  latestReportAt: string;
  usedDistrictCenter: boolean;
}

export interface InstitutionMetric {
  institutionId: string;
  name: string;
  type: string | null;
  address: string | null;
  verifiedReports: number;
  totalCases: number;
  actionedCases: number;
  closedCases: number;
  averageResolutionDays: number | null;
  actionTakenRate: number;
  trustScore: number;
  redFlagScore: number;
}

export interface FameShameRecord {
  record_id: string;
  type: 'fame' | 'shame';
  name: string;
  description: string;
  date_added: string;
  is_approved: boolean;
  review_status: 'pending' | 'approved' | 'rejected';
  institution_id: string | null;
  institution_name: string | null;
  case_id: string | null;
}

export const getHeatmap = (category: string, region: string, months: number) => {
  const params = new URLSearchParams({ category, region, months: String(months) });
  return apiRequest<{ points: HeatmapPoint[]; summary: { reports: number; regions: number } }>(`/public/heatmap?${params}`);
};

export const getInstitutionRankings = () => apiRequest<{ institutions: InstitutionMetric[] }>('/public/institutions/rankings');
export const getFameShame = (type: string) => apiRequest<{ records: FameShameRecord[] }>(`/public/fame-shame?type=${encodeURIComponent(type)}`);

export const createInstitution = (name: string, type: string, address: string) => apiRequest<{ institution: { institution_id: string; name: string } }>('/admin/transparency/institutions', {
  method: 'POST', body: JSON.stringify({ name, type, address }),
});
export const assignInstitution = (reportId: string, institutionId: string) => apiRequest<{ assignment: unknown }>(`/admin/transparency/reports/${encodeURIComponent(reportId)}/institution`, {
  method: 'POST', body: JSON.stringify({ institutionId }),
});
export const recalculateInstitutionScores = () => apiRequest<{ updated: number; institutions: InstitutionMetric[] }>('/admin/transparency/institutions/recalculate', { method: 'POST' });
export const updateCaseOutcome = (caseOrReportId: string, status: string, resolutionNotes: string, closedAt: string | null) =>
  apiRequest<{ case: { case_id: string; report_id: string; status: string }; updated: number; institutions: InstitutionMetric[] }>(`/admin/transparency/cases/${encodeURIComponent(caseOrReportId)}/outcome`, {
    method: 'PATCH', body: JSON.stringify({ status, resolutionNotes, closedAt }),
  });

export const getAdminFameShame = () => apiRequest<{ records: FameShameRecord[] }>('/admin/transparency/fame-shame');
export const createFameShame = (payload: { type: 'fame' | 'shame'; name: string; description: string; institutionId: string | null; caseId: string | null }) =>
  apiRequest<{ record: FameShameRecord }>('/admin/transparency/fame-shame', { method: 'POST', body: JSON.stringify(payload) });
export const reviewFameShame = (recordId: string, approved: boolean) => apiRequest<{ record: FameShameRecord }>(`/admin/transparency/fame-shame/${encodeURIComponent(recordId)}/review`, {
  method: 'POST', body: JSON.stringify({ approved }),
});
