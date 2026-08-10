import { apiRequest } from './apiClient';

export interface TimelineDataPoint {
  date: string;
  active_count: number;
  closed_count: number;
}

export interface CategoryDataPoint {
  category: string;
  count: number;
}

export interface AnalyticsData {
  timelineData: TimelineDataPoint[];
  categoryData: CategoryDataPoint[];
}

export async function getAnalyticsData(district: string, timePeriod: string): Promise<AnalyticsData> {
  const queryParams = new URLSearchParams({
    district,
    timePeriod,
  });
  return apiRequest<AnalyticsData>(`/analytics?${queryParams.toString()}`);
}
