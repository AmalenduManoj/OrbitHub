import { useNavigate } from 'react-router-dom';
import type { StoryResponse } from '../types';

interface StoryCardProps {
  story: StoryResponse;
}

export default function StoryCard({ story }: StoryCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/stories/${story.id}`)}
      className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-bg-card group text-left focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Thumbnail */}
      <img
        src={story.media_url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-3">
        <div className="flex items-center gap-2 mb-1">
          {story.avatar_url ? (
            <img
              src={story.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full ring-2 ring-primary/60"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/30 ring-2 ring-primary/60 flex items-center justify-center text-[10px] font-bold text-white">
              {story.username[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-white truncate">
            {story.username}
          </span>
        </div>

        {story.view_count > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {story.view_count}
          </div>
        )}
      </div>

      {/* Like count badge */}
      {story.like_count > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 text-[11px] text-white">
          <svg className="w-3 h-3 text-accent-pink" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {story.like_count}
        </div>
      )}
    </button>
  );
}
