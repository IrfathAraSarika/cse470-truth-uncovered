import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';
import { getQueuedReports, removeQueuedReport, syncQueuedReports, type QueuedReport } from '../services/offlineReportQueue';

export default function OfflineDraftsPage() {
  const [drafts, setDrafts] = useState<QueuedReport[]>(getQueuedReports());
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const citizen = localStorage.getItem('citizen');

  useEffect(() => {
    const refresh = () => setDrafts(getQueuedReports());
    window.addEventListener('truth-report-queue-change', refresh);
    return () => window.removeEventListener('truth-report-queue-change', refresh);
  }, []);

  if (!citizen) return <Navigate to="/login" replace />;

  const sync = async () => {
    setSyncing(true);
    const result = await syncQueuedReports();
    setMessage(result.synced.length ? `${result.synced.length} report${result.synced.length === 1 ? '' : 's'} synchronized.` : navigator.onLine ? 'No reports could be synchronized.' : 'You are offline. Drafts remain safely queued.');
    setSyncing(false);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10"><div className="max-w-[1100px] mx-auto h-16 px-6 flex items-center justify-between"><Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link><span className="text-xs font-bold uppercase text-brand-teal">Offline Queue</span></div></header>
      <main className="max-w-[900px] mx-auto px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">Feature #6</p>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-5"><div><h1 className="font-sora text-3xl font-bold text-white">Offline PWA Reporting</h1><p className="text-sm text-on-surface/60 mt-3">Drafts remain on this device and synchronize when a connection is available.</p></div><button onClick={sync} disabled={syncing || drafts.length === 0} className="px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold disabled:opacity-40">{syncing ? 'Synchronizing...' : 'Sync All'}</button></div>
        <div className="mt-8 border border-white/10 rounded-lg overflow-hidden">
          <div className="px-5 py-4 bg-white/[0.03] border-b border-white/10 flex justify-between text-xs"><span className={navigator.onLine ? 'text-brand-teal' : 'text-amber-300'}>{navigator.onLine ? 'Online' : 'Offline'}</span><span className="text-on-surface/50">{drafts.length} queued</span></div>
          {drafts.length === 0 ? <div className="p-10 text-center"><p className="text-sm text-on-surface/50">No offline drafts are waiting.</p><Link to="/submit-report" className="inline-block mt-4 text-sm font-bold text-brand-teal">Create a report</Link></div> : drafts.map((draft) => <article key={draft.queueId} className="p-5 border-b border-white/10 last:border-0"><div className="flex flex-col sm:flex-row justify-between gap-4"><div><h2 className="font-sora font-bold text-white">{draft.payload.title}</h2><p className="text-xs text-on-surface/50 mt-2">{draft.payload.category.replaceAll('_', ' ')} / saved {new Date(draft.createdAt).toLocaleString()} / {draft.attempts} attempts</p></div><button onClick={() => removeQueuedReport(draft.queueId)} className="text-xs font-bold text-brand-red self-start">Delete Draft</button></div><p className="text-sm text-on-surface/60 mt-3 line-clamp-2">{draft.payload.description}</p></article>)}
        </div>
        {message && <p className="mt-4 text-sm text-brand-teal">{message}</p>}
      </main>
    </div>
  );
}
