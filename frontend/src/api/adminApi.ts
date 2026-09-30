import { request } from './client'
import type { AdminAuthUserResponse, Role, SecurityAuditResponse, WhoAmIResponse } from '../types/api'

export const adminApi = {
  whoAmI: () => request<WhoAmIResponse>('/admin/whoami'),
  users: () => request<AdminAuthUserResponse[]>('/admin/auth-users'),
  user: (id: string) => request<AdminAuthUserResponse>(`/admin/auth-users/${id}`),
  changeRole: (id: string, role: Role) => request<AdminAuthUserResponse>(`/admin/auth-users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  changeEnabled: (id: string, enabled: boolean) => request<AdminAuthUserResponse>(`/admin/auth-users/${id}/enabled`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
  linkCustomer: (id: string, bankUserId: string) => request<AdminAuthUserResponse>(`/admin/auth-users/${id}/customer-link`, { method: 'PUT', body: JSON.stringify({ bankUserId }) }),
  unlinkCustomer: (id: string) => request<AdminAuthUserResponse>(`/admin/auth-users/${id}/customer-link`, { method: 'DELETE' }),
  securityAudits: () => request<SecurityAuditResponse[]>('/admin/security-audits'),
}
