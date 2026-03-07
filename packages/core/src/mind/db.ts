import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { SCHEMA_SQL, VEC_TABLE_SQL, SCHEMA_VERSION } from './schema.js';

export class MindDB {
  private db: DatabaseType;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Load sqlite-vec extension
    sqliteVec.load(this.db);

    this.initSchema();
  }

  private initSchema(): void {
    const existing = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='meta'"
    ).get() as { name: string } | undefined;

    if (!existing) {
      this.db.exec(SCHEMA_SQL);
      this.db.exec(VEC_TABLE_SQL);
      this.db.prepare(
        "INSERT INTO meta (key, value) VALUES ('schema_version', ?)"
      ).run(SCHEMA_VERSION);
    }
  }

  getDatabase(): DatabaseType {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
