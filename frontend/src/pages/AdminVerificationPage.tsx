import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';
import { getAdminReport, getAdminReports, submitAdminReview, type AdminReport, type AdminReportDetail } from '../services/adminApi';

const filters = ['all', 'submitted', 'pending_verification', 'hidden', 'verified', 'rejected'];
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const demoReport: AdminReport = { report_id: 'demo-report', title: 'Unofficial payment requested at district office', description: 'The reporter states that an official requested payment before accepting a routine public service application.', category: 'bribery', status: 'pending_verification', is_anonymous: true, submission_date: '2026-07-12T10:30:00Z', duplicate_score: 78, evidence_count: 2, review_count: 1, flag_count: 1 };
const demoDetail: AdminReportDetail = {
  report: demoReport,
  evidence: [{ evidence_id: 'demo-evidence-1', file_type: 'image/png', file_size_bytes: 245000 }, { evidence_id: 'demo-evidence-2', file_type: 'application/pdf', file_size_bytes: 88000 }],
  reviews: [{ review_id: 'demo-review', decision: 'request_evidence', notes: 'Initial reviewer requested a clearer copy of the receipt.', admin_name: 'Review Admin', created_at: '2026-07-12T11:00:00Z' }],
  flags: [{ flag_id: 'demo-flag', reason: 'A strongly similar report already exists.', flagged_at: '2026-07-12T10:30:00Z', is_resolved: false }],
  duplicates: [{ detection_id: 'demo-duplicate', similarity_score: 78, detected_at: '2026-07-12T10:30:00Z', report_id: 'TU-2026-0136', title: 'Payment demanded before application processing' }],
};

export default function AdminVerificationPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AdminReport[]>([demoReport]);
  const [selectedId, setSelectedId] = useState('demo-report');
  const [detail, setDetail] = useState<AdminReportDetail | null>(demoDetail);
  const [filter, setFilter] = useState('all');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      const result = await getAdminReports(filter);
      const available = result.reports.length ? result.reports : [demoReport];
      setReports(available);
      setSelectedId((current) => available.some((report) => report.report_id === current) ? current : available[0]?.report_id ?? '');
    } catch (requestError) {
      if (requestError instanceof Error && /Authentication|Administrator|Session/.test(requestError.message)) navigate('/login', { replace: true });
      else setError(requestError instanceof Error ? requestError.message : 'Could not load reports.');
    }
  }, [filter, navigate]);

  useEffect(() => {
    void getAdminReports(filter).then((result) => {
      const available = result.reports.length ? result.reports : [demoReport];
      setReports(available);
      setSelectedId((current) => available.some((report) => report.report_id === current) ? current : available[0]?.report_id ?? '');
    }).catch((requestError) => {
      if (requestError instanceof Error && /Authentication|Administrator|Session/.test(requestError.message)) navigate('/login', { replace: true });
      else setError(requestError instanceof Error ? requestError.message : 'Could not load reports.');
    });
  }, [filter, navigate]);
  useEffect(() => {
    if (!selectedId) return;
    void (selectedId === 'demo-report' ? Promise.resolve(demoDetail) : getAdminReport(selectedId))
      .then(setDetail)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Could not load report.'));
  }, [selectedId]);

  const review = async (decision: string) => {
    if (notes.trim().length < 3) { setError('Add review notes before submitting.'); return; }
    setSaving(true);
    setError('');
    try {
      if (selectedId === 'demo-report') {
        setDetail((current) => current ? {
          ...current,
          report: { ...current.report, status: decision === 'request_evidence' ? 'pending_verification' : decision, flag_count: 0 },
          flags: current.flags.map((flag) => ({ ...flag, is_resolved: true })),
          reviews: [{ review_id: `demo-${Date.now()}`, decision, notes, admin_name: 'Iracus', created_at: new Date().toISOString() }, ...current.reviews],
        } : current);
      } else {
        await submitAdminReview(selectedId, decision, notes);
        await loadReports();
        setDetail(await getAdminReport(selectedId));
      }
      setNotes('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Review could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95">
        <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link>
          <span className="text-xs font-bold uppercase text-brand-teal">Admin Verification</span>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        <h1 className="font-sora text-3xl font-bold text-white mb-6">Multi-Admin Report Verification</h1>
        <div className="flex gap-2 overflow-x-auto mb-5">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`px-3 py-2 rounded-lg border text-xs font-bold whitespace-nowrap ${filter === item ? 'border-brand-teal/50 bg-brand-teal/10 text-brand-teal' : 'border-white/10 text-on-surface/60'}`}>{label(item)}</button>)}
        </div>
        <div className="grid lg:grid-cols-[350px_1fr] border border-white/10 rounded-lg overflow-hidden min-h-[650px]">
          <aside className="border-b lg:border-b-0 lg:border-r border-white/10 max-h-[650px] overflow-y-auto">
            {reports.map((report) => (
              <button key={report.report_id} onClick={() => setSelectedId(report.report_id)} className={`w-full p-5 text-left border-b border-white/10 ${selectedId === report.report_id ? 'bg-brand-teal/10' : 'hover:bg-white/[0.03]'}`}>
                <div className="flex justify-between gap-2"><span className="text-[11px] font-bold uppercase text-brand-teal">{label(report.status)}</span>{report.flag_count > 0 && <span className="text-[10px] font-bold text-brand-red">{report.flag_count} FLAG{report.flag_count === 1 ? '' : 'S'}</span>}</div>
                <h2 className="font-sora text-sm font-bold text-white my-2">{report.title}</h2>
                <p className="text-[11px] text-on-surface/50">{report.evidence_count} evidence / {report.review_count} reviews / {report.duplicate_score}% match</p>
              </button>
            ))}
          </aside>
          <section className="p-6 md:p-8 max-h-[650px] overflow-y-auto">
            {!detail ? <p className="text-sm text-on-surface/50">Select a report.</p> : (
              <>
                <div className="pb-5 border-b border-white/10"><span className="text-xs font-bold text-brand-teal uppercase">{label(detail.report.category)}</span><h2 className="font-sora text-2xl font-bold text-white mt-2">{detail.report.title}</h2><p className="text-xs text-on-surface/40 mt-2">{new Date(detail.report.submission_date).toLocaleString()}</p></div>
                <div className="py-6 border-b border-white/10"><h3 className="font-sora text-sm font-bold text-white mb-3">Incident Details</h3><p className="text-sm leading-7 text-on-surface/70 whitespace-pre-wrap">{detail.report.description}</p></div>
                <div className="py-6 border-b border-white/10">
                  <h3 className="font-sora text-sm font-bold text-white mb-3">Automated Screening</h3>
                  <div className="grid sm:grid-cols-2 gap-3"><div className="p-3 rounded-lg bg-black/30 border border-white/10"><p className="text-[10px] uppercase text-on-surface/40">Duplicate Score</p><p className="font-sora text-xl font-bold text-white mt-1">{detail.report.duplicate_score ?? 0}%</p></div><div className="p-3 rounded-lg bg-black/30 border border-white/10"><p className="text-[10px] uppercase text-on-surface/40">Open Flags</p><p className="font-sora text-xl font-bold text-brand-red mt-1">{detail.flags.filter((flag) => !flag.is_resolved).length}</p></div></div>
                  {detail.flags.map((flag) => <p key={flag.flag_id} className="mt-3 text-xs text-on-surface/70">{flag.is_resolved ? 'Resolved: ' : 'Flag: '}{flag.reason}</p>)}
                  {detail.duplicates.map((item) => <p key={item.detection_id} className="mt-2 text-xs text-brand-teal">{item.similarity_score}% similar to {item.title}</p>)}
                </div>
                <div className="py-6 border-b border-white/10"><h3 className="font-sora text-sm font-bold text-white mb-3">Evidence ({detail.evidence.length})</h3>{detail.evidence.length === 0 ? <p className="text-sm text-on-surface/50">No evidence attached.</p> : detail.evidence.map((item) => <p key={item.evidence_id} className="py-2 text-xs border-b border-white/5">{item.file_type}</p>)}</div>
                <div className="py-6 border-b border-white/10"><h3 className="font-sora text-sm font-bold text-white mb-3">Review History</h3>{detail.reviews.length === 0 ? <p className="text-sm text-on-surface/50">No reviews yet.</p> : detail.reviews.map((item) => <div key={item.review_id} className="py-3 border-b border-white/5"><strong className="text-xs text-white">{item.admin_name}: {label(item.decision)}</strong><p className="text-xs text-on-surface/60 mt-1">{item.notes}</p></div>)}</div>
                <div className="pt-6"><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Review notes" className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-brand-teal/40" />{error && <p className="text-xs text-brand-red mt-2">{error}</p>}<div className="flex flex-wrap gap-3 mt-4"><button disabled={saving} onClick={() => review('verified')} className="px-4 py-2.5 bg-brand-teal text-black rounded-lg text-xs font-bold">Verify</button><button disabled={saving} onClick={() => review('request_evidence')} className="px-4 py-2.5 border border-white/20 rounded-lg text-xs font-bold">Request Evidence</button><button disabled={saving} onClick={() => review('rejected')} className="px-4 py-2.5 bg-brand-red text-white rounded-lg text-xs font-bold">Reject</button></div></div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
