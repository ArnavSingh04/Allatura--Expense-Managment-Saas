import { resolveApiBaseUrl } from '@/lib/resolve-api-base-url';

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Pulls both the message and the raw body off an error response, so callers
 * that want structured detail (such as which files a pack rejected) can read
 * it without parsing the body a second time.
 */
async function extractErrorDetail(
  res: Response,
  fallback: string,
): Promise<{ message: string; body?: unknown }> {
  try {
    const text = await res.text();
    if (!text) return { message: fallback };
    try {
      const parsed = JSON.parse(text) as {
        message?: string | string[];
        error?: string;
      };
      if (Array.isArray(parsed.message))
        return { message: parsed.message.join(', '), body: parsed };
      if (typeof parsed.message === 'string' && parsed.message.length)
        return { message: parsed.message, body: parsed };
      if (typeof parsed.error === 'string' && parsed.error.length)
        return { message: parsed.error, body: parsed };
    } catch {
      if (text.length < 200) return { message: text };
    }
  } catch {
    /* ignore */
  }
  return { message: fallback };
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
  // No Authorization header here by design: the request goes to the same-origin
  // /api/v1 proxy, which attaches the Auth0 access token server-side from the
  // encrypted session cookie.
  const headers: Record<string, string> = {};
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
    const detail = await extractErrorDetail(
      res,
      `Request failed with status ${res.status}`,
    );
    throw new ApiError(detail.message, res.status, detail.body);
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

/**
 * POST that surfaces the HTTP status alongside the body.
 *
 * The import confirm endpoint answers 200 with a finished session when the job
 * ran inline, and 202 when it was handed off to run in the background. Those
 * two cases drive different UI, and branching on the status is sturdier than
 * sniffing the payload shape.
 */
export async function apiPostRaw<T>(
  path: string,
  body?: unknown,
): Promise<{ status: number; data: T }> {
  const base = resolveApiBaseUrl();
  if (!base) {
    throw new ApiError('Backend API URL not configured', 0);
  }
  const url = `${base.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: payload,
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await extractErrorDetail(
      res,
      `Request failed with status ${res.status}`,
    );
    throw new ApiError(detail.message, res.status, detail.body);
  }
  const text = await res.text();
  return {
    status: res.status,
    data: (text ? JSON.parse(text) : undefined) as T,
  };
}

/**
 * GET a file as a Blob.
 *
 * Used instead of a plain <a href> for the two download endpoints, because the
 * Next proxy rebuilds response headers and keeps only `content-type` — so an
 * anchor navigation yields an extensionless file. Fetching here also means a
 * JSON error response surfaces as an ApiError rather than being silently saved
 * to the user's disk as a "download".
 */
export async function apiGetBlob(
  path: string,
): Promise<{ blob: Blob; filename: string | null }> {
  const base = resolveApiBaseUrl();
  if (!base) {
    throw new ApiError('Backend API URL not configured', 0);
  }
  const url = `${base.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!res.ok) {
    const detail = await extractErrorDetail(
      res,
      `Download failed with status ${res.status}`,
    );
    throw new ApiError(detail.message, res.status, detail.body);
  }
  const disposition = res.headers.get('content-disposition');
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  let filename: string | null = null;
  if (match?.[1]) {
    try {
      filename = decodeURIComponent(match[1]);
    } catch {
      filename = match[1];
    }
  }
  return { blob: await res.blob(), filename };
}
