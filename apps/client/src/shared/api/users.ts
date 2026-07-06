import { apiGet } from './client';

export interface UsersResponse {
  count: number;
  limit: number;
  page: number;
  data: Array<{
    id: string;
    email: string;
    name?: string;
  }>;
}

export function fetchUsers(): Promise<UsersResponse> {
  return apiGet<UsersResponse>('/v1/users');
}
