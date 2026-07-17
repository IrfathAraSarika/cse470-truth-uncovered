import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import { getMyReports } from '../services/reportApi';
import type { Report } from '../services/reportApi';

// ─── Helpers ────────────────────────────────────────────────────────────────

interface StoredCitizen { citizen_id: string; name: string; email: string }
interface StoredUser    { name: string; email: string; role: string }

function readStoredCitizen(): StoredCitizen | null {
  try { return JSON.parse(localStorage.getItem('citizen') ?? 'null'); } catch { return null; }
}
function readStoredUser(): StoredUser | null {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null'); } catch { return null; }
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  submitted:            { label: 'Submitted',            color: 'text-sky-400 bg-sky-400/10 border-sky-400/30',      dot: 'bg-sky-400'    },
  pending_verification: { label: 'Pending Verification', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', dot: 'bg-amber-400'  },
  verified:             { label: 'Verified',             color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', dot: 'bg-emerald-400' },
  rejected:             { label: 'Rejected',             color: 'text-rose-400 bg-rose-400/10 border-rose-400/30',   dot: 'bg-rose-400'   },
  under_investigation:  { label: 'Under Investigation',  color: 'text-violet-400 bg-violet-400/10 border-violet-400/30', dot: 'bg-violet-400' },
};

const CATEGORY_LABEL: Record<string, string> = {
  bribery:    'Bribery',
  corruption: 'Corruption',
  other:      'Other',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'text-on-surface/60 bg-white/5 border-white/10', dot: 'bg-on-surface/40' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-white/5 last:border-0">
      <span className="w-40 shrink-0 text-xs font-bold tracking-widest uppercase text-on-surface/40">{label}</span>
      <span className="text-sm text-on-surface/90 leading-relaxed">{value}</span>
    </div>
  );
}

function ReportCard({ report, index }: { report: Report; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative group rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.055] transition-all duration-300 overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Subtle left accent bar based on status */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-opacity
          ${STATUS_META[report.status]?.dot ?? 'bg-white/20'}`}
      />

      {/* Card Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
      >
        {/* Report number */}
        <span className="text-xs font-mono text-on-surface/30 shrink-0">#{String(index + 1).padStart(2, '0')}</span>

        <div className="flex-1 min-w-0">
          <p className="font-sora font-semibold text-white truncate group-hover:text-brand-teal transition-colors">
            {report.title}
          </p>
          <p className="text-xs text-on-surface/40 mt-0.5">
            Submitted {formatDate(report.submission_date)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Category pill */}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-brand-teal/20 text-brand-teal/80 bg-brand-teal/5">
            {CATEGORY_LABEL[report.category] ?? report.category}
          </span>

          <StatusBadge status={report.status} />

          {report.is_anonymous && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 text-on-surface/50 bg-white/5">
              Anonymous
            </span>
          )}

          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-on-surface/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div className="px-6 pb-6 pt-1 border-t border-white/5">
          <div className="rounded-xl bg-black/30 px-5 py-2 mt-2">
            <FieldRow label="Report ID"      value={<span className="font-mono text-xs">{report.report_id}</span>} />
            <FieldRow label="Title"          value={report.title} />
            <FieldRow label="Category"       value={CATEGORY_LABEL[report.category] ?? report.category} />
            <FieldRow label="Status"         value={<StatusBadge status={report.status} />} />
            <FieldRow label="Anonymous"      value={report.is_anonymous ? 'Yes — your identity is hidden from public view' : 'No — submitted with identity'} />
            <FieldRow label="Incident At"    value={formatDate(report.incident_datetime)} />
            <FieldRow label="Submitted At"   value={formatDate(report.submission_date)} />
            {report.updated_at && (
              <FieldRow label="Last Updated" value={formatDate(report.updated_at)} />
            )}
            <FieldRow
              label="Description"
              value={
                <p className="whitespace-pre-wrap leading-relaxed text-on-surface/80">
                  {report.description}
                </p>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MyReportsPage() {
  const navigate   = useNavigate();
  const citizen    = readStoredCitizen();
  const user       = readStoredUser();

  const [reports,  setReports]  = useState<Report[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!citizen) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyReports();
        if (!cancelled) setReports(data.reports);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reports.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [citizen]);

  // Auth guard
  if (!user || !citizen) return <Navigate to="/login" replace />;

  const signOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('citizen');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-dark/95 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <LogoIcon />
              <span className="font-sora font-bold text-white">Truth Uncovered</span>
            </Link>
            <span className="text-on-surface/20 hidden sm:block">›</span>
            <span className="text-sm text-on-surface/50 hidden sm:block">My Reports</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-teal/40 text-on-surface/60 hover:text-brand-teal transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-red/50 hover:text-brand-red transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[860px] mx-auto px-6 py-14">
        {/* Page heading */}
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center">
                <ShieldIcon className="w-5 h-5 text-brand-teal" />
              </div>
              <h1 className="font-sora text-2xl md:text-3xl font-bold text-white">My Submitted Reports</h1>
            </div>
            <p className="text-sm text-on-surface/50 ml-[52px]">
              A complete record of all reports filed under your account.
            </p>
          </div>
          <Link
            to="/submit-report"
            className="shrink-0 px-4 py-2.5 bg-brand-red hover:bg-brand-red/90 text-white text-xs font-bold rounded-lg shadow-lg shadow-brand-red/20 transition-colors"
          >
            + New Report
          </Link>
        </div>

        {/* Stats row */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total',              value: reports.length,                                      color: 'text-white'        },
              { label: 'Submitted',          value: reports.filter(r => r.status === 'submitted').length,        color: 'text-sky-400'      },
              { label: 'Verified',           value: reports.filter(r => r.status === 'verified').length,         color: 'text-emerald-400'  },
              { label: 'Under Review',       value: reports.filter(r => ['pending_verification','under_investigation'].includes(r.status)).length, color: 'text-amber-400' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className={`text-2xl font-sora font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-on-surface/40 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content states */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface/50">Loading your reports…</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 px-6 py-5 text-sm text-brand-red text-center">
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
              <ShieldIcon className="w-8 h-8 text-on-surface/20" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">No reports yet</p>
              <p className="text-sm text-on-surface/40">You haven't submitted any reports. Use the button above to get started.</p>
            </div>
            <Link
              to="/submit-report"
              className="mt-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red/90 text-white text-sm font-bold rounded-lg shadow-lg shadow-brand-red/20 transition-colors"
            >
              Submit Your First Report
            </Link>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="flex flex-col gap-3">
            {reports.map((report, i) => (
              <ReportCard key={report.report_id} report={report} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
