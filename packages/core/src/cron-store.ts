/**
 * Cron Store — SQLite persistence for solo cron schedules.
 *
 * Stores cron job definitions with expression validation via cron-parser,
 * due-job queries, and run tracking. Follows the same pattern as
 * InstallAuditStore — operates on the .mind DB with lazy table creation.
 */

import { parseExpression } from 'cron-parser';
import type { MindDB } from './mind/db.js';

// ── Types ──────────────────────────────────────────────────────────────

export type CronJobType = 'agent_task' | 'memory_consolidation' | 'workspace_health';

export const VALID_JOB_TYPES: Set<string> = new Set([
  'agent_task',
  'memory_consolidation',
  'workspace_health',
]);

export interface CronSchedule {
  id: number;
  name: string;
  cron_expr: string;
  job_type: CronJobType;
  job_config: string;
  workspace_id: string | null;
  enabled: number;          // SQLite integer boolean
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export interface CreateScheduleInput {
  name: string;
  cronExpr: string;
  jobType: CronJobType;
  jobConfig?: Record<string, unknown>;
  workspaceId?: string;
  enabled?: boolean;
}

// ── Table DDL ──────────────────────────────────────────────────────────

export const CRON_SCHEDULES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS cron_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cron_expr TEXT NOT NULL,
  job_type TEXT NOT NULL,
  job_config TEXT NOT NULL DEFAULT '{}',
  workspace_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  next_run_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cron_enabled_next ON cron_schedules (enabled, next_run_at);
`;

// ── Helpers ────────────────────────────────────────────────────────────

/** Parse a cron expression and return the next run time as ISO string. Throws on invalid expr. */
function computeNextRun(cronExpr: string): string {
  const interval = parseExpression(cronExpr);
  return interval.next().toISOString();
}

// ── Store ──────────────────────────────────────────────────────────────

export class CronStore {
  private db: MindDB;

  constructor(db: MindDB) {
    this.db = db;
    this.ensureTable();
  }

  private ensureTable(): void {
    const raw = this.db.getDatabase();
    const exists = raw.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='cron_schedules'",
    ).get();
    if (!exists) {
      raw.exec(CRON_SCHEDULES_TABLE_SQL);
    }
  }

  /** Create a new cron schedule. Validates cron expression and job type. */
  create(input: CreateScheduleInput): CronSchedule {
    // Validate job type
    if (!VALID_JOB_TYPES.has(input.jobType)) {
      throw new Error(`Invalid job type: "${input.jobType}". Must be one of: ${[...VALID_JOB_TYPES].join(', ')}`);
    }

    // agent_task requires workspaceId
    if (input.jobType === 'agent_task' && !input.workspaceId) {
      throw new Error('agent_task jobs require a workspace ID');
    }

    // Validate cron expression (throws on invalid)
    const nextRun = computeNextRun(input.cronExpr);

    const raw = this.db.getDatabase();
    const enabled = input.enabled === false ? 0 : 1;

    raw.prepare(`
      INSERT INTO cron_schedules (name, cron_expr, job_type, job_config, workspace_id, enabled, next_run_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.name,
      input.cronExpr,
      input.jobType,
      JSON.stringify(input.jobConfig ?? {}),
      input.workspaceId ?? null,
      enabled,
      nextRun,
    );

    return raw.prepare(
      'SELECT * FROM cron_schedules ORDER BY id DESC LIMIT 1',
    ).get() as CronSchedule;
  }

  /** List all schedules ordered by name. */
  list(): CronSchedule[] {
    return this.db.getDatabase().prepare(
      'SELECT * FROM cron_schedules ORDER BY name ASC',
    ).all() as CronSchedule[];
  }

  /** Get a schedule by ID. Returns undefined if not found. */
  getById(id: number): CronSchedule | undefined {
    return this.db.getDatabase().prepare(
      'SELECT * FROM cron_schedules WHERE id = ?',
    ).get(id) as CronSchedule | undefined;
  }

  /** Update a schedule. Recomputes next_run_at if cronExpr changes. */
  update(id: number, changes: {
    name?: string;
    cronExpr?: string;
    jobConfig?: Record<string, unknown>;
    workspaceId?: string;
    enabled?: boolean;
  }): void {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (changes.name !== undefined) {
      setClauses.push('name = ?');
      values.push(changes.name);
    }
    if (changes.cronExpr !== undefined) {
      const nextRun = computeNextRun(changes.cronExpr);
      setClauses.push('cron_expr = ?');
      values.push(changes.cronExpr);
      setClauses.push('next_run_at = ?');
      values.push(nextRun);
    }
    if (changes.jobConfig !== undefined) {
      setClauses.push('job_config = ?');
      values.push(JSON.stringify(changes.jobConfig));
    }
    if (changes.workspaceId !== undefined) {
      setClauses.push('workspace_id = ?');
      values.push(changes.workspaceId);
    }
    if (changes.enabled !== undefined) {
      setClauses.push('enabled = ?');
      values.push(changes.enabled ? 1 : 0);
    }

    if (setClauses.length === 0) return;

    values.push(id);
    this.db.getDatabase().prepare(
      `UPDATE cron_schedules SET ${setClauses.join(', ')} WHERE id = ?`,
    ).run(...values);
  }

  /** Delete a schedule by ID. */
  delete(id: number): void {
    this.db.getDatabase().prepare(
      'DELETE FROM cron_schedules WHERE id = ?',
    ).run(id);
  }

  /** Get all enabled schedules whose next_run_at is in the past. */
  getDue(): CronSchedule[] {
    return this.db.getDatabase().prepare(
      "SELECT * FROM cron_schedules WHERE enabled = 1 AND next_run_at <= datetime('now')",
    ).all() as CronSchedule[];
  }

  /** Mark a schedule as having just run. Updates last_run_at and recomputes next_run_at. */
  markRun(id: number): void {
    const schedule = this.getById(id);
    if (!schedule) return;

    const nextRun = computeNextRun(schedule.cron_expr);
    this.db.getDatabase().prepare(
      "UPDATE cron_schedules SET last_run_at = datetime('now'), next_run_at = ? WHERE id = ?",
    ).run(nextRun, id);
  }

  /** Clear all schedules (for testing). */
  clear(): void {
    this.db.getDatabase().prepare('DELETE FROM cron_schedules').run();
  }
}
