import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { conversations, conversationsLoading } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-[1.5px] border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-4">Messages</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-text-secondary font-medium">No conversations yet</p>
          <p className="text-text-muted text-sm">Search for someone to message</p>
          <button
            onClick={() => navigate('/search')}
            className="mt-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all duration-150"
          >
            Find people
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => {
            const isMine = conv.last_message_sender_id === user?.id;
            return (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-bg-hover transition-all duration-150"
              >
                {conv.other_avatar_url ? (
                  <img src={conv.other_avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-1 ring-primary/20 shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center text-base font-semibold text-white shrink-0">
                    {conv.other_username[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate">{conv.other_username}</span>
                    {conv.last_message_at && (
                      <span className="text-xs text-text-muted shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-text-secondary truncate">
                      {isMine && <span className="text-text-muted mr-1">You: </span>}
                      {conv.last_message || 'No messages yet'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="shrink-0 ml-2 bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
