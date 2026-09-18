import { ApiError, NETWORK_ERROR, TIMEOUT_ERROR } from '@/lib/api';

/**
 * Turns anything thrown by the auth calls into a line we are willing to show a
 * user. The backend's own messages are written for humans, so unknown codes
 * fall through to them rather than being flattened into a generic string.
 */
export function authErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return 'Something went wrong. Please try again.';
  }

  switch (err.code) {
    case NETWORK_ERROR:
      return 'Can’t reach the server. Check your connection and try again.';
    case TIMEOUT_ERROR:
      return 'The server took too long to respond. Please try again.';
    case 'invalid_request':
      return 'That email address doesn’t look right.';
    case 'invalid_code':
      return 'Incorrect code. Try again.';
    case 'code_expired':
      return 'That code has expired. Request a new one.';
    case 'too_many_attempts':
      return 'Too many incorrect attempts. Request a new code.';
    case 'google_not_configured':
    case 'apple_not_configured':
      return 'That sign-in option isn’t set up yet.';
    case 'email_required':
      return 'That account did not share an email address, which we need to sign you in.';
    default:
      return err.message || 'Something went wrong. Please try again.';
  }
}
