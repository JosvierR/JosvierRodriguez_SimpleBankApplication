import { request } from '@/shared/api/client';
import type { AuthResponse, LoginRequest, RegisterRequest, VerifyResponse } from '@/shared/types/api';

export const authApi = {
  login: (body: LoginRequest) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: RegisterRequest) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verify: () => request<VerifyResponse>('/auth/verify'),
};
