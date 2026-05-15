import Database from 'better-sqlite3';
import path from 'path';
import config from '../config';

let dbInstance: Database.Database | null = null;

/**
 * Initialize the database connection with pragmas and options.
 * Should be called once during server startup.
 */
export const initDb = (): Database.Database => {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.resolve(config.DATABASE_PATH);
  dbInstance = new Database(dbPath);

  // Set pragmas for WAL mode and foreign key support
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  return dbInstance;
};

/**
 * Get the database connection singleton.
 * Returns the initialized instance, or throws if not yet initialized.
 */
export const getDb = (): Database.Database => {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized. Call initDb() during server startup.'
    );
  }
  return dbInstance;
};

/**
 * Close the database connection.
 * Should be called during graceful shutdown.
 */
export const closeDb = (): void => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};
