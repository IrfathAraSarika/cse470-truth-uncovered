import { apiRequest } from './apiClient';

export interface SafetyCheckIn { check_in_id: string; case_reference: string | null; scheduled_for: string; status: string; private_message: string | null; emergency_requested: boolean; resolution_note: string | null }
export interface Appeal { appeal_id?: string; reference_no: string; case_reference: string; reason: string; requested_outcome: string; status: string; admin_notes: string | null; created_at: string; citizen_name?: string }
export interface Subscription { subscription_id: string; district: string; category: string | null; channel: string; frequency: string; is_active: boolean }
export interface RegionalNotification { notification_id: string; message: string; is_read: boolean; created_at: string }
export interface WitnessContribution { contribution_id?: string; reference_no: string; report_reference: string; relationship_to_incident: string; statement?: string; evidence_url?: string | null; consent_to_contact?: boolean; status: string; admin_notes?: string | null; witness_name?: string; created_at: string }
export interface InstitutionNotice { notification_id: string; report_reference: string | null; case_reference: string | null; office_name: string; website_url: string | null; contact_email: string | null; subject: string; public_message: string; method: string; status: string; external_reference: string | null; created_at: string }

export const getMySafety = () => apiRequest<{ checkIns: SafetyCheckIn[] }>('/accountability/safety');
export const createSafety = (payload: { caseReference: string; scheduledFor: string; privateMessage: string }) => apiRequest('/accountability/safety', { method: 'POST', body: JSON.stringify(payload) });
export const respondSafety = (id: string, status: 'safe' | 'needs_help', privateMessage: string) => apiRequest(`/accountability/safety/${id}/respond`, { method: 'PATCH', body: JSON.stringify({ status, privateMessage }) });
export const getMyAppeals = () => apiRequest<{ appeals: Appeal[] }>('/accountability/appeals');
export const createAppeal = (payload: { caseReference: string; reason: string; requestedOutcome: string }) => apiRequest('/accountability/appeals', { method: 'POST', body: JSON.stringify(payload) });
export const getSubscriptions = () => apiRequest<{ subscriptions: Subscription[] }>('/accountability/subscriptions');
export const createSubscription = (payload: { district: string; category: string; channel: string; frequency: string }) => apiRequest('/accountability/subscriptions', { method: 'POST', body: JSON.stringify(payload) });
export const deleteSubscription = (id: string) => apiRequest(`/accountability/subscriptions/${id}`, { method: 'DELETE' });
export const getRegionalNotifications = () => apiRequest<{ notifications: RegionalNotification[] }>('/accountability/notifications');
export const readRegionalNotification = (id: string) => apiRequest(`/accountability/notifications/${id}/read`, { method: 'PATCH' });
export const getMyWitnesses = () => apiRequest<{ contributions: WitnessContribution[] }>('/accountability/witnesses');
export const createWitness = (payload: { reportReference: string; relationship: string; statement: string; evidenceUrl: string; consentToContact: boolean }) => apiRequest('/accountability/witnesses', { method: 'POST', body: JSON.stringify(payload) });

export const getAdminSafety = () => apiRequest<{ checkIns: Array<SafetyCheckIn & { citizen_name: string }> }>('/admin/accountability/safety');
export const resolveAdminSafety = (id: string, resolutionNote: string) => apiRequest(`/admin/accountability/safety/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolutionNote }) });
export const getAdminAppeals = () => apiRequest<{ appeals: Appeal[] }>('/admin/accountability/appeals');
export const reviewAdminAppeal = (id: string, status: string, adminNotes: string) => apiRequest(`/admin/accountability/appeals/${id}`, { method: 'PATCH', body: JSON.stringify({ status, adminNotes }) });
export const getAdminWitnesses = () => apiRequest<{ contributions: WitnessContribution[] }>('/admin/accountability/witnesses');
export const reviewAdminWitness = (id: string, status: string, adminNotes: string) => apiRequest(`/admin/accountability/witnesses/${id}`, { method: 'PATCH', body: JSON.stringify({ status, adminNotes }) });
export const publishReport = (reference: string, payload: { summary: string; victimContext: string; keywords: string[]; isPublic: boolean }) => apiRequest(`/admin/accountability/publication/${encodeURIComponent(reference)}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getInstitutionNotices = () => apiRequest<{ notices: InstitutionNotice[] }>('/admin/accountability/institution-notices');
export const createInstitutionNotice = (payload: Record<string, string>) => apiRequest('/admin/accountability/institution-notices', { method: 'POST', body: JSON.stringify(payload) });
export const updateInstitutionNotice = (id: string, status: string, externalReference: string) => apiRequest(`/admin/accountability/institution-notices/${id}`, { method: 'PATCH', body: JSON.stringify({ status, externalReference }) });
