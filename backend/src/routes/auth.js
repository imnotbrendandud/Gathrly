const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const env = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const SALT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'invalid_request', 'email and password are required');
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError(409, 'email_taken', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, passwordHash, name || null]
    );
    user = rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError(409, 'email_taken', 'An account with this email already exists');
    }
    throw err;
  }

  res.status(201).json({ token: signToken(user), user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'invalid_request', 'email and password are required');
  }

  const { rows } = await pool.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];

  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));
  if (!passwordMatches) {
    throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
  }

  delete user.password_hash;
  res.json({ token: signToken(user), user });
});

module.exports = router;
