import { apiRequest } from './apiClient';

export interface LoginResponse {
  citizen: { citizen_id: string; name: string; email: string } | null;
  user: { user_id: string; name: string; email: string; role: string };
}

export const login = (email: string, password: string) =>
  apiRequest<LoginResponse>('/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const signup = (name: string, email: string, password: string) =>
  apiRequest<{ userId: string }>('/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
