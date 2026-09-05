const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Issue a session JWT. `tv` (token version) is embedded so we can invalidate
 * every outstanding token for a user by bumping users.token_version
 * (e.g. after Apple credential revocation or account deletion).
 */
function signSession(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, tv: user.token_version ?? 0 },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifySession(token) {
  return jwt.verify(token, env.jwtSecret);
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.email_verified,
    createdAt: user.created_at,
  };
}

module.exports = { signSession, verifySession, publicUser };
