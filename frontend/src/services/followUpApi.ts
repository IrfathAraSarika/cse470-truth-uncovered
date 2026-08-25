import { apiRequest } from './apiClient';

export interface FollowUpRecord {
  follow_up_id: string;
  parent_follow_up_id: string | null;
  case_id: string;
  details: string;
  has_new_evidence: boolean;
  follow_up_date: string;
  updated_at: string;
  depth: number;
  author_name: string;
  author_role: 'citizen' | 'ngo_partner' | 'admin' | 'former_participant';
}

export interface FollowUpThread {
  caseId: string;
  reportId: string;
  caseReference: string;
  reportReference: string;
  access: { role: string; canPost: boolean };
  followUps: FollowUpRecord[];
}

export const getFollowUps = (caseId: string) => apiRequest<FollowUpThread>(`/cases/${encodeURIComponent(caseId)}/follow-ups`);

export const createFollowUp = (caseId: string, details: string, hasNewEvidence: boolean, parentFollowUpId: string | null) =>
  apiRequest<{ followUp: FollowUpRecord }>(`/cases/${encodeURIComponent(caseId)}/follow-ups`, {
    method: 'POST', body: JSON.stringify({ details, hasNewEvidence, parentFollowUpId }),
  });
