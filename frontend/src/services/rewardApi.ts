import { apiRequest } from './apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EarnedBadge {
  badgeId: string;
  badgeType: string;
  pointCost: number | null;
  awardedAt: string;
}

export interface RedeemableBadge {
  badgeId: string;
  badgeType: string;
  pointCost: number;
  owned: boolean;
}

export interface RewardProfile {
  civicPoints: number;
  anonymousLeaderboard: boolean;
  badges: EarnedBadge[];
  redeemableBadges: RedeemableBadge[];
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  civicPoints: number;
  badgeCount: number;
  topBadge: string | null;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function getRewardProfile(): Promise<RewardProfile> {
  return apiRequest<RewardProfile>('/rewards/profile');
}

export async function redeemBadge(badgeType: string): Promise<{ success: boolean; newBalance: number }> {
  return apiRequest('/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify({ badgeType }),
  });
}

export async function updateAnonymity(anonymous: boolean): Promise<{ success: boolean; anonymous: boolean }> {
  return apiRequest('/rewards/anonymity', {
    method: 'PATCH',
    body: JSON.stringify({ anonymous }),
  });
}

export async function getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiRequest('/rewards/leaderboard');
}
