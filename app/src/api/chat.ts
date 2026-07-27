import client from './client';
import type { ConversationResponse, ChatMessageResponse, SendMessageRequest } from '../types';

export async function listConversations() {
  const res = await client.get<ConversationResponse[]>('/chat/conversations');
  return res.data;
}

export async function getOrCreateConversation(userId: string) {
  const res = await client.post<ConversationResponse>('/chat/conversations', { user_id: userId });
  return res.data;
}

export async function getMessages(conversationId: string, before?: string) {
  const params: Record<string, string> = {};
  if (before) params.before = before;
  const res = await client.get<ChatMessageResponse[]>(`/chat/conversations/${conversationId}/messages`, { params });
  return res.data;
}

export async function sendMessage(conversationId: string, content: string) {
  const res = await client.post<ChatMessageResponse>(`/chat/conversations/${conversationId}/messages`, { content });
  return res.data;
}

export async function markRead(conversationId: string) {
  const res = await client.post<{ seen_at: string }>(`/chat/conversations/${conversationId}/read`);
  return res.data;
}
