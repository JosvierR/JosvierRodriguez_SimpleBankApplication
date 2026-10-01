import type { ErrorResponse } from '@/shared/types/api';

export const TOKEN_KEY = 'simple-bank-access-token';
export const AUTH_INVALID_EVENT = 'simple-bank:auth-invalid';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type ClientErrorCode = 'SERVICE_UNAVAILABLE' | 'HTTP_REQUEST_FAILED';

export class ApiError extends Error {
  status: number;
  details?: ErrorResponse;
  code?: ClientErrorCode;

  constructor(message: string, status = 0, details?: ErrorResponse, code?: ClientErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ErrorResponse>;
  return typeof candidate.status === 'number' && typeof candidate.message === 'string';
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('', 0, undefined, 'SERVICE_UNAVAILABLE');
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') || '';
  const body: unknown = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const details = isErrorResponse(body) ? body : undefined;
    if (response.status === 401 && token) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_INVALID_EVENT));
    }
    throw new ApiError(details?.message || '', response.status, details, details ? undefined : 'HTTP_REQUEST_FAILED');
  }

  return body as T;
}
