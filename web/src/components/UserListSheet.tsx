import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface UserListSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  users: Array<{ id: string; username: string; avatar_url: string | null }>;
  renderAction?: (user: { id: string; username: string; avatar_url: string | null }) => ReactNode;
}

export default function UserListSheet({ open, onClose, title, users, renderAction }: UserListSheetProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-elevated w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-5 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm transition-all duration-150"
          >
            Close
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">None yet</p>
        ) : (
          <div className="space-y-1 overflow-y-auto">
            {users.map((u) => (
              <div
                key={u.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-all duration-150 group"
              >
                <button
                  onClick={() => { navigate(`/profile/${u.id}`); onClose(); }}
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-primary/40">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {u.username[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white truncate">{u.username}</span>
                </button>
                {renderAction?.(u)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
