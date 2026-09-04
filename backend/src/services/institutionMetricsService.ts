export interface InstitutionMetricInput {
  institutionId: string;
  name: string;
  type: string | null;
  address: string | null;
  verifiedReports: number;
  totalCases: number;
  actionedCases: number;
  closedCases: number;
  averageResolutionDays: number | null;
}

export interface InstitutionMetric extends InstitutionMetricInput {
  actionTakenRate: number;
  trustScore: number;
  redFlagScore: number;
}

const rounded = (value: number) => Math.round(value * 100) / 100;
const bounded = (value: number) => Math.max(0, Math.min(100, value));

export function calculateInstitutionMetric(input: InstitutionMetricInput): InstitutionMetric {
  const actionTakenRate = input.totalCases > 0 ? (input.actionedCases / input.totalCases) * 100 : 0;
  const resolutionSpeedScore = input.averageResolutionDays === null
    ? 0
    : bounded(100 - input.averageResolutionDays * 2.5);
  const trustScore = input.totalCases > 0
    ? bounded(actionTakenRate * 0.7 + resolutionSpeedScore * 0.3)
    : 0;
  const unresolvedRate = input.totalCases > 0
    ? ((input.totalCases - input.closedCases) / input.totalCases) * 100
    : 0;
  const verifiedVolumeRisk = bounded(input.verifiedReports * 10);
  const redFlagScore = input.verifiedReports > 0
    ? bounded(verifiedVolumeRisk * 0.55 + unresolvedRate * 0.45)
    : 0;

  return {
    ...input,
    actionTakenRate: rounded(actionTakenRate),
    trustScore: rounded(trustScore),
    redFlagScore: rounded(redFlagScore),
  };
}
