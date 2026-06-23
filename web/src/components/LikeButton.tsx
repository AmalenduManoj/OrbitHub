interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
  onCountClick?: () => void;
}

export default function LikeButton({ liked, count, onToggle, onCountClick }: LikeButtonProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onToggle} className="transition">
        {liked ? (
          <svg className="w-7 h-7 text-accent-pink" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>
      {onCountClick ? (
        <button
          onClick={(e) => { e.stopPropagation(); onCountClick(); }}
          className="text-sm text-text-secondary hover:text-primary transition"
        >
          {count}
        </button>
      ) : (
        <span className="text-sm text-text-secondary">{count}</span>
      )}
    </div>
  );
}
