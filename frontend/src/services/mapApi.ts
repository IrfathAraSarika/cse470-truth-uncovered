import { apiRequest } from './apiClient';

export interface MapIncident {
  reportId: string;
  title: string;
  status: 'submitted' | 'verified';
  latitude: number;
  longitude: number;
  address: string | null;
}

export async function getMapIncidents(): Promise<{ incidents: MapIncident[] }> {
  return apiRequest<{ incidents: MapIncident[] }>('/map');
}
