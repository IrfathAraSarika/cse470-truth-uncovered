import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import {
  getArticleBySlug,
  getFollowedCategories,
  followCategory,
  unfollowCategory,
  type Article
} from '../services/articleApi';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return;
      try {
        setLoading(true);
        const { article: fetchedArticle } = await getArticleBySlug(slug);
        setArticle(fetchedArticle);

        // Check if user is following this category
        if (user) {
          const { follows } = await getFollowedCategories();
          setIsFollowing(follows.includes(fetchedArticle.category_id));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load article details.');
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [slug]);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!article) return;

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await unfollowCategory(article.category_id);
        setIsFollowing(false);
      } else {
        await followCategory(article.category_id);
        setIsFollowing(true);
      }
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark text-on-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-on-surface/50 text-sm">Loading article content...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-bg-dark text-on-surface flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white/[0.02] border border-white/10 rounded-xl p-8">
          <p className="text-brand-red text-sm mb-4">{error || 'Article not found.'}</p>
          <Link to="/articles" className="inline-block px-5 py-2.5 bg-brand-teal text-black rounded-lg text-xs font-bold">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const isLegalInfo = article.category_name?.toLowerCase() === 'legal information';

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/articles" className="text-sm font-bold text-brand-teal hover:underline">
              Knowledge Hub
            </Link>
            {user ? (
              <Link to="/dashboard" className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-teal/50">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-teal/50">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-12 md:py-16">
        <article>
          {/* Category, Date & Follow Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-brand-teal px-2.5 py-0.5 rounded bg-brand-teal/10 border border-brand-teal/20">
                {article.category_name}
              </span>
              <span className="text-xs text-on-surface/40">
                Published {article.published_at ? new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </span>
            </div>
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isFollowing
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 hover:border-brand-teal/50 text-white hover:bg-white/[0.02]'
              }`}
            >
              {isFollowing ? '✓ Following Category' : '+ Follow Category'}
            </button>
          </div>

          <h1 className="font-sora text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {article.title}
          </h1>

          <p className="text-xs text-on-surface/50 mb-8 pb-4 border-b border-white/10">
            Written by <span className="text-white font-medium">{article.author_name || 'Truth Uncovered'}</span>
          </p>

          {article.cover_image && (
            <div className="mb-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 max-h-[400px]">
              <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Legal Notice */}
          {isLegalInfo && (
            <div className="mb-8 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs md:text-sm flex gap-3">
              <ShieldIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Legal Information Notice:</strong> This content is provided for general educational and informational purposes and should not be considered a substitute for professional legal advice.
              </p>
            </div>
          )}

          {/* Full Article Content */}
          <div className="text-on-surface/80 leading-8 text-base md:text-lg whitespace-pre-wrap font-inter">
            {article.content}
          </div>
        </article>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <Link to="/articles" className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal hover:underline">
            &larr; Back to Awareness &amp; Legal Rights Directory
          </Link>
        </div>
      </main>
    </div>
  );
}
