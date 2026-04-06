import { getStoredToken } from '@/lib/api-helper';

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.BACKEND_API_URL ||
    ''
  ).replace(/\/$/, '');
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
