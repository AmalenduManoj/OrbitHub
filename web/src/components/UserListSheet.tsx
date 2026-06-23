import { useNavigate } from 'react-router-dom';

interface UserListSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  users: Array<{ id: string; username: string; avatar_url: string | null }>;
}

export default function UserListSheet({ open, onClose, title, users }: UserListSheetProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-bg-card w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-4 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm transition"
          >
            Close
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">None yet</p>
        ) : (
          <div className="space-y-1 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => { navigate(`/profile/${u.id}`); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {u.username[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-white">{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
