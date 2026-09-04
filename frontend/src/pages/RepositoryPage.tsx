import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicReports, type PublicReportItem } from '../services/repositoryApi';

const CATEGORIES = [
  'All',
  'corruption',
  'bribery',
  'dowry',
  'harassment',
  'extortion',
  'land_grabbing',
  'hazard',
  'antisocial_activity',
  'other',
];

const DISTRICTS = [
  'All',
  'Dhaka',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
];

const CASE_STATUSES = ['All', 'received', 'verified', 'under_investigation', 'action_taken', 'closed'];

export default function RepositoryPage() {
  const [category, setCategory] = useState<string>('All');
  const [query, setQuery] = useState<string>('');
  const [district, setDistrict] = useState<string>('All');
  const [caseStatus, setCaseStatus] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('time_desc'); // time_desc, time_asc, name_asc, name_desc
  const [page, setPage] = useState<number>(1);

  const [reports, setReports] = useState<PublicReportItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      setLoading(true);
      try {
        let sortBy = 'time';
        let sortOrder = 'desc';

        if (sortOption === 'time_asc') {
          sortBy = 'time';
          sortOrder = 'asc';
        } else if (sortOption === 'name_asc') {
          sortBy = 'name';
          sortOrder = 'asc';
        } else if (sortOption === 'name_desc') {
          sortBy = 'name';
          sortOrder = 'desc';
        }

        const data = await getPublicReports({
          page,
          q: query,
          category,
          district,
          caseStatus,
          sortBy,
          sortOrder,
        });

        if (isMounted) {
          setReports(data.reports);
          setTotalPages(data.totalPages);
          setTotalCount(data.totalCount);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load public report directory.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [page, query, category, district, caseStatus, sortOption]);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const toggleAccordion = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getCaseStatusBadgeClass = (status: string | null) => {
    if (!status) return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400';
    const s = status.toLowerCase();
    if (s === 'resolved' || s === 'closed') {
      return 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-400';
    }
    if (s === 'prosecution_initiated' || s === 'under_investigation') {
      return 'border border-amber-400/30 bg-amber-400/10 text-amber-400';
    }
    return 'border border-brand-teal/30 bg-brand-teal/10 text-brand-teal';
  };

  const formatCaseStatus = (status: string | null) => {
    if (!status) return 'No Case Record';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-bg-dark/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#ff5634]/40 bg-[#ff5634]/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5634]" />
            </div>
            <span className="font-sora font-bold text-white text-lg">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-semibold text-zinc-400">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/repository" className="text-brand-teal hover:text-brand-teal/80 transition-colors">
              Repository
            </Link>
            <Link to="/heatmap" className="hover:text-white transition-colors">
              Heat Map
            </Link>
            <Link to="/analytics" className="hover:text-white transition-colors">
              Analytics
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1000px] mx-auto px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-2">
          Public Intelligence &amp; Archive
        </p>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-white mb-2">
          Public Report Repository
        </h1>
        <p className="text-sm text-zinc-400 mb-8 font-inter">
          Verified and public incident reports for community scrutiny, press investigations, and accountability.
        </p>

        {/* Filter & Sort Bar */}
        <div className="glass-card glass-border rounded-xl p-5 mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            Search by reference or keyword
          </label>
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="TU-R-..., TU-C-..., bribery, district, institution..."
            className="w-full px-4 py-3 mb-4 bg-black/60 border border-white/10 rounded-lg text-sm text-on-surface focus:outline-none focus:border-brand-teal transition-colors"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => handleFilterChange(setCategory, e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-brand-teal transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#121212] text-white">
                    {cat === 'All' ? cat : cat.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                District
              </label>
              <select
                value={district}
                onChange={(e) => handleFilterChange(setDistrict, e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-brand-teal transition-colors"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-[#121212] text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Case Status Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Case Status
              </label>
              <select
                value={caseStatus}
                onChange={(e) => handleFilterChange(setCaseStatus, e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-brand-teal transition-colors"
              >
                {CASE_STATUSES.map((cs) => (
                  <option key={cs} value={cs} className="bg-[#121212] text-white">
                    {cs === 'All' ? 'All' : cs.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Sort By
              </label>
              <select
                value={sortOption}
                onChange={(e) => handleFilterChange(setSortOption, e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-brand-teal transition-colors"
              >
                <option value="time_desc" className="bg-[#121212] text-white">
                  Submission Time (Newest)
                </option>
                <option value="time_asc" className="bg-[#121212] text-white">
                  Submission Time (Oldest)
                </option>
                <option value="name_asc" className="bg-[#121212] text-white">
                  Title (A - Z)
                </option>
                <option value="name_desc" className="bg-[#121212] text-white">
                  Title (Z - A)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-card border border-brand-red/30 bg-brand-red/10 text-brand-red p-4 rounded-xl mb-8 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="glass-card glass-border rounded-xl p-12 text-center text-zinc-400 font-sora">
            <div className="inline-block w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">Fetching repository directory...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card glass-border rounded-xl p-12 text-center text-zinc-400 font-sora">
            <p className="text-lg font-bold text-white mb-2">No Reports Found</p>
            <p className="text-xs text-zinc-500">
              No verified public reports match your selected filters. Try broadening your criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1 mb-2 font-mono">
              <span>Showing {reports.length} of {totalCount} records</span>
              <span>Page {page} of {totalPages}</span>
            </div>

            {/* Accordion Report List */}
            {reports.map((report) => {
              const isExpanded = expandedId === report.report_reference;
              const formattedDate = new Date(report.submission_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={report.report_reference}
                  onClick={() => toggleAccordion(report.report_reference)}
                  className={`glass-card glass-border rounded-xl p-5 cursor-pointer interactive-hover transition-all duration-200 ${
                    isExpanded ? 'border-brand-teal/50 bg-black/60 shadow-lg shadow-brand-teal/5' : ''
                  }`}
                >
                  {/* Collapsed View */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-sora text-lg font-bold text-white mb-3 group-hover:text-brand-teal transition-colors">
                        {report.title}
                      </h3>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        {/* Category Badge */}
                        <span className="px-2.5 py-1 rounded-md border border-brand-teal/30 bg-brand-teal/10 text-brand-teal capitalize">
                          {report.category.replace(/_/g, ' ')}
                        </span>

                        {/* Case Status Badge */}
                        <span className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold ${getCaseStatusBadgeClass(report.case_status)}`}>
                          {formatCaseStatus(report.case_status)}
                        </span>

                        {/* District Badge */}
                        {report.district && (
                          <span className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-zinc-300">
                            {report.district}
                          </span>
                        )}

                        {/* Date Badge */}
                        <span className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-zinc-400 font-mono text-[11px]">
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    {/* Expand/Collapse Indicator */}
                    <div className="self-end sm:self-center">
                      <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                        <svg
                          className={`w-4 h-4 transform transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-brand-teal' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-white/10 text-sm space-y-4 animate-fadeIn">
                      {report.institution_name && (
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-teal block mb-1">
                            Target Institution / Entity
                          </span>
                          <span className="font-sora font-semibold text-white text-base">
                            {report.institution_name}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Privacy-Safe Incident Summary
                        </span>
                        <p className="text-zinc-300 leading-relaxed font-inter whitespace-pre-line bg-black/40 border border-white/5 p-4 rounded-lg">
                          {report.summary}
                        </p>
                      </div>

                      {report.victim_context && (
                        <div><span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">Generalized Victim Context</span><p className="text-zinc-300">{report.victim_context}</p></div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {report.keywords.map((keyword) => <span key={keyword} className="px-2 py-1 rounded bg-white/5 text-xs text-zinc-400">{keyword}</span>)}
                        {report.corroborating_witnesses > 0 && <span className="px-2 py-1 rounded bg-brand-teal/10 text-xs text-brand-teal">{report.corroborating_witnesses} accepted witness contribution{report.corroborating_witnesses === 1 ? '' : 's'}</span>}
                      </div>

                      {report.case_reference && (
                        <div className="text-xs text-zinc-500 font-mono pt-2">
                          Report: <span className="text-zinc-300">{report.report_reference}</span><br />
                          Case: <span className="text-zinc-300">{report.case_reference}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className={`px-5 py-2.5 rounded-lg border font-sora font-bold text-xs transition-colors ${
                  page <= 1 || loading
                    ? 'border-white/5 text-zinc-600 bg-white/[0.02] cursor-not-allowed'
                    : 'border-white/10 text-on-surface bg-black/40 hover:border-brand-teal/50 hover:text-white'
                }`}
              >
                &larr; Previous
              </button>

              <span className="text-xs font-mono text-zinc-400 font-semibold">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className={`px-5 py-2.5 rounded-lg border font-sora font-bold text-xs transition-colors ${
                  page >= totalPages || loading
                    ? 'border-white/5 text-zinc-600 bg-white/[0.02] cursor-not-allowed'
                    : 'border-white/10 text-on-surface bg-black/40 hover:border-brand-teal/50 hover:text-white'
                }`}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
