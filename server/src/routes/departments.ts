import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../middleware/schemas.js';

const router = Router();
router.use(authMiddleware);

function toDepartment(row: any) {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// List all departments - readable by any authenticated user
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY created_at ASC');
    res.json(result.rows.map(toDepartment));
  } catch (err) {
    console.error('List departments error:', err);
    res.status(500).json({ error: 'Failed to list departments' });
  }
});

// Create department - admin only
router.post('/', authorize('users:manage'), validate(createDepartmentSchema), async (req: AuthRequest, res: Response) => {
  const { name, nameEn, color } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM departments WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Department with this name already exists' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO departments (name, name_en, color)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, nameEn || null, color || '#6366f1']
    );
    res.status(201).json(toDepartment(result.rows[0]));
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department - admin only
router.patch('/:id', authorize('users:manage'), validate(updateDepartmentSchema), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, nameEn, color } = req.body;

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx}`); values.push(name); idx++; }
  if (nameEn !== undefined) { fields.push(`name_en = $${idx}`); values.push(nameEn); idx++; }
  if (color !== undefined) { fields.push(`color = $${idx}`); values.push(color); idx++; }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  try {
    const existingDept = await pool.query('SELECT name FROM departments WHERE id = $1', [id]);
    if (existingDept.rows.length === 0) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    const oldName: string = existingDept.rows[0].name;

    await pool.query(`UPDATE departments SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    if (name !== undefined && name !== oldName) {
      await pool.query('UPDATE tasks SET department = $1 WHERE department = $2', [name, oldName]);
    }

    const result = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
    res.json(toDepartment(result.rows[0]));
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'Department with this name already exists' });
      return;
    }
    console.error('Update department error:', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department - admin only
router.delete('/:id', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  try {
    const dept = await pool.query('SELECT name FROM departments WHERE id = $1', [req.params.id]);
    if (dept.rows.length === 0) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    const taskCount = await pool.query(
      'SELECT COUNT(*)::int AS count FROM tasks WHERE department = $1',
      [dept.rows[0].name]
    );

    if (taskCount.rows[0].count > 0) {
      res.status(409).json({
        error: 'Cannot delete department with linked tasks',
        taskCount: taskCount.rows[0].count,
      });
      return;
    }

    await pool.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;
