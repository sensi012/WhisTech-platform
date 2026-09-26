'use strict';
const request = require('supertest');
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'whistech_test',
  user:     process.env.DB_USER     || 'whistech',
  password: process.env.DB_PASSWORD || 'testpassword',
});

function buildApp() {
  const express    = require('express');
  const pino       = require('pino');
  const tasksRoute = require('../src/routes/tasks');
  const app = express();
  app.use(express.json());
  app.use('/api/tasks', tasksRoute(pool, pino({ level: 'silent' })));
  app.use((err, req, res, next) => res.status(500).json({ error: err.message }));
  return app;
}

let app;

beforeAll(async () => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS tasks (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      status      VARCHAR(20)  NOT NULL DEFAULT 'todo',
      priority    VARCHAR(20)  NOT NULL DEFAULT 'medium',
      due_date    TIMESTAMPTZ,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
  app = buildApp();
});

beforeEach(async () => { await pool.query('TRUNCATE tasks'); });
afterAll(async  () => { await pool.end(); });

describe('POST /api/tasks', () => {
  it('creates a task with valid body', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Fix login bug', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Fix login bug');
    expect(res.body.data.status).toBe('todo');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ priority: 'low' });
    expect(res.status).toBe(400);
    expect(res.body.fields.title).toBeDefined();
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test', status: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tasks', () => {
  it('returns empty list when no tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.total).toBe(0);
  });

  it('returns created tasks', async () => {
    await request(app).post('/api/tasks').send({ title: 'Task A' });
    await request(app).post('/api/tasks').send({ title: 'Task B' });
    const res = await request(app).get('/api/tasks');
    expect(res.body.data).toHaveLength(2);
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('updates only the provided fields', async () => {
    const { body: { data: task } } = await request(app)
      .post('/api/tasks').send({ title: 'Original' });

    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'done' });
    expect(res.body.data.status).toBe('done');
    expect(res.body.data.title).toBe('Original');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .patch('/api/tasks/00000000-0000-0000-0000-000000000000')
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task and returns 204', async () => {
    const { body: { data: task } } = await request(app)
      .post('/api/tasks').send({ title: 'Delete me' });
    const del = await request(app).delete(`/api/tasks/${task.id}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/tasks/${task.id}`);
    expect(get.status).toBe(404);
  });
});
