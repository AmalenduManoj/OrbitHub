import client from './client';
import type {
  HighlightResponse,
  HighlightWithStories,
  CreateHighlightRequest,
  AddStoryToHighlightRequest,
  MessageResponse,
} from '../types';

export async function listHighlights() {
  const res = await client.get<HighlightResponse[]>('/highlights');
  return res.data;
}

export async function getHighlight(id: string) {
  const res = await client.get<HighlightWithStories>(`/highlights/${id}`);
  return res.data;
}

export async function createHighlight(data: CreateHighlightRequest) {
  const res = await client.post<HighlightResponse>('/highlights', data);
  return res.data;
}

export async function deleteHighlight(id: string) {
  const res = await client.delete<MessageResponse>(`/highlights/${id}`);
  return res.data;
}

export async function addStoryToHighlight(highlightId: string, storyId: string) {
  const res = await client.post<MessageResponse>(`/highlights/${highlightId}/stories`, {
    story_id: storyId,
  });
  return res.data;
}

export async function removeStoryFromHighlight(highlightId: string, storyId: string) {
  const res = await client.delete<MessageResponse>(
    `/highlights/${highlightId}/stories/${storyId}`,
  );
  return res.data;
}
