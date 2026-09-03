import { pool } from './database.js';

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'admin' | 'officer' | 'ngo_partner';
  isVerified: boolean;
  createdAt: string;
  civicPoints?: number;
  employeeId?: string;
  organizationName?: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await pool.query(
    `
    SELECT 
      u.user_id as "userId",
      u.email,
      u.full_name as "fullName",
      u.role,
      u.created_at as "createdAt",
      c.civic_points as "civicPoints",
      c.is_verified as "isVerified",
      a.employee_id as "employeeId",
      ngo.organization_name as "organizationName"
    FROM app_users u
    LEFT JOIN citizens c ON c.user_id = u.user_id
    LEFT JOIN admins a ON a.user_id = u.user_id
    LEFT JOIN ngo_partners ngo ON ngo.user_id = u.user_id
    WHERE u.user_id = $1
    `,
    [userId]
  );

  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    userId: row.userId,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    isVerified: row.isVerified || false,
    createdAt: row.createdAt,
    civicPoints: row.civicPoints,
    employeeId: row.employeeId,
    organizationName: row.organizationName,
  };
}

export async function getUserPermissions(role: string): Promise<string[]> {
  // Define role-based permissions
  const permissionsMap: Record<string, string[]> = {
    citizen: [
      'submit_report',
      'anonymous_submission',
      'view_my_reports',
      'offline_drafts',
      'evidence_vault',
      'case_tracker',
      'follow_cases',
      'view_articles',
      'dashboard',
    ],
    admin: [
      'admin_verification',
      'duplicate_detection',
      'fraud_moderation',
      'view_all_reports',
      'manage_articles',
      'admin_accountability',
      'view_analytics',
      'dashboard',
      'submit_report',
      'anonymous_submission',
      'view_my_reports',
      'offline_drafts',
      'evidence_vault',
      'case_tracker',
      'follow_cases',
      'view_articles',
      'flagged_items',
    ],
    officer: [
      'view_assigned_cases',
      'update_case_status',
      'add_follow_ups',
      'view_analytics',
      'dashboard',
      'view_articles',
      'case_follow_ups',
      'corruption_heatmap',
      'institution_rankings',
      'admin_accountability',
    ],
    ngo_partner: [
      'view_cases',
      'add_follow_ups',
      'generate_reports',
      'view_analytics',
      'dashboard',
      'view_articles',
      'case_follow_ups',
      'corruption_heatmap',
      'institution_rankings',
    ],
  };

  return permissionsMap[role] || [];
}
