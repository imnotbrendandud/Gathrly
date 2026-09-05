const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const env = require('../config/env');
const { AppError } = require('../middleware/errorHandler');
const { sendOtpEmail } = require('../lib/mailer');

const SALT_ROUNDS = 10;

function normalizeEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new AppError(400, 'invalid_request', 'A valid email is required');
  }
  return email.trim().toLowerCase();
}

function generateCode() {
  // Uniform 6-digit code, zero-padded.
  const n = crypto.randomInt(0, 10 ** env.otp.length);
  return String(n).padStart(env.otp.length, '0');
}

/**
 * Create and email a fresh OTP for `email`. Any previous unconsumed codes for
 * the address are invalidated first. Callers should always return a generic
 * 200 to avoid leaking whether the address exists.
 */
async function requestOtp(rawEmail) {
  const email = normalizeEmail(rawEmail);

  await pool.query(
    `UPDATE email_otps SET consumed_at = now()
     WHERE email = $1 AND consumed_at IS NULL`,
    [email]
  );

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000);

  await pool.query(
    `INSERT INTO email_otps (email, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [email, codeHash, expiresAt]
  );

  await sendOtpEmail(email, code);
  return { email };
}

/**
 * Verify a submitted code. Returns { email } on success, throws AppError
 * otherwise. Enforces expiry and a per-code attempt cap.
 */
async function verifyOtp(rawEmail, code) {
  const email = normalizeEmail(rawEmail);
  if (!code || typeof code !== 'string') {
    throw new AppError(400, 'invalid_request', 'code is required');
  }

  const { rows } = await pool.query(
    `SELECT * FROM email_otps
     WHERE email = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [email]
  );
  const otp = rows[0];

  if (!otp) {
    throw new AppError(400, 'invalid_code', 'No active verification code for this email');
  }

  if (new Date(otp.expires_at).getTime() < Date.now()) {
    await pool.query(`UPDATE email_otps SET consumed_at = now() WHERE id = $1`, [otp.id]);
    throw new AppError(400, 'code_expired', 'Verification code has expired');
  }

  if (otp.attempts >= env.otp.maxAttempts) {
    await pool.query(`UPDATE email_otps SET consumed_at = now() WHERE id = $1`, [otp.id]);
    throw new AppError(429, 'too_many_attempts', 'Too many incorrect attempts, request a new code');
  }

  const matches = await bcrypt.compare(code, otp.code_hash);
  if (!matches) {
    await pool.query(`UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1`, [otp.id]);
    throw new AppError(400, 'invalid_code', 'Incorrect verification code');
  }

  await pool.query(`UPDATE email_otps SET consumed_at = now() WHERE id = $1`, [otp.id]);
  return { email };
}

module.exports = { requestOtp, verifyOtp, normalizeEmail };
