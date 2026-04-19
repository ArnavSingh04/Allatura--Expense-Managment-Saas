import { getStoredToken } from '@/lib/api-helper';
import { getJwtClaims } from '@/lib/jwt';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base-url';

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const tenantId = getJwtClaims(token)?.tenantId;
  if (tenantId) headers['x-tenant-id'] = tenantId;
  return headers;
}

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function extractErrorMessage(res: Response, fallback: string) {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text) as {
        message?: string | string[];
        error?: string;
      };
      if (Array.isArray(parsed.message)) return parsed.message.join(', ');
      if (typeof parsed.message === 'string' && parsed.message.length)
        return parsed.message;
      if (typeof parsed.error === 'string' && parsed.error.length)
        return parsed.error;
    } catch {
      if (text.length < 200) return text;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const base = resolveApiBaseUrl();
  if (!base) {
    throw new ApiError('Backend API URL not configured', 0);
  }
  const url = `${base.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
  const headers: Record<string, string> = { ...authHeaders() };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(url, {
    method,
    headers,
    body: payload,
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await extractErrorMessage(
      res,
      `Request failed with status ${res.status}`,
    );
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const apiGet = <T>(path: string) => request<T>('GET', path);
export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>('POST', path, body);
export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>('PATCH', path, body);
export const apiDelete = <T>(path: string) => request<T>('DELETE', path);
