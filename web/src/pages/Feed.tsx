import { useState, useEffect, useCallback } from 'react';
import { getFeed } from '../api/stories';
import type { StoryResponse } from '../types';
import StoryCard from '../components/StoryCard';
import CreateStoryModal from '../components/CreateStoryModal';

export default function Feed() {
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getFeed();
      setStories(data);
    } catch {
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-text-muted">{error}</p>
          <button
            onClick={fetchFeed}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
          >
            Retry
          </button>
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-text-secondary font-medium">No stories yet</p>
          <p className="text-text-muted text-sm">Create your first story to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
          >
            Create Story
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* FAB — show only when stories exist */}
      {stories.length > 0 && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 flex items-center justify-center transition active:scale-95"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Create story modal — always mounted, visible when open */}
      <CreateStoryModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchFeed}
      />
    </div>
  );
}
