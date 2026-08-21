import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import {
  getModerationQueue,
  resolveModerationFlag,
  scanReportForFraud,
  type ModerationQueueItem,
  type ModerationRiskBreakdown,
} from '../services/fraudSpamModerationApi';

export default function FraudModerationPage() {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [scanResult, setScanResult] = useState<ModerationRiskBreakdown | null>(null);
  const [scanning, setScanning] = useState(false);

  // Parse once so the effect below runs a single time (a fresh object every
  // render would retrigger the queue fetch in an endless loop).
  const [user] = useState<{ role: string } | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as { role: string }) : null;
  });

  const loadQueue = () => {
    setLoading(true);
    getModerationQueue()
      .then((data) => setQueue(data.queue))
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.role === 'admin') loadQueue();
  }, [user?.role]);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const handleResolve = async (flagId: string, decision: 'approve' | 'reject_spam') => {
    setActionMessage('');
    try {
      await resolveModerationFlag(flagId, decision);
      setActionMessage(decision === 'approve' ? 'Report approved and restored to active queue.' : 'Report confirmed as fraud/spam and rejected.');
      loadQueue();
    } catch {
      setActionMessage('Failed to resolve moderation flag.');
    }
  };

  const handleScanTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testDescription.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await scanReportForFraud(testTitle, testDescription);
      setScanResult(res.risk);
    } catch {
      setActionMessage('Fraud scan failed.');
    } finally {
      setScanning(false);
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
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">Fraud & Spam Moderation</span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">Admin Security Operations</p>
            <h1 className="font-sora text-3xl font-bold text-white mt-1">Fraud and Spam Auto-Moderation System</h1>
            <p className="text-sm text-on-surface/60 mt-2">
              Automated detection of commercial spam, extortion scams, uppercase abuse, and financial fraud patterns.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 self-start md:self-auto">
            <Link to="/admin/duplicate-detection" className="text-xs font-bold text-brand-teal hover:underline">
              &larr; Duplicate Detector
            </Link>
            <Link to="/admin/verification" className="text-xs font-bold text-brand-teal hover:underline">
              Verification Queue &rarr;
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-6 p-4 rounded-lg border border-brand-teal/30 bg-brand-teal/5 text-sm text-brand-teal">
            {actionMessage}
          </div>
        )}

        {/* Live Moderation Sandbox */}
        <section className="mt-8 border border-white/10 rounded-xl p-6 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <ShieldIcon className="w-5 h-5 text-brand-red" />
            <h2 className="font-sora font-bold text-lg text-white">Live Fraud Risk Analyzer</h2>
          </div>
          <form onSubmit={handleScanTest} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-on-surface/60">Sample Title</label>
              <input
                required
                placeholder="e.g. CLICK HERE FOR FREE BDT MONEY CASHOUT"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-on-surface/60">Sample Content / Statement</label>
              <textarea
                required
                rows={3}
                placeholder="Paste text to test against fraud heuristic rules..."
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </div>
            <button
              type="submit"
              disabled={scanning}
              className="px-5 py-2.5 bg-brand-red text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {scanning ? 'Scanning Risk Score...' : 'Run Fraud & Spam Scan'}
            </button>
          </form>

          {scanResult && (
            <div className="mt-6 p-5 border border-white/10 rounded-lg bg-black/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">Fraud Risk Assessment</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded border ${
                    scanResult.totalRiskScore >= 70
                      ? 'bg-brand-red/10 text-brand-red border-brand-red/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  Risk Score: {scanResult.totalRiskScore}% ({scanResult.isAutoHidden ? 'AUTO-HIDDEN' : 'PASS'})
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
                  <span className="text-on-surface/50 text-[10px] block uppercase font-bold">Caps Ratio</span>
                  <span className="font-bold text-white text-sm mt-1 block">{scanResult.capsScore}%</span>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
                  <span className="text-on-surface/50 text-[10px] block uppercase font-bold">Link Spam</span>
                  <span className="font-bold text-white text-sm mt-1 block">{scanResult.linkSpamScore}%</span>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
                  <span className="text-on-surface/50 text-[10px] block uppercase font-bold">Gibberish</span>
                  <span className="font-bold text-white text-sm mt-1 block">{scanResult.gibberishScore}%</span>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
                  <span className="text-on-surface/50 text-[10px] block uppercase font-bold">Financial Scam</span>
                  <span className="font-bold text-white text-sm mt-1 block">{scanResult.fraudScamScore}%</span>
                </div>
              </div>

              {scanResult.reasons.length > 0 && (
                <div className="mt-4 text-xs text-amber-300 space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-on-surface/60">Triggered Heuristics:</p>
                  {scanResult.reasons.map((reason, idx) => (
                    <p key={idx}>&bull; {reason}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Flagged Moderation Queue */}
        <section className="mt-10 border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/10 flex justify-between items-center text-xs">
            <span className="font-bold uppercase tracking-wider text-on-surface/70">Flagged & Hidden Moderation Queue</span>
            <span className="text-on-surface/50">{queue.length} report{queue.length === 1 ? '' : 's'} waiting review</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-on-surface/50">Loading moderation queue...</div>
          ) : queue.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface/50">
              No reports currently flagged for moderation.
            </div>
          ) : (
            queue.map((item) => (
              <article key={item.flag_id} className="p-6 border-b border-white/10 last:border-0 hover:bg-white/[0.01]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/30">
                        Status: {item.status}
                      </span>
                      <span className="text-xs text-on-surface/50">Flagged {new Date(item.flagged_at).toLocaleString()}</span>
                    </div>

                    <h3 className="font-sora font-bold text-white text-lg">{item.title}</h3>
                    <p className="text-xs text-amber-300 font-medium">Reason Flagged: {item.reason}</p>
                    <p className="text-sm text-on-surface/70 bg-black/30 p-3 rounded border border-white/5 line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={() => handleResolve(item.flag_id, 'approve')}
                      className="px-4 py-2 bg-emerald-500 text-black rounded text-xs font-bold hover:bg-emerald-400"
                    >
                      Approve Report
                    </button>
                    <button
                      onClick={() => handleResolve(item.flag_id, 'reject_spam')}
                      className="px-4 py-2 bg-brand-red text-white rounded text-xs font-bold hover:bg-brand-red/90"
                    >
                      Confirm Fraud & Reject
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
