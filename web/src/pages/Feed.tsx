import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeed, getMyStories } from '../api/stories';
import { listHighlights } from '../api/highlights';
import type { StoryResponse, HighlightResponse } from '../types';
import StoryCard from '../components/StoryCard';
import HighlightCard from '../components/HighlightCard';
import CreateStoryModal from '../components/CreateStoryModal';

export default function Feed() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [myStories, setMyStories] = useState<StoryResponse[]>([]);
  const [highlights, setHighlights] = useState<HighlightResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [feedData, myData, hlData] = await Promise.all([
        getFeed(),
        getMyStories(),
        listHighlights(),
      ]);
      setStories(feedData);
      setMyStories(myData);
      setHighlights(hlData);
    } catch {
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-[1.5px] border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-text-muted">{error}</p>
        <button
          onClick={fetchFeed}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all duration-150"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasAnyContent = myStories.length > 0 || highlights.length > 0 || stories.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-text-secondary font-medium">No stories yet</p>
        <p className="text-text-muted text-sm">Create your first story to get started</p>
        <button
          onClick={() => setShowCreate(true)}
          className="mt-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all duration-150"
        >
          Create Story
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Your Stories row */}
      {myStories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Your Stories</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {myStories.map((story) => (
              <div key={story.id} className="shrink-0 w-28">
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highlights row */}
      {highlights.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Saved</h2>
            <button
              onClick={() => navigate('/highlights')}
              className="text-xs text-primary hover:text-primary-light transition-all duration-150"
            >
              See all
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {highlights.map((hl) => (
              <div key={hl.id} className="shrink-0 w-24">
                <HighlightCard highlight={hl} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed stories */}
      {stories.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">From Circles</h2>
          <div className="grid grid-cols-2 gap-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-5 z-50 w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-150 active:scale-[0.92]"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <CreateStoryModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchFeed}
      />
    </div>
  );
}
