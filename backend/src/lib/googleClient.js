const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

const client = new OAuth2Client();

/**
 * Verify a Google id_token (the `idToken` returned by Google Sign-In on the
 * client) and return the normalized profile.
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new AppError(400, 'invalid_request', 'idToken is required');
  }
  if (env.google.clientIds.length === 0) {
    throw new AppError(503, 'google_not_configured', 'Google Sign-In is not configured');
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.google.clientIds,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new AppError(401, 'invalid_google_token', 'Google token verification failed');
  }

  if (!payload || !payload.sub) {
    throw new AppError(401, 'invalid_google_token', 'Google token missing subject');
  }

  return {
    subject: payload.sub,
    email: payload.email ? payload.email.toLowerCase() : null,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    name: payload.name || null,
  };
}

module.exports = { verifyGoogleIdToken };
