import { Response, NextFunction } from 'express';
import pool from '../db.js';
import { AuthRequest } from './auth.js';

// Permission map: role -> allowed permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'tasks:create', 'tasks:edit', 'tasks:delete', 'tasks:archive',
    'tasks:view_history', 'users:manage', 'reports:view', 'kanban:manage',
  ],
  member: ['tasks:edit', 'tasks:view_history', 'reports:view'],
  monitor: ['tasks:view_history', 'reports:view'],
};

/**
 * Authorization middleware that checks if the authenticated user
 * has the required permission based on their role or custom permissions.
 */
export function authorize(...requiredPermissions: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { role, uid } = req.user;

    // Check role-based permissions first
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    const hasRolePerm = requiredPermissions.every(p => rolePerms.includes(p));

    if (hasRolePerm) {
      next();
      return;
    }

    // Check custom permissions from database
    try {
      const result = await pool.query(
        'SELECT custom_permissions FROM users WHERE uid = $1',
        [uid]
      );

      if (result.rows.length > 0) {
        const customPermissions: string[] = result.rows[0].custom_permissions || [];
        const hasCustomPerm = requiredPermissions.every(p => customPermissions.includes(p));

        if (hasCustomPerm) {
          next();
          return;
        }
      }
    } catch (err) {
      console.error('Authorization DB error:', err);
    }

    res.status(403).json({ error: 'Insufficient permissions' });
  };
}
