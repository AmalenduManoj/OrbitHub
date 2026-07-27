import client from './client';
import type { NotificationResponse, UnreadCountResponse } from '../types';

export async function listNotifications() {
  const res = await client.get<NotificationResponse[]>('/notifications');
  return res.data;
}

export async function unreadCount() {
  const res = await client.get<UnreadCountResponse>('/notifications/unread-count');
  return res.data;
}

export async function markRead(id: string) {
  const res = await client.post<{ message: string }>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllRead() {
  const res = await client.post<{ message: string }>('/notifications/read-all');
  return res.data;
}
