import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ibc:ibc_password@localhost:5432/ibc_tasks',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
