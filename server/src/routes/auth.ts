import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../middleware/schemas.js';

const router = Router();

// Register
router.post('/register', validate(registerSchema), async (req, res: Response) => {
  const { email, password, displayName } = req.body;

  try {
    const existing = await pool.query('SELECT uid FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    // First user gets admin role
    const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE is_pending = false');
    const isFirstUser = parseInt(countResult.rows[0].count) === 0;
    const role = isFirstUser ? 'admin' : 'member';

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role, photo_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING uid, email, display_name, role, photo_url, custom_permissions`,
      [email, hash, displayName || email.split('@')[0], role, `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || email)}&background=random`]
    );

    const user = result.rows[0];
    const token = generateToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
    });

    res.json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.display_name,
        photoURL: user.photo_url,
        role: user.role,
        customPermissions: user.custom_permissions,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', validate(loginSchema), async (req, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT uid, email, password_hash, display_name, role, photo_url, custom_permissions FROM users WHERE email = $1 AND is_pending = false',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
    });

    res.json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.display_name,
        photoURL: user.photo_url,
        role: user.role,
        customPermissions: user.custom_permissions,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT uid, email, display_name, role, photo_url, custom_permissions FROM users WHERE uid = $1',
      [req.user!.uid]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const u = result.rows[0];
    res.json({
      uid: u.uid,
      email: u.email,
      displayName: u.display_name,
      photoURL: u.photo_url,
      role: u.role,
      customPermissions: u.custom_permissions,
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
