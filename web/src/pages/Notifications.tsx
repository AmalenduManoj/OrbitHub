import { useNavigate } from 'react-router-dom';
import { useNotif } from '../context/NotificationContext';
import type { NotificationResponse } from '../types';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function iconForType(type: string) {
  switch (type) {
    case 'like':
      return (
        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'comment':
      return (
        <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'follow':
      return (
        <svg className="w-5 h-5 text-accent-lavender" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    default:
      return null;
  }
}

function NotificationItem({ notif, onRead }: { notif: NotificationResponse; onRead: (id: string) => void }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notif.is_read) onRead(notif.id);
    if (notif.notification_type === 'follow' && notif.actor_id) {
      navigate(`/profile/${notif.actor_id}`);
    } else if ((notif.notification_type === 'like' || notif.notification_type === 'comment') && notif.story_id) {
      navigate(`/stories/${notif.story_id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition ${
        notif.is_read
          ? 'bg-bg-base'
          : 'bg-bg-card border-l-2 border-primary'
      } hover:bg-bg-hover`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {iconForType(notif.notification_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notif.is_read ? 'text-text-secondary' : 'text-text-primary'}`}>
          <span className="font-semibold">{notif.actor_username}</span>
          {' '}{notif.content}
        </p>
      </div>
      <span className="text-xs text-text-muted flex-shrink-0 mt-0.5">
        {timeAgo(notif.created_at)}
      </span>
    </button>
  );
}

export default function Notifications() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotif();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-text-primary">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-primary hover:text-primary-light transition font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800 -mx-4">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notif={n} onRead={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}
