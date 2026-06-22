import client from './client';
import type { UserResponse, ProfileUpdateRequest, MessageResponse, UserSearchResult } from '../types';

export async function getProfile(id: string) {
  const res = await client.get<UserResponse>(`/user/${id}`);
  return res.data;
}

export async function updateProfile(data: ProfileUpdateRequest) {
  const res = await client.patch<UserResponse>('/user/profile', data);
  return res.data;
}

export async function follow(id: string) {
  const res = await client.post<MessageResponse>(`/user/${id}/follow`);
  return res.data;
}

export async function unfollow(id: string) {
  const res = await client.delete<MessageResponse>(`/user/${id}/follow`);
  return res.data;
}

export async function searchUsers(query: string) {
  const res = await client.get<UserSearchResult[]>('/user/search', { params: { q: query } });
  return res.data;
}
