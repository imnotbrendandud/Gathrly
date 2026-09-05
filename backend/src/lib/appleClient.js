const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const env = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';

const keys = jwksClient({
  jwksUri: APPLE_KEYS_URL,
  cache: true,
  cacheMaxAge: 24 * 60 * 60 * 1000,
  rateLimit: true,
});

function getSigningKey(header, callback) {
  keys.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function verify(token, options) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getSigningKey, { algorithms: ['RS256'], issuer: APPLE_ISSUER, ...options }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

/**
 * Verify the `identityToken` produced by Sign in with Apple on the client.
 * `nonce` is optional but should be passed when the client sent one.
 */
async function verifyAppleIdToken(identityToken, nonce) {
  if (!identityToken) {
    throw new AppError(400, 'invalid_request', 'identityToken is required');
  }
  if (env.apple.clientIds.length === 0) {
    throw new AppError(503, 'apple_not_configured', 'Sign in with Apple is not configured');
  }

  let payload;
  try {
    payload = await verify(identityToken, { audience: env.apple.clientIds });
  } catch (err) {
    throw new AppError(401, 'invalid_apple_token', 'Apple token verification failed');
  }

  if (nonce && payload.nonce !== nonce) {
    throw new AppError(401, 'invalid_apple_token', 'Apple token nonce mismatch');
  }

  return {
    subject: payload.sub,
    email: payload.email ? payload.email.toLowerCase() : null,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    isPrivateRelay: payload.is_private_email === true || payload.is_private_email === 'true',
  };
}

/**
 * Verify an Apple server-to-server notification token (credential revocation,
 * account deletion, email forwarding changes). Delivered as `{ payload: <jwt> }`.
 */
async function verifyAppleNotificationToken(token) {
  if (!token) {
    throw new AppError(400, 'invalid_request', 'notification payload is required');
  }
  let decoded;
  try {
    decoded = await verify(token, { audience: env.apple.clientIds });
  } catch (err) {
    throw new AppError(401, 'invalid_apple_token', 'Apple notification verification failed');
  }

  // The `events` claim is a JSON-encoded string.
  let event = decoded.events;
  if (typeof event === 'string') {
    try {
      event = JSON.parse(event);
    } catch (err) {
      throw new AppError(400, 'invalid_apple_token', 'Malformed Apple notification events');
    }
  }

  return {
    type: event && event.type, // 'consent-revoked' | 'account-delete' | 'email-disabled' | 'email-enabled'
    subject: event && event.sub,
    email: event && event.email,
  };
}

/**
 * Build the short-lived client secret JWT used to authenticate with Apple's
 * token endpoints (required for revocation).
 */
function generateClientSecret() {
  const { teamId, keyId, privateKey, clientIds } = env.apple;
  if (!teamId || !keyId || !privateKey || clientIds.length === 0) {
    throw new AppError(503, 'apple_not_configured', 'Apple revocation credentials are not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: teamId,
      iat: now,
      exp: now + 5 * 60,
      aud: APPLE_ISSUER,
      sub: clientIds[0],
    },
    privateKey,
    { algorithm: 'ES256', keyid: keyId }
  );
}

/**
 * Ask Apple to revoke a user's tokens. Used when a user unlinks Apple or
 * deletes their account, so Apple stops treating our app as authorized.
 */
async function revokeAppleToken(refreshToken) {
  if (!refreshToken) return;

  const body = new URLSearchParams({
    client_id: env.apple.clientIds[0],
    client_secret: generateClientSecret(),
    token: refreshToken,
    token_type_hint: 'refresh_token',
  });

  const res = await fetch(APPLE_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new AppError(502, 'apple_revoke_failed', `Apple revoke failed: ${res.status} ${text}`);
  }
}

/**
 * Exchange the one-time `authorizationCode` from the client for tokens,
 * including the refresh token we persist for later revocation.
 */
async function exchangeAppleAuthCode(authorizationCode) {
  if (!authorizationCode) return null;

  const body = new URLSearchParams({
    client_id: env.apple.clientIds[0],
    client_secret: generateClientSecret(),
    code: authorizationCode,
    grant_type: 'authorization_code',
  });

  const res = await fetch(APPLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.refresh_token || null;
}

module.exports = {
  verifyAppleIdToken,
  verifyAppleNotificationToken,
  revokeAppleToken,
  exchangeAppleAuthCode,
  generateClientSecret,
};
