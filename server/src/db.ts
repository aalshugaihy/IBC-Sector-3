import pg from 'pg';

// Managed Postgres providers (Render, Heroku, Supabase, Neon, …) require TLS.
// Enable SSL automatically when DATABASE_URL is set or when PGSSL=true.
const useSsl =
  process.env.PGSSL === 'true' ||
  (!!process.env.DATABASE_URL && process.env.PGSSL !== 'false');

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://ibc:ibc_password@localhost:5432/ibc_tasks',
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
