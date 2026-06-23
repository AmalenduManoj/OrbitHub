import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStory, viewStory, toggleLike, getComments, addComment, deleteComment, getLikes, getViews, deleteStory } from '../api/stories';
import { listHighlights, addStoryToHighlight } from '../api/highlights';
import { useAuth } from '../context/AuthContext';
import type { StoryDetailResponse, CommentResponse, HighlightResponse, LikeUserResponse, ViewerResponse } from '../types';
import LikeButton from '../components/LikeButton';
import CommentList from '../components/CommentList';
import CreateHighlightModal from '../components/CreateHighlightModal';
import UserListSheet from '../components/UserListSheet';

export default function StoryView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [story, setStory] = useState<StoryDetailResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Save to highlight state
  const [showHlPicker, setShowHlPicker] = useState(false);
  const [highlights, setHighlights] = useState<HighlightResponse[]>([]);
  const [hlLoading, setHlLoading] = useState(false);
  const [showCreateHl, setShowCreateHl] = useState(false);
  const [hlMsg, setHlMsg] = useState('');

  // Overflow menu
  const [showMenu, setShowMenu] = useState(false);

  // Likes sheet
  const [showLikes, setShowLikes] = useState(false);
  const [likes, setLikes] = useState<LikeUserResponse[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);

  // Viewers sheet
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<ViewerResponse[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);

  const isOwner = user && story && user.id === story.user_id;

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

  // Save to highlight
  const openHlPicker = async () => {
    setShowHlPicker(true);
    setHlMsg('');
    setHlLoading(true);
    try {
      const data = await listHighlights();
      setHighlights(data);
    } catch {
      setHlMsg('Failed to load highlights');
    } finally {
      setHlLoading(false);
    }
  };

  const handleSaveToHl = async (hlId: string) => {
    if (!id) return;
    try {
      await addStoryToHighlight(hlId, id);
      setHlMsg('Saved to highlight!');
      setTimeout(() => setShowHlPicker(false), 1000);
    } catch {
      setHlMsg('Failed to save');
    }
  };

  // Delete story
  const handleDelete = async () => {
    if (!id || !window.confirm('Delete this story?')) return;
    setDeleting(true);
    try {
      await deleteStory(id);
      navigate('/');
    } catch {
      setDeleting(false);
    }
  };

  // Load likes
  const loadLikes = async () => {
    if (!id) return;
    if (likes.length > 0) { setShowLikes(true); return; }
    setLikesLoading(true);
    try {
      const data = await getLikes(id);
      setLikes(data);
      setShowLikes(true);
    } catch {} finally {
      setLikesLoading(false);
    }
  };

  // Load viewers
  const loadViewers = async () => {
    if (!id) return;
    setShowMenu(false);
    if (viewers.length > 0) { setShowViewers(true); return; }
    setViewersLoading(true);
    try {
      const data = await getViews(id);
      setViewers(data);
      setShowViewers(true);
    } catch {} finally {
      setViewersLoading(false);
    }
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
            {isOwner ? (
              <button
                onClick={loadViewers}
                className="hover:text-primary transition"
              >
                {story.view_count}
              </button>
            ) : (
              story.view_count
            )}
          </div>

          {/* Save to highlight (owner only) */}
          {isOwner && (
            <button
              onClick={openHlPicker}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition"
              title="Save to highlight"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}

          {/* Overflow menu (owner only) */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="text-text-secondary hover:text-text-primary transition"
                title="More"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-bg-card border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                  <button
                    onClick={loadViewers}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-hover transition"
                  >
                    Viewers ({story.view_count})
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); handleDelete(); }}
                    disabled={deleting}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-bg-hover transition disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Delete story'}
                  </button>
                </div>
              )}
            </div>
          )}

          <LikeButton liked={liked} count={story.like_count} onToggle={handleLike} onCountClick={loadLikes} />
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

      {/* Comments panel */}
      <div className="w-full md:w-80 bg-bg-card border-l border-gray-800 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-text-primary">
            Comments ({story.comment_count})
          </h3>
        </div>
        <CommentList
          comments={comments}
          currentUserId={user?.id}
          onAdd={handleAddComment}
          onDelete={handleDeleteComment}
        />
      </div>

      {/* Highlight picker overlay */}
      {showHlPicker && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-elevated/80 backdrop-blur-2xl w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-5 pb-20 sm:pb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white text-sm">Save to Highlight</h3>
              <button
                onClick={() => setShowHlPicker(false)}
                className="text-text-secondary hover:text-text-primary text-sm transition-all duration-150"
              >
                Cancel
              </button>
            </div>

            {hlMsg && (
              <p className="text-sm text-center mb-3 text-primary">{hlMsg}</p>
            )}

            {hlLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin h-6 w-6 border-[1.5px] border-primary border-t-transparent rounded-full" />
              </div>
            ) : highlights.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">No highlights yet</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {highlights.map((hl) => (
                  <button
                    key={hl.id}
                    onClick={() => handleSaveToHl(hl.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-all duration-150 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{hl.name}</p>
                      <p className="text-xs text-text-muted">{hl.story_count} stories</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setShowHlPicker(false); setShowCreateHl(true); }}
              className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-gray-700 text-text-secondary hover:border-primary hover:text-primary text-sm font-medium transition-all duration-150"
            >
              + New Highlight
            </button>
          </div>
        </div>
      )}

      {/* Likes sheet */}
      <UserListSheet
        open={showLikes}
        onClose={() => setShowLikes(false)}
        title="Likes"
        users={likes}
      />

      {/* Viewers sheet */}
      <UserListSheet
        open={showViewers}
        onClose={() => setShowViewers(false)}
        title="Viewers"
        users={viewers}
      />

      {/* Create highlight modal */}
      <CreateHighlightModal
        open={showCreateHl}
        onClose={() => setShowCreateHl(false)}
        onCreated={() => {
          setShowCreateHl(false);
          openHlPicker();
        }}
        preSelectedStoryId={id}
      />
    </div>
  );
}
