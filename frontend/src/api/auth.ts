import client from './client';
import type { AuthUser } from '../types/user';

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  role: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await client.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

export async function me(): Promise<AuthUser> {
  const response = await client.get<AuthUser>('/auth/me');
  return response.data;
}
