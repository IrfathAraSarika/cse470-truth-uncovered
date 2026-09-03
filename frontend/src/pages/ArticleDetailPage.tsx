import { useParams, Link } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold text-lg text-white">Truth Uncovered</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <Link to="/articles" className="text-brand-teal hover:underline mb-6 inline-block">← Back to Articles</Link>
        <h1 className="font-sora text-4xl font-bold text-white mb-4">{slug}</h1>
        <p className="text-on-surface/70">Article content will be loaded here.</p>
      </main>
    </div>
  );
}
