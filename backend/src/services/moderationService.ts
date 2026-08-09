import { FlaggedItemStore, type DuplicateMatch, type IFlaggedItem } from '../models/FlaggedItem.js';

// Simple text normalization and k-shingle Jaccard similarity
function normalizeText(s: string) {
  return s
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '') // remove urls
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getShingles(s: string, k = 5) {
  const cleaned = normalizeText(s);
  // work at character level to avoid tokenization differences
  const shingles = new Set<string>();
  for (let i = 0; i + k <= cleaned.length; i++) {
    shingles.add(cleaned.slice(i, i + k));
  }
  return shingles;
}

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = new Set([...a].filter(x => b.has(x))).size;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

export async function detectDuplicates(text: string, threshold = 0.75) {
  const subjectShingles = getShingles(text);
  // naive: compare against recent flagged items - adapt to include your primary content collection if you have one
  const candidates = FlaggedItemStore.recent(200);

  const matches: DuplicateMatch[] = [];
  for (const c of candidates) {
    const s = getShingles(c.text || '');
    const score = jaccard(subjectShingles, s);
    if (score >= threshold) {
      matches.push({
        id: c.id,
        score,
        excerpt: (c.text || '').slice(0, 200),
      });
    }
  }
  return matches;
}

export function simpleFraudSignals(text: string, metadata: any = {}, ip?: string | undefined) {
  const signals: string[] = [];
  if ((text.match(/https?:\/\//g) || []).length > 3) signals.push('many_links');
  if (text.length < 20) signals.push('very_short_text');
  if (ip && (ip.startsWith('10.') || ip.startsWith('192.168.'))) signals.push('private_ip');
  if (/(free|earn|credit|loan)/i.test(text)) signals.push('spammy_keywords');
  if (metadata && metadata.rate && metadata.rate > 10) signals.push('fast_submission');
  return signals;
}

export async function analyzeAndFlag(params: {
  contentId?: string;
  authorId?: string;
  text: string;
  reason?: string;
  metadata?: any;
  reporterIp?: string | undefined;
}) {
  const { text, reason, contentId, authorId, metadata, reporterIp } = params;
  const duplicateMatches = await detectDuplicates(text, 0.75);
  const fraudSignals = simpleFraudSignals(text, metadata, reporterIp);
  const shouldFlag = duplicateMatches.length > 0 || fraudSignals.length > 0 || Boolean(reason);

  let flagged: IFlaggedItem | null = null;
  if (shouldFlag) {
    flagged = FlaggedItemStore.insert({
      contentId,
      authorId,
      text,
      reason,
      duplicateMatches,
      fraudSignals,
      reporterIp,
    });
  }

  return {
    flagged: Boolean(flagged),
    flagId: flagged?.id,
    duplicateMatches,
    fraudSignals,
  };
}

export async function adminVerify(flagId: string, verified: boolean, adminNote?: string) {
  const status = verified ? 'verified' : 'rejected';
  return FlaggedItemStore.updateStatus(flagId, status, adminNote);
}
