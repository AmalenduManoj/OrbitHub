import { useNavigate } from 'react-router-dom';
import type { HighlightResponse } from '../types';

interface HighlightCardProps {
  highlight: HighlightResponse;
}

export default function HighlightCard({ highlight }: HighlightCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/highlights/${highlight.id}`)}
      className="relative aspect-[3/4] rounded-xl overflow-hidden bg-bg-card group text-left focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Cover image or placeholder */}
      {highlight.cover_story_id ? (
        <img
          src={`https://via.placeholder.com/200x280/1B1B35/7C3AED?text=${highlight.name[0]}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
          <svg className="w-10 h-10 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Info */}
      <div className="absolute bottom-0 inset-x-0 p-2.5">
        <p className="text-sm font-semibold text-white truncate">{highlight.name}</p>
        <p className="text-xs text-text-muted">{highlight.story_count} story{highlight.story_count !== 1 ? 'ies' : 'y'}</p>
      </div>
    </button>
  );
}
