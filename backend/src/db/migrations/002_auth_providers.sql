-- Move from an email/password identity model to a multi-provider one.
-- Auth methods supported after this migration: Apple, Google, Email OTP.
-- Passwords are dropped entirely; no phone/SMS columns are introduced.

-- 1. users: no more passwords. Track email verification + a token version
--    used to revoke sessions.
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. auth_identities: one row per linked provider for a user. A single user
--    can have an Apple, a Google and an email identity at the same time.
CREATE TABLE IF NOT EXISTS auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('apple', 'google', 'email')),
  -- Apple `sub`, Google `sub`, or the lowercased email for the 'email' provider.
  provider_subject TEXT NOT NULL,
  email TEXT,
  -- Apple refresh token, kept so we can call Apple's /auth/revoke endpoint.
  refresh_token TEXT,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx ON auth_identities (user_id);

-- 3. Backfill: every existing user gets an 'email' identity so they can keep
--    signing in with the same address via OTP.
INSERT INTO auth_identities (user_id, provider, provider_subject, email)
SELECT id, 'email', lower(email), lower(email)
FROM users
ON CONFLICT (provider, provider_subject) DO NOTHING;

-- 4. email_otps: short-lived one-time codes for passwordless email login.
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otps_email_idx ON email_otps (email);
