export interface LocationCoords {
  district?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
}

export interface ReportCandidate {
  reportId: string;
  title: string;
  description: string;
  category: string;
  district?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  submissionDate?: string | Date | null | undefined;
}

export interface TargetReport {
  reportId?: string | undefined;
  title: string;
  description: string;
  category: string;
  district?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  incidentDateTime?: string | null | undefined;
}

export interface SimilarityBreakdown {
  textSimilarity: number;       // 0 - 100
  locationProximity: number;   // 0 - 100
  categoryMatch: boolean;
  timeProximity: number;       // 0 - 100
  overallScore: number;        // 0 - 100
  reasons: string[];
}

export interface DuplicateDetectionResult {
  candidateId: string;
  candidateTitle: string;
  breakdown: SimilarityBreakdown;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

export function calculateTextSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  if (union === 0) return 0;
  const jaccard = intersection / union;

  // Title exact/phrase bonus check
  const normA = textA.toLowerCase().trim();
  const normB = textB.toLowerCase().trim();
  if (normA === normB) return 100;
  if (normA.includes(normB) || normB.includes(normA)) {
    return Math.min(100, Math.round(jaccard * 100 + 25));
  }

  return Math.round(jaccard * 100);
}

export function calculateGeoDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function calculateLocationProximity(locA: LocationCoords, locB: LocationCoords): number {
  if (locA.latitude != null && locA.longitude != null && locB.latitude != null && locB.longitude != null) {
    const distKm = calculateGeoDistanceKm(locA.latitude, locA.longitude, locB.latitude, locB.longitude);
    if (distKm <= 1) return 100;
    if (distKm <= 5) return 80;
    if (distKm <= 15) return 50;
    if (distKm <= 30) return 20;
    return 0;
  }

  if (locA.district && locB.district) {
    return locA.district.toLowerCase() === locB.district.toLowerCase() ? 70 : 0;
  }

  return 0;
}

export function calculateTimeProximity(dateA?: string | Date | null, dateB?: string | Date | null): number {
  if (!dateA || !dateB) return 0;
  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();
  if (isNaN(timeA) || isNaN(timeB)) return 0;

  const diffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
  if (diffHours <= 24) return 100;
  if (diffHours <= 72) return 75;
  if (diffHours <= 168) return 50; // within 1 week
  if (diffHours <= 720) return 20; // within 1 month
  return 0;
}

export function analyzeDuplicateSimilarity(target: TargetReport, candidate: ReportCandidate): SimilarityBreakdown {
  const titleSim = calculateTextSimilarity(target.title, candidate.title);
  const descSim = calculateTextSimilarity(target.description, candidate.description);
  const textSimilarity = Math.round(titleSim * 0.4 + descSim * 0.6);

  const categoryMatch = target.category === candidate.category;
  const locationProximity = calculateLocationProximity(
    { district: target.district, latitude: target.latitude, longitude: target.longitude },
    { district: candidate.district, latitude: candidate.latitude, longitude: candidate.longitude },
  );

  const timeProximity = calculateTimeProximity(
    target.incidentDateTime || new Date().toISOString(),
    candidate.submissionDate,
  );

  const reasons: string[] = [];
  if (textSimilarity >= 60) reasons.push(`High text similarity (${textSimilarity}%)`);
  if (categoryMatch) reasons.push(`Matching category (${target.category})`);
  if (locationProximity >= 70) reasons.push(`Same geographical area (${candidate.district || 'Location match'})`);
  if (timeProximity >= 75) reasons.push('Incidents reported within close timeframe');

  // Weighted overall score calculation
  let overallScore = Math.round(
    textSimilarity * 0.55 +
      (categoryMatch ? 15 : 0) +
      locationProximity * 0.2 +
      timeProximity * 0.1,
  );

  overallScore = Math.min(100, Math.max(0, overallScore));

  return {
    textSimilarity,
    locationProximity,
    categoryMatch,
    timeProximity,
    overallScore,
    reasons,
  };
}

export function detectDuplicatesForReport(
  target: TargetReport,
  candidates: ReportCandidate[],
  threshold = 40,
): DuplicateDetectionResult[] {
  const results: DuplicateDetectionResult[] = [];

  for (const candidate of candidates) {
    if (target.reportId && target.reportId === candidate.reportId) continue;
    const breakdown = analyzeDuplicateSimilarity(target, candidate);
    if (breakdown.overallScore >= threshold) {
      results.push({
        candidateId: candidate.reportId,
        candidateTitle: candidate.title,
        breakdown,
      });
    }
  }

  return results.sort((a, b) => b.breakdown.overallScore - a.breakdown.overallScore);
}
