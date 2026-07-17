import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';
import { getCase, type CaseRecord } from '../services/caseApi';

const stages = ['received', 'verified', 'under_investigation', 'action_taken', 'closed'];
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CaseTrackerPage() {
  const [caseId, setCaseId] = useState('');
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!localStorage.getItem('user')) return <Navigate to="/login" replace />;

  const track = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getCase(caseId.trim());
      setCaseRecord(result.case);
    } catch (requestError) {
      setCaseRecord(null);
      setError(requestError instanceof Error ? requestError.message : 'Could not load case.');
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = caseRecord ? stages.indexOf(caseRecord.status) : -1;
  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10"><div className="max-w-[1100px] mx-auto h-16 px-6 flex items-center justify-between"><Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link><span className="text-xs font-bold uppercase text-brand-teal">Case Tracking</span></div></header>
      <main className="max-w-[900px] mx-auto px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">Feature #7</p>
        <h1 className="font-sora text-3xl font-bold text-white mt-2">Structured Case Lifecycle Tracker</h1>
        <div className="mt-7 flex flex-col sm:flex-row gap-3"><input value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="Enter case UUID" className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-lg" /><button onClick={track} disabled={loading || !caseId.trim()} className="px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold disabled:opacity-40">{loading ? 'Loading...' : 'Track Case'}</button></div>
        {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}
        {caseRecord ? <section className="mt-7 border border-white/10 rounded-lg bg-white/[0.02] overflow-hidden"><div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between gap-4"><div><p className="text-xs uppercase font-bold text-on-surface/40">Case ID</p><h2 className="font-sora text-base md:text-xl font-bold text-white mt-1 break-all">{caseRecord.case_id}</h2><p className="text-sm text-on-surface/60 mt-2">{caseRecord.report_title}</p></div><div><p className="text-xs uppercase font-bold text-on-surface/40">Current Status</p><p className="text-brand-teal font-bold mt-1">{label(caseRecord.status)}</p></div></div><div className="p-6 md:p-8">{stages.map((stage, index) => { const done = index <= currentIndex; return <div key={stage} className="relative flex gap-5 pb-8 last:pb-0"><div className={`z-10 w-9 h-9 shrink-0 rounded-full grid place-items-center text-sm font-bold ${done ? 'bg-brand-teal text-black' : 'bg-white/5 border border-white/15 text-on-surface/40'}`}>{done ? 'OK' : index + 1}</div>{index < stages.length - 1 && <div className={`absolute left-[17px] top-9 w-px h-[calc(100%-36px)] ${done ? 'bg-brand-teal/50' : 'bg-white/10'}`} />}<div className="pt-1"><h3 className={`font-sora font-bold ${done ? 'text-white' : 'text-on-surface/40'}`}>{label(stage)}</h3><p className="text-xs text-on-surface/40 mt-1">{done ? new Date(caseRecord.updated_at).toLocaleString() : 'Pending'}</p>{stage === caseRecord.status && caseRecord.resolution_notes && <p className="text-sm text-on-surface/60 mt-2">{caseRecord.resolution_notes}</p>}</div></div>; })}</div></section> : <section className="mt-7 border border-white/10 rounded-lg p-8 text-center bg-white/[0.02]"><p className="text-sm text-on-surface/50">Verified reports receive a case ID that can be tracked here.</p></section>}
      </main>
    </div>
  );
}
