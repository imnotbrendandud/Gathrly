const pool = require('../db/pool');
const { AppError } = require('../middleware/errorHandler');

/**
 * Resolve a provider login to a local user, creating the user and/or linking
 * the identity as needed.
 *
 *   provider        'apple' | 'google' | 'email'
 *   subject         stable provider id (Apple sub, Google sub, or the email)
 *   email           email from the provider, if any (lowercased)
 *   emailVerified   whether the provider asserts the email is verified
 *   name            display name from the provider, if any
 *   refreshToken    Apple refresh token, stored for later revocation
 *
 * Returns the full user row.
 */
async function findOrCreateFromProvider({
  provider,
  subject,
  email = null,
  emailVerified = false,
  name = null,
  refreshToken = null,
}) {
  if (!provider || !subject) {
    throw new AppError(400, 'invalid_request', 'provider and subject are required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Existing identity → return its user.
    const identityRes = await client.query(
      `SELECT * FROM auth_identities WHERE provider = $1 AND provider_subject = $2 FOR UPDATE`,
      [provider, subject]
    );

    if (identityRes.rows.length > 0) {
      const identity = identityRes.rows[0];
      if (identity.revoked_at) {
        await client.query(
          `UPDATE auth_identities SET revoked_at = NULL, updated_at = now() WHERE id = $1`,
          [identity.id]
        );
      }
      if (refreshToken) {
        await client.query(
          `UPDATE auth_identities SET refresh_token = $1, updated_at = now() WHERE id = $2`,
          [refreshToken, identity.id]
        );
      }
      const userRes = await client.query(`SELECT * FROM users WHERE id = $1`, [identity.user_id]);
      await client.query('COMMIT');
      return userRes.rows[0];
    }

    // 2. No identity yet. If the provider gave a *verified* email that matches
    //    an existing user, link this identity to that account. The verified
    //    check is what stops an unverified provider email from being used to
    //    take over someone else's account.
    let user = null;
    if (email && emailVerified) {
      const userRes = await client.query(`SELECT * FROM users WHERE lower(email) = $1`, [email]);
      user = userRes.rows[0] || null;
    }

    // 3. Otherwise create a new user.
    if (!user) {
      if (!email) {
        throw new AppError(422, 'email_required', 'Provider did not return an email address');
      }
      const insertRes = await client.query(
        `INSERT INTO users (email, name, email_verified)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [email, name, emailVerified]
      );
      user = insertRes.rows[0];
    } else if (emailVerified && !user.email_verified) {
      const updRes = await client.query(
        `UPDATE users SET email_verified = true, updated_at = now() WHERE id = $1 RETURNING *`,
        [user.id]
      );
      user = updRes.rows[0];
    }

    // 4. Link the identity.
    await client.query(
      `INSERT INTO auth_identities (user_id, provider, provider_subject, email, refresh_token)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, provider, subject, email, refreshToken]
    );

    await client.query('COMMIT');
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Handle an Apple credential-revocation / account-deletion notification:
 * invalidate the user's sessions and mark the identity revoked.
 */
async function revokeAppleIdentity(subject, { deleteIdentity = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `SELECT * FROM auth_identities WHERE provider = 'apple' AND provider_subject = $1 FOR UPDATE`,
      [subject]
    );
    const identity = res.rows[0];
    if (!identity) {
      await client.query('COMMIT');
      return false;
    }

    await client.query(
      `UPDATE users SET token_version = token_version + 1, updated_at = now() WHERE id = $1`,
      [identity.user_id]
    );

    if (deleteIdentity) {
      await client.query(`DELETE FROM auth_identities WHERE id = $1`, [identity.id]);
    } else {
      await client.query(
        `UPDATE auth_identities SET revoked_at = now(), refresh_token = NULL, updated_at = now() WHERE id = $1`,
        [identity.id]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getUserById(id) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

module.exports = { findOrCreateFromProvider, revokeAppleIdentity, getUserById };
