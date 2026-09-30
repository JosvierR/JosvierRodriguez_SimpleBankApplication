import { ApiError } from '../api/client'

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return error instanceof ApiError ? error.message : fallback
}

export function amountError(value: string): string | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Enter a positive amount with no more than 2 decimal places.'
  if (Number(value) <= 0) return 'Amount must be greater than 0.'
  return null
}
