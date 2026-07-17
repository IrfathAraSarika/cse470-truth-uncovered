import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';

interface StoredUser { name: string; email: string; role: string }
const roleLabel = (role: string) => role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const FileIcon = () => (
  <svg className="w-5 h-5 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5 text-brand-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) as StoredUser : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const signOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('citizen');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-dark/95 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link>
          <button onClick={signOut} className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-red/50 hover:text-brand-red transition-colors">Sign Out</button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-3">{roleLabel(user.role)}</p>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-white">Welcome, {user.name}</h1>
        <p className="text-sm text-on-surface/60 mt-3">{user.email}</p>

        {user.role === 'citizen' ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Submit a Report */}
            <Link
              to="/submit-report"
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-brand-red/30 transition-all duration-300 p-6 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center">
                <PlusIcon />
              </div>
              <div>
                <p className="font-sora font-semibold text-white text-lg group-hover:text-brand-red transition-colors">Submit a Report</p>
                <p className="text-sm text-on-surface/50 mt-1">
                  File a new corruption report — optionally anonymously.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-red/70 font-semibold mt-auto">
                Get started
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* My Reports */}
            <Link
              to="/my-reports"
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-brand-teal/30 transition-all duration-300 p-6 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center">
                <FileIcon />
              </div>
              <div>
                <p className="font-sora font-semibold text-white text-lg group-hover:text-brand-teal transition-colors">My Reports</p>
                <p className="text-sm text-on-surface/50 mt-1">
                  View all reports you've submitted and track their status.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-teal/70 font-semibold mt-auto">
                View reports
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </Link>
          </div>
        ) : (
          <section className="mt-10 border border-white/10 rounded-lg p-6 md:p-8 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-3"><ShieldIcon className="w-5 h-5 text-brand-teal" /><h2 className="font-sora text-lg font-bold text-white">Your Dashboard</h2></div>
            <p className="text-sm text-on-surface/60 mb-6">Access the reporting tools available for your account.</p>
            <Link to="/" className="inline-block px-5 py-3 border border-brand-teal/40 text-brand-teal rounded-lg text-sm font-bold">Return Home</Link>
          </section>
        )}
      </main>
    </div>
  );
}

