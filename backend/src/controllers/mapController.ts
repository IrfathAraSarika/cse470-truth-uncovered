import type { Request, Response, NextFunction } from 'express';
import { getMapIncidents, type DBMapIncident } from '../models/mapModel.js';

export interface MapIncidentItem {
  reportId: string;
  title: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string | null;
}

function getFallbackCoordinates(id: string): { latitude: number; longitude: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 1000) - 500) / 10000;
  const lonOffset = ((Math.abs(hash >> 3) % 1000) - 500) / 10000;
  return {
    latitude: 23.8103 + latOffset,
    longitude: 90.4125 + lonOffset,
  };
}

async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TruthUncoveredApp/1.0 (incident-mapper)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = (await response.json()) as Array<{ lat: string; lon: string }>;
    const firstResult = data?.[0];
    if (firstResult?.lat && firstResult?.lon) {
      const lat = parseFloat(firstResult.lat);
      const lon = parseFloat(firstResult.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
  } catch {
    // Ignore error and fall back to default
  }
  return null;
}

export async function getIncidentMapData(_req: Request, res: Response, next: NextFunction) {
  try {
    const rawIncidents: DBMapIncident[] = await getMapIncidents();

    const processedIncidents: MapIncidentItem[] = await Promise.all(
      rawIncidents.map(async (inc) => {
        let lat = inc.latitude;
        let lon = inc.longitude;

        if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
          if (inc.address && inc.address.trim().length > 0) {
            const geocoded = await geocodeAddress(inc.address);
            if (geocoded) {
              lat = geocoded.latitude;
              lon = geocoded.longitude;
            }
          }
        }

        if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
          const fallback = getFallbackCoordinates(inc.reportId);
          lat = fallback.latitude;
          lon = fallback.longitude;
        }

        return {
          reportId: inc.reportId,
          title: inc.title,
          status: inc.status,
          latitude: lat,
          longitude: lon,
          address: inc.address,
        };
      })
    );

    res.json({ incidents: processedIncidents });
  } catch (error) {
    next(error);
  }
}
