import client from './client';
import type { UserSearchResult } from '../types/user';

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const response = await client.get<UserSearchResult[]>('/users/search', {
    params: { q: query },
  });
  return response.data;
}
