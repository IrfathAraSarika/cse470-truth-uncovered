import { evaluateFraudAndSpamRisk } from './fraudSpamModerationService.js';

export type FlagReason =
  | 'fraud_or_scam'
  | 'spam'
  | 'duplicate'
  | 'fake_or_misleading'
  | 'inappropriate'
  | 'other';

export const FLAG_REASONS: FlagReason[] = [
  'fraud_or_scam',
  'spam',
  'duplicate',
  'fake_or_misleading',
  'inappropriate',
  'other',
];

export interface FlagSeverityResult {
  severityScore: number; // 0 - 100
  autoEscalated: boolean;
  reasons: string[];
}

// Maps the community reason category to a base severity weight.
const REASON_BASE_SEVERITY: Record<FlagReason, number> = {
  fraud_or_scam: 60,
  spam: 45,
  duplicate: 30,
  fake_or_misleading: 55,
  inappropriate: 50,
  other: 25,
};

export function isValidFlagReason(reason: unknown): reason is FlagReason {
  return typeof reason === 'string' && FLAG_REASONS.includes(reason as FlagReason);
}

export function buildFlagReasonText(reason: FlagReason, details: string | null): string {
  const label = reason.replace(/_/g, ' ');
  return details ? `${label}: ${details}` : label;
}

// Combines the citizen-selected reason weight with the automated fraud/spam
// heuristics over the reported content to produce an escalation score.
export function calculateFlagSeverity(
  reason: FlagReason,
  reportTitle: string,
  reportDescription: string,
): FlagSeverityResult {
  const baseSeverity = REASON_BASE_SEVERITY[reason];
  const risk = evaluateFraudAndSpamRisk({ title: reportTitle, description: reportDescription });

  const severityScore = Math.min(100, Math.round(baseSeverity * 0.5 + risk.totalRiskScore * 0.5));
  const reasons = [
    `Community reason "${reason.replace(/_/g, ' ')}" (base ${baseSeverity})`,
    ...risk.reasons,
  ];

  return {
    severityScore,
    autoEscalated: severityScore >= 70,
    reasons,
  };
}
