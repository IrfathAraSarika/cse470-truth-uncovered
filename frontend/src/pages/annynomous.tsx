import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldIcon, LockIcon } from 'frontend/src/assets/icons/icons.tsx';

const IncognitoIcon = () => (
  <svg className="w-6 h-6 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 0 10 0 5 5 0 0 0 5-5H2z" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="12" r="3" />
    <line x1="6" y1="9" x2="18" y2="9" />
  </svg>
);

// ⚠️ PLACEHOLDER — replace with your real report_category enum values from Supabase
// (Database → Enumerated Types → report_category)
const CATEGORY_OPTIONS = [
  { value: 'bribery', label: 'Bribery' },
  { value: 'embezzlement', label: 'Embezzlement' },
  { value: 'abuse_of_power', label: 'Abuse of Power' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'other', label: 'Other' },
];

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

interface StoredCitizen {
  citizen_id: string;
  name: string;
  email: string;
}

export default function AnonymousSubmission() {
  const navigate = useNavigate();

  const [citizen, setCitizen] = useState<StoredCitizen | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [isAnonymous, setIsAnonymous] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [incidentDateTime, setIncidentDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Require login before allowing access to this page
  useEffect(() => {
    const stored = localStorage.getItem('citizen');
    if (!stored) {
      navigate('/login');
      return;
    }
    try {
      setCitizen(JSON.parse(stored));
    } catch {
      localStorage.removeItem('citizen');
      navigate('/login');
    } finally {
      setCheckingAuth(false);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: citizen.citizen_id,
          title,
          description,
          category,
          incidentDateTime: incidentDateTime || null,
          isAnonymous,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Submission failed');
      }

      await res.json();
      setSubmitStatus('success');
      setTitle('');
      setDescription('');
      setIncidentDateTime('');
      setCategory(CATEGORY_OPTIONS[0].value);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wait until we've confirmed login state before rendering the form
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <span className="inline-block w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!citizen) return null; // redirect already triggered

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface flex flex-col font-inter px-6 py-16">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-brand-teal/10 flex items-center justify-center border border-brand-teal/20">
            <IncognitoIcon />
          </div>
          <div>
            <h1 className="font-sora text-2xl font-bold text-white">Anonymous Submission Mode</h1>
            <p className="text-xs text-on-surface/50">Report corruption without revealing your identity</p>
          </div>
        </div>

        <p className="text-xs text-on-surface/40 mb-6">
          Signed in as <span className="text-brand-teal">{citizen.email}</span> — your account stays linked internally for accountability, but your identity is hidden from public view when Anonymous Mode is on.
        </p>

        <form onSubmit={handleSubmit} className="glass-card glass-border p-8 mt-2 space-y-6">
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/30 border border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Submit Anonymously</p>
              <p className="text-xs text-on-surface/50 mt-1">
                Your identity will not be shown alongside this report.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-brand-teal' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40"
              placeholder="Brief summary of the incident"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface focus:outline-none focus:border-brand-teal/40"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Incident Date/Time */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">
              Incident Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={incidentDateTime}
              onChange={(e) => setIncidentDateTime(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface focus:outline-none focus:border-brand-teal/40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40"
              placeholder="Describe what happened, when, and where"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-brand-red hover:bg-brand-red/90 text-white font-semibold rounded-lg text-sm shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 interactive-hover disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldIcon className="w-4 h-4" /> Submit Report Securely
              </>
            )}
          </button>

          {submitStatus === 'success' && (
            <p className="text-xs text-brand-teal text-center flex items-center justify-center gap-1.5">
              <LockIcon className="w-3.5 h-3.5" /> Report submitted and secured.
            </p>
          )}
          {submitStatus === 'error' && (
            <p className="text-xs text-brand-red text-center">
              {errorMessage || 'Submission failed — is the backend running?'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}