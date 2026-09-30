import { request } from './client'
import type { CustomerAccountResponse, CustomerMeResponse, CustomerProfileResponse, CustomerTransactionResponse, CustomerTransferResponse, TransferRequest, UpdateUserRequest } from '../types/api'

export const meApi = {
  get: () => request<CustomerMeResponse>('/me'),
  accounts: () => request<CustomerAccountResponse[]>('/me/accounts'),
  account: (id: string) => request<CustomerAccountResponse>(`/me/accounts/${id}`),
  transactions: (id: string) => request<CustomerTransactionResponse[]>(`/me/accounts/${id}/transactions`),
  updateProfile: (body: UpdateUserRequest) => request<CustomerProfileResponse>('/me/profile', { method: 'PUT', body: JSON.stringify(body) }),
  transfer: (body: TransferRequest) => request<CustomerTransferResponse>('/me/transfers', { method: 'POST', body: JSON.stringify(body) }),
}
