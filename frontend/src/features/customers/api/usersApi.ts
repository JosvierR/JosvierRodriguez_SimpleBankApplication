import { request } from '@/shared/api/client';
import type { AccountResponse, CreateUserRequest, UpdateUserRequest, UserResponse } from '@/shared/types/api';

export const usersApi = {
  list: () => request<UserResponse[]>('/users'),
  get: (id: string) => request<UserResponse>(`/users/${id}`),
  create: (body: CreateUserRequest) => request<UserResponse>('/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: UpdateUserRequest) => request<UserResponse>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  accounts: (id: string) => request<AccountResponse[]>(`/users/${id}/accounts`),
};
