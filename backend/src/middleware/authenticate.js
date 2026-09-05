const { AppError } = require('./errorHandler');
const { verifySession } = require('../services/sessionService');
const { getUserById } = require('../services/identityService');

/**
 * Bearer-token auth. Verifies the JWT signature/expiry, then confirms the
 * token version still matches the user row so revoked sessions (Apple
 * credential revocation, account deletion, forced logout) are rejected.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError(401, 'unauthorized', 'Missing or malformed Authorization header');
    }

    const token = header.slice('Bearer '.length);

    let claims;
    try {
      claims = verifySession(token);
    } catch (err) {
      throw new AppError(401, 'unauthorized', 'Invalid or expired token');
    }

    const user = await getUserById(claims.sub);
    if (!user) {
      throw new AppError(401, 'unauthorized', 'User no longer exists');
    }
    if ((claims.tv ?? 0) !== user.token_version) {
      throw new AppError(401, 'session_revoked', 'Session has been revoked, please sign in again');
    }

    req.user = { id: user.id, email: user.email, tokenVersion: user.token_version };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
