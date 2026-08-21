export interface ModerationTarget {
  title: string;
  description: string;
  category?: string;
  nidNumber?: string | null;
}

export interface ModerationRiskBreakdown {
  capsScore: number;          // 0 - 100
  linkSpamScore: number;      // 0 - 100
  gibberishScore: number;     // 0 - 100
  fraudScamScore: number;     // 0 - 100
  totalRiskScore: number;     // 0 - 100
  isAutoHidden: boolean;
  reasons: string[];
}

const FRAUD_KEYWORDS = [
  'bikash money', 'nagad payment', 'cashout fee', 'send money to get job',
  'guaranteed profit', 'invest 1000 get 5000', 'lottery winner',
  'whatsapp money', 'telegram crypto', 'advance payment required',
  'click here to claim bdt', 'fake nid', 'hacked account restore fee',
  'bikash', 'nagad', 'send money',
];

const PROMOTIONAL_SPAM_PATTERNS = [
  /\b(buy now|discount|sale|free offer|click here|casino|betting|poker)\b/i,
  /https?:\/\/[^\s]+/gi,
  /www\.[a-z0-9-]+\.[a-z]{2,}/gi,
];

function calculateCapsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 6) return 0;
  const uppercaseCount = text.replace(/[^A-Z]/g, '').length;
  return Math.round((uppercaseCount / letters.length) * 100);
}

function calculateGibberishScore(text: string): number {
  if (text.length < 10) return 0;
  const repeatPattern = /(.)\1{4,}/g;
  if (repeatPattern.test(text)) return 90;

  const words = text.split(/\s+/);
  let noVowelWords = 0;
  for (const word of words) {
    if (word.length > 7 && !/[aeiouyAEIOUY]/i.test(word)) {
      noVowelWords++;
    }
  }
  if (noVowelWords > 0) return 80;
  return 0;
}

export function evaluateFraudAndSpamRisk(target: ModerationTarget): ModerationRiskBreakdown {
  const combinedText = `${target.title} ${target.description}`;
  const reasons: string[] = [];

  // 1. Caps check
  const capsRatio = calculateCapsRatio(combinedText);
  let capsScore = 0;
  if (capsRatio >= 70) {
    capsScore = 85;
    reasons.push(`Excessive capital letters (${capsRatio}% uppercase)`);
  } else if (capsRatio >= 50) {
    capsScore = 50;
    reasons.push(`High capital letter usage (${capsRatio}%)`);
  }

  // 2. Link & Promo Spam
  let linkCount = 0;
  PROMOTIONAL_SPAM_PATTERNS.forEach((pattern) => {
    const matches = combinedText.match(pattern);
    if (matches) linkCount += matches.length;
  });

  let linkSpamScore = 0;
  if (linkCount >= 3) {
    linkSpamScore = 95;
    reasons.push(`Multiple promotional links or commercial URLs detected (${linkCount} links)`);
  } else if (linkCount >= 1) {
    linkSpamScore = 65;
    reasons.push('External link or promotional URL embedded');
  }

  // 3. Gibberish & Low Quality
  const gibberishScore = calculateGibberishScore(combinedText);
  if (gibberishScore > 0) {
    reasons.push('Repetitive character sequence or gibberish pattern detected');
  }

  // 4. Financial Fraud & Scam Keywords
  let fraudMatches = 0;
  const lowerText = combinedText.toLowerCase();
  for (const keyword of FRAUD_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      fraudMatches++;
    }
  }

  let fraudScamScore = 0;
  if (fraudMatches >= 2) {
    fraudScamScore = 100;
    reasons.push(`High-risk financial fraud & scam keywords matched (${fraudMatches} triggers)`);
  } else if (fraudMatches === 1) {
    fraudScamScore = 75;
    reasons.push('Suspicious financial payment or advance fee request pattern');
  }

  // Max score across indicators
  const maxScore = Math.max(capsScore, linkSpamScore, gibberishScore, fraudScamScore);
  const weightedScore = Math.round(
    capsScore * 0.25 + linkSpamScore * 0.35 + gibberishScore * 0.2 + fraudScamScore * 0.4,
  );

  const totalRiskScore = Math.min(100, Math.max(maxScore, weightedScore));
  const isAutoHidden = totalRiskScore >= 70;

  return {
    capsScore,
    linkSpamScore,
    gibberishScore,
    fraudScamScore,
    totalRiskScore,
    isAutoHidden,
    reasons,
  };
}
