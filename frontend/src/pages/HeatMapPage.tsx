import { Link } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';

export default function HeatMapPage() {
  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold text-lg text-white">Truth Uncovered</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <h1 className="font-sora text-4xl font-bold text-white mb-4">Incident Heatmap</h1>
        <p className="text-on-surface/70">Interactive map showing incident hotspots will be displayed here.</p>
      </main>
    </div>
  );
}
