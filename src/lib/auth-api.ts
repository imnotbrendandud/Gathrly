import { apiRequest } from '@/lib/api';

/** `publicUser()` in backend/src/services/sessionService.js. */
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
};

/** Every successful auth call returns this shape. */
export type Session = {
  token: string;
  user: AuthUser;
};

/**
 * Step 1 of email sign-in. Always resolves 200 whether or not the address has
 * an account — the backend refuses to leak that. A rejection here means the
 * address was malformed or the server is unreachable.
 */
export function requestEmailOtp(email: string) {
  return apiRequest<{ ok: true }>('/v1/auth/email/otp', {
    method: 'POST',
    body: { email },
  });
}

/**
 * Step 2. Creates the account if the address is new.
 * Errors: `invalid_code`, `code_expired` (400), `too_many_attempts` (429).
 */
export function verifyEmailOtp(email: string, code: string) {
  return apiRequest<Session>('/v1/auth/email/verify', {
    method: 'POST',
    body: { email, code },
  });
}

export function signInWithGoogleToken(idToken: string) {
  return apiRequest<Session>('/v1/auth/google', {
    method: 'POST',
    body: { idToken },
  });
}

type AppleCredentialBody = {
  identityToken: string;
  authorizationCode?: string | null;
  /** Apple only sends this on the very first authorization — always forward it. */
  fullName?: { givenName?: string | null; familyName?: string | null } | null;
};

export function signInWithAppleCredential(credential: AppleCredentialBody) {
  return apiRequest<Session>('/v1/auth/apple', {
    method: 'POST',
    body: credential,
  });
}

/** Validates a stored token and returns the current user. */
export function fetchCurrentUser(token: string) {
  return apiRequest<{ user: AuthUser }>('/v1/me', { token });
}
