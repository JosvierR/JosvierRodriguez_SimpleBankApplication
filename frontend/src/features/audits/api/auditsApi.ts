import { request } from '@/shared/api/client';
import type { AuditResponse } from '@/shared/types/api';

export const auditsApi = {
  list: () => request<AuditResponse[]>('/audits'),
  get: (id: string) => request<AuditResponse>(`/audits/${id}`),
};
