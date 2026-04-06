import { getStoredToken } from '@/lib/api-helper';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base-url';

function baseUrl(): string {
  return resolveApiBaseUrl();
}

export async function authFetcher<T = unknown>(path: string): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${baseUrl()}/${path.replace(/^\/+/, '')}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
