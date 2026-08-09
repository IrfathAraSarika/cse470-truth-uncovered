import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import { getMyVerification, type VerificationStatusValue } from '../services/verificationApi';

interface StoredUser { name: string; email: string; role: string }
const roleLabel = (role: string) => role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 align-middle">
      <ShieldIcon className="w-3.5 h-3.5" />
      Verified
    </span>
  );
}

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) as StoredUser : null;

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusValue | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'citizen') return;
    getMyVerification()
      .then((data) => setVerificationStatus(data.status))
      .catch(() => setVerificationStatus(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const signOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('citizen');
    navigate('/login');
  };

  const isVerified = verificationStatus === 'verified';
  const verifyButtonLabel =
    verificationStatus === 'pending' ? 'Verification Pending'
      : verificationStatus === 'rejected' ? 'Re-submit Verification'
        : 'Verify Account';

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link>
          <button onClick={signOut} className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-red/50">Sign Out</button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-3">{roleLabel(user.role)}</p>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-white flex items-center gap-3 flex-wrap">
          Welcome, {user.name}
          {isVerified && <VerifiedBadge />}
        </h1>
        <p className="text-sm text-on-surface/60 mt-3">{user.email}</p>

        <section className="mt-10 border border-white/10 rounded-lg p-6 md:p-8 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-3"><ShieldIcon className="w-5 h-5 text-brand-teal" /><h2 className="font-sora text-lg font-bold text-white">Your Dashboard</h2></div>
          <p className="text-sm text-on-surface/60 mb-6">Access the reporting tools available for your account.</p>
          {user.role === 'citizen' ? (
            <div className="flex flex-wrap gap-3">
              <Link to="/submit-report" className="inline-block px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold">Submit a Report</Link>
              <Link to="/my-reports" className="inline-block px-5 py-3 border border-brand-teal/40 text-brand-teal rounded-lg text-sm font-bold">My Reports</Link>
              <Link to="/case-tracker" className="inline-block px-5 py-3 border border-white/15 text-white rounded-lg text-sm font-bold">Track a Case</Link>
              <Link to="/offline-drafts" className="inline-block px-5 py-3 border border-white/15 text-white rounded-lg text-sm font-bold">Offline Drafts</Link>
              <Link
                to="/verification"
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold ${
                  isVerified
                    ? 'bg-emerald-500 text-black'
                    : verificationStatus === 'pending'
                      ? 'bg-amber-500 text-black'
                      : 'bg-emerald-500 text-black'
                }`}
              >
                <ShieldIcon className="w-4 h-4" />
                {isVerified ? 'Verified' : verifyButtonLabel}
              </Link>
            </div>
          ) : (
            <Link to="/" className="inline-block px-5 py-3 border border-brand-teal/40 text-brand-teal rounded-lg text-sm font-bold">Return Home</Link>
          )}
        </section>

        {user.role === 'citizen' && (
          <section className="mt-6 border border-white/10 rounded-lg p-6 md:p-8 bg-white/[0.02]">
            <h2 className="font-sora text-lg font-bold text-white mb-2">Identity Verification</h2>
            {isVerified ? (
              <p className="text-sm text-on-surface/60">Your account is verified. <VerifiedBadge /></p>
            ) : verificationStatus === 'pending' ? (
              <p className="text-sm text-amber-400/90">Your NID submission is under review. You will get the verified badge once an admin approves it.</p>
            ) : verificationStatus === 'rejected' ? (
              <p className="text-sm text-rose-400/90">Your last verification request was rejected. Visit the <Link to="/verification" className="underline">verification page</Link> to submit again.</p>
            ) : (
              <p className="text-sm text-on-surface/60">You are not verified yet. Submit your NID on the <Link to="/verification" className="underline text-brand-teal">verification page</Link> to earn a verified badge.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
