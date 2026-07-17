import { apiRequest } from './apiClient';

export type VerificationStatusValue = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export interface VerificationStatus {
  status: VerificationStatusValue;
  nid_number: string | null;
  has_photo: boolean;
  notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  is_verified: boolean;
}

export interface VerificationRequest {
  citizen_id: string;
  full_name: string;
  email: string;
  nid_number: string | null;
  status: VerificationStatusValue;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

export interface VerificationRequestDetail extends VerificationRequest {
  nid_photo_path: string | null;
}

// Citizen endpoints.
export const getMyVerification = () => apiRequest<VerificationStatus>('/verification/me');
export const submitMyVerification = (nidNumber: string, nidPhoto: string) =>
  apiRequest<{ success: boolean; status: string }>('/verification/me', {
    method: 'POST',
    body: JSON.stringify({ nidNumber, nidPhoto }),
  });

// Admin endpoints.
export const getVerificationRequests = (status: string) =>
  apiRequest<{ requests: VerificationRequest[] }>(`/admin/verifications?status=${status}`);
export const getVerificationRequestDetail = (citizenId: string) =>
  apiRequest<VerificationRequestDetail>(`/admin/verifications/${citizenId}`);
export const reviewVerificationRequest = (citizenId: string, decision: 'verified' | 'rejected', notes: string) =>
  apiRequest(`/admin/verifications/${citizenId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes }),
  });
