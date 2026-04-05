import { mockFetch } from './mockFetch';
import { DEV_USER_ID_STORAGE_KEY } from '../devUsers';

const API_BASE = import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE ?? '/api';

function getFetch() {
  // Важно брать fetch динамически, иначе в тестах (где `globalThis.fetch` подменяют) значение не успевает обновиться.
  return import.meta.env.VITE_API_MOCK === 'true' || import.meta.env.VITE_API_MOCK === true
    ? mockFetch
    : (globalThis.fetch as typeof fetch | undefined);
}

export interface ApiError {
  ok: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

async function request<T>(
  path: string,
  options: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}
): Promise<ApiResponse<T>> {
  const { headers = {}, ...rest } = options;
  const fetcher = getFetch();
  if (!fetcher) {
    throw new Error('Global fetch is not available. Enable VITE_API_MOCK=true or provide fetch polyfill.');
  }
  const devUserId = import.meta.env.DEV
    ? (() => {
        if (typeof window === 'undefined') return undefined;
        return window.localStorage.getItem(DEV_USER_ID_STORAGE_KEY) ?? undefined;
      })()
    : undefined;
  const devHeaders: Record<string, string> = devUserId ? { 'x-dev-user-id': devUserId } : {};
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...devHeaders,
    ...headers,
  };
  const res = await fetcher(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: mergedHeaders,
    ...rest,
  });
  const json = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      error: json.error ?? { code: 'UNKNOWN', message: res.statusText },
    };
  }
  return json as ApiSuccess<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
