import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';

interface StoredUser { name: string; email: string; role: string }
const roleLabel = (role: string) => role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

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
      <header className="border-b border-white/10 bg-bg-dark/95">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link>
          <button onClick={signOut} className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-red/50">Sign Out</button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-3">{roleLabel(user.role)}</p>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-white">Welcome, {user.name}</h1>
        <p className="text-sm text-on-surface/60 mt-3">{user.email}</p>

        <section className="mt-10 border border-white/10 rounded-lg p-6 md:p-8 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-3"><ShieldIcon className="w-5 h-5 text-brand-teal" /><h2 className="font-sora text-lg font-bold text-white">Your Dashboard</h2></div>
          <p className="text-sm text-on-surface/60 mb-6">Access the reporting tools available for your account.</p>
          {user.role === 'citizen' ? (
            <Link to="/submit-report" className="inline-block px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold">Submit a Report</Link>
          ) : (
            <Link to="/" className="inline-block px-5 py-3 border border-brand-teal/40 text-brand-teal rounded-lg text-sm font-bold">Return Home</Link>
          )}
        </section>
      </main>
    </div>
  );
}
