import { Link, Navigate } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';
import ReportForm from '../components/ReportForm';

export default function ReportSubmissionPage() {
  const citizen = localStorage.getItem('citizen');
  if (!citizen) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10">
        <div className="max-w-[1100px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link>
          <span className="text-xs font-bold uppercase text-brand-teal">Secure Report Builder</span>
        </div>
      </header>
      <main className="max-w-[900px] mx-auto px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Sprint 1 Feature</p>
        <h1 className="font-sora text-3xl font-bold text-white mt-2">Structured Incident Report Builder</h1>
        <p className="text-sm text-on-surface/60 mt-3">Provide clear, actionable incident information. Required fields are marked.</p>
        <ReportForm />
      </main>
    </div>
  );
}
