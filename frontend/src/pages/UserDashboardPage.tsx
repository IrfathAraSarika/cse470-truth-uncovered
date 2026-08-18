import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import { getMyVerification, type VerificationStatusValue } from '../services/verificationApi';
import {
  getMyArticles,
  getMyNotifications,
  markNotificationRead,
  createArticle,
  updateArticle,
  deleteArticle,
  submitArticleForReview,
  getCategories,
  type Article,
  type Category,
  type AppNotification
} from '../services/articleApi';

interface StoredUser { name: string; email: string; role: string }
const roleLabel = (role: string) => role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 align-middle">
      <ShieldIcon className="w-3.5 h-3.5" />
      Verified
    </span>
  );
}

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) as StoredUser : null;

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusValue | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Contributor Article States
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formCoverImage, setFormCoverImage] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [formSaving, setFormSaving] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await getMyNotifications();
      setNotifications(res.notifications);
    } catch {
      // Ignore background notification errors
    }
  }, []);

  const loadArticles = useCallback(async () => {
    try {
      const [artRes, catRes] = await Promise.all([getMyArticles(), getCategories()]);
      setMyArticles(artRes.articles);
      setCategories(catRes.categories);
    } catch {
      // Ignore background errors
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'citizen') {
      getMyVerification()
        .then((data) => setVerificationStatus(data.status))
        .catch(() => setVerificationStatus(null));
    }

    // Load Notifications for all authenticated users
    loadNotifications();

    // Load articles and categories for contributors
    if (user.role === 'ngo_partner' || user.role === 'government_officer' || user.role === 'admin') {
      loadArticles();
    }
  }, [user, loadNotifications, loadArticles]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const signOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('citizen');
    navigate('/login');
  };

  const isVerified = verificationStatus === 'verified';
  const verifyButtonLabel =
    verificationStatus === 'pending' ? 'Verification Pending'
      : verificationStatus === 'rejected' ? 'Re-submit Verification'
        : 'Verify Account';

  // Notification click handler
  const handleNotificationClick = async (notif: AppNotification) => {
    try {
      await markNotificationRead(notif.notification_id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notif.notification_id));
      if (notif.article_id) {
        // Find article slug or navigate using API
        navigate(`/articles`);
      }
    } catch (err) {
      // Just navigate to articles directory
      navigate('/articles');
    }
  };

  // Contributor Create/Edit Save
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
          status: 'draft',
        });
        setMyArticles((prev) => [created, ...prev]);
      } else {
        const { article: updated } = await updateArticle(selectedArticleId, {
          title: formTitle,
          description: formDescription,
          content: formContent,
          category_id: formCategoryId,
          cover_image: formCoverImage || null,
        });
        setMyArticles((prev) => prev.map((a) => (a.article_id === updated.article_id ? { ...a, ...updated } : a)));
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save article.');
    } finally {
      setFormSaving(false);
    }
  };

  const openCreateForm = () => {
    setFormMode('create');
    setFormTitle('');
    setFormDescription('');
    setFormContent('');
    setFormCategoryId(categories[0]?.category_id || '');
    setFormCoverImage('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (art: Article) => {
    setFormMode('edit');
    setSelectedArticleId(art.article_id);
    setFormTitle(art.title);
    setFormDescription(art.description);
    setFormContent(art.content);
    setFormCategoryId(art.category_id);
    setFormCoverImage(art.cover_image || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmitReview = async (id: string) => {
    try {
      const { article: updated } = await submitArticleForReview(id);
      setMyArticles((prev) => prev.map((a) => (a.article_id === updated.article_id ? { ...a, ...updated } : a)));
    } catch (err: any) {
      alert(err.message || 'Failed to submit article.');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm('Delete this article draft?')) return;
    try {
      await deleteArticle(id);
      setMyArticles((prev) => prev.filter((a) => a.article_id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete article.');
    }
  };

  const isContributor = user.role === 'ngo_partner' || user.role === 'government_officer';

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link>
          <div className="flex items-center gap-4">
            <Link to="/articles" className="text-xs hover:underline text-brand-teal font-bold">Knowledge Hub</Link>
            {user.role === 'admin' && (
              <>
                <Link to="/admin/verification" className="text-xs hover:underline">Verifications</Link>
                <Link to="/admin/verification" className="text-xs hover:underline text-brand-teal">Articles Admin</Link>
              </>
            )}
            <button onClick={signOut} className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-red/50">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-3">{roleLabel(user.role)}</p>
        <h1 className="font-sora text-3xl md:text-4xl font-bold text-white flex items-center gap-3 flex-wrap">
          Welcome, {user.name}
          {isVerified && <VerifiedBadge />}
        </h1>
        <p className="text-sm text-on-surface/60 mt-3">{user.email}</p>

        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <section className="mt-8 border border-brand-teal/20 rounded-xl p-6 bg-brand-teal/5">
            <h3 className="font-sora text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-teal animate-pulse"></span>
              In-App Notifications ({notifications.length})
            </h3>
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.notification_id} className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3 rounded-lg hover:bg-white/[0.04] transition-all">
                  <div>
                    <p className="text-xs text-white font-medium">{n.message}</p>
                    <span className="text-[10px] text-on-surface/40 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => handleNotificationClick(n)}
                    className="px-3 py-1 bg-brand-teal text-black rounded text-[11px] font-bold hover:bg-brand-teal/90"
                  >
                    Read Article
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 border border-white/10 rounded-lg p-6 md:p-8 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-3"><ShieldIcon className="w-5 h-5 text-brand-teal" /><h2 className="font-sora text-lg font-bold text-white">Your Dashboard</h2></div>
          <p className="text-sm text-on-surface/60 mb-6">Access the tools available for your account.</p>
          {user.role === 'citizen' ? (
            <div className="flex flex-wrap gap-3">
              <Link to="/articles" className="inline-block px-5 py-3 bg-brand-teal text-black rounded-lg text-sm font-bold">Knowledge Hub</Link>
              <Link to="/submit-report" className="inline-block px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold">Submit a Report</Link>
              <Link to="/my-reports" className="inline-block px-5 py-3 border border-brand-teal/40 text-brand-teal rounded-lg text-sm font-bold">My Reports</Link>
              <Link to="/case-tracker" className="inline-block px-5 py-3 border border-white/15 text-white rounded-lg text-sm font-bold">Track a Case</Link>
              <Link to="/offline-drafts" className="inline-block px-5 py-3 border border-white/15 text-white rounded-lg text-sm font-bold">Offline Drafts</Link>
              <Link
                to="/verification"
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold ${
                  isVerified
                    ? 'bg-emerald-500 text-black'
                    : verificationStatus === 'pending'
                      ? 'bg-amber-500 text-black'
                      : 'bg-emerald-500 text-black'
                }`}
              >
                <ShieldIcon className="w-4 h-4" />
                {isVerified ? 'Verified' : verifyButtonLabel}
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link to="/articles" className="inline-block px-5 py-3 bg-brand-teal text-black rounded-lg text-sm font-bold">Knowledge Hub</Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/verification" className="inline-block px-5 py-3 border border-white/15 text-white rounded-lg text-sm font-bold">Verification Requests</Link>
                  <Link to="/admin/verification" className="inline-block px-5 py-3 border border-white/15 text-white rounded-lg text-sm font-bold">Article Management</Link>
                </>
              )}
            </div>
          )}
        </section>

        {/* Identity Verification (Citizen Only) */}
        {user.role === 'citizen' && (
          <section className="mt-6 border border-white/10 rounded-lg p-6 md:p-8 bg-white/[0.02]">
            <h2 className="font-sora text-lg font-bold text-white mb-2">Identity Verification</h2>
            {isVerified ? (
              <p className="text-sm text-on-surface/60">Your account is verified. <VerifiedBadge /></p>
            ) : verificationStatus === 'pending' ? (
              <p className="text-sm text-amber-400/90">Your NID submission is under review. You will get the verified badge once an admin approves it.</p>
            ) : verificationStatus === 'rejected' ? (
              <p className="text-sm text-rose-400/90">Your last verification request was rejected. Visit the <Link to="/verification" className="underline">verification page</Link> to submit again.</p>
            ) : (
              <p className="text-sm text-on-surface/60">You are not verified yet. Submit your NID on the <Link to="/verification" className="underline text-brand-teal">verification page</Link> to earn a verified badge.</p>
            )}
          </section>
        )}

        {/* Contributor "My Articles" Panel */}
        {isContributor && (
          <section className="mt-8 border border-white/10 rounded-xl p-6 md:p-8 bg-white/[0.02]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-sora text-xl font-bold text-white">My Educational Articles</h2>
              <button
                onClick={openCreateForm}
                className="px-4 py-2 bg-brand-teal text-black rounded-lg text-xs font-bold hover:bg-brand-teal/90"
              >
                + Create Article
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-on-surface/50 font-medium">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myArticles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-on-surface/40">
                        You have not created any articles yet.
                      </td>
                    </tr>
                  ) : (
                    myArticles.map((art) => (
                      <tr key={art.article_id} className="hover:bg-white/[0.01]">
                        <td className="py-4 pr-4">
                          <p className="font-medium text-white line-clamp-1">{art.title}</p>
                          {art.rejection_reason && (
                            <span className="text-[10px] text-brand-red block mt-1">Rejection reason: {art.rejection_reason}</span>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-xs text-on-surface/60">{art.category_name}</td>
                        <td className="py-4 pr-4">
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
                        </td>
                        <td className="py-4 text-right flex justify-end gap-2">
                          {(art.status === 'draft' || art.status === 'rejected') && (
                            <>
                              <button
                                onClick={() => openEditForm(art)}
                                className="px-2.5 py-1.5 border border-white/10 rounded hover:border-brand-teal/50 text-xs font-bold text-white"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleSubmitReview(art.article_id)}
                                className="px-2.5 py-1.5 bg-brand-teal text-black rounded hover:bg-brand-teal/90 text-xs font-bold"
                              >
                                Submit Review
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(art.article_id)}
                                className="px-2.5 py-1.5 border border-brand-red/30 hover:bg-brand-red/10 text-brand-red rounded text-xs font-bold"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {art.status === 'published' && (
                            <Link
                              to={`/articles/${art.slug}`}
                              className="px-2.5 py-1.5 border border-brand-teal/20 text-brand-teal rounded text-xs font-bold hover:bg-brand-teal/10"
                            >
                              View Live
                            </Link>
                          )}
                          {art.status === 'pending_review' && (
                            <span className="text-xs text-on-surface/40 italic">Review Pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Contributor Form Modal Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-dark border border-white/10 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
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
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal/50"
                  placeholder="Write full article body details here..."
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
                  {formSaving ? 'Saving...' : 'Save Draft'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
