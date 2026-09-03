import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoIcon, LogoutIcon } from '../components/AppIcons';
import { fetchDashboard, type DashboardData } from '../services/dashboardApi';
import {
  getFeaturesByRole,
  getFeaturesByCategory,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from '../config/featureConfig';

const colorMap: Record<string, string> = {
  teal: 'border-brand-teal/30 bg-brand-teal/5 hover:border-brand-teal/50 hover:bg-brand-teal/10',
  red: 'border-brand-red/30 bg-brand-red/5 hover:border-brand-red/50 hover:bg-brand-red/10',
  amber: 'border-amber-400/30 bg-amber-400/5 hover:border-amber-400/50 hover:bg-amber-400/10',
  emerald: 'border-emerald-400/30 bg-emerald-400/5 hover:border-emerald-400/50 hover:bg-emerald-400/10',
};

const colorTextMap: Record<string, string> = {
  teal: 'text-brand-teal',
  red: 'text-brand-red',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  path: string;
  color: string;
  badge?: string;
  badgeColor?: string;
}

function FeatureCard({
  icon,
  title,
  description,
  path,
  color,
  badge,
  badgeColor,
}: FeatureCardProps) {
  return (
    <Link
      to={path}
      className={`group rounded-lg border p-6 transition-all duration-300 cursor-pointer ${colorMap[color]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {badge && (
          <span
            className={`text-[9px] font-bold uppercase px-2 py-1 rounded border ${
              badgeColor === 'red'
                ? 'border-brand-red/30 bg-brand-red/10 text-brand-red'
                : badgeColor === 'teal'
                  ? 'border-brand-teal/30 bg-brand-teal/10 text-brand-teal'
                  : 'border-white/20 bg-white/5 text-on-surface/70'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-sora font-bold text-lg text-white mb-2 group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="text-sm text-on-surface/70 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-on-surface/60 group-hover:text-on-surface/80 transition-colors">
        Open <span>→</span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard()
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('citizen');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark text-on-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return <Navigate to="/login" replace />;
  }

  const { user, role } = dashboard;
  const allFeatures = getFeaturesByRole(role);
  const categories = [
    'reporting',
    'admin',
    'transparency',
    'analytics',
    'accountability',
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      {/* Header */}
      <header className="border-b border-white/10 bg-bg-dark/95 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold text-lg text-white">Truth Uncovered</span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{user.fullName}</p>
              <p className="text-xs text-on-surface/60">
                {ROLE_LABELS[role] || role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-on-surface/70 hover:text-on-surface"
              title="Logout"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-2">
              Welcome Back
            </p>
            <h1 className="font-sora text-4xl md:text-5xl font-bold text-white mb-4">
              {ROLE_LABELS[role] || role} Dashboard
            </h1>
            <p className="text-lg text-on-surface/70 leading-relaxed">
              {ROLE_DESCRIPTIONS[role] || 'Access your personalized features and tools'}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
              <p className="text-xs text-on-surface/60 uppercase tracking-wider">Role</p>
              <p className="text-lg font-bold text-white mt-2">
                {ROLE_LABELS[role]}
              </p>
            </div>
            {user.civicPoints !== undefined && (
              <div className="p-4 rounded-lg border border-brand-teal/20 bg-brand-teal/5">
                <p className="text-xs text-on-surface/60 uppercase tracking-wider">Civic Points</p>
                <p className="text-lg font-bold text-brand-teal mt-2">
                  {user.civicPoints}
                </p>
              </div>
            )}
            <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
              <p className="text-xs text-on-surface/60 uppercase tracking-wider">
                Features Available
              </p>
              <p className="text-lg font-bold text-white mt-2">{allFeatures.length}</p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
              <p className="text-xs text-on-surface/60 uppercase tracking-wider">Member Since</p>
              <p className="text-xs font-semibold text-white mt-2">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features by Category */}
      <main className="max-w-[1400px] mx-auto px-6 py-12">
        {categories.map((category) => {
          const categoryFeatures = getFeaturesByCategory(role, category);
          if (categoryFeatures.length === 0) return null;

          const categoryTitles: Record<string, string> = {
            reporting: '📝 Reporting & Case Management',
            admin: '⚙️ Admin Operations',
            transparency: '🔍 Transparency & Analytics',
            analytics: '📊 Analytics & Insights',
            accountability: '⚖️ Accountability & Safety',
          };

          return (
            <section key={category} className="mb-12">
              <div className="mb-6">
                <h2 className="font-sora text-2xl font-bold text-white">
                  {categoryTitles[category]}
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-brand-teal to-transparent mt-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryFeatures.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    path={feature.path}
                    color={feature.color}
                    badge={feature.badge}
                    badgeColor={feature.badgeColor}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Footer CTA */}
      <section className="border-t border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-[1400px] mx-auto px-6 py-12 text-center">
          <p className="text-on-surface/70 text-sm">
            Need help? Check our{' '}
            <Link to="/articles" className="text-brand-teal hover:underline font-semibold">
              learning resources
            </Link>
            {' '}or contact support.
          </p>
        </div>
      </section>
    </div>
  );
}
