import { useState } from 'react';
import { ShieldIcon, LockIcon } from './App';

const IncognitoIcon = () => (
  <svg className="w-6 h-6 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 0 10 0 5 5 0 0 0 5-5H2z" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="12" r="3" />
    <line x1="6" y1="9" x2="18" y2="9" />
  </svg>
);

const CATEGORY_OPTIONS = ['Bribery', 'Embezzlement', 'Abuse of Power', 'Fraud', 'Other'];
const DELAY_OPTIONS = [
  { label: 'Publish Immediately', hours: 0 },
  { label: '24 Hours', hours: 24 },
  { label: '3 Days', hours: 72 },
  { label: '7 Days', hours: 168 },
];

export default function AnonymousSubmission() {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [reporterName, setReporterName] = useState('');
  const [reporterNid, setReporterNid] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [delayHours, setDelayHours] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          isAnonymous,
          reporterName: isAnonymous ? undefined : reporterName,
          reporterNid: isAnonymous ? undefined : reporterNid,
          reporterPhone: isAnonymous ? undefined : reporterPhone,
          publishDelayHours: delayHours,
        }),
      });

      if (!res.ok) throw new Error('Submission failed');

      await res.json();
      setSubmitStatus('success');
      setTitle('');
      setDescription('');
      setReporterName('');
      setReporterNid('');
      setReporterPhone('');
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="glass-card glass-border p-8 mt-8 space-y-6">
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/30 border border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Strip Personal Identifiers</p>
              <p className="text-xs text-on-surface/50 mt-1">
                Name, NID, phone, and device fingerprint will be fully removed before saving.
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
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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

          {/* Reporter details — only shown if NOT anonymous */}
          {!isAnonymous && (
            <div className="space-y-4 p-4 rounded-lg bg-brand-red/5 border border-brand-red/10">
              <p className="text-xs text-brand-red font-semibold">
                ⚠ Identity fields will be stored since Anonymous Mode is off.
              </p>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40"
                placeholder="Full name"
              />
              <input
                type="text"
                value={reporterNid}
                onChange={(e) => setReporterNid(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40"
                placeholder="NID number"
              />
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40"
                placeholder="Phone number"
              />
            </div>
          )}

          {/* Time-delayed publishing */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">
              Publish Delay
            </label>
            <p className="text-xs text-on-surface/50 mb-3">
              Adds a buffer before your report becomes publicly visible, to protect you from being singled out immediately after submission.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DELAY_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setDelayHours(opt.hours)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                    delayHours === opt.hours
                      ? 'bg-brand-teal/15 border-brand-teal/40 text-brand-teal'
                      : 'bg-white/[0.02] border-white/10 text-on-surface/60 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
            <p className="text-xs text-brand-red text-center">Submission failed — is the backend running?</p>
          )}
        </form>
      </div>
    </div>
  );
}