const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const authRouter = require('./routes/auth');
const authenticate = require('./middleware/authenticate');
const { publicUser } = require('./services/sessionService');
const { getUserById } = require('./services/identityService');
const { errorHandler } = require('./middleware/errorHandler');
const { verifyTransport } = require('./lib/mailer');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const { rows } = await pool.query('SELECT NOW() AS db_time');
  res.json({ status: 'ok', dbTime: rows[0].db_time });
});

app.use('/v1/auth', authRouter);

app.get('/v1/me', authenticate, async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json({ user: publicUser(user) });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
  // Surface auth misconfiguration at boot rather than on a user's first login.
  verifyTransport();
  if (env.apple.clientIds.length === 0) {
    console.warn('[auth] APPLE_CLIENT_IDS not set - /v1/auth/apple will return 503');
  }
  if (env.google.clientIds.length === 0) {
    console.warn('[auth] GOOGLE_CLIENT_IDS not set - /v1/auth/google will return 503');
  }
});
