import { apiRequest } from './apiClient';

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'admin';
  isVerified: boolean;
  createdAt: string;
  civicPoints?: number;
  employeeId?: string;
}

export interface DashboardData {
  user: UserProfile;
  permissions: string[];
  role: string;
}

export async function fetchDashboard(): Promise<DashboardData> {
  return apiRequest<DashboardData>('/dashboard');
}

export async function fetchUserProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/user');
}
