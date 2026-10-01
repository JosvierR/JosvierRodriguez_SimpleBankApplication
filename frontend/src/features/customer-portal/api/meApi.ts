import { request } from '@/shared/api/client';
import type {
  CustomerAccountResponse,
  CustomerMeResponse,
  CustomerProfileResponse,
  CustomerTransactionResponse,
  CustomerTransferReceiptResponse,
  CustomerTransferRequest,
  TransferPreviewResponse,
  UpdateUserRequest,
} from '@/shared/types/api';

export const meApi = {
  get: () => request<CustomerMeResponse>('/me'),
  accounts: () => request<CustomerAccountResponse[]>('/me/accounts'),
  account: (id: string) => request<CustomerAccountResponse>(`/me/accounts/${id}`),
  transactions: (id: string) => request<CustomerTransactionResponse[]>(`/me/accounts/${id}/transactions`),
  updateProfile: (body: UpdateUserRequest) =>
    request<CustomerProfileResponse>('/me/profile', { method: 'PUT', body: JSON.stringify(body) }),
  previewTransfer: (body: CustomerTransferRequest) =>
    request<TransferPreviewResponse>('/me/transfers/preview', { method: 'POST', body: JSON.stringify(body) }),
  transfer: (body: CustomerTransferRequest) =>
    request<CustomerTransferReceiptResponse>('/me/transfers', { method: 'POST', body: JSON.stringify(body) }),
};
