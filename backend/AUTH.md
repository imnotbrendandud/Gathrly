# Authentication

Supported methods: **Sign in with Apple**, **Google Sign-In**, and **Email OTP** (6-digit code). That's it —
no passwords, no phone / SMS, and no SMS provider dependencies or env vars.

All successful auth calls return the same shape:

```json
{ "token": "<JWT>", "user": { "id", "email", "name", "emailVerified", "createdAt" } }
```

Send the token as `Authorization: Bearer <JWT>` on protected routes (e.g. `GET /v1/me`).

## Endpoints

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/v1/auth/apple` | `{ identityToken, authorizationCode?, nonce?, fullName? }` | `fullName` is `{ givenName, familyName }` — Apple only sends it on first sign-in, so always forward it when present. `authorizationCode` lets the server store a refresh token for later revocation. |
| POST | `/v1/auth/google` | `{ idToken }` | The `idToken` from Google Sign-In. |
| POST | `/v1/auth/email/otp` | `{ email }` | Emails a 6-digit code. Always `200 { ok: true }` (no account enumeration). |
| POST | `/v1/auth/email/verify` | `{ email, code }` | Creates the account if new. Errors: `invalid_code`, `code_expired`, `too_many_attempts`. |
| POST | `/v1/auth/apple/notifications` | `{ payload }` | Apple server-to-server webhook. Register the public URL in the Apple Developer portal. |
| GET | `/v1/me` | — | Requires bearer token. |

Errors are `{ error: { code, message } }`. Notable codes: `invalid_apple_token`, `invalid_google_token`,
`apple_not_configured`, `google_not_configured`, `email_required` (provider gave no email), `session_revoked`.

## Account model

- `users` is keyed by UUID; `email` is unique. There is no password column.
- `auth_identities` links providers to a user: one row per `(provider, provider_subject)` where subject is the
  Apple `sub`, Google `sub`, or the email for the `email` provider. A user can have several identities.
- On first login from a provider, if it asserts a **verified** email that matches an existing user, the new
  identity is linked to that user; otherwise a new user is created.
- `users.token_version` is embedded in every JWT (`tv` claim). Bumping it invalidates all outstanding sessions.

## Revocation

Apple sends `consent-revoked` / `account-delete` events to `/v1/auth/apple/notifications`. The handler
verifies the signed payload against Apple's JWKS, bumps the user's `token_version` (killing sessions), and
marks or deletes the Apple identity. `revokeAppleToken()` in `src/lib/appleClient.js` calls Apple's
`/auth/revoke` when you need to unlink from our side (requires `APPLE_TEAM_ID`, `APPLE_KEY_ID`,
`APPLE_PRIVATE_KEY`).

## Setup

1. Copy `.env.example` → `.env` and fill in Apple / Google / SMTP values (see comments there).
   With no `SMTP_HOST`, OTP codes are printed to the server console for local dev.
2. `npm run migrate` — applies `src/db/migrations/*.sql` in order (tracked in `schema_migrations`).
3. `npm start`.
