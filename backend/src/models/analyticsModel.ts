import { pool } from './database.js';

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
  let intervalString = "'1 month'";
  const periodLower = timePeriod.toLowerCase();

  if (periodLower === 'week') {
    intervalString = "'1 week'";
  } else if (periodLower === 'month') {
    intervalString = "'1 month'";
  } else if (periodLower === 'quarter') {
    intervalString = "'3 months'";
  } else if (periodLower === 'year') {
    intervalString = "'1 year'";
  }

  // Query 1: Timeline graph
  const timelineQuery = `
    SELECT 
      DATE(r.incident_datetime)::text AS date,
      COUNT(CASE WHEN r.status IN ('submitted', 'verified') THEN 1 END)::int AS active_count,
      COUNT(CASE WHEN r.status = 'closed' THEN 1 END)::int AS closed_count
    FROM reports r
    JOIN locations l ON r.location_id = l.location_id
    WHERE l.district ILIKE $1
      AND r.incident_datetime >= NOW() - INTERVAL ${intervalString}
      AND r.status IN ('submitted', 'verified', 'closed')
    GROUP BY DATE(r.incident_datetime)
    ORDER BY date ASC
  `;

  // Query 2: Category ranking
  const categoryQuery = `
    SELECT 
      r.category::text AS category,
      COUNT(*)::int AS count
    FROM reports r
    JOIN locations l ON r.location_id = l.location_id
    WHERE l.district ILIKE $1
      AND r.incident_datetime >= NOW() - INTERVAL ${intervalString}
      AND r.status IN ('submitted', 'verified', 'closed')
    GROUP BY r.category
    ORDER BY count DESC
  `;

  const districtParam = `%${district.trim()}%`;

  const [timelineResult, categoryResult] = await Promise.all([
    pool.query(timelineQuery, [districtParam]),
    pool.query(categoryQuery, [districtParam])
  ]);

  return {
    timelineData: timelineResult.rows,
    categoryData: categoryResult.rows
  };
}
