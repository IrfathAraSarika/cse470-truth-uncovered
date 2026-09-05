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
  textSimilarity: number;
  locationProximity: number;
  categoryMatch: boolean;
  timeProximity: number;
  overallScore: number;
  reasons: string[];
}

export interface DuplicateDetectionResult {
  candidateId: string;
  candidateTitle: string;
  breakdown: SimilarityBreakdown;
}

function tokenize(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at',
    'for', 'from', 'with', 'by', 'is', 'was', 'were', 'are', 'be', 'been',
    'this', 'that', 'these', 'those', 'it', 'as', 'has', 'have', 'had',
    'about', 'into', 'after', 'before', 'during', 'there', 'their',
    'they', 'them', 'he', 'she', 'his', 'her', 'we', 'our', 'you',
    'your', 'i', 'my', 'me',
  ]);

  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .map((word) => {
        if (word.endsWith('ies') && word.length > 4) {
          return word.slice(0, -3) + 'y';
        }
        if (word.endsWith('ing') && word.length > 5) {
          return word.slice(0, -3);
        }
        if (word.endsWith('ed') && word.length > 4) {
          return word.slice(0, -2);
        }
        if (word.endsWith('s') && word.length > 4) {
          return word.slice(0, -1);
        }
        return word;
      })
      .filter((word) => word.length > 2 && !stopWords.has(word)),
  );
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateTextSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  const normA = normalizeText(textA);
  const normB = normalizeText(textB);

  if (normA === normB) return 100;

  let intersection = 0;

  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = setA.size + setB.size - intersection;

  if (union === 0) return 0;

  const jaccard = intersection / union;

  const containmentA = intersection / setA.size;
  const containmentB = intersection / setB.size;
  const containment = Math.max(containmentA, containmentB);

  const smallerSetSize = Math.min(setA.size, setB.size);
  const overlapRatio =
    smallerSetSize > 0 ? intersection / smallerSetSize : 0;

  const compactA = normA.replace(/\s/g, '');
  const compactB = normB.replace(/\s/g, '');

  const maxLength = Math.max(compactA.length, compactB.length);
  const minLength = Math.min(compactA.length, compactB.length);

  let characterSimilarity = 0;

  if (maxLength > 0) {
    let matchingCharacters = 0;

    for (let i = 0; i < minLength; i++) {
      if (compactA[i] === compactB[i]) {
        matchingCharacters++;
      }
    }

    characterSimilarity = matchingCharacters / maxLength;
  }

  let similarity =
    jaccard * 0.45 +
    containment * 0.25 +
    overlapRatio * 0.20 +
    characterSimilarity * 0.10;

  if (containment >= 0.80) {
    similarity += 0.10;
  }

  if (containment >= 0.90) {
    similarity += 0.10;
  }

  if (
    normA.length > 20 &&
    normB.length > 20 &&
    (normA.includes(normB) || normB.includes(normA))
  ) {
    similarity += 0.20;
  }

  return Math.min(100, Math.max(0, Math.round(similarity * 100)));
}

export function calculateGeoDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 100) / 100;
}

export function calculateLocationProximity(
  locA: LocationCoords,
  locB: LocationCoords,
): number {
  if (
    locA.latitude != null &&
    locA.longitude != null &&
    locB.latitude != null &&
    locB.longitude != null
  ) {
    const distKm = calculateGeoDistanceKm(
      locA.latitude,
      locA.longitude,
      locB.latitude,
      locB.longitude,
    );

    if (distKm <= 1) return 100;
    if (distKm <= 5) return 80;
    if (distKm <= 15) return 50;
    if (distKm <= 30) return 20;

    return 0;
  }

  if (locA.district && locB.district) {
    return locA.district.toLowerCase() === locB.district.toLowerCase()
      ? 70
      : 0;
  }

  return 0;
}

export function calculateTimeProximity(
  dateA?: string | Date | null,
  dateB?: string | Date | null,
): number {
  if (!dateA || !dateB) return 0;

  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();

  if (isNaN(timeA) || isNaN(timeB)) return 0;

  const diffHours =
    Math.abs(timeA - timeB) / (1000 * 60 * 60);

  if (diffHours <= 24) return 100;
  if (diffHours <= 72) return 75;
  if (diffHours <= 168) return 50;
  if (diffHours <= 720) return 20;

  return 0;
}

export function analyzeDuplicateSimilarity(
  target: TargetReport,
  candidate: ReportCandidate,
): SimilarityBreakdown {
  const titleSim = calculateTextSimilarity(
    target.title,
    candidate.title,
  );

  const descSim = calculateTextSimilarity(
    target.description,
    candidate.description,
  );

  const textSimilarity = Math.round(
    titleSim * 0.4 + descSim * 0.6,
  );

  const categoryMatch =
    target.category === candidate.category;

  const locationProximity = calculateLocationProximity(
    {
      district: target.district,
      latitude: target.latitude,
      longitude: target.longitude,
    },
    {
      district: candidate.district,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    },
  );

  const timeProximity = calculateTimeProximity(
    target.incidentDateTime || new Date().toISOString(),
    candidate.submissionDate,
  );

  const reasons: string[] = [];

  if (textSimilarity >= 60) {
    reasons.push(`High text similarity (${textSimilarity}%)`);
  }

  if (textSimilarity >= 75) {
    reasons.push(
      'Possible paraphrased or AI-assisted duplicate report',
    );
  }

  if (categoryMatch) {
    reasons.push(`Matching category (${target.category})`);
  }

  if (locationProximity >= 70) {
    reasons.push(
      `Same geographical area (${candidate.district || 'Location match'})`,
    );
  }

  if (timeProximity >= 75) {
    reasons.push(
      'Incidents reported within close timeframe',
    );
  }

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
    if (
      target.reportId &&
      target.reportId === candidate.reportId
    ) {
      continue;
    }

    const breakdown = analyzeDuplicateSimilarity(
      target,
      candidate,
    );

    if (breakdown.overallScore >= threshold) {
      results.push({
        candidateId: candidate.reportId,
        candidateTitle: candidate.title,
        breakdown,
      });
    }
  }

  return results.sort(
    (a, b) =>
      b.breakdown.overallScore -
      a.breakdown.overallScore,
  );
}