#!/usr/bin/env node
/**
 * Regenerates scripts/restore-migration-sql.mjs from prisma/migrations.
 * Run after adding a migration: node scripts/build-restore-migration-sql.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'prisma', 'migrations');
const dirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const map = {};
for (const name of dirs) {
  const sqlPath = path.join(root, name, 'migration.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('missing', sqlPath);
    process.exit(1);
  }
  map[name] = fs.readFileSync(sqlPath, 'utf8');
}

const lock = fs.readFileSync(path.join(root, 'migration_lock.toml'), 'utf8');

const body = `#!/usr/bin/env node
/**
 * Restores prisma migration.sql files when the deploy artifact has empty
 * migration directories (Prisma P3015).
 *
 * Safe: writes migration.sql / migration_lock.toml only; does not touch the DB.
 * Optional --prune-empty-unknown: remove EMPTY migration dirs not in this bundle
 * (only if the directory contains no files — never deletes SQL or DB data).
 *
 * Usage on pod:
 *   node scripts/restore-migration-sql.cjs
 *   node scripts/restore-migration-sql.cjs --prune-empty-unknown
 *   npx prisma migrate deploy
 */
const fs = require('fs');
const path = require('path');

const MIGRATIONS = ${JSON.stringify(map, null, 2)};
const LOCK = ${JSON.stringify(lock)};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeIfNeeded(filePath, contents) {
  const exists = fs.existsSync(filePath);
  const prev = exists ? fs.readFileSync(filePath, 'utf8') : null;
  if (prev === contents) {
    return 'ok';
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, 'utf8');
  return exists ? 'updated' : 'wrote';
}

function listMigrationDirs(base) {
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\\d{14}_/.test(d.name))
    .map((d) => d.name);
}

function isDirEmptyOfFiles(dir) {
  if (!fs.existsSync(dir)) return true;
  const entries = fs.readdirSync(dir);
  return entries.length === 0;
}

function restoreInto(base) {
  ensureDir(base);
  const results = [];
  for (const [name, sql] of Object.entries(MIGRATIONS)) {
    const filePath = path.join(base, name, 'migration.sql');
    results.push({ base, name, action: writeIfNeeded(filePath, sql) });
  }
  const lockPath = path.join(base, 'migration_lock.toml');
  results.push({ base, name: 'migration_lock.toml', action: writeIfNeeded(lockPath, LOCK) });
  return results;
}

function pruneEmptyUnknown(base, known) {
  const removed = [];
  for (const name of listMigrationDirs(base)) {
    if (known.has(name)) continue;
    const dir = path.join(base, name);
    if (!isDirEmptyOfFiles(dir)) {
      console.warn('skip prune (not empty):', dir);
      continue;
    }
    fs.rmdirSync(dir);
    removed.push(dir);
  }
  return removed;
}

const prune = process.argv.includes('--prune-empty-unknown');
const cwd = process.cwd();
const targets = [];

// Common Runflare layouts: schema at prisma/ or flattened to /app
const prismaMigrations = path.join(cwd, 'prisma', 'migrations');
const rootMigrations = path.join(cwd, 'migrations');
targets.push(prismaMigrations);
if (fs.existsSync(rootMigrations) || fs.existsSync(path.join(cwd, 'schema.prisma'))) {
  targets.push(rootMigrations);
}

const known = new Set(Object.keys(MIGRATIONS));
let wrote = 0;
let updated = 0;
for (const base of targets) {
  for (const r of restoreInto(base)) {
    if (r.action === 'wrote') wrote++;
    if (r.action === 'updated') updated++;
  }
  console.log('restored into', base);
}

if (prune) {
  for (const base of targets) {
    if (!fs.existsSync(base)) continue;
    for (const dir of pruneEmptyUnknown(base, known)) {
      console.log('pruned empty unknown', dir);
    }
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      migrations: known.size,
      targets,
      wrote,
      updated,
      prune,
      next: 'npx prisma migrate deploy',
    },
    null,
    2,
  ),
);
`;

// .cjs so it runs even when package.json has "type":"module" or Node treats .mjs as ESM-only.
const outPath = path.join(__dirname, 'restore-migration-sql.cjs');
fs.writeFileSync(outPath, body, 'utf8');
console.log('wrote', outPath, 'migrations=', dirs.length, 'bytes=', fs.statSync(outPath).size);
