import { apiRequest } from './apiClient';

export interface CaseRecord {
  case_id: string;
  report_id: string;
  report_title: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  resolution_notes: string | null;
  updated_at: string;
}

export const getCase = (caseId: string) => apiRequest<{ case: CaseRecord }>(`/cases/${encodeURIComponent(caseId)}`);
