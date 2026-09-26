'use strict';
const { Router } = require('express');
const { validate, taskCreateSchema, taskUpdateSchema } = require('../middleware/validate');

module.exports = (pool, logger) => {
  const router = Router();

  // GET /api/tasks
  router.get('/', async (req, res, next) => {
    try {
      const { status, priority, page = '1', limit = '20' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conditions = [];
      const params = [];

      if (status)   { conditions.push(`status = $${params.push(status)}`); }
      if (priority) { conditions.push(`priority = $${params.push(priority)}`); }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      const [{ rows }, { rows: count }] = await Promise.all([
        pool.query(
          `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT $${params.push(parseInt(limit))} OFFSET $${params.push(offset)}`,
          params
        ),
        pool.query(`SELECT COUNT(*) FROM tasks ${where}`, params.slice(0, conditions.length)),
      ]);

      res.json({
        data: rows,
        meta: { total: parseInt(count[0].count), page: parseInt(page), limit: parseInt(limit) },
      });
    } catch (err) { next(err); }
  });

  // GET /api/tasks/:id
  router.get('/:id', async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Task not found' });
      res.json({ data: rows[0] });
    } catch (err) { next(err); }
  });

  // POST /api/tasks
  router.post('/', validate(taskCreateSchema), async (req, res, next) => {
    try {
      const { title, description, status, priority, due_date } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO tasks (title, description, status, priority, due_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, description, status, priority, due_date]
      );
      logger.info({ task_id: rows[0].id, req_id: req.id }, 'task created');
      res.status(201).json({ data: rows[0] });
    } catch (err) { next(err); }
  });

  // PATCH /api/tasks/:id
  router.patch('/:id', validate(taskUpdateSchema), async (req, res, next) => {
    try {
      const updates = req.body;
      if (!Object.keys(updates).length)
        return res.status(400).json({ error: 'No fields provided for update' });

      const fields = Object.keys(updates);
      const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = [...Object.values(updates), req.params.id];

      const { rows } = await pool.query(
        `UPDATE tasks SET ${setClauses}, updated_at = NOW()
         WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (!rows.length) return res.status(404).json({ error: 'Task not found' });
      logger.info({ task_id: rows[0].id, req_id: req.id }, 'task updated');
      res.json({ data: rows[0] });
    } catch (err) { next(err); }
  });

  // DELETE /api/tasks/:id
  router.delete('/:id', async (req, res, next) => {
    try {
      const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
      if (!rowCount) return res.status(404).json({ error: 'Task not found' });
      logger.info({ task_id: req.params.id, req_id: req.id }, 'task deleted');
      res.status(204).send();
    } catch (err) { next(err); }
  });

  return router;
};
