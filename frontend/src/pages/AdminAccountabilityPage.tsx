import { Link, Navigate } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';
import { useState, useEffect } from 'react';

export default function AdminAccountabilityPage() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      setUser(JSON.parse(raw));
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen bg-bg-dark" />;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold text-lg text-white">Truth Uncovered</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <h1 className="font-sora text-4xl font-bold text-white mb-4">Admin Accountability Operations</h1>
        <p className="text-on-surface/70">Manage whistleblower safety, case appeals, and witness reviews.</p>
      </main>
    </div>
  );
}
