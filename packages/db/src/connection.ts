import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export interface ConnectionOptions {
  dbPath?: string;
}

/**
 * Gets or creates a SQLite database connection.
 * Uses CACHE_DB_PATH environment variable or the provided path.
 */
export function getConnection(options?: ConnectionOptions): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = options?.dbPath ?? process.env.CACHE_DB_PATH ?? ':memory:';

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  return db;
}

/**
 * Closes the database connection if open.
 */
export function closeConnection(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Resets the connection (useful for testing).
 */
export function resetConnection(): void {
  closeConnection();
}
