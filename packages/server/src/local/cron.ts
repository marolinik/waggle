/**
 * LocalScheduler — lightweight cron tick loop for Solo mode.
 *
 * Polls CronStore for due schedules and executes them via an injected
 * executor function. Includes a concurrency guard to prevent overlapping
 * ticks when jobs run longer than the tick interval.
 *
 * Part of Wave 1.1 — Solo Cron Service.
 */

import type { CronStore, CronSchedule } from '@waggle/core';

/** Function that executes a cron job. Injected to keep the scheduler generic and testable. */
export type JobExecutor = (schedule: CronSchedule) => Promise<void>;

/** Maximum consecutive failures before a job is auto-disabled */
const MAX_CONSECUTIVE_FAILURES = 5;

export class LocalScheduler {
  private store: CronStore;
  private executor: JobExecutor;
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;
  /** Track consecutive failure count per schedule ID */
  private failCounts = new Map<number, number>();
  /** Set of schedule IDs that have been disabled due to repeated failures */
  private disabledJobs = new Set<number>();

  constructor(store: CronStore, executor: JobExecutor) {
    this.store = store;
    this.executor = executor;
  }

  /** Get the current fail count for a schedule (for testing). */
  getFailCount(scheduleId: number): number {
    return this.failCounts.get(scheduleId) ?? 0;
  }

  /** Check if a job has been disabled due to failures (for testing). */
  isDisabled(scheduleId: number): boolean {
    return this.disabledJobs.has(scheduleId);
  }

  /** Reset the failure state for a schedule (e.g., after manual re-enable). */
  resetFailure(scheduleId: number): void {
    this.failCounts.delete(scheduleId);
    this.disabledJobs.delete(scheduleId);
  }

  /** Start the tick loop. Default interval is 60 seconds. */
  start(intervalMs: number = 60_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick().catch(() => {});
    }, intervalMs);
  }

  /** Stop the tick loop. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Whether the scheduler timer is currently running. */
  isRunning(): boolean {
    return this.timer !== null;
  }

  /** W5.11: Execute a specific schedule's job immediately (for manual trigger via API). */
  async executeJob(schedule: CronSchedule): Promise<void> {
    await this.executor(schedule);
    this.store.markRun(schedule.id);
    this.failCounts.delete(schedule.id);
  }

  /**
   * Execute one tick: find all due schedules and run them.
   * Returns the count of successfully executed jobs.
   *
   * Concurrency guard: if a previous tick is still running, returns 0 immediately.
   */
  async tick(): Promise<number> {
    if (this.ticking) return 0;
    this.ticking = true;
    let executed = 0;
    try {
      const due = this.store.getDue();
      for (const schedule of due) {
        // Skip jobs that have been disabled due to repeated failures
        if (this.disabledJobs.has(schedule.id)) {
          continue;
        }

        try {
          await this.executor(schedule);
          this.store.markRun(schedule.id);
          // Reset fail count on success
          this.failCounts.delete(schedule.id);
          executed++;
        } catch (err) {
          const count = (this.failCounts.get(schedule.id) ?? 0) + 1;
          this.failCounts.set(schedule.id, count);
          console.error('[cron] Job failed:', schedule.id, err);

          if (count >= MAX_CONSECUTIVE_FAILURES) {
            this.disabledJobs.add(schedule.id);
            console.warn('[cron] Job disabled after 5 failures:', schedule.id);
          }
        }
      }
    } finally {
      this.ticking = false;
    }
    return executed;
  }
}

export { MAX_CONSECUTIVE_FAILURES };
