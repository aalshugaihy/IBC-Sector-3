import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createReportSchema } from '../middleware/schemas.js';

const router = Router();
router.use(authMiddleware);

function toReport(row: any) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    period: row.period,
    generatedBy: row.generated_by,
    createdAt: row.created_at,
  };
}

// List all reports
router.get('/', authorize('reports:view'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows.map(toReport));
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

// Create report
router.post('/', authorize('reports:view'), validate(createReportSchema), async (req: AuthRequest, res: Response) => {
  const { title, content, period } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO reports (title, content, period, generated_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, content, period || null, req.user!.uid]
    );
    res.status(201).json(toReport(result.rows[0]));
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

export default router;
