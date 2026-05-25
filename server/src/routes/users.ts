import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { inviteUserSchema, updateUserSchema } from '../middleware/schemas.js';

const router = Router();
router.use(authMiddleware);

function toUser(row: any) {
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url,
    role: row.role,
    isPending: row.is_pending,
    customPermissions: row.custom_permissions,
  };
}

// List all users
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT uid, email, display_name, photo_url, role, is_pending, custom_permissions FROM users ORDER BY created_at ASC');
    res.json(result.rows.map(toUser));
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Invite user (create pending)
router.post('/invite', authorize('users:manage'), validate(inviteUserSchema), async (req: AuthRequest, res: Response) => {
  const { email, role, customPermissions } = req.body;

  try {
    // Check if exists
    const existing = await pool.query('SELECT uid FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      // Update role instead
      await pool.query(
        'UPDATE users SET role = $1, custom_permissions = $2, updated_at = NOW() WHERE email = $3',
        [role, JSON.stringify(customPermissions || []), email]
      );
      res.json({ success: true, updated: true });
      return;
    }

    // Create pending user with temp password
    const hash = await bcrypt.hash('pending-' + Date.now(), 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role, is_pending, custom_permissions, photo_url)
       VALUES ($1, $2, $3, $4, true, $5, $6)`,
      [email, hash, 'Pending Invitation', role, JSON.stringify(customPermissions || []),
       `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Invite user error:', err);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// Update user role
router.patch('/:uid', authorize('users:manage'), validate(updateUserSchema), async (req: AuthRequest, res: Response) => {
  const { uid } = req.params;
  const { role, customPermissions } = req.body;

  try {
    await pool.query(
      'UPDATE users SET role = $1, custom_permissions = $2, updated_at = NOW() WHERE uid = $3',
      [role, JSON.stringify(customPermissions || []), uid]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:uid', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  const { uid } = req.params;

  if (uid === req.user!.uid) {
    res.status(400).json({ error: 'Cannot delete yourself' });
    return;
  }

  try {
    await pool.query('DELETE FROM users WHERE uid = $1', [uid]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
