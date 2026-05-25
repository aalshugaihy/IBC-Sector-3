import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, bulkUpdateSchema, bulkDeleteSchema } from '../middleware/schemas.js';

const router = Router();
router.use(authMiddleware);

// Helper: transform DB row to frontend Task shape
function toTask(row: any) {
  return {
    id: row.id,
    refNo: row.ref_no,
    requestNo: row.request_no,
    title: row.title,
    department: row.department,
    month: row.month,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to,
    teamMembers: row.team_members || [],
    dependencies: row.dependencies || [],
    classification: row.classification,
    taskType: row.task_type || 'regular',
    committeeId: row.committee_id || null,
    plannedDate: row.planned_date,
    actualDate: row.actual_date,
    startDate: row.start_date,
    endDate: row.end_date,
    completionPercentage: row.completion_percentage,
    notes: row.notes,
    obstacles: row.obstacles,
    parentTaskId: row.parent_task_id,
    isArchived: row.is_archived,
    // Request-tracker fields (merged from Excel)
    requestType: row.request_type,
    requestingEntity: row.requesting_entity,
    entityClassification: row.entity_classification,
    sector: row.sector,
    purpose: row.purpose,
    direction: row.direction,
    transactionNo: row.transaction_no,
    transactionName: row.transaction_name,
    transactionStatus: row.transaction_status,
    requestDate: row.request_date,
    dueDate: row.due_date,
    actualCloseDate: row.actual_close_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// List all tasks
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at ASC');
    const tasks = result.rows.map(toTask);

    // Attach history to each task
    const histResult = await pool.query(
      'SELECT id, task_id, user_id, user_name, changes, created_at FROM task_history ORDER BY created_at ASC'
    );
    const historyMap: Record<string, any[]> = {};
    for (const h of histResult.rows) {
      if (!historyMap[h.task_id]) historyMap[h.task_id] = [];
      historyMap[h.task_id].push({
        userId: h.user_id,
        userName: h.user_name,
        timestamp: h.created_at,
        changes: h.changes,
      });
    }
    for (const task of tasks) {
      (task as any).history = historyMap[task.id] || [];
    }

    res.json(tasks);
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

// Create task
router.post('/', authorize('tasks:create'), validate(createTaskSchema), async (req: AuthRequest, res: Response) => {
  const t = req.body;
  try {
    // Auto-generate request_no if not provided
    let requestNo = t.requestNo || null;
    if (!requestNo) {
      const seqResult = await pool.query('SELECT next_request_no() AS rn');
      requestNo = seqResult.rows[0].rn;
    }

    const result = await pool.query(
      `INSERT INTO tasks (
         ref_no, request_no, title, department, month, status, priority,
         assigned_to, team_members, dependencies, classification,
         planned_date, actual_date, start_date, end_date,
         completion_percentage, notes, obstacles, parent_task_id, is_archived,
         task_type, committee_id,
         request_type, requesting_entity, entity_classification, sector,
         purpose, direction, transaction_no, transaction_name, transaction_status,
         request_date, due_date, actual_close_date
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34)
       RETURNING *`,
      [
        t.refNo || null, requestNo, t.title, t.department, t.month || null,
        t.status || 'not-started', t.priority || 'medium',
        t.assignedTo || null, JSON.stringify(t.teamMembers || []),
        JSON.stringify(t.dependencies || []), t.classification || null,
        t.plannedDate || null, t.actualDate || null,
        t.startDate || null, t.endDate || null,
        t.completionPercentage || 0, t.notes || null,
        t.obstacles || null, t.parentTaskId || null, t.isArchived || false,
        t.taskType || 'regular',
        t.committeeId || null,
        t.requestType || null, t.requestingEntity || null,
        t.entityClassification || null, t.sector || null,
        t.purpose || null, t.direction || null,
        t.transactionNo || null, t.transactionName || null, t.transactionStatus || null,
        t.requestDate || null, t.dueDate || null, t.actualCloseDate || null,
      ]
    );
    const task = toTask(result.rows[0]);
    (task as any).history = [];
    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.patch('/:id', authorize('tasks:edit'), validate(updateTaskSchema), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Get old task for history tracking
    const oldResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    const oldTask = toTask(oldResult.rows[0]);

    // Build dynamic UPDATE
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      title: 'title', department: 'department', month: 'month',
      status: 'status', priority: 'priority', assignedTo: 'assigned_to',
      teamMembers: 'team_members', dependencies: 'dependencies',
      classification: 'classification', taskType: 'task_type',
      committeeId: 'committee_id',
      plannedDate: 'planned_date',
      actualDate: 'actual_date', startDate: 'start_date', endDate: 'end_date',
      completionPercentage: 'completion_percentage', notes: 'notes',
      obstacles: 'obstacles', parentTaskId: 'parent_task_id',
      isArchived: 'is_archived', refNo: 'ref_no', requestNo: 'request_no',
      // Request-tracker fields
      requestType: 'request_type', requestingEntity: 'requesting_entity',
      entityClassification: 'entity_classification', sector: 'sector',
      purpose: 'purpose', direction: 'direction',
      transactionNo: 'transaction_no', transactionName: 'transaction_name',
      transactionStatus: 'transaction_status',
      requestDate: 'request_date', dueDate: 'due_date',
      actualCloseDate: 'actual_close_date',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        const val = (key === 'teamMembers' || key === 'dependencies')
          ? JSON.stringify(updates[key])
          : updates[key];
        fields.push(`${col} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (fields.length === 0) {
      res.json(oldTask);
      return;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );

    // Track history
    const changes: any[] = [];
    const trackedFields = [
      'title', 'status', 'priority', 'assignedTo', 'completionPercentage',
      'plannedDate', 'startDate', 'endDate', 'actualDate', 'department',
      'classification', 'taskType', 'committeeId',
      'requestType', 'requestingEntity', 'entityClassification', 'sector',
      'purpose', 'direction', 'transactionStatus', 'requestDate',
      'dueDate', 'actualCloseDate',
    ];
    for (const field of trackedFields) {
      if (updates[field] !== undefined && updates[field] !== (oldTask as any)[field]) {
        changes.push({ field, oldValue: (oldTask as any)[field] ?? '', newValue: updates[field] ?? '' });
      }
    }

    if (changes.length > 0) {
      await pool.query(
        `INSERT INTO task_history (task_id, user_id, user_name, changes)
         VALUES ($1, $2, $3, $4)`,
        [id, req.user!.uid, req.user!.displayName, JSON.stringify(changes)]
      );
    }

    // Return updated task
    const updated = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const task = toTask(updated.rows[0]);

    const histResult = await pool.query(
      'SELECT * FROM task_history WHERE task_id = $1 ORDER BY created_at ASC', [id]
    );
    (task as any).history = histResult.rows.map(h => ({
      userId: h.user_id, userName: h.user_name, timestamp: h.created_at, changes: h.changes,
    }));

    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Bulk update tasks
router.patch('/', authorize('tasks:edit'), validate(bulkUpdateSchema), async (req: AuthRequest, res: Response) => {
  const { taskIds, updates } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const id of taskIds) {
      const oldResult = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
      if (oldResult.rows.length === 0) continue;
      const oldTask = toTask(oldResult.rows[0]);

      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;
      const fieldMap: Record<string, string> = {
        title: 'title', department: 'department', month: 'month',
        status: 'status', priority: 'priority', assignedTo: 'assigned_to',
        completionPercentage: 'completion_percentage', isArchived: 'is_archived',
      };

      for (const [key, col] of Object.entries(fieldMap)) {
        if (updates[key] !== undefined) {
          fields.push(`${col} = $${idx}`);
          values.push(updates[key]);
          idx++;
        }
      }

      if (fields.length > 0) {
        fields.push('updated_at = NOW()');
        values.push(id);
        await client.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx}`, values);

        const changes: any[] = [];
        for (const key of Object.keys(updates)) {
          if (updates[key] !== (oldTask as any)[key]) {
            changes.push({ field: key, oldValue: (oldTask as any)[key] ?? '', newValue: updates[key] ?? '' });
          }
        }
        if (changes.length > 0) {
          await client.query(
            'INSERT INTO task_history (task_id, user_id, user_name, changes) VALUES ($1,$2,$3,$4)',
            [id, req.user!.uid, req.user!.displayName, JSON.stringify(changes)]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk update error:', err);
    res.status(500).json({ error: 'Bulk update failed' });
  } finally {
    client.release();
  }
});

// Delete task
router.delete('/:id', authorize('tasks:delete'), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Bulk delete
router.post('/bulk-delete', authorize('tasks:delete'), validate(bulkDeleteSchema), async (req: AuthRequest, res: Response) => {
  const { taskIds } = req.body;
  try {
    await pool.query('DELETE FROM tasks WHERE id = ANY($1)', [taskIds]);
    res.json({ success: true });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// Reset tasks (delete all + re-seed)
router.post('/reset', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM task_history');
    await client.query('DELETE FROM tasks');

    // Seed from request body (frontend sends INITIAL_TASKS)
    const tasks = req.body.tasks;
    if (Array.isArray(tasks)) {
      for (const t of tasks) {
        await client.query(
          `INSERT INTO tasks (ref_no, title, department, month, status, priority, completion_percentage, start_date, end_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [t.refNo || null, t.title, t.department, t.month || null,
           t.status || 'not-started', t.priority || 'medium',
           t.completionPercentage || 0, t.startDate || null, t.endDate || null]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reset tasks error:', err);
    res.status(500).json({ error: 'Reset failed' });
  } finally {
    client.release();
  }
});

export default router;
