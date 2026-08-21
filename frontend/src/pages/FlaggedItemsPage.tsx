import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import {
  FLAG_REASON_OPTIONS,
  createFlaggedItem,
  getFlaggableReports,
  getFlaggedItemQueue,
  getPublicFlaggedReports,
  resolveFlaggedItem,
  type FlagReason,
  type FlaggableReport,
  type FlaggedItemQueueEntry,
  type PublicFlaggedItem,
} from '../services/flaggedItemApi';

export default function FlaggedItemsPage() {
  const [watchBoard, setWatchBoard] = useState<PublicFlaggedItem[]>([]);
  const [flaggable, setFlaggable] = useState<FlaggableReport[]>([]);
  const [queue, setQueue] = useState<FlaggedItemQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  // Flag form state.
  const [selectedReportId, setSelectedReportId] = useState('');
  const [reason, setReason] = useState<FlagReason>('fraud_or_scam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? (JSON.parse(userRaw) as { role: string }) : null;
  const isAdmin = user?.role === 'admin';

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      getPublicFlaggedReports().catch(() => ({ items: [] as PublicFlaggedItem[] })),
      getFlaggableReports().catch(() => ({ reports: [] as FlaggableReport[] })),
      isAdmin ? getFlaggedItemQueue().catch(() => ({ queue: [] as FlaggedItemQueueEntry[] })) : Promise.resolve({ queue: [] as FlaggedItemQueueEntry[] }),
    ])
      .then(([publicRes, flaggableRes, queueRes]) => {
        setWatchBoard(publicRes.items);
        setFlaggable(flaggableRes.reports);
        setQueue(queueRes.queue);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await createFlaggedItem(selectedReportId, reason, details.trim() || undefined);
      setMessage({
        text: res.autoEscalated
          ? `Flag submitted. Severity ${res.severity}% — auto-escalated to the admin review queue.`
          : `Flag submitted with severity ${res.severity}%. An admin will review it.`,
        tone: 'ok',
      });
      setSelectedReportId('');
      setDetails('');
      loadAll();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Failed to submit flag.', tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (flagId: string, decision: 'dismiss' | 'hide') => {
    setMessage(null);
    try {
      await resolveFlaggedItem(flagId, decision);
      setMessage({
        text: decision === 'hide' ? 'Flag confirmed — report hidden from the public board.' : 'Flag dismissed — report stays active.',
        tone: 'ok',
      });
      loadAll();
    } catch {
      setMessage({ text: 'Failed to resolve the flagged item.', tone: 'error' });
    }
  };

  const fieldClass =
    'w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-on-surface focus:outline-none focus:border-brand-teal/50';

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold">Truth Uncovered</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">FlaggedItem Watch</span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">Community Moderation</p>
          <h1 className="font-sora text-3xl font-bold text-white mt-1">FlaggedItem — Community Flag Watch</h1>
          <p className="text-sm text-on-surface/60 mt-2 max-w-3xl">
            Citizens flag suspicious incident reports; every flag is severity-scored against the fraud
            heuristics engine and routed to the admin verification queue for a final decision.
          </p>
        </div>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg border text-sm ${
              message.tone === 'ok'
                ? 'border-brand-teal/30 bg-brand-teal/5 text-brand-teal'
                : 'border-brand-red/30 bg-brand-red/5 text-brand-red'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Community Watch Board */}
          <section className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/10 flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-on-surface/70">Currently Flagged Reports</span>
              <span className="text-on-surface/50">{watchBoard.length} under review</span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-on-surface/50">Loading flagged reports...</div>
            ) : watchBoard.length === 0 ? (
              <div className="p-12 text-center text-sm text-on-surface/50">
                No reports are currently flagged. The community board is clean.
              </div>
            ) : (
              watchBoard.map((item) => (
                <article key={item.report_id} className="p-5 border-b border-white/10 last:border-0 hover:bg-white/[0.01]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/30">
                      {item.flag_count} flag{item.flag_count === 1 ? '' : 's'}
                    </span>
                    <span className="text-xs text-on-surface/50 uppercase">{item.category}</span>
                    {item.district && <span className="text-xs text-on-surface/40">• {item.district}</span>}
                  </div>
                  <h3 className="font-sora font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-on-surface/50 mt-1">
                    Last flagged {new Date(item.last_flagged_at).toLocaleString()} • status: {item.status}
                  </p>
                </article>
              ))
            )}
          </section>

          {/* Flag Submission Form */}
          <section className="border border-white/10 rounded-xl p-6 bg-white/[0.02] self-start">
            <div className="flex items-center gap-2 mb-4">
              <ShieldIcon className="w-5 h-5 text-brand-red" />
              <h2 className="font-sora font-bold text-lg text-white">Flag a Report</h2>
            </div>

            {!user ? (
              <div className="p-5 rounded-lg border border-white/10 bg-black/30 text-sm text-on-surface/70">
                You need an account to flag reports.{' '}
                <Link to="/login" className="text-brand-teal font-bold hover:underline">Log in</Link>
                {' '}or{' '}
                <Link to="/signup" className="text-brand-teal font-bold hover:underline">sign up</Link>
                {' '}to join the community watch.
              </div>
            ) : (
              <form onSubmit={handleFlagSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-on-surface/60">Report to Flag</label>
                  <select
                    required
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className={`${fieldClass} mt-1`}
                  >
                    <option value="">Select an active report...</option>
                    {flaggable.map((report) => (
                      <option key={report.report_id} value={report.report_id}>
                        {report.title} ({report.category}{report.district ? `, ${report.district}` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-on-surface/60">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as FlagReason)}
                    className={`${fieldClass} mt-1`}
                  >
                    {FLAG_REASON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-on-surface/60">Details (optional)</label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    placeholder="Explain why this report looks suspicious..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className={`${fieldClass} mt-1`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedReportId}
                  className="px-5 py-2.5 bg-brand-red text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting Flag...' : 'Submit Flag for Review'}
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Admin Resolution Queue */}
        {isAdmin && (
          <section className="mt-10 border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/10 flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-on-surface/70">Admin Flag Resolution Queue</span>
              <span className="text-on-surface/50">{queue.length} flag{queue.length === 1 ? '' : 's'} waiting</span>
            </div>

            {queue.length === 0 ? (
              <div className="p-12 text-center text-sm text-on-surface/50">
                No unresolved flags in the admin queue.
              </div>
            ) : (
              queue.map((item) => (
                <article key={item.flag_id} className="p-6 border-b border-white/10 last:border-0 hover:bg-white/[0.01]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/30">
                          {item.category}
                        </span>
                        <span className="text-xs text-on-surface/50">Flagged {new Date(item.flagged_at).toLocaleString()}</span>
                        {item.flagged_by && <span className="text-xs text-on-surface/40">by {item.flagged_by}</span>}
                      </div>

                      <h3 className="font-sora font-bold text-white text-lg">{item.title}</h3>
                      <p className="text-xs text-amber-300 font-medium">Reason: {item.reason}</p>
                      <p className="text-sm text-on-surface/70 bg-black/30 p-3 rounded border border-white/5 line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <button
                        onClick={() => handleResolve(item.flag_id, 'dismiss')}
                        className="px-4 py-2 bg-emerald-500 text-black rounded text-xs font-bold hover:bg-emerald-400"
                      >
                        Dismiss Flag
                      </button>
                      <button
                        onClick={() => handleResolve(item.flag_id, 'hide')}
                        className="px-4 py-2 bg-brand-red text-white rounded text-xs font-bold hover:bg-brand-red/90"
                      >
                        Confirm &amp; Hide Report
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
