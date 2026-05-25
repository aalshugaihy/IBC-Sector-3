import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createNotificationSchema } from '../middleware/schemas.js';

const router = Router();
router.use(authMiddleware);

function toNotification(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    read: row.read,
    taskId: row.task_id,
    createdAt: row.created_at,
  };
}

// List notifications for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.uid]
    );
    res.json(result.rows.map(toNotification));
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
});

// Create notification
router.post('/', authorize('tasks:edit'), validate(createNotificationSchema), async (req: AuthRequest, res: Response) => {
  const { userId, title, message, taskId } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, task_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, message, taskId || null]
    );
    res.status(201).json(toNotification(result.rows[0]));
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark as read (owner only)
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    // Verify ownership
    const notif = await pool.query('SELECT user_id FROM notifications WHERE id = $1', [req.params.id]);
    if (notif.rows.length === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    if (notif.rows[0].user_id !== req.user!.uid) {
      res.status(403).json({ error: 'Not your notification' });
      return;
    }

    await pool.query('UPDATE notifications SET read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.post('/mark-all-read', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
      [req.user!.uid]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification (owner only)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Verify ownership
    const notif = await pool.query('SELECT user_id FROM notifications WHERE id = $1', [req.params.id]);
    if (notif.rows.length === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    if (notif.rows[0].user_id !== req.user!.uid) {
      res.status(403).json({ error: 'Not your notification' });
      return;
    }

    await pool.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
