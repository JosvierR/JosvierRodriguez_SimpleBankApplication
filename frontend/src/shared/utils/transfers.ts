import type { TransactionType } from '@/shared/types/api';

export function maskAccountNumber(accountNumber?: string | null) {
  if (!accountNumber) return '••••';
  return `•••• ${accountNumber.slice(-4)}`;
}

export function isIncomingMovement(type: TransactionType, hasCounterparty: boolean) {
  if (type === 'TRANSFER_IN' || type === 'DEPOSIT') return true;
  if (type === 'TRANSFER_OUT' || type === 'WITHDRAW') return false;
  return !hasCounterparty;
}

export function isTransferMovement(type: TransactionType, counterpartyName?: string | null) {
  return type === 'TRANSFER_IN' || type === 'TRANSFER_OUT' || Boolean(counterpartyName);
}
