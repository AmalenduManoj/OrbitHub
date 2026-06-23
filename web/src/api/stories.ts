import client from './client';
import type {
  StoryResponse,
  StoryDetailResponse,
  CommentResponse,
  ViewerResponse,
  LikeUserResponse,
  MessageResponse,
  LikedResponse,
  AddCommentRequest,
  CreateStoryRequest,
} from '../types';

export async function getFeed() {
  const res = await client.get<StoryResponse[]>('/stories/feed');
  return res.data;
}

export async function getMyStories() {
  const res = await client.get<StoryResponse[]>('/stories/mine');
  return res.data;
}

export async function getStory(id: string) {
  const res = await client.get<StoryDetailResponse>(`/stories/${id}`);
  return res.data;
}

export async function viewStory(id: string) {
  const res = await client.post<MessageResponse>(`/stories/${id}/view`);
  return res.data;
}

export async function toggleLike(id: string) {
  const res = await client.post<LikedResponse>(`/stories/${id}/like`);
  return res.data;
}

export async function getViews(id: string) {
  const res = await client.get<ViewerResponse[]>(`/stories/${id}/views`);
  return res.data;
}

export async function getLikes(id: string) {
  const res = await client.get<LikeUserResponse[]>(`/stories/${id}/likes`);
  return res.data;
}

export async function getComments(id: string) {
  const res = await client.get<CommentResponse[]>(`/stories/${id}/comments`);
  return res.data;
}

export async function addComment(id: string, data: AddCommentRequest) {
  const res = await client.post<CommentResponse>(`/stories/${id}/comments`, data);
  return res.data;
}

export async function deleteComment(storyId: string, commentId: string) {
  const res = await client.delete<MessageResponse>(`/stories/${storyId}/comments/${commentId}`);
  return res.data;
}

export async function createStory(data: CreateStoryRequest) {
  const res = await client.post<StoryDetailResponse>('/stories', data);
  return res.data;
}

export async function deleteStory(id: string) {
  const res = await client.delete<MessageResponse>(`/stories/${id}`);
  return res.data;
}
