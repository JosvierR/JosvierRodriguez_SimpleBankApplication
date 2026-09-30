import { request } from './client'
import type { AuditResponse } from '../types/api'

export const auditsApi = {
  list: () => request<AuditResponse[]>('/audits'),
  get: (id: string) => request<AuditResponse>(`/audits/${id}`),
}
