import client from './client';
import type { StoryResponse, StoryDetailResponse, CreateStoryRequest, ViewerResponse, LikeUserResponse, AddCommentRequest, CommentResponse } from '../types';

export async function getFeed() {
  const res = await client.get<StoryResponse[]>('/stories/feed');
  return res.data;
}

export async function getMyStories() {
  const res = await client.get<StoryResponse[]>('/stories/my');
  return res.data;
}

export async function getStory(id: string) {
  const res = await client.get<StoryDetailResponse>(`/stories/${id}`);
  return res.data;
}

export async function createStory(data: CreateStoryRequest) {
  const res = await client.post<StoryResponse>('/stories', data);
  return res.data;
}

export async function deleteStory(id: string) {
  const res = await client.delete<{ message: string }>(`/stories/${id}`);
  return res.data;
}

export async function viewStory(id: string) {
  const res = await client.post<{ message: string }>(`/stories/${id}/view`);
  return res.data;
}

export async function likeStory(id: string) {
  const res = await client.post<{ liked: boolean }>(`/stories/${id}/like`);
  return res.data;
}

export async function unlikeStory(id: string) {
  const res = await client.delete<{ liked: boolean }>(`/stories/${id}/like`);
  return res.data;
}

export async function getStoryLikes(id: string) {
  const res = await client.get<LikeUserResponse[]>(`/stories/${id}/likes`);
  return res.data;
}

export async function getStoryViews(id: string) {
  const res = await client.get<ViewerResponse[]>(`/stories/${id}/views`);
  return res.data;
}

export async function getComments(storyId: string) {
  const res = await client.get<CommentResponse[]>(`/stories/${storyId}/comments`);
  return res.data;
}

export async function addComment(storyId: string, data: AddCommentRequest) {
  const res = await client.post<CommentResponse>(`/stories/${storyId}/comments`, data);
  return res.data;
}

export async function deleteComment(storyId: string, commentId: string) {
  const res = await client.delete<{ message: string }>(`/stories/${storyId}/comments/${commentId}`);
  return res.data;
}
