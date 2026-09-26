'use strict';
const fs   = require('fs');
const path = require('path');
const pool = require('./pool');

/**
 * Runs all *.sql files from the migrations directory in order.
 * Tracks applied migrations in the _migrations table — idempotent.
 */
async function migrate(logger) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        filename   TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const dir = path.resolve(__dirname, '../../../database/migrations');
    if (!fs.existsSync(dir)) {
      logger.warn('migrations directory not found — skipping');
      return;
    }

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rowCount } = await client.query(
        'SELECT 1 FROM _migrations WHERE filename = $1', [file]
      );
      if (rowCount > 0) continue;

      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info({ migration: file }, 'migration applied');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

module.exports = migrate;
