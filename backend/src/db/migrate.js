/**
 * Minimal forward-only migration runner.
 *
 *   node src/db/migrate.js
 *
 * Runs every .sql file in ./migrations (lexicographic order) that has not been
 * applied yet, each in its own transaction, and records it in schema_migrations.
 */
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.filename));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`applied ${file}`);
      ran += 1;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`failed ${file}: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(ran === 0 ? 'no pending migrations' : `done (${ran} applied)`);
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
