import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import {
  analyzeReportDuplicates,
  getDuplicateQueue,
  resolveDuplicate,
  type DuplicateAnalyzeResponse,
  type DuplicateQueueItem,
} from '../services/duplicateDetectionApi';

export default function DuplicateDetectionPage() {
  const [queue, setQueue] = useState<DuplicateQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testCategory, setTestCategory] = useState('corruption');
  const [analyzeResult, setAnalyzeResult] = useState<DuplicateAnalyzeResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Parse once so the effect below runs a single time (a fresh object every
  // render would retrigger the queue fetch in an endless loop).
  const [user] = useState<{ role: string } | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as { role: string }) : null;
  });

  const loadQueue = () => {
    setLoading(true);
    getDuplicateQueue()
      .then((data) => setQueue(data.queue))
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') loadQueue();
  }, [user]);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const handleResolve = async (detectionId: string, action: 'merge' | 'dismiss') => {
    setActionMessage('');
    try {
      await resolveDuplicate(detectionId, action);
      setActionMessage(action === 'merge' ? 'Reports merged successfully. Secondary report marked as hidden.' : 'Duplicate pair dismissed.');
      loadQueue();
    } catch {
      setActionMessage('Failed to resolve duplicate record.');
    }
  };

  const handleAnalyzeTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testDescription.trim()) return;
    setAnalyzing(true);
    setAnalyzeResult(null);
    try {
      const res = await analyzeReportDuplicates({ title: testTitle, description: testDescription, category: testCategory });
      setAnalyzeResult(res);
    } catch {
      setActionMessage('Similarity analysis failed.');
    } finally {
      setAnalyzing(false);
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
          <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">AI Duplicate Detector</span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">Admin Operations</p>
            <h1 className="font-sora text-3xl font-bold text-white mt-1">AI-Powered Duplicate Report Detector</h1>
            <p className="text-sm text-on-surface/60 mt-2">
              Multi-factor similarity scoring matching incident NLP text, location proximity, and category vectors.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 self-start md:self-auto">
            <Link to="/admin/verification" className="text-xs font-bold text-brand-teal hover:underline">
              &larr; Verification Queue
            </Link>
            <Link to="/admin/fraud-moderation" className="text-xs font-bold text-brand-red hover:underline">
              Fraud Moderation &rarr;
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-6 p-4 rounded-lg border border-brand-teal/30 bg-brand-teal/5 text-sm text-brand-teal">
            {actionMessage}
          </div>
        )}

        {/* AI Similarity Sandbox / Tester */}
        <section className="mt-8 border border-white/10 rounded-xl p-6 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <ShieldIcon className="w-5 h-5 text-brand-teal" />
            <h2 className="font-sora font-bold text-lg text-white">Live AI Similarity Sandbox</h2>
          </div>
          <form onSubmit={handleAnalyzeTest} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-on-surface/60">Report Title</label>
                <input
                  required
                  placeholder="e.g. Bribe requested at land registration office"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-on-surface/60">Category</label>
                <select
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  <option value="corruption">Corruption</option>
                  <option value="bribery">Bribery</option>
                  <option value="extortion">Extortion</option>
                  <option value="hazard">Hazard</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-on-surface/60">Incident Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe details to compare against database candidates..."
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="px-5 py-2.5 bg-brand-teal text-black rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {analyzing ? 'Scanning Candidates...' : 'Run AI Similarity Scan'}
            </button>
          </form>

          {analyzeResult && (
            <div className="mt-6 p-5 border border-white/10 rounded-lg bg-black/40">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                Scan Result: {analyzeResult.matchesFound} Potential Match{analyzeResult.matchesFound === 1 ? '' : 'es'}
              </p>

              {analyzeResult.detections.length === 0 ? (
                <p className="text-xs text-on-surface/50 mt-2">No matching duplicate candidates found above similarity threshold.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {analyzeResult.detections.map((match) => (
                    <div key={match.candidateId} className="p-3 border border-white/10 rounded bg-white/[0.01]">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-white">{match.candidateTitle}</span>
                        <span className="text-xs font-bold text-brand-red px-2 py-0.5 rounded bg-brand-red/10 border border-brand-red/30">
                          {match.breakdown.overallScore}% Overall Match
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-on-surface/60">
                        <div>Text Sim: <span className="text-white font-bold">{match.breakdown.textSimilarity}%</span></div>
                        <div>Loc Proximity: <span className="text-white font-bold">{match.breakdown.locationProximity}%</span></div>
                        <div>Category Match: <span className="text-white font-bold">{match.breakdown.categoryMatch ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Flagged Duplicate Detections Queue */}
        <section className="mt-10 border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/10 flex justify-between items-center text-xs">
            <span className="font-bold uppercase tracking-wider text-on-surface/70">Flagged Duplicate Detections Queue</span>
            <span className="text-on-surface/50">{queue.length} pending review{queue.length === 1 ? '' : 's'}</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-on-surface/50">Loading duplicate queue...</div>
          ) : queue.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface/50">
              No flagged duplicate pairs currently waiting in the moderation queue.
            </div>
          ) : (
            queue.map((item) => (
              <article key={item.detection_id} className="p-6 border-b border-white/10 last:border-0 hover:bg-white/[0.01]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/30">
                        {item.similarity_score}% Similarity Score
                      </span>
                      <span className="text-xs text-on-surface/50">Detected {new Date(item.detected_at).toLocaleString()}</span>
                    </div>

                    <div className="mt-3 grid md:grid-cols-2 gap-4 bg-black/30 p-4 rounded border border-white/5 text-xs">
                      <div>
                        <p className="font-bold uppercase text-on-surface/50 text-[10px]">New Incoming Report</p>
                        <p className="font-bold text-white text-sm mt-0.5">{item.report_title}</p>
                        <p className="text-on-surface/50 mt-1">Category: {item.report_category} &bull; Status: {item.report_status}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-on-surface/50 text-[10px]">Existing Candidate Report</p>
                        <p className="font-bold text-white text-sm mt-0.5">{item.duplicate_title}</p>
                        <p className="text-on-surface/50 mt-1">Category: {item.duplicate_category} &bull; Status: {item.duplicate_status}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={() => handleResolve(item.detection_id, 'merge')}
                      className="px-4 py-2 bg-brand-red text-white rounded text-xs font-bold hover:bg-brand-red/90"
                    >
                      Merge Reports
                    </button>
                    <button
                      onClick={() => handleResolve(item.detection_id, 'dismiss')}
                      className="px-4 py-2 border border-white/15 text-on-surface rounded text-xs font-bold hover:bg-white/5"
                    >
                      Dismiss Pair
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
