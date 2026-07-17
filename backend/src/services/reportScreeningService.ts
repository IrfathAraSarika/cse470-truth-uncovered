export interface ScreeningInput {
  title: string;
  description: string;
  category: string;
  district: string | null;
}

export interface DuplicateCandidate extends ScreeningInput {
  reportId: string;
}

export interface PossibleDuplicate {
  reportId: string;
  title: string;
  score: number;
}

export interface ReportScreeningResult {
  duplicateScore: number;
  moderationScore: number;
  reasons: string[];
  possibleDuplicates: PossibleDuplicate[];
  status: 'submitted' | 'pending_verification' | 'hidden';
}

const stopWords = new Set(['a', 'an', 'and', 'at', 'for', 'from', 'in', 'is', 'of', 'on', 'the', 'to', 'was', 'were', 'with']);

function tokens(value: string) {
  return new Set(
    value.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  );
}

function jaccard(left: string, right: string) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function duplicateScore(input: ScreeningInput, candidate: DuplicateCandidate) {
  const title = jaccard(input.title, candidate.title) * 35;
  const description = jaccard(input.description, candidate.description) * 45;
  const category = input.category === candidate.category ? 10 : 0;
  const district = input.district && candidate.district && input.district.toLowerCase() === candidate.district.toLowerCase() ? 10 : 0;
  return Math.round((title + description + category + district) * 100) / 100;
}

export function screenReport(input: ScreeningInput, candidates: DuplicateCandidate[]): ReportScreeningResult {
  const possibleDuplicates = candidates
    .map((candidate) => ({ reportId: candidate.reportId, title: candidate.title, score: duplicateScore(input, candidate) }))
    .filter((candidate) => candidate.score >= 45)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  const highestDuplicate = possibleDuplicates[0]?.score ?? 0;
  const reasons: string[] = [];
  let moderationScore = 0;
  const combined = `${input.title} ${input.description}`;
  const linkCount = (combined.match(/https?:\/\/|www\./gi) ?? []).length;
  const letters = combined.replace(/[^a-z]/gi, '');
  const uppercase = letters.replace(/[^A-Z]/g, '').length;

  if (input.description.trim().length < 40) { moderationScore += 20; reasons.push('Description is unusually short.'); }
  if (/(.)\1{7,}/i.test(combined)) { moderationScore += 25; reasons.push('Repeated-character spam pattern detected.'); }
  if (linkCount >= 2) { moderationScore += 30; reasons.push('Multiple external links detected.'); }
  if (/\b(buy now|click here|guaranteed profit|crypto giveaway|free money)\b/i.test(combined)) { moderationScore += 45; reasons.push('Known promotional spam language detected.'); }
  if (letters.length >= 30 && uppercase / letters.length > 0.75) { moderationScore += 15; reasons.push('Excessive uppercase text detected.'); }
  if (highestDuplicate >= 85) { moderationScore += 70; reasons.push('Near-identical report already exists.'); }
  else if (highestDuplicate >= 70) { moderationScore += 20; reasons.push('A strongly similar report already exists.'); }

  moderationScore = Math.min(100, moderationScore);
  const status = moderationScore >= 70 ? 'hidden' : highestDuplicate >= 70 ? 'pending_verification' : 'submitted';
  return { duplicateScore: highestDuplicate, moderationScore, reasons, possibleDuplicates, status };
}
