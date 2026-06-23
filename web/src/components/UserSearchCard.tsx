import { useNavigate } from 'react-router-dom';
import type { UserSearchResult } from '../types';

export default function UserSearchCard({ user }: { user: UserSearchResult }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/profile/${user.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-all duration-150"
    >
      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-primary/40">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-white">
            {user.username[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-text-primary truncate">
          {user.username}
        </p>
      </div>
      <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
