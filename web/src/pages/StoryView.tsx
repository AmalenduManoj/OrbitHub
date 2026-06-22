import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStory, viewStory, toggleLike, getComments, addComment, deleteComment } from '../api/stories';
import type { StoryDetailResponse, CommentResponse } from '../types';
import LikeButton from '../components/LikeButton';
import CommentList from '../components/CommentList';

export default function StoryView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<StoryDetailResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStory = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [storyData, commentsData] = await Promise.all([
        getStory(id),
        getComments(id),
      ]);
      setStory(storyData);
      setComments(commentsData);
      // Register view
      viewStory(id).catch(() => {});
    } catch {
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  const handleLike = async () => {
    if (!id) return;
    try {
      const res = await toggleLike(id);
      setLiked(res.liked);
      setStory((prev) =>
        prev
          ? { ...prev, like_count: prev.like_count + (res.liked ? 1 : -1) }
          : prev
      );
    } catch {}
  };

  const handleAddComment = async (content: string) => {
    if (!id) return;
    const newComment = await addComment(id, { content });
    setComments((prev) => [...prev, newComment]);
    setStory((prev) =>
      prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      await deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {}
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-bg-base flex items-center justify-center z-50">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="fixed inset-0 bg-bg-base flex flex-col items-center justify-center z-50 gap-3">
        <p className="text-text-muted">{error || 'Story not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
        >
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-bg-base z-50 flex flex-col md:flex-row">
      {/* Close button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Media section */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-black">
        <img
          src={story.media_url}
          alt=""
          className="max-h-full max-w-full object-contain"
        />

        {/* Top bar overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-text-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {story.view_count}
          </div>
          <LikeButton liked={liked} count={story.like_count} onToggle={handleLike} />
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-2 mb-1">
            {story.avatar_url ? (
              <img src={story.avatar_url} alt="" className="w-8 h-8 rounded-full ring-2 ring-primary/60" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/30 ring-2 ring-primary/60 flex items-center justify-center text-sm font-bold text-white">
                {story.username[0]?.toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-white">{story.username}</span>
          </div>
          {story.caption && (
            <p className="text-sm text-text-secondary mt-1">{story.caption}</p>
          )}
        </div>
      </div>

      {/* Comments panel (desktop sidebar, mobile bottom sheet) */}
      <div className="w-full md:w-80 bg-bg-card border-l border-gray-800 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-text-primary">
            Comments ({story.comment_count})
          </h3>
        </div>
        <CommentList
          comments={comments}
          onAdd={handleAddComment}
          onDelete={handleDeleteComment}
        />
      </div>
    </div>
  );
}
