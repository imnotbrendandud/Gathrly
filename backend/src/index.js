const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const { rows } = await pool.query('SELECT NOW() AS db_time');
  res.json({ status: 'ok', dbTime: rows[0].db_time });
});

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
});
