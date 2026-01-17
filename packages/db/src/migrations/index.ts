import type Database from 'better-sqlite3';

export interface Migration {
  id: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    id: '001_create_cache_entries',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS cache_entries (
          cache_key TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          request TEXT NOT NULL,
          url TEXT NOT NULL,
          status INTEGER NOT NULL,
          body BLOB NOT NULL,
          content_type TEXT NOT NULL,
          headers TEXT,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at
          ON cache_entries(expires_at);

        CREATE INDEX IF NOT EXISTS idx_cache_entries_source
          ON cache_entries(source);
      `);
    },
  },
];

/**
 * Runs all pending migrations on the database.
 */
export function runMigrations(db: Database.Database): void {
  // Create migrations tracking table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  const getApplied = db.prepare('SELECT id FROM _migrations WHERE id = ?');
  const recordMigration = db.prepare('INSERT INTO _migrations (id, applied_at) VALUES (?, ?)');

  for (const migration of migrations) {
    const existing = getApplied.get(migration.id);
    if (!existing) {
      migration.up(db);
      recordMigration.run(migration.id, Date.now());
    }
  }
}

export { migrations };
