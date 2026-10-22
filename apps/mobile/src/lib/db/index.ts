// Local SQLite schema + migration runner (expo-sqlite).
// Offline-first: writes go to SQLite first, then a sync_queue row, in one
// transaction (AGENTS.md rule #6). Sync engine itself is a later phase.
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'pih.db';

// Each statement is idempotent so re-running is safe.
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS flocks (
     id TEXT PRIMARY KEY NOT NULL,
     name TEXT NOT NULL,
     placed_on TEXT,
     birds_placed INTEGER,
     status TEXT NOT NULL DEFAULT 'growing',
     updated_at TEXT NOT NULL
   );`,
  `CREATE TABLE IF NOT EXISTS daily_records (
     id TEXT PRIMARY KEY NOT NULL,
     flock_id TEXT NOT NULL,
     record_date TEXT NOT NULL,
     feed_kg REAL,
     water_l REAL,
     deaths INTEGER,
     avg_weight_kg REAL,
     notes TEXT,
     photo_uri TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     sync_status TEXT NOT NULL DEFAULT 'pending',
     UNIQUE (flock_id, record_date)
   );`,
  `CREATE TABLE IF NOT EXISTS sync_queue (
     id TEXT PRIMARY KEY NOT NULL,
     entity TEXT NOT NULL,
     entity_id TEXT NOT NULL,
     operation TEXT NOT NULL,
     payload TEXT NOT NULL,
     attempts INTEGER NOT NULL DEFAULT 0,
     last_error TEXT,
     created_at TEXT NOT NULL
   );`,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      for (const stmt of MIGRATIONS) {
        await db.execAsync(stmt);
      }
      return db;
    })();
  }
  return dbPromise;
}
