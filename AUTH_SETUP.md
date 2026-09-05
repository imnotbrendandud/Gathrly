# Auth provider setup (Tier 0)

Everything in code is done. What remains are the console steps that need your Apple, Google,
and email-provider accounts. Work top to bottom; each section ends with the env values it produces.

**App identifiers now fixed in `app.json`** (change them here before your first store submission,
not after — they are effectively permanent once published):

| | |
| --- | --- |
| iOS bundle identifier | `com.gathrly.app` |
| Android package | `com.gathrly.app` |
| URL scheme | `gathrly` |

> **Expo Go will not work from here on.** Apple and Google sign-in are native modules. Use a
> development build: `npx expo run:ios` / `npx expo run:android` locally, or
> `eas build --profile development`.

---

## 1. Sign in with Apple

In the [Apple Developer portal](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**:

1. **Identifiers → +** → App IDs → App. Set the Bundle ID to `com.gathrly.app` and tick
   **Sign In with Apple** under Capabilities.
2. **Keys → +**. Name it (e.g. "Gathrly Sign in with Apple"), tick **Sign In with Apple**,
   configure it against the App ID above, then Continue → Register.
3. **Download the `.p8` file.** Apple lets you download it exactly once. Note the **Key ID** shown
   on that page.
4. Your **Team ID** is in the top-right of the portal (10 characters).

Then in `backend/.env`:

```
APPLE_CLIENT_IDS=com.gathrly.app
APPLE_TEAM_ID=<10-char team id>
APPLE_KEY_ID=<key id from step 3>
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGT...\n-----END PRIVATE KEY-----
```

`APPLE_PRIVATE_KEY` is the whole `.p8` contents on one line with literal `\n` between lines
(`src/config/env.js` converts them back). Never commit the `.p8` — `.gitignore` already blocks `*.p8`.

**Team ID / Key ID / private key are only needed for revocation** (the `/auth/revoke` call and the
authorization-code exchange). Plain sign-in works with just `APPLE_CLIENT_IDS`.

### Credential revocation webhook

Once the backend has a public HTTPS URL, register it under the App ID's Sign In with Apple
configuration as the **Server-to-Server Notification Endpoint**:

```
https://<your-api-host>/v1/auth/apple/notifications
```

Apple then posts `consent-revoked` and `account-delete` events there, and the handler kills that
user's sessions. Until this is registered, revocation is not wired up end to end.

---

## 2. Google Sign-In

In the [Google Cloud console](https://console.cloud.google.com) → **APIs & Services**:

1. Create (or pick) a project, then configure the **OAuth consent screen**.
2. **Credentials → Create credentials → OAuth client ID**, three times:

   | Type | What it needs | What you get |
   | --- | --- | --- |
   | iOS | Bundle ID `com.gathrly.app` | iOS client ID |
   | Android | Package `com.gathrly.app` + SHA-1 fingerprint | Android client ID |
   | Web application | — | Web client ID |

   The **Web** client is required even though there is no web build: passing it as `webClientId`
   on the native side is what makes the returned `idToken` audience predictable.

   Get the Android SHA-1 from `eas credentials` (EAS-managed) or
   `keytool -list -v -keystore <path>` for a local keystore. Debug and release builds have
   *different* fingerprints — register both.

3. Take the **iOS** client ID and reverse it for `app.json`. Given
   `123456789-abcdef.apps.googleusercontent.com`, the scheme is:

   ```
   com.googleusercontent.apps.123456789-abcdef
   ```

   Replace `REPLACE_WITH_IOS_CLIENT_ID` in the `@react-native-google-signin/google-signin`
   plugin entry in `app.json` with that value. **Rebuild after changing it** — it is compiled into
   `Info.plist`, so a Metro reload will not pick it up.

Then in `backend/.env` — all three, comma separated:

```
GOOGLE_CLIENT_IDS=<ios client id>,<android client id>,<web client id>
```

The backend accepts any of them as a valid `aud`. Listing all three avoids a class of bug where
sign-in works on one platform and 401s on the other.

---

## 3. Email (OTP delivery)

Pick any SMTP provider — the backend is provider-agnostic. Concrete settings for the common ones
are in `backend/.env.example`.

1. Sign up, then **verify your sending domain** (SPF + DKIM records). Skip this and codes land in spam.
2. Fill in `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` in `backend/.env`.
3. Prove it works:

   ```bash
   cd backend && npm run mail:test -- you@example.com
   ```

With `SMTP_HOST` empty, OTP codes print to the server console instead — fine for local dev, and the
server warns you at boot that it is in that mode.

---

## 4. Verify

Start the backend. It reports its own configuration state at boot:

```
Server listening on port 3000 (development)
[mailer] SMTP ready (smtp.resend.com:587)
```

Any provider you have not configured warns instead, and its endpoint returns
`503 {apple,google}_not_configured` rather than failing confusingly at token-verification time.

## Known gaps

None of these block development, but close them before the API is publicly reachable:

- **No rate limiting on `POST /v1/auth/email/otp`.** Anyone can use it to send mail to an arbitrary
  address repeatedly.
- **`email_otps` is never pruned.** Add a nightly
  `DELETE FROM email_otps WHERE expires_at < now() - interval '1 day';`
- **CORS is wide open** (`cors()` with no options in `backend/src/index.js`).
