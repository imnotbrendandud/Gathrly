const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const authRouter = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const { rows } = await pool.query('SELECT NOW() AS db_time');
  res.json({ status: 'ok', dbTime: rows[0].db_time });
});

app.use('/v1/auth', authRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
});
