export interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  skills: string[];
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: 'manager' | 'employee';
}
