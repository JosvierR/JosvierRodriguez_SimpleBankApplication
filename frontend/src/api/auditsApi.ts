import { request } from './client'
import type { AuditResponse, WhoAmIResponse } from '../types/api'

export const auditsApi = {
  list: () => request<AuditResponse[]>('/audits'),
  get: (id: string) => request<AuditResponse>(`/audits/${id}`),
}

export const adminApi = {
  whoAmI: () => request<WhoAmIResponse>('/admin/whoami'),
}
