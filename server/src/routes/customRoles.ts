import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createCustomRoleSchema, updateCustomRoleSchema } from '../middleware/schemas.js';

const router = Router();
router.use(authMiddleware);
router.use(authorize('users:manage'));

function toCustomRole(row: any) {
  return {
    id: row.id,
    name: row.name,
    permissions: row.permissions,
    color: row.color,
  };
}

// List all custom roles
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM custom_roles ORDER BY id');
    res.json(result.rows.map(toCustomRole));
  } catch (err) {
    console.error('List custom roles error:', err);
    res.status(500).json({ error: 'Failed to list custom roles' });
  }
});

// Create custom role
router.post('/', validate(createCustomRoleSchema), async (req: AuthRequest, res: Response) => {
  const { name, permissions, color } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO custom_roles (name, permissions, color)
       VALUES ($1, $2, $3) RETURNING *`,
      [JSON.stringify(name), JSON.stringify(permissions || []), color || '#6b7280']
    );
    res.status(201).json(toCustomRole(result.rows[0]));
  } catch (err) {
    console.error('Create custom role error:', err);
    res.status(500).json({ error: 'Failed to create custom role' });
  }
});

// Update custom role
router.patch('/:id', validate(updateCustomRoleSchema), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, permissions, color } = req.body;

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx}`); values.push(JSON.stringify(name)); idx++; }
  if (permissions !== undefined) { fields.push(`permissions = $${idx}`); values.push(JSON.stringify(permissions)); idx++; }
  if (color !== undefined) { fields.push(`color = $${idx}`); values.push(color); idx++; }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(id);

  try {
    await pool.query(`UPDATE custom_roles SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    const result = await pool.query('SELECT * FROM custom_roles WHERE id = $1', [id]);
    res.json(toCustomRole(result.rows[0]));
  } catch (err) {
    console.error('Update custom role error:', err);
    res.status(500).json({ error: 'Failed to update custom role' });
  }
});

// Delete custom role
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM custom_roles WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete custom role error:', err);
    res.status(500).json({ error: 'Failed to delete custom role' });
  }
});

export default router;
