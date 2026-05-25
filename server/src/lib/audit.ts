import pool from '../db.js';
import type { AuthRequest } from '../middleware/auth.js';

export interface AuditEntry {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(req: AuthRequest, entry: AuditEntry): Promise<void> {
  try {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    await pool.query(
      `INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user?.uid ?? null,
        req.user?.email ?? null,
        entry.action,
        entry.entityType ?? null,
        entry.entityId ?? null,
        entry.details ? JSON.stringify(entry.details) : null,
        ip,
      ]
    );
  } catch (err) {
    console.error('audit log failed:', err);
  }
}
