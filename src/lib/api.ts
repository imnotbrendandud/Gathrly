import Constants from 'expo-constants';

/** Port the backend listens on by default (see backend/.env `PORT`). */
const DEFAULT_API_PORT = 3000;
const REQUEST_TIMEOUT_MS = 15_000;

function resolveBaseUrl(): string {
  // Expo only inlines `process.env.X` when it is written as a static property
  // access, so this cannot be shortened to a computed lookup.
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');

  // Dev fallback: the packager host is the machine running the backend, which
  // is what a simulator and a physical device on the same LAN both need.
  // Hard-coding `localhost` would only ever work in a simulator.
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${DEFAULT_API_PORT}`;

  return `http://localhost:${DEFAULT_API_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

/**
 * A structured failure from the API. `code` is the backend's machine-readable
 * error code (`invalid_code`, `too_many_attempts`, ...) — see backend/AUTH.md.
 * Transport failures are surfaced under the synthetic codes below so callers
 * only ever have to switch on `code`.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** The request never reached the server (no connection, DNS, TLS). */
export const NETWORK_ERROR = 'network_error';
/** The server accepted the request but did not answer in time. */
export const TIMEOUT_ERROR = 'timeout';

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** Bearer token for protected routes (`/v1/me`). */
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  // AbortSignal.timeout() is not available on every RN engine, so drive the
  // controller manually.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? null : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError(0, TIMEOUT_ERROR, 'The server took too long to respond.');
    }
    throw new ApiError(0, NETWORK_ERROR, `Could not reach the server at ${API_BASE_URL}.`);
  } finally {
    clearTimeout(timeout);
  }

  // A proxy or crashed process can answer with HTML, so never assume JSON.
  const raw = await response.text();
  let payload: any = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'internal_error',
      error?.message ?? 'Something went wrong.'
    );
  }

  return payload as T;
}
