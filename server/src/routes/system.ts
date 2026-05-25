import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import pool from '../db.js';
import { logAudit } from '../lib/audit.js';
import { getSecret } from '../lib/settings.js';

const router = Router();
router.use(authMiddleware);

// Admin: full system diagnostics
router.get('/info', authorize('users:manage'), async (_req: AuthRequest, res: Response) => {
  try {
    const [
      dbResult,
      userCount,
      taskCount,
      committeeCount,
      pgVersion,
    ] = await Promise.all([
      pool.query('SELECT NOW() as now'),
      pool.query('SELECT COUNT(*)::int as c FROM users'),
      pool.query('SELECT COUNT(*)::int as c FROM tasks'),
      pool.query('SELECT COUNT(*)::int as c FROM committees'),
      pool.query('SHOW server_version'),
    ]);

    const geminiKey = await getSecret('gemini.api_key', 'GEMINI_API_KEY');

    res.json({
      database: {
        connected: true,
        serverTime: dbResult.rows[0].now,
        version: pgVersion.rows[0].server_version,
      },
      counts: {
        users: userCount.rows[0].c,
        tasks: taskCount.rows[0].c,
        committees: committeeCount.rows[0].c,
      },
      integrations: {
        gemini: { configured: !!geminiKey, source: geminiKey ? (process.env.GEMINI_API_KEY === geminiKey ? 'env' : 'db') : null },
      },
      server: {
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        memoryMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        env: process.env.NODE_ENV || 'development',
      },
    });
  } catch (err) {
    console.error('System info error:', err);
    res.status(500).json({ error: 'Failed to gather system info' });
  }
});

// Admin: download a JSON backup of all app data
router.get('/backup', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  try {
    const [users, tasks, taskHistory, notifications, reports, customRoles, departments, committees, committeeMembers, settings] = await Promise.all([
      pool.query('SELECT uid, email, display_name, photo_url, role, is_pending, custom_permissions, created_at FROM users'),
      pool.query('SELECT * FROM tasks'),
      pool.query('SELECT * FROM task_history'),
      pool.query('SELECT * FROM notifications'),
      pool.query('SELECT * FROM reports'),
      pool.query('SELECT * FROM custom_roles'),
      pool.query('SELECT * FROM departments'),
      pool.query('SELECT * FROM committees'),
      pool.query('SELECT * FROM committee_members'),
      pool.query('SELECT key, value, is_secret, description, updated_at FROM system_settings WHERE is_secret = false'),
    ]);

    const backup = {
      meta: {
        app: 'ibc-sector-3',
        exportedAt: new Date().toISOString(),
        exportedBy: req.user!.email,
        version: 1,
      },
      data: {
        users: users.rows,
        tasks: tasks.rows,
        taskHistory: taskHistory.rows,
        notifications: notifications.rows,
        reports: reports.rows,
        customRoles: customRoles.rows,
        departments: departments.rows,
        committees: committees.rows,
        committeeMembers: committeeMembers.rows,
        settings: settings.rows,
      },
    };

    await logAudit(req, { action: 'system.backup', details: { sizes: Object.fromEntries(Object.entries(backup.data).map(([k, v]) => [k, (v as unknown[]).length])) } });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ibc-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Admin: read the audit log (paginated, newest first)
router.get('/audit', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '100')) || 100, 500);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0')) || 0, 0);
    const r = await pool.query(
      `SELECT id, user_id, user_email, action, entity_type, entity_id, details, ip_address, created_at
       FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ entries: r.rows, limit, offset });
  } catch (err) {
    console.error('Audit list error:', err);
    res.status(500).json({ error: 'Failed to load audit log' });
  }
});

export default router;
