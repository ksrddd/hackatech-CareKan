// Reference typed API client. Single place to set baseURL, attach the
// auth token, parse JSON, surface errors. Once backend is up, every
// feature calls `api.<endpoint>()` — never raw fetch.

import type { ApiErrorBody } from '../../../../shared/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: Record<string, string> | undefined;
  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code;
    this.details = body?.details;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Endpoint functions enforce concrete query shapes; this loose object type
 *  exists only so buildUrl can serialise structural-typed query objects from
 *  shared/api.ts (TS interfaces don't satisfy string index signatures). */
type QueryObject = object;

interface ApiRequestOptions<TBody> {
  method: Method;
  path: string;
  body?: TBody;
  signal?: AbortSignal;
  query?: QueryObject;
}

let authToken: string | null = null;
export function setAuthToken(token: string | null): void {
  authToken = token;
}

function buildUrl(path: string, query?: QueryObject): string {
  const base = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function apiFetch<TRes, TBody = undefined>(
  opts: ApiRequestOptions<TBody>,
): Promise<TRes> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(opts.path, opts.query), {
      method: opts.method,
      headers,
      credentials: 'include',
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      0,
    );
  }

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // non-JSON error body — fall through
    }
    throw new ApiError(body?.error ?? res.statusText, res.status, body);
  }

  if (res.status === 204) return undefined as TRes;
  return (await res.json()) as TRes;
}
