import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { impactStoriesApi } from '../services/impactStoriesApi';
import type { ImpactStory } from '../services/impactStoriesApi';
import { LogoIcon } from '../components/AppIcons';
import DashboardLink from '../components/DashboardLink';

const outcomeLabels: Record<string, string> = {
  arrest: 'Arrest',
  fine: 'Fine',
  reform: 'Reform',
  policy_change: 'Policy Change',
  other: 'Other'
};

const outcomeColors: Record<string, string> = {
  arrest: 'bg-red-500/20 text-red-400 border-red-500/30',
  fine: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  reform: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  policy_change: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

export default function ImpactStoriesPage() {
  const { slug } = useParams();
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (slug) {
      impactStoriesApi.getStoryBySlug(slug)
        .then(story => { if (active) { setStories(story ? [story] : []); setLoading(false); } })
        .catch(err => { if (active) { setError(err.message); setLoading(false); } });
    } else {
      impactStoriesApi.getPublicStories(filter)
        .then(res => { if (active) { setStories(res); setLoading(false); } })
        .catch(err => { if (active) { setError(err.message); setLoading(false); } });
    }
    return () => { active = false; };
  }, [filter, slug]);

  const handleShare = async (storySlug: string, method: string) => {
    try {
      await impactStoriesApi.shareStory(storySlug);
      // Update local count
      setStories(s => s.map(story => story.public_slug === storySlug ? { ...story, share_count: story.share_count + 1 } : story));
      
      const shareUrl = `${window.location.origin}/impact-stories/${storySlug}`;
      const story = stories.find(s => s.public_slug === storySlug);
      const text = `Check out this impact story: ${story?.title}`;
      
      if (method === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } else if (method === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      } else if (method === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
      }
    } catch (e) {
      console.error('Failed to share', e);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </Link>
          <DashboardLink />
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="border-b border-white/10 bg-gradient-to-b from-bg-dark to-brand-teal/5">
        <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
          <h1 className="font-sora text-4xl md:text-5xl font-bold text-white mb-6">Impact Stories Wall</h1>
          <p className="text-on-surface/80 max-w-2xl mx-auto text-lg mb-8">
            Verified cases where citizen action on the platform led to a concrete real-world outcome — an arrest, a fine, an institutional reform, or a policy change.
          </p>
          
          {!slug && (
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {['all', 'arrest', 'fine', 'reform', 'policy_change'].map(f => (
                <button 
                  key={f}
                  onClick={() => { setFilter(f); setLoading(true); }}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${filter === f ? 'bg-brand-teal text-black' : 'border border-white/20 text-white hover:bg-white/5'}`}
                >
                  {f === 'all' ? 'All Outcomes' : outcomeLabels[f]}
                </button>
              ))}
            </div>
          )}
          {slug && (
            <div className="mt-8">
              <Link to="/impact-stories" className="text-brand-teal hover:underline text-sm font-bold">← Back to Wall</Link>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        {loading && <div className="text-center text-on-surface/50">Loading impact stories...</div>}
        {error && <div className="text-center text-brand-red">{error}</div>}
        
        {!loading && !error && stories.length === 0 && (
          <div className="panel text-center py-16">
            <h3 className="font-sora text-xl text-white mb-2">No stories found</h3>
            <p className="text-on-surface/60">There are currently no verified impact stories in this category.</p>
          </div>
        )}

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {stories.map(story => (
            <article key={story.story_id} className="panel break-inside-avoid shadow-lg shadow-black/20 hover:border-brand-teal/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${outcomeColors[story.outcome_type]}`}>
                  {outcomeLabels[story.outcome_type]}
                </span>
                <span className="text-xs text-on-surface/40">
                  {new Date(story.date_added).toLocaleDateString()}
                </span>
              </div>
              
              <h2 className="font-sora text-xl font-bold text-white mb-3 leading-snug">
                {story.title}
              </h2>
              
              <p className="text-on-surface/80 text-sm whitespace-pre-wrap mb-5 leading-relaxed">
                {story.description}
              </p>
              
              {(story.case_reference || story.report_reference || story.institution_name) && (
                <div className="bg-black/30 rounded-lg p-3 mb-5 border border-white/5 space-y-1">
                  {story.institution_name && <div className="text-xs text-on-surface/60">Institution: <span className="text-on-surface">{story.institution_name}</span></div>}
                  {story.case_reference && <div className="text-xs text-on-surface/60">Case Ref: <span className="text-brand-teal">{story.case_reference}</span></div>}
                  {story.report_reference && <div className="text-xs text-on-surface/60">Report Ref: <span className="text-brand-teal">{story.report_reference}</span></div>}
                  {!story.report_reference && !story.case_reference && <div className="text-xs text-brand-teal flex items-center gap-1"><span className="text-lg leading-none">🕵️</span> Protected Whistleblower Mode</div>}
                </div>
              )}
              
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs text-on-surface/50 flex items-center gap-2">
                  <span className="text-lg">📈</span> {story.share_count} shares
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleShare(story.public_slug, 'twitter')} title="Share on X/Twitter" className="p-2 rounded hover:bg-white/10 text-on-surface/70 hover:text-white transition-colors">𝕏</button>
                  <button onClick={() => handleShare(story.public_slug, 'whatsapp')} title="Share on WhatsApp" className="p-2 rounded hover:bg-white/10 text-on-surface/70 hover:text-green-400 transition-colors">💬</button>
                  <button onClick={() => handleShare(story.public_slug, 'copy')} title="Copy Link" className="p-2 rounded hover:bg-white/10 text-on-surface/70 hover:text-brand-teal transition-colors">🔗</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
