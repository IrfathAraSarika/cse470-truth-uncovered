import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import {
  getQueuedReports,
  removeQueuedReport,
  syncQueuedReports,
  syncSingleQueuedReport,
  updateQueuedReport,
  type QueuedReport,
} from '../services/offlineReportQueue';
import type { ReportSubmission } from '../services/reportApi';

const categories = [
  ['corruption', 'Corruption'],
  ['bribery', 'Bribery'],
  ['dowry', 'Dowry'],
  ['harassment', 'Harassment'],
  ['extortion', 'Extortion'],
  ['land_grabbing', 'Land Grabbing'],
  ['hazard', 'Public Hazard'],
  ['antisocial_activity', 'Antisocial Activity'],
  ['other', 'Other'],
] as const;

const districts = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'];

export default function OfflineDraftsPage() {
  const [drafts, setDrafts] = useState<QueuedReport[]>(getQueuedReports());
  const [syncing, setSyncing] = useState(false);
  const [syncingItem, setSyncingItem] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [editingDraft, setEditingDraft] = useState<QueuedReport | null>(null);
  const [editForm, setEditForm] = useState<ReportSubmission | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const citizen = localStorage.getItem('citizen');

  useEffect(() => {
    const refresh = () => setDrafts(getQueuedReports());
    const handleOnline = () => {
      setIsOnline(true);
      void syncQueuedReports().then(refresh);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('truth-report-queue-change', refresh);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('truth-report-queue-change', refresh);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!citizen) return <Navigate to="/login" replace />;

  const handleSyncAll = async () => {
    setSyncing(true);
    setMessage('');
    const result = await syncQueuedReports();
    setSyncing(false);
    if (result.synced.length > 0) {
      setMessage(`Successfully synchronized ${result.synced.length} report${result.synced.length === 1 ? '' : 's'} to server.`);
    } else if (!navigator.onLine) {
      setMessage('Device is currently offline. Drafts remain stored safely on your device.');
    } else {
      setMessage('No draft reports could be synchronized. Check error details below.');
    }
  };

  const handleSyncSingle = async (queueId: string) => {
    setSyncingItem(queueId);
    setMessage('');
    const res = await syncSingleQueuedReport(queueId);
    setSyncingItem(null);
    if (res.success) {
      setMessage('Draft successfully submitted and synchronized.');
    } else {
      setMessage(res.error || 'Failed to sync draft.');
    }
  };

  const openEditor = (draft: QueuedReport) => {
    setEditingDraft(draft);
    setEditForm({ ...draft.payload });
  };

  const closeEditor = () => {
    setEditingDraft(null);
    setEditForm(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDraft || !editForm) return;
    updateQueuedReport(editingDraft.queueId, editForm);
    closeEditor();
    setMessage('Offline draft updated successfully.');
  };

  const fieldClass =
    'mt-2 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm normal-case font-normal text-on-surface focus:outline-none focus:border-brand-teal/50';

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10">
        <div className="max-w-[1100px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold">Truth Uncovered</span>
          </Link>
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isOnline ? 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-brand-teal animate-pulse' : 'bg-amber-400'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
            </span>
            <Link to="/submit-report" className="text-xs font-bold text-brand-teal hover:underline">
              New Report
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">Feature Sector #6</p>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <h1 className="font-sora text-3xl font-bold text-white">Offline PWA Reporting</h1>
            <p className="text-sm text-on-surface/60 mt-3">
              Drafts are stored locally with Service Worker caching and automatically sync when online connection is restored.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSyncAll}
              disabled={syncing || drafts.length === 0}
              className="px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-40 hover:bg-brand-red/90 transition-colors"
            >
              <ShieldIcon className="w-4 h-4" />
              {syncing ? 'Synchronizing...' : 'Sync All Drafts'}
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-6 p-4 rounded-lg border border-brand-teal/30 bg-brand-teal/5 text-sm text-brand-teal">
            {message}
          </div>
        )}

        <div className="mt-8 border border-white/10 rounded-lg overflow-hidden bg-white/[0.01]">
          <div className="px-5 py-4 bg-white/[0.03] border-b border-white/10 flex justify-between items-center text-xs">
            <span className="font-bold uppercase tracking-wider text-on-surface/70">Device Draft Queue</span>
            <span className="text-on-surface/50">{drafts.length} queued draft{drafts.length === 1 ? '' : 's'}</span>
          </div>

          {drafts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-on-surface/50">No offline drafts queued on this device.</p>
              <Link
                to="/submit-report"
                className="inline-block mt-4 px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-brand-teal hover:bg-white/10"
              >
                Create a New Incident Report
              </Link>
            </div>
          ) : (
            drafts.map((draft) => (
              <article key={draft.queueId} className="p-6 border-b border-white/10 last:border-0 hover:bg-white/[0.01] transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-sora font-bold text-white text-lg">{draft.payload.title}</h2>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          draft.status === 'failed'
                            ? 'bg-brand-red/10 text-brand-red border-brand-red/30'
                            : draft.status === 'syncing'
                            ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/30 animate-pulse'
                            : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                        }`}
                      >
                        {draft.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface/50 mt-1">
                      <span className="capitalize">{draft.payload.category.replaceAll('_', ' ')}</span> &bull; {draft.payload.district || 'Location N/A'} &bull; Saved {new Date(draft.createdAt).toLocaleString()} &bull; Attempts: {draft.attempts}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => openEditor(draft)}
                      className="px-3 py-1.5 border border-white/15 rounded text-xs font-bold text-on-surface hover:bg-white/5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleSyncSingle(draft.queueId)}
                      disabled={syncingItem === draft.queueId || !isOnline}
                      className="px-3 py-1.5 border border-brand-teal/40 rounded text-xs font-bold text-brand-teal hover:bg-brand-teal/10 disabled:opacity-40"
                    >
                      {syncingItem === draft.queueId ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => removeQueuedReport(draft.queueId)}
                      className="px-3 py-1.5 text-xs font-bold text-brand-red hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="text-sm text-on-surface/70 mt-3 line-clamp-3 bg-black/20 p-3 rounded border border-white/5">
                  {draft.payload.description}
                </p>

                {draft.errorMessage && (
                  <p className="mt-2 text-xs text-brand-red bg-brand-red/10 p-2 rounded border border-brand-red/20">
                    Sync Warning: {draft.errorMessage}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </main>

      {/* Edit Offline Draft Modal */}
      {editingDraft && editForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-dark border border-white/15 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="font-sora font-bold text-xl text-white">Edit Offline Report Draft</h3>
              <button onClick={closeEditor} className="text-on-surface/60 hover:text-white text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-on-surface/60">Report Title *</label>
                <input
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-on-surface/60">Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className={fieldClass}
                  >
                    {categories.map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-on-surface/60">District *</label>
                  <select
                    value={editForm.district || 'Dhaka'}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className={fieldClass}
                  >
                    {districts.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-on-surface/60">Address or Landmark</label>
                <input
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-on-surface/60">Detailed Statement *</label>
                <textarea
                  required
                  rows={5}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-on-surface/80 pt-2">
                <input
                  type="checkbox"
                  checked={editForm.isAnonymous}
                  onChange={(e) => setEditForm({ ...editForm, isAnonymous: e.target.checked })}
                  className="w-4 h-4 accent-brand-teal"
                />
                Hide identity (Anonymous submission)
              </label>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={closeEditor} className="px-5 py-2.5 border border-white/15 rounded-lg text-sm font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-brand-teal text-black rounded-lg text-sm font-bold">
                  Save Changes to Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
