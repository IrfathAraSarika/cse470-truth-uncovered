export interface Feature {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  color: 'teal' | 'red' | 'amber' | 'emerald';
  roles: ('citizen' | 'admin' | 'officer' | 'ngo_partner')[];
  category: 'reporting' | 'admin' | 'transparency' | 'accountability' | 'analytics';
}

export const FEATURES: Feature[] = [
  // ============= CITIZEN FEATURES =============
  {
    id: 'submit_report',
    title: 'Submit Report',
    description: 'Report corruption, fraud, or misconduct incidents',
    path: '/submit-report',
    icon: '📝',
    color: 'teal',
    roles: ['citizen', 'admin'],
    category: 'reporting',
    badge: 'Citizen',
  },
  {
    id: 'anonymous_submission',
    title: 'Anonymous Submission',
    description: 'Report without logging in or revealing your identity',
    path: '/submit-anonymous',
    icon: '🔒',
    color: 'red',
    roles: ['citizen', 'admin'],
    category: 'reporting',
    badge: 'Citizen',
  },
  {
    id: 'offline_drafts',
    title: 'Offline PWA Reporting',
    description: 'Submit incident reports offline with automatic sync when reconnected',
    path: '/offline-drafts',
    icon: '📶',
    color: 'red',
    roles: ['citizen', 'admin'],
    category: 'reporting',
    badge: 'Citizen',
  },
  {
    id: 'view_my_reports',
    title: 'My Reports',
    description: 'View and track all reports you have submitted',
    path: '/my-reports',
    icon: '📊',
    color: 'teal',
    roles: ['citizen', 'admin'],
    category: 'reporting',
  },
  {
    id: 'evidence_vault',
    title: 'Evidence Vault',
    description: 'Securely store and manage evidence for your reports',
    path: '/evidence-vault',
    icon: '🔐',
    color: 'teal',
    roles: ['citizen', 'admin'],
    category: 'reporting',
  },
  {
    id: 'case_tracker',
    title: 'Case Tracker',
    description: 'Track the status and progress of your cases',
    path: '/case-tracker',
    icon: '📈',
    color: 'teal',
    roles: ['citizen', 'admin', 'officer', 'ngo_partner'],
    category: 'reporting',
  },
  {
    id: 'view_articles',
    title: 'Learn & Awareness',
    description: 'Read articles about citizen rights, legal info, and safety tips',
    path: '/articles',
    icon: '📚',
    color: 'teal',
    roles: ['citizen', 'admin', 'officer', 'ngo_partner'],
    category: 'transparency',
  },

  // ============= FLAGGED ITEMS & COMMUNITY =============
  {
    id: 'flagged_items',
    title: 'Community Flag Watch',
    description: 'Flag suspicious reports as fraud, spam, or fake for admin review',
    path: '/flagged-items',
    icon: '🚩',
    color: 'teal',
    roles: ['citizen', 'admin'],
    category: 'reporting',
    badge: 'Citizen',
  },

  // ============= ADMIN FEATURES =============
  {
    id: 'admin_verification',
    title: 'Admin Verification',
    description: 'Multi-admin verification queue with review history and auto case creation',
    path: '/admin/verification',
    icon: '✓',
    color: 'teal',
    roles: ['admin'],
    category: 'admin',
    badge: 'Admin',
    badgeColor: 'teal',
  },
  {
    id: 'duplicate_detection',
    title: 'AI-Powered Duplicate Detector',
    description: 'Multi-factor similarity scoring (NLP, location, category vectors)',
    path: '/admin/duplicate-detection',
    icon: '🤖',
    color: 'teal',
    roles: ['admin'],
    category: 'admin',
    badge: 'Admin',
    badgeColor: 'teal',
  },
  {
    id: 'fraud_moderation',
    title: 'Fraud & Spam Moderation',
    description: 'Automated detection of spam, fraud keywords, and suspicious patterns',
    path: '/admin/fraud-moderation',
    icon: '⚠️',
    color: 'red',
    roles: ['admin'],
    category: 'admin',
    badge: 'Admin',
    badgeColor: 'red',
  },
  {
    id: 'manage_articles',
    title: 'Manage Articles',
    description: 'Create, edit, and moderate awareness articles and legal content',
    path: '/admin/articles',
    icon: '📝',
    color: 'teal',
    roles: ['admin'],
    category: 'admin',
    badge: 'Admin',
  },
  {
    id: 'view_all_reports',
    title: 'All Reports View',
    description: 'View and analyze all submitted reports across the platform',
    path: '/admin/reports',
    icon: '📋',
    color: 'teal',
    roles: ['admin'],
    category: 'admin',
    badge: 'Admin',
  },

  // ============= TRANSPARENCY & ANALYTICS =============
  {
    id: 'follow_cases',
    title: 'Case Follow-Ups',
    description: 'Recursive case follow-up threads and investigative threads',
    path: '/case-follow-ups',
    icon: '🔗',
    color: 'teal',
    roles: ['citizen', 'admin', 'officer', 'ngo_partner'],
    category: 'transparency',
  },
  {
    id: 'corruption_heatmap',
    title: 'Corruption Heatmap',
    description: 'Interactive map showing corruption hotspots by region',
    path: '/corruption-heatmap',
    icon: '🗺️',
    color: 'red',
    roles: ['citizen', 'admin', 'officer', 'ngo_partner'],
    category: 'transparency',
  },
  {
    id: 'institution_rankings',
    title: 'Institution Rankings',
    description: 'Red-flag institution rankings and trust scores by performance',
    path: '/institution-rankings',
    icon: '🏆',
    color: 'red',
    roles: ['citizen', 'admin', 'officer', 'ngo_partner'],
    category: 'transparency',
  },
  {
    id: 'repository',
    title: 'Public Repository',
    description: 'Privacy-safe public search of approved summaries and keywords',
    path: '/repository',
    icon: '🔍',
    color: 'teal',
    roles: ['citizen', 'admin', 'officer', 'ngo_partner'],
    category: 'transparency',
  },
  {
    id: 'view_analytics',
    title: 'Analytics Dashboard',
    description: 'View platform statistics, trends, and case outcomes',
    path: '/analytics',
    icon: '📊',
    color: 'teal',
    roles: ['admin', 'officer', 'ngo_partner'],
    category: 'analytics',
    badge: 'Data',
  },

  // ============= ACCOUNTABILITY =============
  {
    id: 'admin_accountability',
    title: 'Accountability Operations',
    description: 'Whistleblower safety, case appeals, witness reviews, and external notices',
    path: '/admin/accountability',
    icon: '⚖️',
    color: 'red',
    roles: ['citizen', 'admin', 'officer'],
    category: 'accountability',
    badge: 'Security',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Your personalized dashboard with quick access to key features',
    path: '/dashboard',
    icon: '🏠',
    color: 'teal',
    roles: ['citizen', 'admin', 'officer', 'ngo_partner'],
    category: 'reporting',
  },
];

export function getFeaturesByRole(role: string): Feature[] {
  return FEATURES.filter((feature) => feature.roles.includes(role as any));
}

export function getFeaturesByCategory(
  role: string,
  category: string
): Feature[] {
  return FEATURES.filter(
    (feature) =>
      feature.roles.includes(role as any) &&
      feature.category === category
  );
}

export const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen',
  admin: 'Administrator',
  officer: 'Government Officer',
  ngo_partner: 'NGO Partner',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  citizen:
    'Report incidents, track cases, and participate in transparent accountability',
  admin: 'Verify reports, manage moderation, and oversee platform operations',
  officer:
    'Review cases, provide official updates, and coordinate investigations',
  ngo_partner: 'Monitor cases, provide follow-ups, and support investigations',
};
