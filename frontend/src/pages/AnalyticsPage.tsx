import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAnalyticsData, type AnalyticsData } from '../services/analyticsApi';

const TIME_PERIODS = [
  { label: '1 Week', value: 'week' },
  { label: '1 Month', value: 'month' },
  { label: '1 Quarter', value: 'quarter' },
  { label: '1 Year', value: 'year' },
];

export default function AnalyticsPage() {
  const [district, setDistrict] = useState<string>('Dhaka');
  const [timePeriod, setTimePeriod] = useState<string>('month');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const res = await getAnalyticsData(district, timePeriod);
        if (isMounted) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [district, timePeriod]);

  const totalReports = data
    ? data.categoryData.reduce((sum, item) => sum + item.count, 0)
    : 0;

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-bg-dark/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-semibold text-zinc-400">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/heatmap" className="hover:text-white transition-colors">
              Heat Map
            </Link>
            <Link to="/analytics" className="text-brand-teal hover:text-brand-teal/80 transition-colors">
              Analytics
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-2">
          Public Intelligence
        </p>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-white mb-6">
          Analytics Dashboard
        </h1>

        {/* Controls Bar */}
        <div className="glass-card glass-border rounded-xl p-6 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          {/* District Input */}
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              District Filter
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Dhaka, Chittagong, Sylhet..."
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder-zinc-500 focus:outline-none focus:border-brand-teal transition-colors"
            />
          </div>

          {/* Time Period Segmented Control */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Time Horizon
            </label>
            <div className="inline-flex p-1 bg-black/50 border border-white/10 rounded-lg">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setTimePeriod(period.value)}
                  className={`px-4 py-1.5 text-xs font-sora font-bold rounded-md transition-all ${
                    timePeriod === period.value
                      ? 'bg-brand-teal text-bg-dark shadow-md shadow-brand-teal/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-card border border-brand-red/30 bg-brand-red/10 text-brand-red p-4 rounded-xl mb-8 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="glass-card glass-border rounded-xl p-12 text-center text-zinc-400 font-sora">
            <div className="inline-block w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading analytics intelligence...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Timeline Chart Container */}
            <div className="glass-card glass-border rounded-xl p-6 interactive-hover">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <div>
                  <h2 className="font-sora text-xl font-bold text-white mb-1">
                    Incident Resolution Timeline
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Active vs Closed reports trends over time in {district || 'All Districts'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold mt-3 sm:mt-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff4c29]" />
                    <span className="text-zinc-300">Active (Submitted &amp; Verified)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#00adb5]" />
                    <span className="text-zinc-300">Closed</span>
                  </div>
                </div>
              </div>

              {!data || data.timelineData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-zinc-500 text-sm font-sora">
                  No timeline data recorded for the selected parameters.
                </div>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.timelineData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff4c29" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ff4c29" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="closedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00adb5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#00adb5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121212',
                          borderColor: 'rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          color: '#e5e2e1',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                        }}
                        itemStyle={{ color: '#e5e2e1', fontSize: '13px' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="active_count"
                        name="Active Incidents"
                        stroke="#ff4c29"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#activeGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="closed_count"
                        name="Closed Incidents"
                        stroke="#00adb5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#closedGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category Ranking Container */}
            <div className="glass-card glass-border rounded-xl p-6 interactive-hover">
              <h2 className="font-sora text-xl font-bold text-white mb-1">
                Category Ranking &amp; Distribution
              </h2>
              <p className="text-xs text-zinc-400 mb-6">
                Breakdown of report volume by category for district {district || 'All Districts'}
              </p>

              {!data || data.categoryData.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm font-sora">
                  No category reports found matching criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.categoryData.map((item, idx) => {
                    const percentage = totalReports > 0 ? Math.round((item.count / totalReports) * 100) : 0;
                    return (
                      <div
                        key={item.category}
                        className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col justify-between hover:border-brand-teal/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-brand-teal/10 border border-brand-teal/30 text-brand-teal font-sora text-xs font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="font-sora font-semibold text-white text-sm capitalize">
                              {item.category.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="font-sora text-sm font-bold text-brand-teal">
                            {item.count} {item.count === 1 ? 'report' : 'reports'}
                          </span>
                        </div>

                        {/* Visual Flair Progress Bar */}
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-2">
                          <div
                            className="bg-gradient-to-r from-brand-teal to-brand-red h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
