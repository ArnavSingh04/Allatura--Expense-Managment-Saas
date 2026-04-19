import { apiGet } from '@/lib/api-client';

export async function authFetcher<T = unknown>(path: string): Promise<T> {
  return apiGet<T>(path);
}
