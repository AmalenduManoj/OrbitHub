import client from './client';
import type { ConversationResponse, ChatMessageResponse, CreateConversationRequest, SendMessageRequest } from '../types';

export async function listConversations() {
  const res = await client.get<ConversationResponse[]>('/chat/conversations');
  return res.data;
}

export async function getOrCreateConversation(data: CreateConversationRequest) {
  const res = await client.post<ConversationResponse>('/chat/conversations', data);
  return res.data;
}

export async function getMessages(conversationId: string, before?: string) {
  const params: Record<string, string> = {};
  if (before) params.before = before;
  const res = await client.get<ChatMessageResponse[]>(`/chat/conversations/${conversationId}/messages`, { params });
  return res.data;
}

export async function sendMessage(conversationId: string, data: SendMessageRequest) {
  const res = await client.post<ChatMessageResponse>(`/chat/conversations/${conversationId}/messages`, data);
  return res.data;
}

export async function markRead(conversationId: string) {
  const res = await client.post<{ seen_at: string }>(`/chat/conversations/${conversationId}/read`);
  return res.data;
}
