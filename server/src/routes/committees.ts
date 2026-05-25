import { Router, Response } from 'express';
import pool from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createCommitteeSchema,
  updateCommitteeSchema,
  importCommitteesSchema,
  committeeMemberInputSchema,
} from '../middleware/schemas.js';

const router = Router();
router.use(authMiddleware);

function toCommittee(row: any) {
  return {
    id: row.id,
    recordNo: row.record_no,
    name: row.name,
    type: row.type,
    representativeType: row.representative_type,
    scope: row.scope,
    department: row.department,
    confidentiality: row.confidentiality,
    status: row.status,
    isInternal: row.is_internal,
    organizingEntity: row.organizing_entity,
    formationDate: row.formation_date,
    endDate: row.end_date,
    chairperson: row.chairperson,
    budget: row.budget == null ? null : Number(row.budget),
    investment: row.investment == null ? null : Number(row.investment),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMember(row: any) {
  return {
    id: row.id,
    committeeId: row.committee_id,
    userId: row.user_id,
    memberName: row.member_name,
    role: row.role,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// LIST committees with members
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM committees ORDER BY created_at DESC');
    const committees = result.rows.map(toCommittee);
    const memResult = await pool.query('SELECT * FROM committee_members ORDER BY created_at ASC');
    const memberMap: Record<string, any[]> = {};
    for (const m of memResult.rows) {
      if (!memberMap[m.committee_id]) memberMap[m.committee_id] = [];
      memberMap[m.committee_id].push(toMember(m));
    }
    for (const c of committees) {
      (c as any).members = memberMap[c.id] || [];
    }
    res.json(committees);
  } catch (err) {
    console.error('List committees error:', err);
    res.status(500).json({ error: 'Failed to list committees' });
  }
});

// GET one committee with members
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const r = await pool.query('SELECT * FROM committees WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) {
      res.status(404).json({ error: 'Committee not found' });
      return;
    }
    const committee = toCommittee(r.rows[0]);
    const m = await pool.query('SELECT * FROM committee_members WHERE committee_id = $1 ORDER BY created_at ASC', [req.params.id]);
    (committee as any).members = m.rows.map(toMember);
    res.json(committee);
  } catch (err) {
    console.error('Get committee error:', err);
    res.status(500).json({ error: 'Failed to get committee' });
  }
});

// CREATE
router.post('/', authorize('users:manage'), validate(createCommitteeSchema), async (req: AuthRequest, res: Response) => {
  const c = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO committees (record_no, name, type, representative_type, scope, department, confidentiality, status, is_internal, organizing_entity, formation_date, end_date, chairperson, budget, investment, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        c.recordNo || null, c.name, c.type || null, c.representativeType || null,
        c.scope || null, c.department || null, c.confidentiality || 'public',
        c.status || 'forming', c.isInternal ?? false, c.organizingEntity || null,
        c.formationDate || null, c.endDate || null, c.chairperson || null,
        c.budget ?? null, c.investment ?? null, c.notes || null,
      ]
    );
    const committee = toCommittee(result.rows[0]);
    const members: any[] = [];
    if (Array.isArray(c.members)) {
      for (const m of c.members) {
        const mr = await client.query(
          `INSERT INTO committee_members (committee_id, user_id, member_name, role, notes)
           VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [committee.id, m.userId || null, m.memberName || null, m.role || 'member', m.notes || null]
        );
        members.push(toMember(mr.rows[0]));
      }
    }
    await client.query('COMMIT');
    (committee as any).members = members;
    res.status(201).json(committee);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create committee error:', err);
    res.status(500).json({ error: 'Failed to create committee' });
  } finally {
    client.release();
  }
});

// UPDATE
router.patch('/:id', authorize('users:manage'), validate(updateCommitteeSchema), async (req: AuthRequest, res: Response) => {
  const updates = req.body;
  const fieldMap: Record<string, string> = {
    recordNo: 'record_no', name: 'name', type: 'type',
    representativeType: 'representative_type', scope: 'scope', department: 'department',
    confidentiality: 'confidentiality', status: 'status', isInternal: 'is_internal',
    organizingEntity: 'organizing_entity', formationDate: 'formation_date',
    endDate: 'end_date', chairperson: 'chairperson', budget: 'budget',
    investment: 'investment', notes: 'notes',
  };
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [key, col] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      fields.push(`${col} = $${idx}`);
      values.push(updates[key]);
      idx++;
    }
  }
  if (fields.length === 0) {
    const r = await pool.query('SELECT * FROM committees WHERE id = $1', [req.params.id]);
    res.json(r.rows[0] ? toCommittee(r.rows[0]) : null);
    return;
  }
  fields.push(`updated_at = NOW()`);
  values.push(req.params.id);
  try {
    await pool.query(`UPDATE committees SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    const r = await pool.query('SELECT * FROM committees WHERE id = $1', [req.params.id]);
    res.json(toCommittee(r.rows[0]));
  } catch (err) {
    console.error('Update committee error:', err);
    res.status(500).json({ error: 'Failed to update committee' });
  }
});

// DELETE
router.delete('/:id', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM committees WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete committee error:', err);
    res.status(500).json({ error: 'Failed to delete committee' });
  }
});

// ADD member
router.post('/:id/members', authorize('users:manage'), validate(committeeMemberInputSchema), async (req: AuthRequest, res: Response) => {
  const m = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO committee_members (committee_id, user_id, member_name, role, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, m.userId || null, m.memberName || null, m.role || 'member', m.notes || null]
    );
    res.status(201).json(toMember(r.rows[0]));
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// REMOVE member
router.delete('/:id/members/:memberId', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM committee_members WHERE id = $1 AND committee_id = $2', [req.params.memberId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// IMPORT (bulk upsert by name)
router.post('/import', authorize('users:manage'), validate(importCommitteesSchema), async (req: AuthRequest, res: Response) => {
  const { committees, upsertByName } = req.body;
  const client = await pool.connect();
  let created = 0;
  let updated = 0;
  try {
    await client.query('BEGIN');
    for (const c of committees) {
      let committeeId: string | null = null;
      if (upsertByName) {
        const existing = await client.query('SELECT id FROM committees WHERE name = $1 LIMIT 1', [c.name]);
        if (existing.rows.length > 0) committeeId = existing.rows[0].id;
      }
      if (committeeId) {
        await client.query(
          `UPDATE committees SET
            record_no = COALESCE($1, record_no),
            type = COALESCE($2, type),
            representative_type = COALESCE($3, representative_type),
            scope = COALESCE($4, scope),
            department = COALESCE($5, department),
            confidentiality = COALESCE($6, confidentiality),
            status = COALESCE($7, status),
            is_internal = COALESCE($8, is_internal),
            organizing_entity = COALESCE($9, organizing_entity),
            formation_date = COALESCE($10, formation_date),
            end_date = COALESCE($11, end_date),
            chairperson = COALESCE($12, chairperson),
            budget = COALESCE($13, budget),
            investment = COALESCE($14, investment),
            notes = COALESCE($15, notes),
            updated_at = NOW()
           WHERE id = $16`,
          [
            c.recordNo ?? null, c.type ?? null, c.representativeType ?? null,
            c.scope ?? null, c.department ?? null, c.confidentiality ?? null,
            c.status ?? null, c.isInternal ?? null, c.organizingEntity ?? null,
            c.formationDate ?? null, c.endDate ?? null, c.chairperson ?? null,
            c.budget ?? null, c.investment ?? null, c.notes ?? null, committeeId,
          ]
        );
        updated++;
      } else {
        const r = await client.query(
          `INSERT INTO committees (record_no, name, type, representative_type, scope, department, confidentiality, status, is_internal, organizing_entity, formation_date, end_date, chairperson, budget, investment, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
          [
            c.recordNo || null, c.name, c.type || null, c.representativeType || null,
            c.scope || null, c.department || null, c.confidentiality || 'public',
            c.status || 'forming', c.isInternal ?? false, c.organizingEntity || null,
            c.formationDate || null, c.endDate || null, c.chairperson || null,
            c.budget ?? null, c.investment ?? null, c.notes || null,
          ]
        );
        committeeId = r.rows[0].id;
        created++;
      }
      if (Array.isArray(c.members)) {
        for (const m of c.members) {
          if (!m.memberName && !m.userId) continue;
          const dup = await client.query(
            `SELECT id FROM committee_members WHERE committee_id = $1 AND COALESCE(member_name,'') = COALESCE($2,'') AND role = $3 LIMIT 1`,
            [committeeId, m.memberName || null, m.role || 'member']
          );
          if (dup.rows.length === 0) {
            await client.query(
              `INSERT INTO committee_members (committee_id, user_id, member_name, role, notes)
               VALUES ($1,$2,$3,$4,$5)`,
              [committeeId, m.userId || null, m.memberName || null, m.role || 'member', m.notes || null]
            );
          }
        }
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, created, updated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import committees error:', err);
    res.status(500).json({ error: 'Failed to import committees' });
  } finally {
    client.release();
  }
});

export default router;
