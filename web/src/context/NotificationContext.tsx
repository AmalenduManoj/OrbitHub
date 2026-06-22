import { createContext, useContext, type ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationResponse } from '../types';

interface NotificationContextValue {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const value = useNotifications();
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotif() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotif must be used within NotificationProvider');
  return ctx;
}
