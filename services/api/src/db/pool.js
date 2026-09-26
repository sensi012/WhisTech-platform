'use strict';
const { Pool } = require('pg');

const pool = new Pool({
  host:                    process.env.DB_HOST,
  port:                    parseInt(process.env.DB_PORT || '5432'),
  database:                process.env.DB_NAME,
  user:                    process.env.DB_USER,
  password:                process.env.DB_PASSWORD,
  max:                     parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis:       30_000,
  connectionTimeoutMillis: 3_000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error', err);
  process.exit(1);
});

module.exports = pool;
