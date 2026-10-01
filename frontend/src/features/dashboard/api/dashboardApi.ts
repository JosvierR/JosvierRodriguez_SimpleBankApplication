import { request } from '@/shared/api/client';
import type { RoleDashboardData } from '@/features/dashboard/types/dashboard';

export const dashboardApi = {
  get: () => request<RoleDashboardData>('/dashboard'),
};
