import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHighlight, deleteHighlight, addStoryToHighlight, removeStoryFromHighlight } from '../api/highlights';
import type { HighlightWithStories } from '../types';

export default function HighlightDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<HighlightWithStories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHighlight = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const d = await getHighlight(id);
      setData(d);
    } catch {
      setError('Highlight not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHighlight();
  }, [fetchHighlight]);

  const handleDelete = async () => {
    if (!id || !confirm('Delete this highlight?')) return;
    try {
      await deleteHighlight(id);
      navigate('/highlights', { replace: true });
    } catch {
      setError('Failed to delete');
    }
  };

  const handleRemoveStory = async (storyId: string) => {
    if (!id) return;
    try {
      await removeStoryFromHighlight(id, storyId);
      setData((prev) =>
        prev ? { ...prev, stories: prev.stories.filter((s) => s.id !== storyId) } : prev
      );
    } catch {
      setError('Failed to remove story');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-text-muted">{error || 'Highlight not found'}</p>
        <button
          onClick={() => navigate('/highlights')}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/highlights')}
            className="text-text-secondary hover:text-text-primary transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">{data.highlight.name}</h1>
        </div>
        <button
          onClick={handleDelete}
          className="text-text-muted hover:text-red-400 transition text-sm"
        >
          Delete
        </button>
      </div>

      {/* Stories grid */}
      {data.stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-text-secondary font-medium">No stories in this highlight</p>
          <p className="text-text-muted text-sm">Save stories from the story viewer</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {data.stories.map((story) => (
            <div key={story.id} className="relative group">
              <button
                onClick={() => navigate(`/stories/${story.id}`)}
                className="aspect-[3/4] rounded-lg overflow-hidden bg-bg-card block w-full"
              >
                <img
                  src={story.media_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {story.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white truncate">{story.caption}</p>
                  </div>
                )}
              </button>
              <button
                onClick={() => handleRemoveStory(story.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs hover:bg-red-500/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
