import { Link } from 'react-router-dom';

function dashboardPath() {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? 'null') as { role?: string } | null;
    return user?.role === 'admin' ? '/admin/verification' : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

export default function DashboardLink() {
  return (
    <Link
      to={dashboardPath()}
      className="px-4 py-2 border border-white/15 rounded-lg text-xs font-bold text-on-surface/70 hover:text-brand-teal hover:border-brand-teal/40 transition-colors whitespace-nowrap"
    >
      Back to Dashboard
    </Link>
  );
}
