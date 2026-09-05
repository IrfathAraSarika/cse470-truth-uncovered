import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard, type LeaderboardEntry } from '../services/rewardApi';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function badgeLabel(type: string): string {
  return type.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const BADGE_ICON: Record<string, string> = {
  civic_champion: '🏆',
  trusted_contributor: '⭐',
  community_hero: '🦸',
  corruption_crusader: '⚔️',
  evidence_expert: '🔬',
  community_guardian: '🛡️',
};

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const PODIUM_GRADIENT: Record<number, string> = {
  1: 'from-amber-400/20 via-yellow-500/10 to-transparent border-amber-400/40',
  2: 'from-slate-300/20 via-slate-400/10 to-transparent border-slate-300/40',
  3: 'from-amber-700/20 via-amber-800/10 to-transparent border-amber-700/40',
};

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-2 bg-white/5 rounded w-1/5" />
      </div>
      <div className="h-4 bg-white/10 rounded w-16" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Podium card for top 3
// ---------------------------------------------------------------------------
function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const gradient = PODIUM_GRADIENT[entry.rank] ?? '';
  return (
    <div
      className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border bg-gradient-to-b ${gradient} transition-transform hover:-translate-y-1 duration-300`}
    >
      <span className="text-4xl">{RANK_MEDAL[entry.rank]}</span>
      <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-white/80">
        {entry.displayName.slice(0, 1).toUpperCase()}
      </div>
      <div className="text-center">
        <p className="font-bold text-white text-sm leading-tight">{entry.displayName}</p>
        {entry.topBadge && (
          <span className="text-[10px] text-on-surface/50 mt-0.5 block">
            {BADGE_ICON[entry.topBadge] ?? '🏅'} {badgeLabel(entry.topBadge)}
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="text-2xl font-black text-brand-teal tabular-nums">{entry.civicPoints.toLocaleString()}</p>
        <p className="text-[10px] text-on-surface/40 uppercase tracking-widest">civic pts</p>
      </div>
      {entry.badgeCount > 0 && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white/60">
          {entry.badgeCount} badge{entry.badgeCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table row for rank 4+
// ---------------------------------------------------------------------------
function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 rounded-xl bg-white/[0.025] border border-white/5 hover:bg-white/[0.05] hover:border-brand-teal/20 transition-all duration-200">
      <span className="w-8 text-center text-sm font-black text-on-surface/40 tabular-nums shrink-0">
        {entry.rank}
      </span>
      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold text-white/60 shrink-0">
        {entry.displayName.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{entry.displayName}</p>
        {entry.topBadge && (
          <p className="text-[11px] text-on-surface/40 mt-0.5">
            {BADGE_ICON[entry.topBadge] ?? '🏅'} {badgeLabel(entry.topBadge)}
          </p>
        )}
      </div>
      {entry.badgeCount > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-on-surface/40 font-medium shrink-0">
          {entry.badgeCount}🏅
        </span>
      )}
      <span className="text-base font-black text-brand-teal tabular-nums shrink-0">
        {entry.civicPoints.toLocaleString()}
        <span className="text-[10px] text-on-surface/30 font-normal ml-1">pts</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLeaderboard()
      .then((res) => setEntries(res.leaderboard))
      .catch(() => setError('Failed to load leaderboard. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      {/* ---- Header ---- */}
      <header className="border-b border-white/10 bg-bg-dark/95 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-brand-teal font-black text-sm">T</div>
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </Link>
          <Link to="/dashboard" className="text-xs font-bold border border-white/10 px-4 py-2 rounded-lg hover:border-brand-teal/50 hover:text-brand-teal transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-[860px] mx-auto px-6 py-14">
        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-3">
            🏆 Public Rankings
          </p>
          <h1 className="font-['Sora'] text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            Civic <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-emerald-400">Leaderboard</span>
          </h1>
          <p className="text-sm text-on-surface/50 max-w-lg mx-auto">
            Recognising the most active civic contributors — citizens earning points through verified reports,
            evidence uploads, and confirmed community flags.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm text-center mb-8">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-20 text-on-surface/30">
            <p className="text-5xl mb-4">🌟</p>
            <p className="font-bold text-white">No contributors yet</p>
            <p className="text-sm mt-2">Be the first to earn civic points!</p>
          </div>
        )}

        {/* Podium — top 3 */}
        {!loading && top3.length > 0 && (
          <div className={`grid gap-4 mb-10 ${top3.length === 3 ? 'grid-cols-3' : top3.length === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'}`}>
            {top3.map((e) => <PodiumCard key={e.rank} entry={e} />)}
          </div>
        )}

        {/* Rest of table */}
        {!loading && rest.length > 0 && (
          <div className="space-y-2">
            {rest.map((e) => <LeaderboardRow key={e.rank} entry={e} />)}
          </div>
        )}

        {/* Footer note */}
        {!loading && entries.length > 0 && (
          <p className="text-center text-[11px] text-on-surface/25 mt-10">
            Rankings update in real time. Users may opt to appear as "Anonymous" from their dashboard.
          </p>
        )}
      </main>
    </div>
  );
}
