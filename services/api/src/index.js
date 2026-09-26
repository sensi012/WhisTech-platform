'use strict';
const express    = require('express');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const pino       = require('pino');
const pinoHttp   = require('pino-http');
const pool       = require('./db/pool');
const migrate    = require('./db/migrate');
const requestId  = require('./middleware/requestId');
const tasksRoute = require('./routes/tasks');

const PORT   = parseInt(process.env.PORT || '3000');
const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: !isProd ? { target: 'pino-pretty' } : undefined,
});

const app = express();

app.use(helmet());
app.disable('x-powered-by');

app.use(requestId);

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (res) => res.statusCode >= 500 ? 'error' : 'info',
}));

app.use('/api', rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests' }),
}));

app.use(express.json({ limit: '10kb' }));

// Health check — tests real DB connectivity
app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS db_time');
    res.json({ status: 'ok', db_time: rows[0].db_time, uptime: process.uptime() });
  } catch (err) {
    logger.error({ err }, 'health check db failure');
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/tasks', tasksRoute(pool, logger));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  logger.error({ err, req_id: req.id }, 'unhandled error');
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : err.message,
  });
});

// ── Startup ──────────────────────────────────────────────────────────────
async function start() {
  try {
    logger.info('running database migrations...');
    await migrate(logger);
    logger.info('migrations complete');
  } catch (err) {
    logger.fatal({ err }, 'migration failed — refusing to start');
    process.exit(1);
  }
}

const server = app.listen(PORT, async () => {
  await start();
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'api server ready');
});

// ── Graceful shutdown ────────────────────────────────────────────────────
function shutdown(signal) {
  logger.info({ signal }, 'shutdown signal received');
  server.close(async () => {
    logger.info('HTTP server closed');
    await pool.end();
    logger.info('db pool closed — exiting');
    process.exit(0);
  });
  setTimeout(() => { logger.error('forced exit'); process.exit(1); }, 30_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => { logger.fatal({ err }); process.exit(1); });
