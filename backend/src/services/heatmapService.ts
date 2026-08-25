export interface HeatmapAggregate {
  district: string;
  category: string;
  reportCount: number;
  latitude: number | null;
  longitude: number | null;
  latestReportAt: string;
}

const DISTRICT_CENTERS: Record<string, [number, number]> = {
  dhaka: [23.8103, 90.4125],
  chattogram: [22.3569, 91.7832],
  rajshahi: [24.3745, 88.6042],
  khulna: [22.8456, 89.5403],
  sylhet: [24.8949, 91.8687],
  barishal: [22.701, 90.3535],
  rangpur: [25.7439, 89.2752],
  mymensingh: [24.7471, 90.4203],
};

export function buildHeatmapPoints(aggregates: HeatmapAggregate[]) {
  return aggregates.flatMap((aggregate) => {
    const fallback = DISTRICT_CENTERS[aggregate.district.toLowerCase()];
    const latitude = aggregate.latitude ?? fallback?.[0];
    const longitude = aggregate.longitude ?? fallback?.[1];
    if (latitude === undefined || longitude === undefined) return [];
    return [{
      ...aggregate,
      latitude,
      longitude,
      severityIndex: Math.min(100, Math.round((20 + aggregate.reportCount * 12) * 100) / 100),
      usedDistrictCenter: aggregate.latitude === null || aggregate.longitude === null,
    }];
  });
}
