import crypto from 'crypto';
import pool from '../db.js';

// AES-256-GCM key derived from SETTINGS_KEY env (or JWT_SECRET fallback).
// Same secret across restarts → same key, so encrypted values survive reboots.
function getEncryptionKey(): Buffer {
  const source =
    process.env.SETTINGS_KEY ||
    process.env.JWT_SECRET ||
    'ibc-default-settings-key-change-in-production';
  return crypto.createHash('sha256').update(source).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptSecret(payload: string): string {
  try {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

/** Read a setting value. For secrets, returns the decrypted plaintext. */
export async function getSetting(key: string): Promise<unknown> {
  const r = await pool.query(
    'SELECT value, encrypted_value, is_secret FROM system_settings WHERE key = $1',
    [key]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  if (row.is_secret) {
    return row.encrypted_value ? decryptSecret(row.encrypted_value) : null;
  }
  return row.value;
}

/** Resolve a secret: try DB-stored value first, then env-var fallback. */
export async function getSecret(
  settingKey: string,
  envVarName: string
): Promise<string | null> {
  const fromDb = await getSetting(settingKey);
  if (typeof fromDb === 'string' && fromDb.length > 0) return fromDb;
  const fromEnv = process.env[envVarName];
  return fromEnv && fromEnv.length > 0 ? fromEnv : null;
}

export interface SetSettingOptions {
  isSecret?: boolean;
  description?: string;
  updatedBy?: string;
}

export async function setSetting(
  key: string,
  value: unknown,
  opts: SetSettingOptions = {}
): Promise<void> {
  const { isSecret = false, description, updatedBy } = opts;

  if (isSecret) {
    const plaintext = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = plaintext ? encryptSecret(plaintext) : null;
    await pool.query(
      `INSERT INTO system_settings (key, encrypted_value, is_secret, description, updated_by, updated_at)
       VALUES ($1, $2, true, $3, $4, NOW())
       ON CONFLICT (key) DO UPDATE
       SET encrypted_value = EXCLUDED.encrypted_value,
           is_secret = true,
           description = COALESCE(EXCLUDED.description, system_settings.description),
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()`,
      [key, encrypted, description ?? null, updatedBy ?? null]
    );
  } else {
    await pool.query(
      `INSERT INTO system_settings (key, value, is_secret, description, updated_by, updated_at)
       VALUES ($1, $2::jsonb, false, $3, $4, NOW())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           is_secret = false,
           description = COALESCE(EXCLUDED.description, system_settings.description),
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()`,
      [key, JSON.stringify(value), description ?? null, updatedBy ?? null]
    );
  }
}

/** Public-safe listing: secrets are returned as `{ isSet: boolean }` only. */
export async function listSettings(): Promise<Array<{
  key: string;
  value: unknown;
  isSecret: boolean;
  isSet: boolean;
  description: string | null;
  updatedAt: string | null;
}>> {
  const r = await pool.query(
    `SELECT key, value, encrypted_value, is_secret, description, updated_at
     FROM system_settings ORDER BY key ASC`
  );
  return r.rows.map((row) => ({
    key: row.key,
    value: row.is_secret ? null : row.value,
    isSecret: row.is_secret,
    isSet: row.is_secret
      ? !!row.encrypted_value
      : row.value !== null && row.value !== undefined,
    description: row.description,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }));
}

export async function deleteSetting(key: string): Promise<void> {
  await pool.query('DELETE FROM system_settings WHERE key = $1', [key]);
}
