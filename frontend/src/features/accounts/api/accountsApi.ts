import { request } from '@/shared/api/client';
import type {
  AccountResponse,
  CreateAccountRequest,
  TransactionResponse,
  TransferRequest,
  TransferResponse,
  UpdateAccountRequest,
} from '@/shared/types/api';

export const accountsApi = {
  list: () => request<AccountResponse[]>('/accounts'),
  premium: (threshold: number) => request<AccountResponse[]>(`/accounts/premium?threshold=${encodeURIComponent(threshold.toFixed(2))}`),
  get: (id: string) => request<AccountResponse>(`/accounts/${id}`),
  create: (body: CreateAccountRequest) => request<AccountResponse>('/accounts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: UpdateAccountRequest) =>
    request<AccountResponse>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
  deposit: (id: string, amount: number) =>
    request<AccountResponse>(`/accounts/${id}/deposit`, { method: 'POST', body: JSON.stringify({ amount }) }),
  withdraw: (id: string, amount: number) =>
    request<AccountResponse>(`/accounts/${id}/withdraw`, { method: 'POST', body: JSON.stringify({ amount }) }),
  transactions: (id: string) => request<TransactionResponse[]>(`/accounts/${id}/transactions`),
  transfer: (body: TransferRequest) => request<TransferResponse>('/accounts/transfer', { method: 'POST', body: JSON.stringify(body) }),
};
