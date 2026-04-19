import { getStoredToken } from '@/lib/api-helper';
import { getJwtClaims } from '@/lib/jwt';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base-url';

function baseUrl(): string {
  return resolveApiBaseUrl();
}

export async function authFetcher<T = unknown>(path: string): Promise<T> {
  const token = getStoredToken();
  const tenantId = token ? getJwtClaims(token)?.tenantId : undefined;
  const res = await fetch(`${baseUrl()}/${path.replace(/^\/+/, '')}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
