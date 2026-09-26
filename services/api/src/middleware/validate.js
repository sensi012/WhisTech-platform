'use strict';
const { z } = require('zod');

const STATUSES  = ['todo', 'in_progress', 'done', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const taskCreateSchema = z.object({
  title:       z.string().min(1, 'title is required').max(255).trim(),
  description: z.string().max(4000).trim().optional().nullable(),
  status:      z.enum(STATUSES).default('todo'),
  priority:    z.enum(PRIORITIES).default('medium'),
  due_date:    z.string().datetime().optional().nullable(),
});

const taskUpdateSchema = taskCreateSchema.partial();

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error:  'Validation failed',
        fields: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate, taskCreateSchema, taskUpdateSchema, STATUSES, PRIORITIES };
