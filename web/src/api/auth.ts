import client from './client';
import type { AuthResponse, RefreshResponse, RegisterRequest, LoginRequest } from '../types';

export async function register(data: RegisterRequest) {
  const res = await client.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function login(data: LoginRequest) {
  const res = await client.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function refresh(refreshToken: string) {
  const res = await client.post<RefreshResponse>('/auth/refresh', { refresh_token: refreshToken });
  return res.data;
}
