import client from './client';
import type { NotificationResponse } from '../types';

export function listNotifications() {
  return client.get<NotificationResponse[]>('/notifications').then(r => r.data);
}

export function getUnreadCount() {
  return client.get<{ count: number }>('/notifications/unread-count').then(r => r.data);
}

export function markRead(id: string) {
  return client.post(`/notifications/${id}/read`).then(r => r.data);
}

export function markAllRead() {
  return client.post('/notifications/read-all').then(r => r.data);
}
