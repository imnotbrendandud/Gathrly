require('dotenv').config();

function list(value) {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function required(name, value) {
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const applePrivateKey = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: required('JWT_SECRET', process.env.JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Sign in with Apple. Accept multiple audiences (native app bundle id +
  // web "Services ID"). Team id / key id / private key are only needed for
  // token revocation calls to Apple.
  apple: {
    clientIds: list(process.env.APPLE_CLIENT_IDS),
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: applePrivateKey,
  },

  // Google Sign-In. Accept every OAuth client id the mobile/web apps use
  // (iOS, Android, Web) as a valid audience for the id_token.
  google: {
    clientIds: list(process.env.GOOGLE_CLIENT_IDS),
  },

  // SMTP transport for authentication emails (provider-agnostic: Postmark,
  // SES, Resend, Mailgun, etc. all expose SMTP credentials).
  email: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'Gathrly <no-reply@gathrly.app>',
  },

  otp: {
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    length: 6,
  },
};
