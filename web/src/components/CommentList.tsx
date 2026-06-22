import { useState } from 'react';
import type { CommentResponse } from '../types';

interface CommentListProps {
  comments: CommentResponse[];
  currentUserId?: string;
  onAdd: (content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export default function CommentList({ comments, currentUserId, onAdd, onDelete }: CommentListProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await onAdd(content.trim());
      setContent('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {comments.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">No comments yet</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt="" className="w-7 h-7 rounded-full mt-0.5" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                {c.username[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-white">{c.username}</span>
                {currentUserId === c.user_id && (
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-text-muted hover:text-red-400 transition text-xs shrink-0"
                  >
                    delete
                  </button>
                )}
              </div>
              <p className="text-sm text-text-secondary break-words">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment…"
          maxLength={500}
          className="flex-1 px-3 py-2 rounded-lg bg-bg-card border border-gray-700 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition disabled:opacity-50"
        >
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
