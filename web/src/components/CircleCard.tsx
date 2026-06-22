import { useNavigate } from 'react-router-dom';
import type { CircleResponse } from '../types';

interface CircleCardProps {
  circle: CircleResponse;
  onDelete: (id: string) => void;
}

export default function CircleCard({ circle, onDelete }: CircleCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/circles/${circle.id}`)}
      className="bg-bg-card rounded-xl p-4 border border-gray-800 hover:border-primary/50 transition cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">{circle.name}</h3>
            <p className="text-sm text-text-muted">{circle.member_count} member{circle.member_count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(circle.id);
          }}
          className="text-text-muted hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-1"
          title="Delete circle"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-text-muted">
        Created {new Date(circle.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
