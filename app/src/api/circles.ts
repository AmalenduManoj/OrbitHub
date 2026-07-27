import client from './client';
import type { CircleResponse, CircleMemberResponse, CreateCircleRequest, UpdateCircleRequest, AddMembersRequest } from '../types';

export async function listCircles() {
  const res = await client.get<CircleResponse[]>('/circles');
  return res.data;
}

export async function getCircle(id: string) {
  const res = await client.get<CircleResponse>(`/circles/${id}`);
  return res.data;
}

export async function createCircle(data: CreateCircleRequest) {
  const res = await client.post<CircleResponse>('/circles', data);
  return res.data;
}

export async function updateCircle(id: string, data: UpdateCircleRequest) {
  const res = await client.patch<CircleResponse>(`/circles/${id}`, data);
  return res.data;
}

export async function deleteCircle(id: string) {
  const res = await client.delete<{ message: string }>(`/circles/${id}`);
  return res.data;
}

export async function getCircleMembers(id: string) {
  const res = await client.get<CircleMemberResponse[]>(`/circles/${id}/members`);
  return res.data;
}

export async function addCircleMembers(id: string, data: AddMembersRequest) {
  const res = await client.post<{ message: string }>(`/circles/${id}/members`, data);
  return res.data;
}

export async function removeCircleMember(circleId: string, userId: string) {
  const res = await client.delete<{ message: string }>(`/circles/${circleId}/members/${userId}`);
  return res.data;
}
