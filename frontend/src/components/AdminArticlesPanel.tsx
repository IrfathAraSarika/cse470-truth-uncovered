import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminArticles,
  reviewArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getCategories,
  type Article,
  type Category
} from '../services/articleApi';

export function AdminArticlesPanel() {
  const navigate = useNavigate();
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Selected article for details/review
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  // Form State for Create/Edit Article
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formCoverImage, setFormCoverImage] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('draft');
  const [formError, setFormError] = useState<string>('');
  const [formSaving, setFormSaving] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [artRes, catRes] = await Promise.all([getAdminArticles(), getCategories()]);
      setArticles(artRes.articles);
      setCategories(catRes.categories);
      if (artRes.articles.length > 0) {
        setSelectedArticle(artRes.articles[0]);
      }
    } catch (err: any) {
      if (err.message?.includes('Admin') || err.message?.includes('Authentication')) {
        navigate('/login');
      } else {
        setError(err.message || 'Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData, navigate]);

  // Compute Stats
  const totalArticles = articles.length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const pendingCount = articles.filter((a) => a.status === 'pending_review').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;

  const handleSelectArticle = (art: Article) => {
    setSelectedArticle(art);
    setRejectionReason('');
    setError('');
  };

  const handleReview = async (decision: 'approve' | 'reject') => {
    if (!selectedArticle) return;
    if (decision === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    try {
      setReviewLoading(true);
      setError('');
      const { article: updated } = await reviewArticle(
        selectedArticle.article_id,
        decision,
        decision === 'reject' ? rejectionReason : undefined
      );
      
      // Update local state
      setArticles((prev) => prev.map((a) => (a.article_id === updated.article_id ? { ...a, ...updated } : a)));
      setSelectedArticle((current) => current && current.article_id === updated.article_id ? { ...current, ...updated } : current);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to review article.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteArticle(articleId);
      setArticles((prev) => prev.filter((a) => a.article_id !== articleId));
      if (selectedArticle?.article_id === articleId) {
        setSelectedArticle(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete article.');
    }
  };

  // Open Creation Form
  const openCreateForm = () => {
    setFormMode('create');
    setFormTitle('');
    setFormDescription('');
    setFormContent('');
    setFormCategoryId(categories[0]?.category_id || '');
    setFormCoverImage('');
    setFormStatus('draft');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Edition Form
  const openEditForm = (art: Article) => {
    setFormMode('edit');
    setFormTitle(art.title);
    setFormDescription(art.description);
    setFormContent(art.content);
    setFormCategoryId(art.category_id);
    setFormCoverImage(art.cover_image || '');
    setFormStatus(art.status);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formContent || !formCategoryId) {
      setFormError('All fields except cover image are required.');
      return;
    }
    try {
      setFormSaving(true);
      setFormError('');
      if (formMode === 'create') {
        const { article: created } = await createArticle({
          title: formTitle,
          description: formDescription,
          content: formContent,
          category_id: formCategoryId,
          cover_image: formCoverImage || null,
          status: formStatus,
        });
        setArticles((prev) => [created, ...prev]);
        setSelectedArticle(created);
      } else {
        if (!selectedArticle) return;
        const { article: updated } = await updateArticle(selectedArticle.article_id, {
          title: formTitle,
          description: formDescription,
          content: formContent,
          category_id: formCategoryId,
          cover_image: formCoverImage || null,
        });
        setArticles((prev) => prev.map((a) => (a.article_id === updated.article_id ? { ...a, ...updated } : a)));
        setSelectedArticle((current) => current && current.article_id === updated.article_id ? { ...current, ...updated } : current);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save article.');
    } finally {
      setFormSaving(false);
    }
  };

  return (
    <div className="py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-sora text-2xl font-bold text-white">Articles Management</h2>
          <p className="text-sm text-on-surface/60">Manage educational resources, review contributors' submissions, and publish guides.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="px-5 py-3 bg-brand-teal text-black rounded-lg text-sm font-bold hover:bg-brand-teal/90 transition-all flex items-center justify-center gap-2"
        >
          Create Article
        </button>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <p className="text-[10px] uppercase font-bold text-on-surface/40">Total Articles</p>
          <p className="font-sora text-2xl font-bold text-white mt-1">{totalArticles}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <p className="text-[10px] uppercase font-bold text-brand-teal">Published</p>
          <p className="font-sora text-2xl font-bold text-white mt-1">{publishedCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <p className="text-[10px] uppercase font-bold text-amber-400">Pending Review</p>
          <p className="font-sora text-2xl font-bold text-white mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <p className="text-[10px] uppercase font-bold text-on-surface/50">Drafts</p>
          <p className="font-sora text-2xl font-bold text-white mt-1">{draftCount}</p>
        </div>
      </section>

      {/* Master Detail Section */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal mx-auto"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[380px_1fr] border border-white/10 rounded-xl overflow-hidden min-h-[600px] bg-white/[0.01]">
          {/* Sidebar list */}
          <aside className="border-b lg:border-b-0 lg:border-r border-white/10 max-h-[600px] overflow-y-auto">
            {articles.length === 0 ? (
              <p className="p-6 text-sm text-on-surface/50 text-center">No articles available.</p>
            ) : (
              articles.map((art) => (
                <button
                  key={art.article_id}
                  onClick={() => handleSelectArticle(art)}
                  className={`w-full p-5 text-left border-b border-white/5 transition-all flex flex-col gap-1 ${
                    selectedArticle?.article_id === art.article_id
                      ? 'bg-brand-teal/10'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-bold uppercase text-brand-teal">
                      {art.category_name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        art.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : art.status === 'pending_review'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-white/10 text-white/50 border border-white/5'
                      }`}
                    >
                      {art.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-sora text-sm font-bold text-white mt-1 line-clamp-1">{art.title}</h3>
                  <p className="text-[10px] text-on-surface/50 mt-1">
                    By {art.author_name} &bull; {new Date(art.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </aside>

          {/* Details & Review pane */}
          <section className="p-6 md:p-8 max-h-[600px] overflow-y-auto flex flex-col justify-between">
            {selectedArticle ? (
              <div>
                <div className="pb-5 border-b border-white/10 flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-brand-teal uppercase tracking-wider">{selectedArticle.category_name}</span>
                    <h2 className="font-sora text-2xl font-bold text-white mt-1">{selectedArticle.title}</h2>
                    <p className="text-xs text-on-surface/50 mt-2">
                      Author: <span className="text-white font-medium">{selectedArticle.author_name} ({selectedArticle.author_role})</span> &bull; Status: <span className="text-white font-medium uppercase">{selectedArticle.status}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(selectedArticle)}
                      className="px-3.5 py-1.5 border border-white/15 hover:border-white/30 rounded-lg text-xs font-bold transition-all text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedArticle.article_id)}
                      className="px-3.5 py-1.5 border border-brand-red/30 hover:bg-brand-red/10 rounded-lg text-xs font-bold transition-all text-brand-red"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="py-6 border-b border-white/10">
                  <h4 className="font-sora text-xs font-bold text-white uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-on-surface/80 leading-relaxed mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-lg">{selectedArticle.description}</p>

                  <h4 className="font-sora text-xs font-bold text-white uppercase tracking-wider mb-2">Full Content</h4>
                  <div className="text-sm text-on-surface/70 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto bg-black/20 p-4 border border-white/5 rounded-lg">
                    {selectedArticle.content}
                  </div>
                </div>

                {selectedArticle.rejection_reason && (
                  <div className="my-6 p-4 rounded-xl border border-brand-red/20 bg-brand-red/5 text-brand-red text-xs">
                    <strong>Rejection Reason:</strong> {selectedArticle.rejection_reason}
                  </div>
                )}

                {/* Review / Approval Workflow Actions */}
                {selectedArticle.status === 'pending_review' && (
                  <div className="pt-6">
                    <h4 className="font-sora text-sm font-bold text-white mb-3">Review Contributor's Submission</h4>
                    <textarea
                      rows={3}
                      placeholder="Provide rejection reason if rejecting submission..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50"
                    />
                    {error && <p className="text-xs text-brand-red mt-2">{error}</p>}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleReview('approve')}
                        disabled={reviewLoading}
                        className="px-5 py-2.5 bg-brand-teal text-black rounded-lg text-xs font-bold hover:bg-brand-teal/90 transition-all"
                      >
                        Approve &amp; Publish
                      </button>
                      <button
                        onClick={() => handleReview('reject')}
                        disabled={reviewLoading}
                        className="px-5 py-2.5 bg-brand-red text-white rounded-lg text-xs font-bold hover:bg-brand-red/90 transition-all"
                      >
                        Reject Submission
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-on-surface/50 text-center py-20">Select an article from the sidebar list.</p>
            )}
          </section>
        </div>
      )}

      {/* Create / Edit Dialog Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-dark border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <header className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-sora text-lg font-bold text-white">
                {formMode === 'create' ? 'Create Educational Article' : 'Edit Article'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-on-surface/60 hover:text-white font-bold">&times;</button>
            </header>

            <form onSubmit={handleSaveForm} className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/60 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50"
                  placeholder="How to report a bribery incident"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/60 mb-2">Category</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50"
                >
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id} className="bg-bg-dark text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/60 mb-2">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              {formMode === 'create' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/60 mb-2">Publishing State</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50"
                  >
                    <option value="draft" className="bg-bg-dark text-white">Draft (Save locally)</option>
                    <option value="published" className="bg-bg-dark text-white">Published (Make live immediately)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/60 mb-2">Description / Summary</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50"
                  placeholder="A short summary of the legal concepts covered..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/60 mb-2">Article Body Content</label>
                <textarea
                  required
                  rows={10}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50 font-mono"
                  placeholder="Write the full markdown or plain text details here..."
                />
              </div>

              {formError && <p className="text-xs text-brand-red font-bold">{formError}</p>}

              <footer className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2.5 bg-brand-teal text-black rounded-lg text-xs font-bold hover:bg-brand-teal/90"
                >
                  {formSaving ? 'Saving...' : 'Save Article'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
