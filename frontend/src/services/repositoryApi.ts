import { apiRequest } from './apiClient';

export interface PublicReportItem {
  report_id: string;
  title: string;
  category: string;
  status: string;
  submission_date: string;
  district: string | null;
  division: string | null;
  institution_name: string | null;
  case_id: string | null;
  case_status: string | null;
  description: string;
}

export interface PublicReportsResponse {
  reports: PublicReportItem[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export interface GetPublicReportsParams {
  page?: number;
  category?: string;
  district?: string;
  caseStatus?: string;
  sortBy?: string;
  sortOrder?: string;
}

export async function getPublicReports(params: GetPublicReportsParams = {}): Promise<PublicReportsResponse> {
  const query = new URLSearchParams();

  if (params.page) query.append('page', params.page.toString());
  if (params.category && params.category !== 'All') query.append('category', params.category);
  if (params.district && params.district !== 'All') query.append('district', params.district);
  if (params.caseStatus && params.caseStatus !== 'All') query.append('caseStatus', params.caseStatus);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);

  const queryString = query.toString();
  const endpoint = queryString ? `/repository?${queryString}` : '/repository';

  return apiRequest<PublicReportsResponse>(endpoint);
}
