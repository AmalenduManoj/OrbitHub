import { useState, useEffect, useCallback } from 'react';
import * as notificationsApi from '../api/notifications';
import { useWebSocket } from './useWebSocket';
import { getAccessToken } from '../api/client';
import type { NotificationResponse } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetch() {
      try {
        const [data, countRes] = await Promise.all([
          notificationsApi.listNotifications(),
          notificationsApi.getUnreadCount(),
        ]);
        if (cancelled) return;
        setNotifications(data);
        setUnreadCount(countRes.count);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  const handleWsMessage = useCallback((data: unknown) => {
    const notif = data as NotificationResponse;
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const { isConnected } = useWebSocket('/ws/notifications', handleWsMessage);

  const markRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, isConnected };
}
