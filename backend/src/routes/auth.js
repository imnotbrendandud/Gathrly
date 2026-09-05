const express = require('express');
const { signSession, publicUser } = require('../services/sessionService');
const {
  findOrCreateFromProvider,
  revokeAppleIdentity,
} = require('../services/identityService');
const { requestOtp, verifyOtp } = require('../services/otpService');
const { verifyGoogleIdToken } = require('../lib/googleClient');
const {
  verifyAppleIdToken,
  verifyAppleNotificationToken,
  exchangeAppleAuthCode,
} = require('../lib/appleClient');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

function sessionResponse(res, user) {
  res.json({ token: signSession(user), user: publicUser(user) });
}

/* ------------------------------------------------------------------ *
 * Passwordless email OTP
 * ------------------------------------------------------------------ */

// Step 1: request a 6-digit code. Always 200 (no account enumeration).
router.post('/email/otp', async (req, res) => {
  try {
    await requestOtp(req.body.email);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 400) throw err; // malformed email
    console.error('otp request failed', err);
  }
  res.json({ ok: true });
});

// Step 2: verify the code and start a session (creating the account if new).
router.post('/email/verify', async (req, res) => {
  const { email } = await verifyOtp(req.body.email, req.body.code);
  const user = await findOrCreateFromProvider({
    provider: 'email',
    subject: email,
    email,
    emailVerified: true,
  });
  sessionResponse(res, user);
});

/* ------------------------------------------------------------------ *
 * Google Sign-In
 * ------------------------------------------------------------------ */

router.post('/google', async (req, res) => {
  const profile = await verifyGoogleIdToken(req.body.idToken);
  const user = await findOrCreateFromProvider({
    provider: 'google',
    subject: profile.subject,
    email: profile.email,
    emailVerified: profile.emailVerified,
    name: profile.name,
  });
  sessionResponse(res, user);
});

/* ------------------------------------------------------------------ *
 * Sign in with Apple
 * ------------------------------------------------------------------ */

router.post('/apple', async (req, res) => {
  const { identityToken, authorizationCode, nonce, fullName } = req.body;
  const profile = await verifyAppleIdToken(identityToken, nonce);

  // Apple only returns the name on the very first authorization; the client
  // forwards it as `fullName`.
  let name = null;
  if (fullName && typeof fullName === 'object') {
    name = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ') || null;
  } else if (typeof fullName === 'string') {
    name = fullName || null;
  }

  let refreshToken = null;
  try {
    refreshToken = await exchangeAppleAuthCode(authorizationCode);
  } catch (err) {
    console.error('apple auth code exchange failed', err);
  }

  const user = await findOrCreateFromProvider({
    provider: 'apple',
    subject: profile.subject,
    email: profile.email,
    emailVerified: profile.emailVerified,
    name,
    refreshToken,
  });
  sessionResponse(res, user);
});

// Apple server-to-server notifications (credential revocation, account delete).
// Configure this URL in the Apple Developer portal. Body: { payload: <JWT> }.
router.post('/apple/notifications', async (req, res) => {
  const event = await verifyAppleNotificationToken(req.body.payload);

  if (!event.subject) {
    return res.status(202).json({ ok: true });
  }

  if (event.type === 'consent-revoked') {
    await revokeAppleIdentity(event.subject);
  } else if (event.type === 'account-delete') {
    await revokeAppleIdentity(event.subject, { deleteIdentity: true });
  }
  // email-enabled / email-disabled: no session impact, acknowledged only.

  res.status(202).json({ ok: true });
});

module.exports = router;
