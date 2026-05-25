import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import customRoleRoutes from './routes/customRoles.js';
import departmentRoutes from './routes/departments.js';
import committeeRoutes from './routes/committees.js';
import chatRoutes from './routes/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Behind nginx in docker compose — trust the first proxy hop so
// express-rate-limit uses the real client IP from X-Forwarded-For.
app.set('trust proxy', 1);

const PORT = parseInt(process.env.PORT || '3001');

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts' },
});

// Chat rate limit
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many chat requests' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/chat', chatLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/custom-roles', customRoleRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/chat', chatRoutes);

// Initialize database schema
async function initDB() {
  try {
    const schemaPath = join(__dirname, '..', 'src', 'schema.sql');
    let schema: string;
    try {
      schema = readFileSync(schemaPath, 'utf-8');
    } catch {
      // In production (compiled), schema.sql is relative to dist
      schema = readFileSync(join(__dirname, '..', 'schema.sql'), 'utf-8');
    }
    await pool.query(schema);
    console.log('Database schema initialized');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
