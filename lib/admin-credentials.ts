/**
 * Server-only: resolve admin seed passwords from a gitignored local file or env.
 * Never import this from client components.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export type AdminCredentialMap = Record<string, string>;

const ENV_KEYS: Record<string, string> = {
  admin: 'ADMIN_PASSWORD_ADMIN',
  ops: 'ADMIN_PASSWORD_OPS',
  content: 'ADMIN_PASSWORD_CONTENT',
  finance: 'ADMIN_PASSWORD_FINANCE',
};

function loadFromFile(): AdminCredentialMap | null {
  const filePath = join(process.cwd(), 'ADMIN-CREDENTIALS.local.json');
  if (!existsSync(filePath)) return null;
  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as AdminCredentialMap;
  return raw;
}

function loadFromEnv(): AdminCredentialMap {
  const out: AdminCredentialMap = {};
  for (const [username, envKey] of Object.entries(ENV_KEYS)) {
    const value = process.env[envKey]?.trim();
    if (value) out[username] = value;
  }
  return out;
}

/** Merge file (preferred) with env fallbacks. Throws if any required user is missing. */
export function resolveAdminPasswords(usernames: string[]): AdminCredentialMap {
  const fromFile = loadFromFile() ?? {};
  const fromEnv = loadFromEnv();
  const merged: AdminCredentialMap = { ...fromEnv, ...fromFile };

  const missing = usernames.filter((u) => !merged[u]?.trim());
  if (missing.length > 0) {
    throw new Error(
      [
        `Missing admin passwords for: ${missing.join(', ')}`,
        'Create ADMIN-CREDENTIALS.local.json (see ADMIN-CREDENTIALS.example.json)',
        'or set ADMIN_PASSWORD_ADMIN / ADMIN_PASSWORD_OPS / ADMIN_PASSWORD_CONTENT / ADMIN_PASSWORD_FINANCE.',
      ].join('\n'),
    );
  }

  return merged;
}
