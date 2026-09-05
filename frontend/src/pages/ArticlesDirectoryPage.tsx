import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon } from '../components/AppIcons';
import { getArticles, getCategories, type Article, type Category } from '../services/articleApi';

export default function ArticlesDirectoryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [articlesRes, categoriesRes] = await Promise.all([
          getArticles({
            category_id: selectedCategory === 'all' ? undefined : selectedCategory,
            search: searchQuery.trim() || undefined,
          }),
          getCategories(),
        ]);
        setArticles(articlesRes.articles);
        setCategories(categoriesRes.categories);
      } catch (err: any) {
        setError(err.message || 'Failed to load articles.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategory, searchQuery]);

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
            <Link to="/articles" className="text-sm font-bold text-brand-teal">
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

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="text-center max-w-[800px] mx-auto mb-12">
          <h1 className="font-sora text-4xl md:text-5xl font-bold text-white mb-4">
            Awareness &amp; Legal Rights Repository
          </h1>
          <p className="text-base text-on-surface/60">
            Empowering citizens with educational articles, legal frameworks, reporting guides, and safety procedures in Bangladesh.
          </p>
        </div>

        {/* Search and Filters */}
        <section className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl">
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="Search articles (e.g. bribery, harassment)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-2 md:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-brand-teal text-black'
                  : 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategory(cat.category_id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat.category_id
                    ? 'bg-brand-teal text-black'
                    : 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Articles list */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal mx-auto mb-4"></div>
            <p className="text-on-surface/50 text-sm">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-brand-red text-sm bg-brand-red/5 border border-brand-red/20 rounded-xl p-6">
            {error}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <p className="text-on-surface/50 text-sm">No published articles found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <article
                key={art.article_id}
                className="group border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl overflow-hidden flex flex-col transition-all hover:border-brand-teal/30"
              >
                {art.cover_image && (
                  <div className="h-48 overflow-hidden bg-black/40">
                    <img
                      src={art.cover_image}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-teal px-2 py-0.5 rounded bg-brand-teal/10 border border-brand-teal/20">
                      {art.category_name}
                    </span>
                    <span className="text-[10px] text-on-surface/40">
                      {art.published_at ? new Date(art.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h3 className="font-sora text-lg font-bold text-white group-hover:text-brand-teal transition-colors mb-2 line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-on-surface/60 line-clamp-3 mb-6 flex-grow leading-relaxed">
                    {art.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    <span className="text-[11px] text-on-surface/50 font-medium">
                      By {art.author_name || 'Truth Uncovered'}
                    </span>
                    <Link
                      to={`/articles/${art.slug}`}
                      className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      Read Article &rarr;
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
