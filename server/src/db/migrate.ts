import fs from 'fs';
import path from 'path';
import { getDb } from './client';

/**
 * Run database migrations.
 * Reads all .sql files from db/migrations/ directory (numbered 001_, 002_, etc.),
 * tracks which have been applied in the _migrations table, and runs only new ones.
 */
export const runMigrations = (): void => {
  const db = getDb();

  // Create _migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);

  // Read all migration files from db/migrations directory
  const migrationsDir = path.resolve(__dirname, '../db/migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found, skipping migrations');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found');
    return;
  }

  // Get already applied migrations
  const applied = db
    .prepare('SELECT filename FROM _migrations')
    .all() as Array<{ filename: string }>;
  const appliedSet = new Set(applied.map((row) => row.filename));

  // Run new migrations in order
  for (const filename of files) {
    if (appliedSet.has(filename)) {
      console.log(`Skipping already-applied migration: ${filename}`);
      continue;
    }

    const filePath = path.join(migrationsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`Applying migration: ${filename}`);

    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(filename);
      console.log(`  ✓ Successfully applied: ${filename}`);
    } catch (error) {
      console.error(`  ✗ Failed to apply migration ${filename}:`, error);
      throw error;
    }
  }

  console.log('Migrations completed successfully');
};
