import { useState } from 'react';
import { ShieldIcon, LockIcon } from '../components/AppIcons';
import {
  submitAnonymousReport,
  trackAnonymousReport,
  type AnonymousReportResult,
} from '../services/anonymousReportApi';

const IncognitoIcon = () => (
  <svg className="w-6 h-6 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 0 10 0 5 5 0 0 0 5-5H2z" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="12" r="3" />
    <line x1="6" y1="9" x2="18" y2="9" />
  </svg>
);

// Must match the backend report_category enum.
const CATEGORY_OPTIONS = [
  { value: 'corruption', label: 'Corruption' },
  { value: 'bribery', label: 'Bribery' },
  { value: 'dowry', label: 'Dowry' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'extortion', label: 'Extortion' },
  { value: 'land_grabbing', label: 'Land Grabbing' },
  { value: 'hazard', label: 'Public Hazard' },
  { value: 'antisocial_activity', label: 'Antisocial Activity' },
  { value: 'other', label: 'Other' },
];

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-brand-teal/15 text-brand-teal border-brand-teal/30',
  under_review: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  pending_verification: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  verified: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  hidden: 'bg-brand-red/15 text-brand-red border-brand-red/30',
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-white/10 text-on-surface/70 border-white/15';
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function AnonymousSubmission() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [district, setDistrict] = useState('');
  const [incidentDateTime, setIncidentDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState<AnonymousReportResult | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const [trackingInput, setTrackingInput] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackedReport, setTrackedReport] = useState<AnonymousReportResult | null>(null);
  const [trackError, setTrackError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await submitAnonymousReport({
        title,
        description,
        category,
        incidentDateTime: incidentDateTime || null,
        district: district.trim() || null,
        address: null,
      });
      setSubmitted(result.report);
      setTitle('');
      setDescription('');
      setDistrict('');
      setIncidentDateTime('');
      setCategory(CATEGORY_OPTIONS[0].value);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!submitted) return;
    try {
      await navigator.clipboard.writeText(submitted.tracking_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // clipboard unavailable — the code stays visible on screen anyway
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setIsTracking(true);
    setTrackError('');
    setTrackedReport(null);

    try {
      const result = await trackAnonymousReport(trackingInput);
      setTrackedReport(result.report);
    } catch (err) {
      console.error(err);
      setTrackError(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface flex flex-col font-inter px-6 py-16">
      <div className="max-w-2xl mx-auto w-full space-y-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-brand-teal/10 flex items-center justify-center border border-brand-teal/20">
            <IncognitoIcon />
          </div>
          <div>
            <h1 className="font-sora text-2xl font-bold text-white">Anonymous Submission Mode</h1>
            <p className="text-xs text-on-surface/50">Report corruption without an account or identity</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-brand-teal/5 border border-brand-teal/20 text-xs text-on-surface/60 leading-relaxed">
          <LockIcon className="w-3.5 h-3.5 inline mr-1.5 text-brand-teal" />
          No login is required. We never store your account, email, or IP address with the report.
          After submitting, you receive a one-time tracking code — the only way to follow this case.
        </div>

        {/* Success panel with tracking code */}
        {submitted && (
          <div className="glass-card glass-border p-6 space-y-3 border-brand-teal/30">
            <p className="text-sm font-semibold text-brand-teal flex items-center gap-2">
              <ShieldIcon className="w-4 h-4" /> Report submitted securely
            </p>
            <p className="text-xs text-on-surface/60">
              Save this tracking code — it is the only way to check your report's status later.
            </p>
            <div className="flex items-center gap-3">
              <code className="px-4 py-2.5 rounded-lg bg-black/50 border border-brand-teal/30 text-brand-teal font-mono text-lg tracking-widest">
                {submitted.tracking_code}
              </code>
              <button
                type="button"
                onClick={copyCode}
                className="px-3 py-2.5 rounded-lg border border-white/15 text-xs text-on-surface/70 hover:border-brand-teal/40 hover:text-brand-teal transition-colors"
              >
                {codeCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-on-surface/50">
              Current status: <StatusBadge status={submitted.status} />
            </p>
          </div>
        )}

        {/* Submission form */}
        <form onSubmit={handleSubmit} className="glass-card glass-border p-8 space-y-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">District (optional)</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40"
                placeholder="e.g. Dhaka"
              />
            </div>
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
          </div>

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

          {errorMessage && (
            <p className="text-xs text-brand-red text-center">
              {errorMessage || 'Submission failed — is the backend running?'}
            </p>
          )}
        </form>

        {/* Track by code */}
        <div className="glass-card glass-border p-8 space-y-4">
          <div>
            <h2 className="font-sora text-base font-semibold text-white">Track Your Anonymous Report</h2>
            <p className="text-xs text-on-surface/50 mt-1">
              Enter the tracking code you received after submitting.
            </p>
          </div>
          <form onSubmit={handleTrack} className="flex gap-3">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
              placeholder="ANON-XXXXXX"
              className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40 font-mono tracking-widest"
            />
            <button
              type="submit"
              disabled={isTracking || !trackingInput.trim()}
              className="px-5 py-3 bg-brand-teal/20 border border-brand-teal/30 hover:bg-brand-teal/30 text-brand-teal font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isTracking ? 'Checking…' : 'Track'}
            </button>
          </form>

          {trackError && <p className="text-xs text-brand-red">{trackError}</p>}

          {trackedReport && (
            <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{trackedReport.title}</p>
                <StatusBadge status={trackedReport.status} />
              </div>
              <p className="text-xs text-on-surface/50">
                Category: {trackedReport.category.replace(/_/g, ' ')}
                {trackedReport.district ? ` · District: ${trackedReport.district}` : ''}
                {' · Submitted: '}
                {new Date(trackedReport.submission_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
